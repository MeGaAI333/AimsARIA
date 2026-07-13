"""
step1_find_targets.py — Google Places API target finder
Pulls businesses by vertical and location, outputs a CSV of targets
with name, address, phone, website URL, rating, review count, and
place ID ready for the crawler in step 2.

Usage:
    python step1_find_targets.py --vertical plumber --location "Miami FL"
    python step1_find_targets.py --all-verticals --location "Miami FL"
    python step1_find_targets.py --vertical hvac --location "Dallas TX" --limit 200
"""

import os
import time
import argparse
import pandas as pd
import googlemaps
from dotenv import load_dotenv
from config import VERTICALS

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_PLACES_API_KEY"))


def search_places(keyword: str, location: str, limit: int = 100) -> list[dict]:
    """Pull businesses from Google Places for a keyword + location."""
    results = []
    query = f"{keyword} in {location}"
    print(f"  Searching: {query}")

    response = gmaps.places(query=query)
    results.extend(response.get("results", []))

    # Page through results (each page = 20 results, max 3 pages = 60)
    while "next_page_token" in response and len(results) < limit:
        time.sleep(2)  # Google requires a short delay before next_page_token works
        response = gmaps.places(query=query, page_token=response["next_page_token"])
        results.extend(response.get("results", []))

    return results[:limit]


def extract_details(place: dict, vertical_key: str) -> dict:
    """Pull the fields we care about from a Places result."""
    # Get phone + website from Place Details (costs 1 extra API call per business)
    place_id = place.get("place_id", "")
    details = {}
    if place_id:
        try:
            detail_response = gmaps.place(
                place_id,
                fields=["name", "formatted_address", "formatted_phone_number",
                        "website", "rating", "user_ratings_total", "reviews"]
            )
            details = detail_response.get("result", {})
        except Exception as e:
            print(f"    Warning: could not get details for {place.get('name')}: {e}")

    # Extract negative review signals
    reviews = details.get("reviews", [])
    negative_review_count = 0
    negative_review_snippets = []
    from config import NEGATIVE_REVIEW_PHRASES
    for review in reviews:
        text = review.get("text", "").lower()
        for phrase in NEGATIVE_REVIEW_PHRASES:
            if phrase in text:
                negative_review_count += 1
                negative_review_snippets.append(review.get("text", "")[:200])
                break

    return {
        "vertical":               vertical_key,
        "name":                   details.get("name") or place.get("name", ""),
        "address":                details.get("formatted_address") or place.get("formatted_address", ""),
        "phone":                  details.get("formatted_phone_number", ""),
        "website":                details.get("website", ""),
        "google_rating":          details.get("rating", ""),
        "review_count":           details.get("user_ratings_total", 0),
        "negative_review_count":  negative_review_count,
        "negative_review_sample": " | ".join(negative_review_snippets[:2]),
        "place_id":               place_id,
    }


def run(vertical_key: str, keywords: list[str], location: str, limit: int, output_dir: str):
    """Run the full Places pull for one vertical."""
    all_results = []
    for keyword in keywords:
        places = search_places(keyword, location, limit=limit)
        for place in places:
            row = extract_details(place, vertical_key)
            if row["website"]:  # Only keep businesses with a website to scan
                all_results.append(row)
        time.sleep(1)

    # Deduplicate by place_id
    df = pd.DataFrame(all_results).drop_duplicates(subset="place_id")
    location_slug = location.lower().replace(" ", "_")
    output_path = os.path.join(output_dir, f"{vertical_key}_{location_slug}_targets.csv")
    df.to_csv(output_path, index=False)
    print(f"  Saved {len(df)} targets → {output_path}")
    return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIMS target finder — Step 1")
    parser.add_argument("--vertical", type=str, help="Single vertical key (e.g. plumber)")
    parser.add_argument("--all-verticals", action="store_true", help="Run all verticals")
    parser.add_argument("--location", type=str, required=True, help="City and state (e.g. 'Miami FL')")
    parser.add_argument("--limit", type=int, default=100, help="Max results per keyword")
    parser.add_argument("--output-dir", type=str, default="output", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if args.all_verticals:
        for key, keywords in VERTICALS.items():
            print(f"\nVertical: {key}")
            run(key, keywords, args.location, args.limit, args.output_dir)
    elif args.vertical:
        if args.vertical not in VERTICALS:
            print(f"Unknown vertical '{args.vertical}'. Options: {list(VERTICALS.keys())}")
        else:
            print(f"\nVertical: {args.vertical}")
            run(args.vertical, VERTICALS[args.vertical], args.location, args.limit, args.output_dir)
    else:
        print("Specify --vertical <key> or --all-verticals")
