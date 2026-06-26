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
