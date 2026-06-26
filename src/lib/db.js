import { supabase } from "./supabase.js";

async function getOrgId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.user_metadata?.org_id || null;
}

// ── CONTACTS ──────────────────────────────────────────────────────────────────
export async function getContacts() {
  const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addContact(c) {
  const orgId = await getOrgId();
  const record = orgId ? { ...c, org_id: orgId } : c;
  const { data, error } = await supabase.from("contacts").insert([record]).select().single();
  if (error) throw error;
  return data;
}
export async function updateContact(id, changes) {
  const { error } = await supabase.from("contacts").update(changes).eq("id", id);
  if (error) throw error;
}
export async function deleteContact(id) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

// ── TASKS ─────────────────────────────────────────────────────────────────────
export async function getTasks() {
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addTask(t) {
  const orgId = await getOrgId();
  const record = orgId ? { ...t, org_id: orgId } : t;
  const { data, error } = await supabase.from("tasks").insert([record]).select().single();
  if (error) throw error;
  return data;
}
export async function updateTask(id, changes) {
  const { error } = await supabase.from("tasks").update(changes).eq("id", id);
  if (error) throw error;
}
export async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ── NOTES ─────────────────────────────────────────────────────────────────────
export async function getNotes() {
  const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addNote(n) {
  const orgId = await getOrgId();
  const record = orgId ? { ...n, org_id: orgId } : n;
  const { data, error } = await supabase.from("notes").insert([record]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteNote(id) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// ── EVENTS ────────────────────────────────────────────────────────────────────
export async function getEvents() {
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
  if (error) throw error;
  return data;
}
export async function addEvent(e) {
  const orgId = await getOrgId();
  const record = orgId ? { ...e, org_id: orgId } : e;
  const { data, error } = await supabase.from("events").insert([record]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ── CLIENT PROFILES ───────────────────────────────────────────────────────────
export async function getProfile(orgId) {
  const { data, error } = await supabase.from("client_profiles").select("*").eq("org_id", orgId).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}
export async function getAllProfiles() {
  const { data, error } = await supabase.from("client_profiles").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function saveProfile(orgId, profile) {
  const { data, error } = await supabase.from("client_profiles")
    .upsert({ ...profile, org_id: orgId, updated_at: new Date().toISOString() }, { onConflict: "org_id" })
    .select().single();
  if (error) throw error;
  return data;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
export async function getOnboarding(orgId) {
  const { data, error } = await supabase.from("onboarding_data").select("*").eq("org_id", orgId).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}
export async function getAllOnboarding() {
  const { data, error } = await supabase.from("onboarding_data").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function saveOnboarding(orgId, data) {
  const { data: result, error } = await supabase.from("onboarding_data")
    .upsert({ ...data, org_id: orgId, updated_at: new Date().toISOString() }, { onConflict: "org_id" })
    .select().single();
  if (error) throw error;
  return result;
}

// ── CONVERSATIONS ─────────────────────────────────────────────────────────────
export async function getOrCreateConversation(contactId, contactName, contactCompany, orgId, agentId) {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .in("status", ["active", "needs_human", "human_active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return data;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert([{ contact_id: contactId, contact_name: contactName, contact_company: contactCompany || "", org_id: orgId || "", agent_id: agentId, status: "active", messages: [] }])
    .select().single();
  if (error) throw error;
  return created;
}

export async function appendConversationMessage(convId, message) {
  const { data: conv } = await supabase.from("conversations").select("messages").eq("id", convId).single();
  const messages = [...(conv?.messages || []), message];
  const { data, error } = await supabase.from("conversations")
    .update({ messages, updated_at: new Date().toISOString() })
    .eq("id", convId).select().single();
  if (error) throw error;
  return data;
}

export async function setConversationNeedsHuman(convId) {
  const { data, error } = await supabase.from("conversations")
    .update({ status: "needs_human", updated_at: new Date().toISOString() })
    .eq("id", convId).select().single();
  if (error) throw error;
  return data;
}

export async function getQueuedConversations() {
  const { data, error } = await supabase.from("conversations")
    .select("*")
    .in("status", ["needs_human", "human_active"])
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function claimConversation(convId, humanName) {
  const { data, error } = await supabase.from("conversations")
    .update({ status: "human_active", assigned_to_human: humanName, updated_at: new Date().toISOString() })
    .eq("id", convId).select().single();
  if (error) throw error;
  return data;
}

export async function returnConversationToAI(convId, humanName) {
  const { data: conv } = await supabase.from("conversations").select("messages").eq("id", convId).single();
  const sysMsg = { id: Date.now(), role: "system", content: `${humanName} returned conversation to AI`, ts: new Date().toISOString() };
  const messages = [...(conv?.messages || []), sysMsg];
  const { data, error } = await supabase.from("conversations")
    .update({ status: "active", assigned_to_human: null, messages, updated_at: new Date().toISOString() })
    .eq("id", convId).select().single();
  if (error) throw error;
  return data;
}

export async function closeConversation(convId) {
  const { data, error } = await supabase.from("conversations")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", convId).select().single();
  if (error) throw error;
  return data;
}
