/**
 * 設定管理 - Supabase system_config テーブルからの読み取り
 *
 * DB優先、環境変数フォールバック。
 * 5秒キャッシュで毎リクエストのDB問い合わせを回避。
 */
import { supabase } from "@/lib/supabase"

let _configCache: Record<string, string> = {}
let _configCacheTime = 0
const CONFIG_CACHE_TTL = 5000 // 5秒

export async function getConfigValue(key: string): Promise<string> {
  if (Date.now() - _configCacheTime > CONFIG_CACHE_TTL) {
    try {
      const { data } = await supabase.from("system_config").select("key, value")
      _configCache = {}
      for (const row of data ?? []) {
        _configCache[row.key] = row.value
      }
      _configCacheTime = Date.now()
    } catch {
      // DB接続失敗時はキャッシュを維持、環境変数にフォールバック
    }
  }
  return _configCache[key] ?? process.env[key] ?? ""
}

export async function getAllConfigValues(): Promise<Record<string, string>> {
  // キャッシュ更新のためにgetConfigValueを一度呼ぶ
  await getConfigValue("_dummy_")
  return { ..._configCache }
}

/** キャッシュを即座に無効化（設定保存後に呼ぶ） */
export function invalidateConfigCache() {
  _configCacheTime = 0
}
