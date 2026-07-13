# Command Center Manual

## AIMS Website Scanner & Lead Qualifier

Location: `aims-scanner/`

Finds local service businesses in AIMS's target verticals (plumbers,
electricians, HVAC, roofers, PI attorneys, medspas, dental, insurance,
financial advisors), crawls their websites, and scores each one for fit
and warmth so outreach can be prioritized by who's most likely to convert.

### One-time setup

```bash
cd ~/command-center/aims-scanner
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and fill in:
- `GOOGLE_PLACES_API_KEY` — from console.cloud.google.com (enable "Places API,"
  attach a billing account — free tier covers normal usage)
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `AIMS_CRM_WEBHOOK` — optional, see below

### Every time you use it (new terminal session)

The virtual environment does not stay active across sessions — reactivate it first:

```bash
cd ~/command-center/aims-scanner
source venv/bin/activate
```

### Running a scan

Single vertical, single city:
```bash
python run_pipeline.py --vertical plumber --location "Miami FL"
```

All verticals, one city:
```bash
python run_pipeline.py --all-verticals --location "Miami FL"
```

Limit results per keyword (useful for a quick test):
```bash
python run_pipeline.py --vertical plumber --location "Miami FL" --limit 5
```

Vertical keys: `plumber`, `electrician`, `hvac`, `roofer`, `pi_attorney`,
`medspa`, `dental`, `insurance_agency`, `financial_advisor` (edit `config.py`
to add more).

### Reading the output

Results land in `output/<timestamp>/<vertical>_<location>_scored.csv`.
Each row is one business with:
- `allegra_tier` — Tier 1 (Call Now) / Tier 2 (Call Soon) / Tier 3 (Nurture) / Discard
- `combined_score` — weighted fit + warmth
- `fit_score` / `warmth_score` — separate AI-assigned scores
- `suggested_opener` — a specific opening line for that business
- contact details (phone, website, address)

View a CSV readably in the terminal:
```bash
cat output/<timestamp>/<file>.csv | column -s, -t | less -S
```

### Cost

Roughly $0.003 per business scored (Claude Haiku). Google Places API is
free up to 10,000 calls/month.

### Automating runs on a schedule (cron)

To run automatically instead of by hand, use `cron` on the Ubuntu machine:

```bash
crontab -e
```

Add a line (adjust path, location, and time as needed). Example — run all
verticals for Miami every day at 7:00 AM:

```
0 7 * * * cd /home/meghan/command-center/aims-scanner && /home/meghan/command-center/aims-scanner/venv/bin/python run_pipeline.py --all-verticals --location "Miami FL" --limit 100 >> /home/meghan/command-center/aims-scanner/logs/pipeline.log 2>&1
```

Notes:
- Use the **full path** to the venv's Python (`venv/bin/python`), not just
  `python` — cron doesn't run inside your activated venv.
- Create the logs directory first: `mkdir -p ~/command-center/aims-scanner/logs`
- Check `logs/pipeline.log` after a scheduled run to confirm it worked or
  see errors.
- Cron's minimum interval is once per minute; for a lead-gen scan, once a
  day or a few times a week is typical — running it constantly just re-finds
  the same businesses and burns API budget for no new signal.

### CRM webhook integration

Set `AIMS_CRM_WEBHOOK` in `.env` to a URL, and every scored lead from that
run gets POSTed there automatically as JSON immediately after the CSV is
saved (in addition to the CSV, not instead of it). Each POST body is one
business record with the same fields as the CSV row (`allegra_tier`,
`combined_score`, `name`, `phone`, `website`, `suggested_opener`, etc.).

Leave `AIMS_CRM_WEBHOOK` blank to skip this — the pipeline still writes
CSVs either way.

If a webhook post fails for a specific business (CRM down, bad URL, etc.),
it's logged as a warning and the pipeline continues with the rest — it
won't stop the whole run or lose the CSV output.

### Troubleshooting

| Error | Fix |
|---|---|
| `externally-managed-environment` on `pip install` | You're not in the venv. Run `python3 -m venv venv && source venv/bin/activate` first. |
| `REQUEST_DENIED (invalid API key)` | Check `GOOGLE_PLACES_API_KEY` in `.env` for typos — copy it again from Google Cloud Console → Credentials. |
| `REQUEST_DENIED (must enable Billing)` | Link/create a billing account for the project in Google Cloud Console → Billing. Required even though Places API has a free tier. |
| `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'` | Version mismatch between `anthropic` and `httpx`. Run `pip install "httpx==0.27.2"`. Already pinned in `requirements.txt` as of this writing. |
