/**
 * トラッキング/アナリティクス系スクリプトを判定する。
 * これらは機能に不要で、エラーの原因になるため削除対象。
 */
const REMOVE_PATTERNS = [
  "googletagmanager.com",
  "google-analytics.com",
  "gtag/",
  "facebook.net",
  "fbevents",
  "connect.facebook",
  "ads-twitter.com",
  "static.ads-twitter",
  "doubleclick.net",
  "karte.io",
  "google.com/ccm",
  "google.com/measurement",
  "googlesyndication",
]

/**
 * 機能に必要な外部スクリプト。これらは保持する。
 */
const KEEP_PATTERNS = [
  "player-static.p.uliza.jp",
  "player-api.p.uliza.jp",
  "api.iconify.design",
]

export function shouldRemoveScript(src: string): boolean {
  // 機能に必要なスクリプトは保持
  if (KEEP_PATTERNS.some((p) => src.includes(p))) return false
  // トラッキング系は削除
  if (REMOVE_PATTERNS.some((p) => src.includes(p))) return true
  return false
}

/**
 * page.evaluate 文字列テンプレート内で使えるインライン版フィルタリスト
 */
export function getRemovePatternsJson(): string {
  return JSON.stringify(REMOVE_PATTERNS)
}

export function getKeepPatternsJson(): string {
  return JSON.stringify(KEEP_PATTERNS)
}
