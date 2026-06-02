/**
 * 本番 Supabase の ai_contents を詳細コンテンツで更新し、正規化タグを再生成する。
 *
 * - 各エピソードの summary / chapters / article / tags を ai-content-data.ts の
 *   充実版に差し替え（汎用テンプレ → 専門的な内容へ）。
 * - その後 tags / video_tags をクリーンに再構築（usage_count も再集計）。
 *
 * 実行: npm run db:enrich
 *   （= npx tsx --env-file=.env.local src/db/update-supabase-ai-contents.ts）
 * 冪等。
 */
import { Client } from "pg"
import { aiContentMap } from "./ai-content-data"

function slugify(name: string, fallbackId: number): string {
  const base = name.trim().toLowerCase().replace(/[\s　]+/g, "-").replace(/[^\p{L}\p{N}\-]/gu, "")
  return base || `tag-${fallbackId}`
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log("Connected. Updating ai_contents with detailed content...")

  let updated = 0
  for (const [numId, c] of Object.entries(aiContentMap)) {
    const videoId = `EP_${numId}`
    const res = await client.query(
      `UPDATE ai_contents
       SET summary = $2, chapters = $3::jsonb, article = $4, tags = $5::jsonb,
           is_edited = true, updated_at = now()
       WHERE video_id = $1`,
      [videoId, c.summary, JSON.stringify(c.chapters), c.article, JSON.stringify(c.tags)]
    )
    if (res.rowCount && res.rowCount > 0) {
      updated += res.rowCount
    } else {
      // 行が無ければ作成
      await client.query(
        `INSERT INTO ai_contents (id, video_id, summary, chapters, article, tags, related_category_codes, status, version, is_edited, created_at, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6::jsonb,'[]','done',1,true,now(),now())`,
        [`ai_${videoId}`, videoId, c.summary, JSON.stringify(c.chapters), c.article, JSON.stringify(c.tags)]
      )
      updated++
    }
  }
  console.log(`✓ ai_contents updated: ${updated}`)

  // --- tags / video_tags をクリーン再構築 ---
  console.log("Rebuilding normalized tags...")
  await client.query(`TRUNCATE video_tags`)
  await client.query(`TRUNCATE tags RESTART IDENTITY CASCADE`)

  const { rows } = await client.query<{ video_id: string; tags: unknown }>(
    `SELECT video_id, tags FROM ai_contents WHERE tags IS NOT NULL`
  )
  const cache = new Map<string, number>()
  let links = 0
  for (const r of rows) {
    const list: string[] = Array.isArray(r.tags) ? (r.tags as string[]) : []
    for (const raw of list) {
      const name = String(raw).trim()
      if (!name) continue
      let id = cache.get(name)
      if (id === undefined) {
        const up = await client.query<{ id: number }>(
          `INSERT INTO tags (name, slug) VALUES ($1,$2)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [name, slugify(name, cache.size + 1)]
        )
        id = up.rows[0].id
        cache.set(name, id)
      }
      await client.query(`INSERT INTO video_tags (video_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [r.video_id, id])
      links++
    }
  }
  await client.query(`
    UPDATE tags t SET usage_count = sub.cnt
    FROM (SELECT tag_id, COUNT(*) cnt FROM video_tags GROUP BY tag_id) sub
    WHERE t.id = sub.tag_id
  `)
  console.log(`✓ tags rebuilt: ${cache.size} tags, ${links} links`)

  const top = await client.query(`SELECT name, usage_count FROM tags ORDER BY usage_count DESC, name LIMIT 10`)
  console.log("top tags:", top.rows.map((r) => `${r.name}(${r.usage_count})`).join(", "))

  await client.end()
  console.log("\nEnrich complete.")
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1) })
