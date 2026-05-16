import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * サーバーサイド用Supabaseクライアント（service_role権限）
 * API Routes / Server Components から使用。
 * クライアントコンポーネントからは import しないこと。
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey)
