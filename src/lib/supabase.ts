import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * サーバーサイド用Supabaseクライアント（service_role権限）
 * API Routes / Server Components から使用
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * クライアント用（anon key）— ユーザー認証用シングルトン
 */
let _browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (_browserClient) return _browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  _browserClient = createClient(url, anonKey)
  return _browserClient
}
