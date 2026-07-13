"""
config.py — AIMS Website Scanner Configuration
All verticals, scoring weights, and thresholds live here.
Change these without touching the main scanner code.
"""

# ── Verticals ────────────────────────────────────────────────────────────────
VERTICALS = {
    "plumber":           ["plumber", "plumbing", "plumbing contractor"],
    "electrician":       ["electrician", "electrical contractor", "electrical services"],
    "hvac":              ["HVAC", "heating and cooling", "air conditioning contractor", "AC repair"],
    "roofer":            ["roofing contractor", "roofer", "roof repair"],
    "pi_attorney":       ["personal injury attorney", "personal injury lawyer", "accident attorney"],
    "medspa":            ["medspa", "med spa", "medical spa", "aesthetics clinic"],
    "dental":            ["dentist", "dental office", "dental practice"],
    "insurance_agency":  ["insurance agency", "insurance broker", "insurance agent"],
    "financial_advisor": ["financial advisor", "financial planner", "wealth management", "IMO"],
}

# ── Scoring weights ───────────────────────────────────────────────────────────
FIT_WEIGHT    = 0.40   # How well they match AIMS's ICP
WARMTH_WEIGHT = 0.60   # How actively in-market they are right now

# ── Queue thresholds (combined score) ────────────────────────────────────────
TIER_1_THRESHOLD = 8.0   # Explicit pain signal + strong fit → call now
TIER_2_THRESHOLD = 6.0   # Good fit + some warmth signal → call soon
TIER_3_THRESHOLD = 4.5   # ICP fit, no active signal → nurture sequence
# Below 4.5 → discard

# ── Crawler settings ─────────────────────────────────────────────────────────
CRAWL_TIMEOUT_SECONDS   = 10
CRAWL_DELAY_SECONDS     = 1.5   # polite delay between requests
MAX_HOMEPAGE_CHARS      = 8000  # truncate before sending to AI

# ── Review signals to look for (customer complaints → warmth) ────────────────
NEGATIVE_REVIEW_PHRASES = [
    "never called back", "didn't call back", "no call back",
    "hard to reach", "couldn't reach", "didn't answer",
    "voicemail", "left a message", "never returned",
    "slow response", "no response", "waited days",
    "missed appointment", "no show",
]

# ── Job posting signals → in-market warmth ───────────────────────────────────
HIRING_SIGNAL_TITLES = [
    "dispatcher", "call center", "receptionist", "office manager",
    "customer service", "answering service", "front desk", "scheduler",
]
