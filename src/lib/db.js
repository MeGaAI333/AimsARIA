import { supabase } from "./supabase.js";

// ── CONTACTS ──────────────────────────────────────────────────────────────────
export async function getContacts() {
  const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function addContact(c) {
  const { data, error } = await supabase.from("contacts").insert([c]).select().single();
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
  const { data, error } = await supabase.from("tasks").insert([t]).select().single();
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
  const { data, error } = await supabase.from("notes").insert([n]).select().single();
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
  const { data, error } = await supabase.from("events").insert([e]).select().single();
  if (error) throw error;
  return data;
}
export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
