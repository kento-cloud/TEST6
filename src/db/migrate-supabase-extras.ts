/**
 * 追加テーブルのマイグレーション + シード（Supabase Postgres 直結）
 *
 * 対象機能（ハードコード → DB化）:
 *   1. 解説者（MC/出演者）       mc_members, video_casts
 *   2. マイリスト/プレイリスト    playlists, playlist_items
 *   3. 検索ジャンルタグ           search_tags
 *
 * 実行: npx tsx --env-file=.env.local src/db/migrate-supabase-extras.ts
 * 冪等（IF NOT EXISTS / ON CONFLICT）なので何度実行しても安全。
 */
import { Client } from "pg"

const DDL = `
CREATE TABLE IF NOT EXISTS mc_members (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT DEFAULT '',
  bio          TEXT DEFAULT '',
  thumbnail_path TEXT,
  sort_order   INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_casts (
  video_id  TEXT NOT NULL,
  mc_id     INTEGER NOT NULL REFERENCES mc_members(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, mc_id)
);
CREATE INDEX IF NOT EXISTS idx_video_casts_mc ON video_casts(mc_id);

CREATE TABLE IF NOT EXISTS playlists (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_label TEXT DEFAULT 'AI MEDIA運営',
  kind        TEXT DEFAULT 'curated',
  sort_order  INTEGER DEFAULT 0,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS playlist_items (
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id    TEXT NOT NULL,
  position    INTEGER DEFAULT 0,
  PRIMARY KEY (playlist_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_playlist_items_pl ON playlist_items(playlist_id);

CREATE TABLE IF NOT EXISTS search_tags (
  id         SERIAL PRIMARY KEY,
  label      TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
`

const mcMembers = [
  { id: 1, name: "高橋 渉", role: "AIジャーナリスト", bio: "生成AIの最新動向を追う専門記者。難しい技術トピックを誰にでも分かる言葉で解説する。", thumb: "14328" },
  { id: 2, name: "藤本 さき", role: "機械学習エンジニア", bio: "現場でモデル開発に携わるエンジニア。実装目線でAIの仕組みと限界を語る。", thumb: "14305" },
  { id: 3, name: "亀井 啓介", role: "AI研究者", bio: "大規模言語モデルを研究。論文の最前線をかみ砕いて届ける。", thumb: "14316" },
  { id: 4, name: "石井 修一", role: "データサイエンティスト", bio: "データ分析と評価が専門。ベンチマークの読み方に定評がある。", thumb: "14325" },
  { id: 5, name: "星野 純", role: "プロダクトマネージャー", bio: "AIプロダクトの企画・導入を支援。実務での活用事例に詳しい。", thumb: "14317" },
  { id: 6, name: "須藤 拓也", role: "スタートアップ投資家", bio: "AI領域のスタートアップに投資。資金とトレンドの両面から業界を読む。", thumb: "14287" },
]

const videoCasts: Record<number, string[]> = {
  1: ["EP_14365", "EP_14317", "EP_14305", "EP_14357"],
  2: ["EP_14287", "EP_14362", "EP_14317"],
  3: ["EP_14287", "EP_14365", "EP_14364"],
  4: ["EP_14317", "EP_14325", "EP_14362"],
  5: ["EP_14316", "EP_14325", "EP_14328"],
  6: ["EP_14328", "EP_14364", "EP_14305", "EP_14357"],
}

const playlists = [
  { id: "pl_news",    title: "今週の最新AIニュース",            description: "生成AIと最新技術の注目トピックをまとめてチェック。",     sort: 1, items: ["EP_14365", "EP_14317", "EP_14305", "EP_14357"] },
  { id: "pl_master",  title: "AI活用マスター講座",              description: "実務でAIを使いこなすための実践エピソード集。",           sort: 2, items: ["EP_14325", "EP_14316", "EP_14362", "EP_14365"] },
  { id: "pl_startup", title: "次に来る注目AIスタートアップ",      description: "資金調達や戦略から次の主役を見抜く。",                 sort: 3, items: ["EP_14364", "EP_14328", "EP_14305", "EP_14357"] },
  { id: "pl_prompt",  title: "プロンプト&業務自動化",            description: "プロンプト設計から業務自動化まで、生産性を上げる技。",   sort: 4, items: ["EP_14325", "EP_14316", "EP_14362", "EP_14317"] },
  { id: "pl_basic",   title: "LLMの基礎からTransformerまで",     description: "AIの仕組みを基礎から理解するための入門コース。",       sort: 5, items: ["EP_14287", "EP_14317", "EP_14365", "EP_14364"] },
  { id: "pl_global",  title: "世界のAI動向を追う",              description: "米中をはじめ世界のAI開発競争と最新トレンド。",         sort: 6, items: ["EP_14305", "EP_14357", "EP_14328", "EP_14364"] },
]

const searchTags = [
  "ChatGPT活用", "プロンプト術", "画像生成AI",
  "LLM入門", "AI倫理", "業務効率化",
  "生成AI", "最新モデル", "海外動向",
]

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log("Connected. Applying DDL...")
  await client.query(DDL)
  console.log("✓ tables ready")

  // --- mc_members ---
  for (const m of mcMembers) {
    await client.query(
      `INSERT INTO mc_members (id, name, role, bio, thumbnail_path, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, bio=EXCLUDED.bio,
         thumbnail_path=EXCLUDED.thumbnail_path, sort_order=EXCLUDED.sort_order, is_active=true`,
      [m.id, m.name, m.role, m.bio, `/images/static/converted/chapter/${m.thumb}/ogp/${m.thumb}.webp`, m.id]
    )
  }
  // keep sequence ahead of manual ids
  await client.query(`SELECT setval(pg_get_serial_sequence('mc_members','id'), (SELECT MAX(id) FROM mc_members))`)
  console.log(`✓ ${mcMembers.length} mc_members`)

  // --- video_casts ---
  await client.query(`DELETE FROM video_casts WHERE mc_id = ANY($1)`, [Object.keys(videoCasts).map(Number)])
  let castCount = 0
  for (const [mcId, videoIds] of Object.entries(videoCasts)) {
    for (const vid of videoIds) {
      await client.query(
        `INSERT INTO video_casts (video_id, mc_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [vid, Number(mcId)]
      )
      castCount++
    }
  }
  console.log(`✓ ${castCount} video_casts`)

  // --- playlists + items ---
  for (const p of playlists) {
    await client.query(
      `INSERT INTO playlists (id, title, description, kind, sort_order, is_public)
       VALUES ($1,$2,$3,'curated',$4,true)
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, sort_order=EXCLUDED.sort_order`,
      [p.id, p.title, p.description, p.sort]
    )
    await client.query(`DELETE FROM playlist_items WHERE playlist_id=$1`, [p.id])
    let pos = 0
    for (const vid of p.items) {
      await client.query(
        `INSERT INTO playlist_items (playlist_id, video_id, position) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [p.id, vid, pos++]
      )
    }
  }
  console.log(`✓ ${playlists.length} playlists`)

  // --- search_tags ---
  for (let i = 0; i < searchTags.length; i++) {
    await client.query(
      `INSERT INTO search_tags (label, sort_order, is_active) VALUES ($1,$2,true)
       ON CONFLICT (label) DO UPDATE SET sort_order=EXCLUDED.sort_order, is_active=true`,
      [searchTags[i], i + 1]
    )
  }
  console.log(`✓ ${searchTags.length} search_tags`)

  await client.end()
  console.log("\nMigration + seed complete.")
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1) })
