# Galloway Fence & Gate — Build-Your-Fence Estimator (Wireframe)

Standalone prototype for James Galloway (Galloway Fence & Gate, Tallahassee FL) — a
customer-facing "build your own fence" configurator that produces a live visual
preview + estimate, then walks through proposal → quote → invoice → payment
tracking. This is a **wireframe**: the flow, screens, and interactions are real,
but pricing figures, e-sign, PDF export, and payment processing are stubbed with
placeholders so it can be reviewed end-to-end before wiring up real numbers,
a payment processor, and persistence.

## Run it

```bash
cd fence-estimator
npm install
npm run dev
```

Opens on http://localhost:5174

## What's here

**Customer flow** (`/` → `/estimate/...`)
- Landing page
- Step 1 — Property & measurements (draw the fence line on a 2D top-down canvas, or enter linear footage manually)
- Step 2 — Fence style (material, height, color/finish)
- Step 3 — Gates (add single/double/drive gates, placed along the line)
- Step 4 — Accessories (post caps, staining, lighting, etc.)
- Step 5 — Review & estimate summary
- Live 2D top-down preview + running price panel visible throughout

**Documents / back office**
- Proposal (printable summary sent to the customer)
- Quote acceptance (typed e-sign stand-in)
- Invoice (deposit + balance terms)
- Payments ledger ("check & balance" — payments received vs. balance due)
- Admin dashboard — every saved project with its status (Draft → Sent → Accepted → Invoiced → Paid)

## Notes on what's real vs. placeholder

- **Real**: the step flow, the linear-footage math, the live price calculation
  from the rate table in `src/data/pricing.js`, the SVG preview, project
  persistence to `localStorage`, status transitions.
- **Placeholder**: the actual $/ft rates, gate prices, and accessory prices —
  swap in James's real numbers in `src/data/pricing.js`. PDF export, e-signature,
  and payment capture are stubbed (buttons exist, no real PDF/e-sign/Stripe
  integration yet).

## Next steps once James signs off on the flow

1. Real pricing from Galloway Fence & Gate.
2. Real photos/material swatches per fence type.
3. PDF generation for proposals/invoices.
4. E-signature (e.g. an embedded signing widget).
5. Payment capture (e.g. Stripe) instead of manual "record payment".
6. A backend (Supabase, matching the stack already used in the AIMS Command
   Center) instead of localStorage, plus lead hand-off into the CRM.
