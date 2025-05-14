import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

// Create a single instance of the Supabase client for use on the client side
export const createClient = () => {
  return createClientComponentClient<Database>()
}
