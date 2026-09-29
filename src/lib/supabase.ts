import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://ddwtarfqzdhqdjsuzaft.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_nTQolNRIM4F3SLU36uyhbg_bjLndmu9";

export const supabase = createClient(supabaseUrl, supabaseKey);
