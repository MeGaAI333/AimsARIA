// PLACEHOLDER RATES — swap in Galloway Fence & Gate's real numbers.
// Everything downstream (estimate math, proposal, invoice) reads from this file only.

export const MATERIALS = [
  {
    id: "wood",
    name: "Wood — Privacy",
    blurb: "Classic dog-ear or board-on-board privacy fencing.",
    swatch: "#a9784f",
    ratePerFt: 28,
    heights: [4, 6, 8],
    finishes: ["Natural", "Stained — Cedar", "Stained — Walnut", "Painted — White"],
  },
  {
    id: "vinyl",
    name: "Vinyl — Privacy",
    blurb: "Low-maintenance PVC privacy or picket panels.",
    swatch: "#e7e3d8",
    ratePerFt: 34,
    heights: [4, 6, 8],
    finishes: ["White", "Tan", "Gray", "Almond"],
  },
  {
    id: "chainlink",
    name: "Chain Link",
    blurb: "Galvanized or black vinyl-coated chain link.",
    swatch: "#9aa5ad",
    ratePerFt: 14,
    heights: [3, 4, 5, 6],
    finishes: ["Galvanized (silver)", "Black vinyl-coated", "Green vinyl-coated"],
  },
  {
    id: "aluminum",
    name: "Aluminum — Ornamental",
    blurb: "Decorative metal picket fencing, pool-code options.",
    swatch: "#3b3f45",
    ratePerFt: 32,
    heights: [4, 5, 6],
    finishes: ["Black", "Bronze", "White"],
  },
  {
    id: "farm",
    name: "Farm & Ranch",
    blurb: "Split rail or field/no-climb wire fencing.",
    swatch: "#8a6d4b",
    ratePerFt: 18,
    heights: [3, 4, 5],
    finishes: ["Natural wood", "Black wire", "Galvanized wire"],
  },
];

export const GATE_TYPES = [
  { id: "walk-single", name: "Single Walk Gate", widthFt: 4, basePrice: 220 },
  { id: "walk-double", name: "Double Walk Gate", widthFt: 6, basePrice: 380 },
  { id: "drive-single", name: "Single Drive Gate", widthFt: 10, basePrice: 520 },
  { id: "drive-double", name: "Double Drive Gate", widthFt: 16, basePrice: 890 },
];

export const ACCESSORIES = [
  { id: "post-caps", name: "Decorative Post Caps", price: 6, unit: "per post" },
  { id: "lattice-top", name: "Lattice Top Accent", price: 4, unit: "per ft" },
  { id: "staining", name: "Staining / Sealing", price: 3.5, unit: "per ft" },
  { id: "solar-lights", name: "Solar Post Cap Lights", price: 18, unit: "per fixture" },
  { id: "haul-away", name: "Old Fence Haul-Away", price: 350, unit: "flat" },
  { id: "rush-install", name: "Rush Install (2-week)", price: 400, unit: "flat" },
];

export const POST_SPACING_FT = 8; // used to estimate post count from linear footage

export const DEPOSIT_PCT = 0.5; // 50% deposit due at quote acceptance

export function estimatePostCount(linearFt) {
  return Math.max(2, Math.ceil(linearFt / POST_SPACING_FT) + 1);
}

export function findMaterial(id) {
  return MATERIALS.find((m) => m.id === id);
}

export function findGateType(id) {
  return GATE_TYPES.find((g) => g.id === id);
}

export function findAccessory(id) {
  return ACCESSORIES.find((a) => a.id === id);
}
