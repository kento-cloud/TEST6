import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * サーバーサイド用Supabaseクライアント（service_role権限）
 * API Routes / Server Components から使用
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * クライアント用（anon key）— 将来のクライアント認証用
 */
export function createBrowserClient() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, anonKey)
}
