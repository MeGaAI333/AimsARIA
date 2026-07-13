"""
step3_score_leads.py — AI scoring for fit and warmth
Takes the crawled CSV from step 2, sends each business through
Claude (or GPT-4o-mini) for dual scoring: fit (ICP match) and
warmth (actively in-market). Outputs a final ranked lead list.

Usage:
    python step3_score_leads.py --input output/plumber_miami_fl_crawled.csv
    python step3_score_leads.py --input output/plumber_miami_fl_crawled.csv --output output/plumber_miami_fl_scored.csv
"""

import os
import json
import time
import argparse
import pandas as pd
import requests
from anthropic import Anthropic
from dotenv import load_dotenv
from config import FIT_WEIGHT, WARMTH_WEIGHT, TIER_1_THRESHOLD, TIER_2_THRESHOLD, TIER_3_THRESHOLD

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SCORING_PROMPT = """You are evaluating whether a local service business is a good fit for AIMS AI — an AI revenue recovery system that helps businesses capture missed calls, automate follow-up, and book more appointments from their existing lead volume.

The ideal AIMS customer:
- Depends on inbound calls or form fills from advertising for new business
- Has limited staff and may struggle to answer every call (especially after hours)
- Does not have a strong automated follow-up system in place
- Is actively paying for advertising (Google Ads, Facebook Ads, etc.)
- Has signs of missed-call or slow-response problems

Business details:
Name: {name}
Vertical: {vertical}
Address: {address}
Google Rating: {rating} ({review_count} reviews)
Negative review signals (customers complaining about responsiveness): {negative_review_count} found
Negative review samples: {negative_review_sample}
Is running paid ads: {is_running_ads}
Has booking widget: {has_booking_widget}
Has live chat widget: {has_chat_widget}
Has CRM pixel: {has_crm_pixel}
Missed-call language found on site: {missed_call_signals_found}
Hiring signals found (dispatcher, receptionist, etc.): {hiring_signals_found}

Homepage text (truncated):
{homepage_text}

Evaluate this business and return ONLY a valid JSON object with no other text, no markdown, no explanation:

{{
  "fit_score": <integer 1-10, where 10 = perfect ICP match for AIMS>,
  "warmth_score": <integer 1-10, where 10 = actively in-market right now>,
  "depends_on_inbound_calls": <true or false>,
  "has_missed_call_risk": <true or false>,
  "is_running_ads": <true or false>,
  "estimated_size": "<solo | small_2_10 | medium_11_50 | large_50_plus>",
  "fit_reason": "<one sentence explaining the fit score>",
  "warmth_reason": "<one sentence explaining the warmth score>",
  "suggested_opener": "<one sentence Allegra could open with, referencing something specific about this business>"
}}

Warmth scoring guide:
- 9-10: Active pain signal (negative reviews about responsiveness, hiring a dispatcher, running ads with no booking system)
- 7-8: Strong behavioral signal (running ads, no booking widget, low review score)
- 5-6: Moderate signal (some indicators but not definitive)
- 3-4: Weak signal (looks fine, just a good ICP fit)
- 1-2: No signal (well-established systems, strong reviews, booking widget present)"""


def score_business(row: dict) -> dict:
    """Send one business to Claude for dual scoring."""
    prompt = SCORING_PROMPT.format(
        name=row.get("name", ""),
        vertical=row.get("vertical", ""),
        address=row.get("address", ""),
        rating=row.get("google_rating", "N/A"),
        review_count=row.get("review_count", 0),
        negative_review_count=row.get("negative_review_count", 0),
        negative_review_sample=row.get("negative_review_sample", "none"),
        is_running_ads=row.get("is_running_ads", False),
        has_booking_widget=row.get("has_booking_widget", False),
        has_chat_widget=row.get("has_chat_widget", False),
        has_crm_pixel=row.get("has_crm_pixel", False),
        missed_call_signals_found=row.get("missed_call_signals_found", "none"),
        hiring_signals_found=row.get("hiring_signals_found", "none"),
        homepage_text=str(row.get("homepage_text", ""))[:6000],
    )

    for attempt in range(2):
        try:
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            raw = response.content[0].text.strip()
            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            return json.loads(raw)
        except json.JSONDecodeError:
            if attempt == 0:
                time.sleep(1)
                continue
            return {"fit_score": 0, "warmth_score": 0, "fit_reason": "parse_error", "warmth_reason": "parse_error", "suggested_opener": ""}
        except Exception as e:
            return {"fit_score": 0, "warmth_score": 0, "fit_reason": f"api_error: {str(e)[:100]}", "warmth_reason": "", "suggested_opener": ""}

    return {"fit_score": 0, "warmth_score": 0, "fit_reason": "failed_after_retry", "warmth_reason": "", "suggested_opener": ""}


def assign_tier(combined_score: float) -> str:
    if combined_score >= TIER_1_THRESHOLD:
        return "Tier 1 — Call Now"
    elif combined_score >= TIER_2_THRESHOLD:
        return "Tier 2 — Call Soon"
    elif combined_score >= TIER_3_THRESHOLD:
        return "Tier 3 — Nurture"
    else:
        return "Discard"


def post_to_crm_webhook(records: list[dict], webhook_url: str):
    """POST each scored lead to the configured CRM webhook."""
    sent = 0
    for record in records:
        try:
            response = requests.post(webhook_url, json=record, timeout=10)
            response.raise_for_status()
            sent += 1
        except Exception as e:
            print(f"  Warning: webhook post failed for {record.get('name', 'unknown')}: {e}")
    print(f"  Posted {sent}/{len(records)} leads to CRM webhook")


def run(input_path: str, output_path: str):
    df = pd.read_csv(input_path)

    # Only score businesses that were successfully crawled
    scoreable = df[df["crawl_status"] == "ok"].copy()
    skipped = df[df["crawl_status"] != "ok"].copy()
    print(f"Scoring {len(scoreable)} businesses (skipping {len(skipped)} with crawl errors)...")

    scores = []
    for idx, (_, row) in enumerate(scoreable.iterrows()):
        name = row.get("name", "unknown")
        print(f"  [{idx+1}/{len(scoreable)}] Scoring: {name}")
        score = score_business(row.to_dict())
        scores.append(score)
        time.sleep(0.5)  # Gentle rate limiting

    scores_df = pd.DataFrame(scores)
    scored = pd.concat([scoreable.reset_index(drop=True), scores_df.reset_index(drop=True)], axis=1)

    # Calculate combined score and assign tier
    scored["combined_score"] = (
        scored["fit_score"].fillna(0) * FIT_WEIGHT +
        scored["warmth_score"].fillna(0) * WARMTH_WEIGHT
    ).round(2)
    scored["allegra_tier"] = scored["combined_score"].apply(assign_tier)

    # Sort by combined score descending
    scored = scored.sort_values("combined_score", ascending=False)

    # Select final output columns
    final_cols = [
        "allegra_tier", "combined_score", "fit_score", "warmth_score",
        "vertical", "name", "phone", "website", "address",
        "google_rating", "review_count", "negative_review_count",
        "is_running_ads", "has_booking_widget", "has_chat_widget",
        "estimated_size", "fit_reason", "warmth_reason", "suggested_opener",
        "negative_review_sample",
    ]
    available_cols = [c for c in final_cols if c in scored.columns]
    output_df = scored[available_cols]

    output_df.to_csv(output_path, index=False)
    print(f"\nDone. Saved {len(output_df)} scored businesses → {output_path}")

    webhook_url = os.getenv("AIMS_CRM_WEBHOOK")
    if webhook_url:
        print(f"\nPosting {len(output_df)} leads to CRM webhook...")
        post_to_crm_webhook(output_df.to_dict(orient="records"), webhook_url)

    # Summary
    tier_counts = output_df["allegra_tier"].value_counts()
    print("\n── Queue Summary ──────────────────────────────")
    for tier, count in tier_counts.items():
        print(f"  {tier}: {count}")
    print(f"  Total cost estimate: ~${len(scored) * 0.003:.2f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIMS AI scorer — Step 3")
    parser.add_argument("--input", type=str, required=True, help="Crawled CSV from step 2")
    parser.add_argument("--output", type=str, help="Output CSV (default: input_scored.csv)")
    args = parser.parse_args()

    output = args.output or args.input.replace("_crawled.csv", "_scored.csv").replace(".csv", "_scored.csv")
    run(args.input, output)
