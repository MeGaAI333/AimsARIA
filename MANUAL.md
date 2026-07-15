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

**Wiring it to the AIMS AI Command Center CRM:**

The CRM (branch `claude/aims-command-center-agents-h49o16`) has a
`scanner-webhook` Supabase Edge Function built for exactly this. Once it's
deployed:

```
AIMS_CRM_WEBHOOK=https://<your-project-ref>.supabase.co/functions/v1/scanner-webhook?org_id=<your_org_id>
```

- `org_id` in the query string controls which org in the CRM these leads
  land under (defaults to `aims-internal` if omitted).
- If the Edge Function has `SCANNER_WEBHOOK_SECRET` set (recommended —
  otherwise this endpoint accepts contact writes from anyone with the URL),
  also set `AIMS_CRM_WEBHOOK_SECRET` in `.env` to the same value.
- The function upserts contacts (deduped by phone within the org) and adds
  a note with the fit/warmth reasoning and suggested opener.
- Deploy it with `supabase functions deploy scanner-webhook` from the CRM
  branch, and set its secret with
  `supabase secrets set SCANNER_WEBHOOK_SECRET=<your-secret>`.

### Troubleshooting

| Error | Fix |
|---|---|
| `externally-managed-environment` on `pip install` | You're not in the venv. Run `python3 -m venv venv && source venv/bin/activate` first. |
| `REQUEST_DENIED (invalid API key)` | Check `GOOGLE_PLACES_API_KEY` in `.env` for typos — copy it again from Google Cloud Console → Credentials. |
| `REQUEST_DENIED (must enable Billing)` | Link/create a billing account for the project in Google Cloud Console → Billing. Required even though Places API has a free tier. |
| `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'` | Version mismatch between `anthropic` and `httpx`. Run `pip install "httpx==0.27.2"`. Already pinned in `requirements.txt` as of this writing. |

### Quick command reference

**Getting started (every new terminal session):**
```bash
cd ~/command-center/aims-scanner
source venv/bin/activate
```
*Produces:* nothing printed except `(venv)` appearing at the front of your prompt — that's confirmation the virtual environment is active. Required before any `python run_pipeline.py` command will find its installed packages.

**Running scans:**
```bash
python run_pipeline.py --vertical plumber --location "Miami FL"
python run_pipeline.py --all-verticals --location "Miami FL"
python run_pipeline.py --all-verticals --location "Miami FL" --limit 5   # quick test
```
*Produces:* a new timestamped folder under `output/` (e.g. `output/2026-07-15_0930/`) containing one `_targets.csv`, one `_crawled.csv`, and one `_scored.csv` per vertical scanned. `--vertical` scans one industry; `--all-verticals` scans all 9; `--limit` caps how many businesses per keyword (default 100) — use a small limit like 5 to test quickly without burning API budget.

**Finding results:**
```bash
ls -t output/ | head -1              # newest run folder
ls output/<timestamp>/               # files inside it
```
*Produces:* the first command prints just the name of your most recent run's folder. The second lists every CSV file inside a given run so you know what's available to view.

**Viewing a CSV in the terminal:**
```bash
cat output/<timestamp>/<file>.csv | column -s, -t | less -S
# in less: right arrow scrolls sideways, q quits
```
*Produces:* the CSV displayed as aligned columns in your terminal, one page at a time, instead of a raw comma-separated wall of text.

**Combining all verticals from one run into one file:**
```bash
head -1 output/<timestamp>/hvac_<city>_scored.csv > output/<timestamp>/all_leads.csv
for f in output/<timestamp>/*_scored.csv; do tail -n +2 "$f"; done >> output/<timestamp>/all_leads.csv
```
*Produces:* `all_leads.csv` — every business from every vertical scanned in that run (Tier 1, Tier 2, Tier 3, and Discards) merged into one spreadsheet with a single header row.

**Filtering to just hot leads (Tier 1/2 only):**
```bash
head -1 output/<timestamp>/hvac_<city>_scored.csv > output/<timestamp>/hot_leads.csv
for f in output/<timestamp>/*_scored.csv; do awk -F',' 'NR>1 && ($1 ~ /Tier 1|Tier 2/)' "$f"; done >> output/<timestamp>/hot_leads.csv
```
*Produces:* `hot_leads.csv` — only the businesses tagged Tier 1 ("Call Now") or Tier 2 ("Call Soon") across every vertical in that run, skipping Tier 3/Discard. This is the actual calling list.

**Getting a file to a Windows computer** (run from PowerShell on the Windows machine, not the Ubuntu terminal):
```powershell
scp meghan@<server-ip>:~/command-center/aims-scanner/output/<timestamp>/<file>.csv C:\Users\<you>\OneDrive\Desktop\<file>.csv
```
*Produces:* a copy of that CSV file physically downloaded onto the Windows machine's Desktop, ready to double-click and open in Excel. Check `OneDrive\Desktop` vs plain `Desktop` first with `Test-Path` — OneDrive commonly redirects the real Desktop folder.

**Managing the scheduled cron job:**
```bash
crontab -l      # view current schedule
crontab -e      # edit it
crontab -r      # remove all scheduled jobs (careful — deletes everything)
```
*Produces:* `-l` prints your current scheduled job(s) as plain text, unchanged. `-e` opens the schedule in an editor so you can add/change/remove lines. `-r` wipes out all scheduled jobs immediately with no confirmation and no undo.

**Checking the last automated run:**
```bash
cat ~/command-center/aims-scanner/logs/pipeline.log
```
*Produces:* the full printed output from the most recent cron-triggered run (or the accumulated output from every run so far, since it appends) — use this to confirm a scheduled run actually completed or to see what error stopped it.
