import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, publicAnonKey } from "../utils/supabase/info";

export const supabase = createClient(SUPABASE_URL, publicAnonKey);

