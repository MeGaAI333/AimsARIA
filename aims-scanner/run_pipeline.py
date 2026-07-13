"""
run_pipeline.py — Full pipeline runner
Runs all three steps end to end for one or all verticals.

Usage:
    python run_pipeline.py --vertical plumber --location "Miami FL"
    python run_pipeline.py --all-verticals --location "Dallas TX" --limit 50
"""

import os
import argparse
import subprocess
import sys
from datetime import datetime
from config import VERTICALS


def run_step(script: str, args: list[str]):
    """Run a pipeline step as a subprocess."""
    cmd = [sys.executable, script] + args
    print(f"\n{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'='*60}")
    result = subprocess.run(cmd, check=True)
    return result.returncode == 0


def run_vertical(vertical: str, location: str, limit: int, output_dir: str):
    """Run all three steps for a single vertical."""
    location_slug = location.lower().replace(" ", "_")
    base = os.path.join(output_dir, f"{vertical}_{location_slug}")

    targets_csv  = f"{base}_targets.csv"
    crawled_csv  = f"{base}_crawled.csv"
    scored_csv   = f"{base}_scored.csv"

    print(f"\n{'#'*60}")
    print(f"# VERTICAL: {vertical.upper()} — {location}")
    print(f"{'#'*60}")

    # Step 1 — Find targets
    run_step("step1_find_targets.py", [
        "--vertical", vertical,
        "--location", location,
        "--limit", str(limit),
        "--output-dir", output_dir,
    ])

    if not os.path.exists(targets_csv):
        print(f"  Step 1 produced no output for {vertical}. Skipping.")
        return

    # Step 2 — Crawl websites
    run_step("step2_crawl_websites.py", [
        "--input", targets_csv,
        "--output", crawled_csv,
    ])

    # Step 3 — Score leads
    run_step("step3_score_leads.py", [
        "--input", crawled_csv,
        "--output", scored_csv,
    ])

    print(f"\n✓ {vertical} complete → {scored_csv}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIMS full pipeline runner")
    parser.add_argument("--vertical", type=str, help="Single vertical (e.g. plumber)")
    parser.add_argument("--all-verticals", action="store_true")
    parser.add_argument("--location", type=str, required=True, help="City and state (e.g. 'Miami FL')")
    parser.add_argument("--limit", type=int, default=100, help="Max businesses per keyword")
    args = parser.parse_args()

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    output_dir = f"output/{timestamp}"
    os.makedirs(output_dir, exist_ok=True)
    print(f"Output directory: {output_dir}")

    if args.all_verticals:
        for key in VERTICALS:
            run_vertical(key, args.location, args.limit, output_dir)
    elif args.vertical:
        if args.vertical not in VERTICALS:
            print(f"Unknown vertical. Options: {list(VERTICALS.keys())}")
        else:
            run_vertical(args.vertical, args.location, args.limit, output_dir)
    else:
        print("Specify --vertical <key> or --all-verticals")

    print(f"\n{'='*60}")
    print(f"All done. Results in: {output_dir}")
    print(f"{'='*60}")
