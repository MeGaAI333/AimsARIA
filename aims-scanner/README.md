# AIMS Website Scanner & Lead Qualifier

Automatically finds local service businesses in AIMS's target
verticals, crawls their websites, and scores each one for fit and
warmth — so Allegra's calling queue is ranked by who's most likely
to convert, not just who exists.

## Setup

1. Install dependencies:
   pip install -r requirements.txt

2. Copy .env.example to .env and fill in your API keys:
   cp .env.example .env

3. Get your Google Places API key:
   - Go to console.cloud.google.com
   - Enable the Places API
   - Create an API key
   - Paste it into .env as GOOGLE_PLACES_API_KEY

4. Your ANTHROPIC_API_KEY is already in use for the AIMS CRM —
   use the same key here.

## Running

Single vertical, single city:
   python run_pipeline.py --vertical plumber --location "Miami FL"

All verticals, same city:
   python run_pipeline.py --all-verticals --location "Miami FL"

Limit results per keyword (useful for testing):
   python run_pipeline.py --vertical hvac --location "Dallas TX" --limit 20

## Output

Results land in output/YYYY-MM-DD_HHMM/ as CSV files, one per vertical.
Each row is a scored business with:
- allegra_tier (Tier 1 Call Now / Tier 2 Call Soon / Tier 3 Nurture / Discard)
- combined_score (weighted fit + warmth)
- fit_score and warmth_score (separate, from AI)
- suggested_opener (Allegra's specific opening line for that business)
- All contact details

## Cost

Scoring 100 businesses: under $0.50
Scoring 1,000 businesses: under $5.00
Google Places API: free up to 10,000 calls/month

## Running individual steps

Step 1 only (find targets):
   python step1_find_targets.py --vertical plumber --location "Miami FL"

Step 2 only (crawl websites):
   python step2_crawl_websites.py --input output/plumber_miami_fl_targets.csv

Step 3 only (score leads):
   python step3_score_leads.py --input output/plumber_miami_fl_crawled.csv

## Configuring

Edit config.py to:
- Add or modify verticals and their search keywords
- Adjust fit/warmth scoring weights
- Change tier thresholds
- Add new missed-call or hiring signal phrases
