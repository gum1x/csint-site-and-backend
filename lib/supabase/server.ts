import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// Create a Supabase client for use in Server Components
export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// Create a Supabase client for use in Server Actions
export const createActionClient = () => {
  return createServerActionClient<Database>({ cookies })
}

// Add this export to fix the error
export const createClient = createServerClient
