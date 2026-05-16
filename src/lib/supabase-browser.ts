import { createClient } from "@supabase/supabase-js"

/**
 * クライアント用Supabaseクライアント（anon key）— ユーザー認証用シングルトン
 * "use client" コンポーネントからのみ使用する。
 * サーバー専用の supabase.ts とは分離してモジュール評価時のエラーを防ぐ。
 */
let _browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (_browserClient) return _browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  _browserClient = createClient(url, anonKey)
  return _browserClient
}
