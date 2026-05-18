/**
 * snake_case ↔ camelCase 変換
 * Supabase (snake_case) と フロントエンド (camelCase) の橋渡し
 */

/** snake_case → camelCase */
export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}


/** 配列版 snake_case → camelCase */
export function snakeToCamelArray<T extends Record<string, unknown>>(arr: T[]): Record<string, unknown>[] {
  return arr.map(snakeToCamel)
}
