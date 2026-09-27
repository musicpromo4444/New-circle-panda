import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://ddwtarfqzdhqdjsuzaft.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_nTQolNRIM4F3SLU36uyhbg_bjLndmu9";

export const crushSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

let authPromise: Promise<string | null> | null = null;

export function ensureCrushUser(): Promise<string | null> {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    const existing = await crushSupabase.auth.getUser();
    if (existing.data.user?.id) return existing.data.user.id;
    const created = await crushSupabase.auth.signInAnonymously();
    return created.data.user?.id ?? null;
  })().catch(() => null);
  return authPromise;
}

export async function loadCrushRemote() {
  const userId = await ensureCrushUser();
  if (!userId) return null;
  const [{ data: nominees }, { data: reactions }, { data: votes }, { data: shares }, { data: config }, { data: winners }] =
    await Promise.all([
      crushSupabase.from("crush_nominees").select("id,user_id,display_name,kind,blurb,emoji,created_at,week_start").order("created_at", { ascending: false }),
      crushSupabase.from("crush_reactions").select("nominee_id,reaction"),
      crushSupabase.from("crush_votes").select("nominee_id,user_id"),
      crushSupabase.from("crush_shares").select("nominee_id"),
      crushSupabase.from("crush_admin_config").select("*").eq("id", true).maybeSingle(),
      crushSupabase.from("crush_winners").select("*").order("created_at", { ascending: false }).limit(8),
    ]);
  return { nominees: nominees ?? [], reactions: reactions ?? [], votes: votes ?? [], shares: shares ?? [], config, winners: winners ?? [], userId };
}

export async function uploadCrushRemote(name: string, kind: "wcw" | "mcm", blurb: string, emoji: string) {
  const userId = await ensureCrushUser();
  if (!userId) return null;
  const { data } = await crushSupabase
    .from("crush_nominees")
    .insert({ user_id: userId, display_name: name, kind, blurb, emoji, week_start: new Date().toISOString().slice(0, 10) })
    .select("id")
    .single();
  return data?.id ?? null;
}

export async function voteCrushRemote(nomineeId: string) {
  const userId = await ensureCrushUser();
  if (!userId) return false;
  const { error } = await crushSupabase.from("crush_votes").insert({ nominee_id: nomineeId, user_id: userId });
  return !error;
}

export async function reactCrushRemote(nomineeId: string, reaction: string) {
  const userId = await ensureCrushUser();
  if (!userId) return false;
  const { error } = await crushSupabase.from("crush_reactions").insert({ nominee_id: nomineeId, user_id: userId, reaction });
  return !error;
}

export async function shareCrushRemote(nomineeId: string) {
  const userId = await ensureCrushUser();
  if (!userId) return false;
  const { error } = await crushSupabase.from("crush_shares").insert({ nominee_id: nomineeId, user_id: userId });
  return !error;
}

export type CrushRemoteClient = SupabaseClient;

export async function finalizeCrushWeekRemote(weekStart: string) {
  await ensureCrushUser();
  const { data } = await crushSupabase.rpc("finalize_crush_week", { p_week_start: weekStart });
  return data ?? null;
}
