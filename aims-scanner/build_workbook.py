"""
build_workbook.py — Combine one run's per-vertical scored CSVs into a
single master workbook: one tab per vertical, sorted hottest-first,
plus a Summary tab with lead counts by tier. No color branding — just
a usable, functional layout.

Usage:
    python build_workbook.py --input-dir output/2026-07-15_0900
    python build_workbook.py --input-dir output/2026-07-15_0900 --output output/2026-07-15_0900/AIMS_Leads_Master.xlsx
"""

import os
import glob
import argparse
import pandas as pd
from openpyxl.styles import Font

TIER_ORDER = ["Tier 1 — Call Now", "Tier 2 — Call Soon", "Tier 3 — Nurture", "Discard"]


def sheet_name_for(vertical: str) -> str:
    """Excel sheet names are capped at 31 chars and can't contain some symbols."""
    name = vertical.replace("_", " ").title()
    return name[:31]


def build(input_dir: str, output_path: str):
    scored_files = sorted(glob.glob(os.path.join(input_dir, "*_scored.csv")))
    if not scored_files:
        print(f"No *_scored.csv files found in {input_dir}")
        return

    summary_rows = []
    sheets = {}

    for f in scored_files:
        vertical = os.path.basename(f).split("_")[0]
        df = pd.read_csv(f)
        if df.empty:
            continue

        df["combined_score"] = pd.to_numeric(df["combined_score"], errors="coerce").fillna(0)
        df = df.sort_values("combined_score", ascending=False)

        sheets[sheet_name_for(vertical)] = df

        tier_counts = df["allegra_tier"].value_counts()
        summary_rows.append({
            "Vertical": vertical,
            "Total Leads": len(df),
            "Tier 1 — Call Now": int(tier_counts.get("Tier 1 — Call Now", 0)),
            "Tier 2 — Call Soon": int(tier_counts.get("Tier 2 — Call Soon", 0)),
            "Tier 3 — Nurture": int(tier_counts.get("Tier 3 — Nurture", 0)),
            "Discard": int(tier_counts.get("Discard", 0)),
        })

    if not sheets:
        print(f"All scored files in {input_dir} were empty. Nothing to build.")
        return

    summary_df = pd.DataFrame(summary_rows)
    total_row = {
        "Vertical": "TOTAL",
        "Total Leads": summary_df["Total Leads"].sum(),
        "Tier 1 — Call Now": summary_df["Tier 1 — Call Now"].sum(),
        "Tier 2 — Call Soon": summary_df["Tier 2 — Call Soon"].sum(),
        "Tier 3 — Nurture": summary_df["Tier 3 — Nurture"].sum(),
        "Discard": summary_df["Discard"].sum(),
    }
    summary_df = pd.concat([summary_df, pd.DataFrame([total_row])], ignore_index=True)

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
        for name, df in sheets.items():
            df.to_excel(writer, sheet_name=name, index=False)

        # Bold headers, freeze top row, reasonable column widths — no color styling.
        for sheet in writer.sheets.values():
            sheet.freeze_panes = "A2"
            for cell in sheet[1]:
                cell.font = Font(bold=True)
            for col_cells in sheet.columns:
                max_len = max((len(str(c.value)) for c in col_cells if c.value is not None), default=10)
                sheet.column_dimensions[col_cells[0].column_letter].width = min(max_len + 2, 60)

    print(f"Saved master workbook → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build a by-vertical master workbook from one run's scored CSVs")
    parser.add_argument("--input-dir", type=str, required=True, help="Run output directory (e.g. output/2026-07-15_0900)")
    parser.add_argument("--output", type=str, help="Output .xlsx path (default: <input-dir>/AIMS_Leads_Master.xlsx)")
    args = parser.parse_args()

    output = args.output or os.path.join(args.input_dir, "AIMS_Leads_Master.xlsx")
    build(args.input_dir, output)
