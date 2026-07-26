"""
build_master.py — Combine every scan run to date into one persistent
master workbook: one tab per vertical, deduplicated by phone number
(most recent scan wins on a duplicate), plus a Summary tab.

Rebuilt fresh from every output/<run>/*_scored.csv file each time it
runs — no incremental state to drift or get out of sync. Safe to run
after every pipeline run (it's wired into run_pipeline.py already).

Usage:
    python build_master.py
    python build_master.py --output-dir output --output output/AIMS_Master_Leads_ALL.xlsx
"""

import os
import glob
import argparse
import pandas as pd
from openpyxl.styles import Font

# Vertical keys that changed over time — fold old data into the current key
# so history doesn't get split across two tabs.
VERTICAL_ALIASES = {
    "pi": "attorney",  # old "pi_attorney" -> filename prefix "pi" -> new "attorney"
}


def sheet_name_for(vertical: str) -> str:
    """Excel sheet names are capped at 31 chars and can't contain some symbols."""
    name = vertical.replace("_", " ").title()
    return name[:31]


def vertical_from_filename(path: str) -> str:
    prefix = os.path.basename(path).split("_")[0]
    return VERTICAL_ALIASES.get(prefix, prefix)


def build(output_dir: str, output_path: str):
    pattern = os.path.join(output_dir, "*", "*_scored.csv")
    scored_files = sorted(glob.glob(pattern))
    if not scored_files:
        print(f"No scored CSVs found under {output_dir}/*/")
        return

    all_rows = []
    run_folders = set()
    for f in scored_files:
        vertical = vertical_from_filename(f)
        run_folder = os.path.basename(os.path.dirname(f))
        run_folders.add(run_folder)
        df = pd.read_csv(f)
        if df.empty:
            continue
        df["vertical"] = vertical
        df["source_run"] = run_folder
        all_rows.append(df)

    if not all_rows:
        print("All scored CSVs were empty. Nothing to build.")
        return

    combined = pd.concat(all_rows, ignore_index=True)
    combined["combined_score"] = pd.to_numeric(combined["combined_score"], errors="coerce").fillna(0)

    # Dedupe by phone within each vertical — most recent run wins (run folders
    # are named YYYY-MM-DD_HHMM, so sorting by source_run is chronological).
    # Rows with no phone are never collapsed into each other.
    has_phone = combined["phone"].notna() & (combined["phone"].astype(str).str.strip() != "")
    with_phone = combined[has_phone].sort_values("source_run")
    with_phone = with_phone.drop_duplicates(subset=["vertical", "phone"], keep="last")
    without_phone = combined[~has_phone]
    deduped = pd.concat([with_phone, without_phone], ignore_index=True)

    summary_rows = []
    sheets = {}
    for vertical, group in deduped.groupby("vertical"):
        group = group.sort_values("combined_score", ascending=False)
        sheets[sheet_name_for(vertical)] = group
        tier_counts = group["allegra_tier"].value_counts()
        summary_rows.append({
            "Vertical": vertical,
            "Total Unique Leads": len(group),
            "Tier 1 — Call Now": int(tier_counts.get("Tier 1 — Call Now", 0)),
            "Tier 2 — Call Soon": int(tier_counts.get("Tier 2 — Call Soon", 0)),
            "Tier 3 — Nurture": int(tier_counts.get("Tier 3 — Nurture", 0)),
            "Discard": int(tier_counts.get("Discard", 0)),
        })

    summary_df = pd.DataFrame(summary_rows).sort_values("Vertical").reset_index(drop=True)
    total_row = {
        "Vertical": "TOTAL",
        "Total Unique Leads": summary_df["Total Unique Leads"].sum(),
        "Tier 1 — Call Now": summary_df["Tier 1 — Call Now"].sum(),
        "Tier 2 — Call Soon": summary_df["Tier 2 — Call Soon"].sum(),
        "Tier 3 — Nurture": summary_df["Tier 3 — Nurture"].sum(),
        "Discard": summary_df["Discard"].sum(),
    }
    summary_df = pd.concat([summary_df, pd.DataFrame([total_row])], ignore_index=True)

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="Summary", index=False, startrow=1)
        for name, df in sheets.items():
            df.to_excel(writer, sheet_name=name, index=False)

        summary_sheet = writer.sheets["Summary"]
        summary_sheet["A1"] = (
            f"{len(run_folders)} run(s) combined, deduplicated by phone within each vertical "
            f"— most recent scan wins on a duplicate."
        )
        summary_sheet["A1"].font = Font(italic=True)

        for sheet in writer.sheets.values():
            header_row = 2 if sheet.title == "Summary" else 1
            sheet.freeze_panes = f"A{header_row + 1}"
            for cell in sheet[header_row]:
                cell.font = Font(bold=True)
            for col_cells in sheet.columns:
                max_len = max((len(str(c.value)) for c in col_cells if c.value is not None), default=10)
                sheet.column_dimensions[col_cells[0].column_letter].width = min(max_len + 2, 60)

    print(f"Saved cumulative master workbook ({len(run_folders)} runs, {len(deduped)} unique leads) → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the cumulative all-runs master workbook")
    parser.add_argument("--output-dir", type=str, default="output", help="Directory containing run folders (default: output)")
    parser.add_argument("--output", type=str, help="Output .xlsx path (default: <output-dir>/AIMS_Master_Leads_ALL.xlsx)")
    args = parser.parse_args()

    output = args.output or os.path.join(args.output_dir, "AIMS_Master_Leads_ALL.xlsx")
    build(args.output_dir, output)
