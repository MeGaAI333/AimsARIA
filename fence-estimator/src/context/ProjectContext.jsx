import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ACCESSORIES,
  DEPOSIT_PCT,
  estimatePostCount,
  findAccessory,
  findGateType,
  findMaterial,
  GATE_TYPES,
} from "../data/pricing.js";

const STORAGE_KEY = "gf_projects_v1";
const DRAFT_KEY = "gf_draft_v1";

const emptyDraft = {
  line: { points: [], linearFt: 0 },
  materialId: "wood",
  height: 6,
  finish: "",
  gates: [],
  accessories: [],
  solarLightQty: 4,
  customer: { name: "", email: "", phone: "", address: "" },
  notes: "",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const ProjectCtx = createContext(null);

export function ProjectProvider({ children }) {
  const [draft, setDraft] = useState(() => loadJSON(DRAFT_KEY, emptyDraft));
  const [projects, setProjects] = useState(() => loadJSON(STORAGE_KEY, []));

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  function updateDraft(patch) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function resetDraft() {
    setDraft(emptyDraft);
  }

  function addGate(typeId) {
    const type = findGateType(typeId);
    setDraft((d) => ({
      ...d,
      gates: [...d.gates, { id: `${typeId}-${Date.now()}`, typeId, label: type?.name }],
    }));
  }

  function removeGate(instanceId) {
    setDraft((d) => ({ ...d, gates: d.gates.filter((g) => g.id !== instanceId) }));
  }

  function toggleAccessory(id) {
    setDraft((d) => ({
      ...d,
      accessories: d.accessories.includes(id)
        ? d.accessories.filter((a) => a !== id)
        : [...d.accessories, id],
    }));
  }

  function saveProject(overridePatch = {}) {
    const finalDraft = { ...draft, ...overridePatch };
    const pricing = calcPricing(finalDraft);
    const project = {
      id: `GF-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: "draft",
      snapshot: finalDraft,
      pricing,
      payments: [],
      signature: null,
    };
    setProjects((p) => [project, ...p]);
    return project;
  }

  function updateProject(id, patch) {
    setProjects((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function setStatus(id, status) {
    updateProject(id, { status });
  }

  function addPayment(id, payment) {
    setProjects((all) =>
      all.map((p) =>
        p.id === id
          ? { ...p, payments: [...p.payments, { id: `PMT-${Date.now()}`, ...payment }] }
          : p
      )
    );
  }

  function getProject(id) {
    return projects.find((p) => p.id === id);
  }

  const draftPricing = useMemo(() => calcPricing(draft), [draft]);

  const value = {
    draft,
    updateDraft,
    resetDraft,
    addGate,
    removeGate,
    toggleAccessory,
    draftPricing,
    projects,
    saveProject,
    updateProject,
    setStatus,
    addPayment,
    getProject,
  };

  return <ProjectCtx.Provider value={value}>{children}</ProjectCtx.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

export function calcPricing(snapshot) {
  const material = findMaterial(snapshot.materialId);
  const linearFt = Number(snapshot.line?.linearFt) || 0;
  const lines = [];

  if (material && linearFt > 0) {
    lines.push({
      label: `${material.name} — ${snapshot.height}ft (${linearFt} linear ft)`,
      qty: linearFt,
      rate: material.ratePerFt,
      amount: round2(linearFt * material.ratePerFt),
    });
  }

  (snapshot.gates || []).forEach((g) => {
    const type = findGateType(g.typeId);
    if (!type) return;
    lines.push({
      label: type.name,
      qty: 1,
      rate: type.basePrice,
      amount: type.basePrice,
    });
  });

  (snapshot.accessories || []).forEach((accId) => {
    const acc = findAccessory(accId);
    if (!acc) return;
    let qty = 1;
    let amount = acc.price;
    if (acc.unit === "per ft") {
      qty = linearFt;
      amount = round2(linearFt * acc.price);
    } else if (acc.unit === "per post") {
      qty = estimatePostCount(linearFt);
      amount = round2(qty * acc.price);
    } else if (acc.unit === "per fixture") {
      qty = Number(snapshot.solarLightQty) || 0;
      amount = round2(qty * acc.price);
    }
    lines.push({ label: `${acc.name} (${acc.unit})`, qty, rate: acc.price, amount });
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const deposit = round2(subtotal * DEPOSIT_PCT);
  const balance = round2(subtotal - deposit);

  return { lines, subtotal, deposit, balance, depositPct: DEPOSIT_PCT };
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtMoney(n) {
  return (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const STATUS_LABEL = {
  draft: "Draft",
  sent: "Proposal Sent",
  accepted: "Quote Accepted",
  invoiced: "Invoiced",
  paid: "Paid in Full",
};

export { ACCESSORIES, GATE_TYPES };
