"""
step2_crawl_websites.py — Website crawler
Takes the CSV from step 1, visits each business's homepage,
extracts visible text and tech signals, and outputs an enriched CSV
ready for AI scoring in step 3.

Usage:
    python step2_crawl_websites.py --input output/plumber_miami_fl_targets.csv
    python step2_crawl_websites.py --input output/plumber_miami_fl_targets.csv --output output/plumber_miami_fl_crawled.csv
"""

import os
import time
import argparse
import requests
import pandas as pd
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from config import CRAWL_TIMEOUT_SECONDS, CRAWL_DELAY_SECONDS, MAX_HOMEPAGE_CHARS

load_dotenv()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Signals that suggest a business catches calls well (lowers warmth score)
BOOKING_SIGNALS = [
    "book online", "schedule online", "book appointment", "request appointment",
    "online scheduling", "book now", "schedule now", "calendly", "acuity",
    "housecall pro", "servicetitan", "jobber",
]

# Signals that suggest missed-call risk (raises warmth score)
MISSED_CALL_SIGNALS = [
    "leave a message", "call back", "we will call you", "after hours",
    "leave voicemail", "answering service", "we're busy", "limited availability",
    "call during business hours", "no answer",
]

# Hiring signals that indicate they're trying to solve this with headcount
HIRING_PAGE_SIGNALS = ["careers", "join our team", "we're hiring", "employment", "dispatcher needed"]


def detect_tech(soup: BeautifulSoup, html: str) -> dict:
    """Detect booking widgets, chat tools, and CRM pixels from page source."""
    html_lower = html.lower()
    return {
        "has_chat_widget":     any(t in html_lower for t in ["tawk.to", "intercom", "drift", "crisp", "tidio", "livechat"]),
        "has_booking_widget":  any(t in html_lower for t in ["calendly", "acuityscheduling", "housecallpro", "servicetitan", "jobber", "bookingkoala"]),
        "has_crm_pixel":       any(t in html_lower for t in ["hubspot", "salesforce", "gohighlevel", "keap", "activecampaign"]),
        "has_facebook_pixel":  "fbq(" in html_lower or "facebook.net/tr" in html_lower,
        "has_google_ads":      "googleadservices" in html_lower or "gtag(" in html_lower,
        "is_running_ads":      "fbq(" in html_lower or "googleadservices" in html_lower,
    }


def crawl_site(url: str) -> dict:
    """Fetch a homepage and extract all useful signals."""
    if not url.startswith("http"):
        url = "https://" + url

    result = {
        "crawl_status":         "ok",
        "page_title":           "",
        "meta_description":     "",
        "homepage_text":        "",
        "has_chat_widget":      False,
        "has_booking_widget":   False,
        "has_crm_pixel":        False,
        "has_facebook_pixel":   False,
        "has_google_ads":       False,
        "is_running_ads":       False,
        "booking_signals_found": "",
        "missed_call_signals_found": "",
        "hiring_signals_found": "",
    }

    try:
        response = requests.get(url, headers=HEADERS, timeout=CRAWL_TIMEOUT_SECONDS, allow_redirects=True)
        response.raise_for_status()

        # Detect if redirected to Facebook or similar (no real website)
        if "facebook.com" in response.url or "instagram.com" in response.url:
            result["crawl_status"] = "social_redirect"
            return result

        soup = BeautifulSoup(response.text, "lxml")

        # Remove nav, footer, scripts, styles — just the content
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        result["page_title"]       = soup.title.string.strip() if soup.title else ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        result["meta_description"] = meta_desc["content"].strip() if meta_desc and meta_desc.get("content") else ""

        visible_text = soup.get_text(separator=" ", strip=True)
        result["homepage_text"] = visible_text[:MAX_HOMEPAGE_CHARS]

        text_lower = visible_text.lower()
        result["booking_signals_found"]     = ", ".join(s for s in BOOKING_SIGNALS if s in text_lower)
        result["missed_call_signals_found"] = ", ".join(s for s in MISSED_CALL_SIGNALS if s in text_lower)
        result["hiring_signals_found"]      = ", ".join(s for s in HIRING_PAGE_SIGNALS if s in text_lower)

        tech = detect_tech(soup, response.text)
        result.update(tech)

    except requests.exceptions.Timeout:
        result["crawl_status"] = "timeout"
    except requests.exceptions.ConnectionError:
        result["crawl_status"] = "connection_error"
    except requests.exceptions.HTTPError as e:
        result["crawl_status"] = f"http_{e.response.status_code}"
    except Exception as e:
        result["crawl_status"] = f"error: {str(e)[:100]}"

    return result


def run(input_path: str, output_path: str):
    df = pd.read_csv(input_path)
    print(f"Crawling {len(df)} websites...")

    crawl_results = []
    for idx, row in df.iterrows():
        url = str(row.get("website", "")).strip()
        name = str(row.get("name", "")).strip()

        if not url or url == "nan":
            crawl_results.append({"crawl_status": "no_website"})
            print(f"  [{idx+1}/{len(df)}] SKIP (no website): {name}")
            continue

        print(f"  [{idx+1}/{len(df)}] Crawling: {name} — {url}")
        result = crawl_site(url)
        crawl_results.append(result)
        time.sleep(CRAWL_DELAY_SECONDS)

    crawl_df = pd.DataFrame(crawl_results)
    combined = pd.concat([df.reset_index(drop=True), crawl_df.reset_index(drop=True)], axis=1)
    combined.to_csv(output_path, index=False)
    print(f"\nDone. Saved {len(combined)} rows → {output_path}")
    ok_count = (combined["crawl_status"] == "ok").sum()
    print(f"  Successfully crawled: {ok_count} / {len(combined)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIMS website crawler — Step 2")
    parser.add_argument("--input", type=str, required=True, help="CSV from step 1")
    parser.add_argument("--output", type=str, help="Output CSV path (default: input_crawled.csv)")
    args = parser.parse_args()

    output = args.output or args.input.replace(".csv", "_crawled.csv")
    run(args.input, output)
