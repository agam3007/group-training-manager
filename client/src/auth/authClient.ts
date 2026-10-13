import { createClient } from "@supabase/supabase-js";
import { env } from "../env/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);