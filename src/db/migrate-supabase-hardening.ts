/**
 * 本番運用ハードニング・マイグレーション（Supabase Postgres 直結）
 *
 * 長期運用（数年スパン）に耐えるよう、追加機能テーブルを中心に
 * 参照整合性・インデックス・制約・updated_at自動更新・拡張カラム・
 * 正規化タグ体系（tags / video_tags）を整備する。
 *
 * 実行: npm run db:harden
 *   （= npx tsx --env-file=.env.local src/db/migrate-supabase-hardening.ts）
 * 冪等。何度実行しても安全。
 */
import { Client } from "pg"

const DDL = `
-- ============================================================
-- 共通: updated_at 自動更新トリガー関数
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- ============================================================
-- mc_members: slug / SNS / updated_at / 制約・索引
-- ============================================================
ALTER TABLE mc_members ADD COLUMN IF NOT EXISTS slug       TEXT;
ALTER TABLE mc_members ADD COLUMN IF NOT EXISTS x_url      TEXT;
ALTER TABLE mc_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
UPDATE mc_members SET slug = 'mc-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE mc_members ALTER COLUMN slug SET NOT NULL;
ALTER TABLE mc_members ALTER COLUMN name SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mc_members_slug   ON mc_members(slug);
CREATE INDEX        IF NOT EXISTS idx_mc_members_active ON mc_members(is_active, sort_order);
DROP TRIGGER IF EXISTS trg_mc_members_updated ON mc_members;
CREATE TRIGGER trg_mc_members_updated BEFORE UPDATE ON mc_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- video_casts: videos へのFK / 役割・並び順 / 索引
-- ============================================================
ALTER TABLE video_casts ADD COLUMN IF NOT EXISTS role_in_video TEXT DEFAULT 'MC';
ALTER TABLE video_casts ADD COLUMN IF NOT EXISTS sort_order    INTEGER DEFAULT 0;
ALTER TABLE video_casts ADD COLUMN IF NOT EXISTS created_at    TIMESTAMPTZ DEFAULT now();
DELETE FROM video_casts WHERE video_id NOT IN (SELECT id FROM videos);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_video_casts_video') THEN
    ALTER TABLE video_casts ADD CONSTRAINT fk_video_casts_video
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_video_casts_role') THEN
    ALTER TABLE video_casts ADD CONSTRAINT chk_video_casts_role
      CHECK (role_in_video IN ('MC','ゲスト','解説','ナレーター'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_video_casts_video ON video_casts(video_id);

-- ============================================================
-- playlists: slug / カバー画像 / updated_at / kind制約 / 索引
-- ============================================================
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS slug             TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS cover_image_path TEXT;
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now();
UPDATE playlists SET slug = id WHERE slug IS NULL OR slug = '';
ALTER TABLE playlists ALTER COLUMN slug SET NOT NULL;
ALTER TABLE playlists ALTER COLUMN title SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_playlists_slug   ON playlists(slug);
CREATE INDEX        IF NOT EXISTS idx_playlists_public ON playlists(is_public, sort_order);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_playlists_kind') THEN
    ALTER TABLE playlists ADD CONSTRAINT chk_playlists_kind
      CHECK (kind IN ('curated','auto','user'));
  END IF;
END $$;
DROP TRIGGER IF EXISTS trg_playlists_updated ON playlists;
CREATE TRIGGER trg_playlists_updated BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- playlist_items: videos へのFK / 追加日時 / 並び順整合
-- ============================================================
ALTER TABLE playlist_items ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT now();
DELETE FROM playlist_items WHERE video_id NOT IN (SELECT id FROM videos);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_playlist_items_video') THEN
    ALTER TABLE playlist_items ADD CONSTRAINT fk_playlist_items_video
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_playlist_items_video ON playlist_items(video_id);

-- ============================================================
-- search_tags: 分類 / updated_at
-- ============================================================
ALTER TABLE search_tags ADD COLUMN IF NOT EXISTS category   TEXT DEFAULT 'genre';
ALTER TABLE search_tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
DROP TRIGGER IF EXISTS trg_search_tags_updated ON search_tags;
CREATE TRIGGER trg_search_tags_updated BEFORE UPDATE ON search_tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 正規化タグ体系: tags / video_tags
-- （ai_contents.tags(jsonb) は表示用、こちらは検索・集計・関連動画用の正規化）
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_tags_updated ON tags;
CREATE TRIGGER trg_tags_updated BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS video_tags (
  video_id   TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (video_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_video_tags_tag   ON video_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_video ON video_tags(video_id);

-- ============================================================
-- 既存コアテーブルのスケール向け索引（検索/一覧の頻出条件）
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_videos_publish_published ON videos(publish_status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category          ON videos(category_code);
CREATE INDEX IF NOT EXISTS idx_videos_program           ON videos(program_id);
CREATE INDEX IF NOT EXISTS idx_videos_source_type       ON videos(source_type);
`

/** スラッグ生成（日本語はそのまま、空白→ハイフン、記号除去） */
function slugify(name: string, fallbackId: number): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, "-")
    .replace(/[^\p{L}\p{N}\-]/gu, "")
  return base || `tag-${fallbackId}`
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log("Connected. Applying hardening DDL...")
  await client.query(DDL)
  console.log("✓ schema hardened (constraints / indexes / triggers / columns)")

  // --- 正規化タグのバックフィル: ai_contents.tags(jsonb) → tags / video_tags ---
  const { rows: aiRows } = await client.query<{ video_id: string; tags: unknown }>(
    `SELECT video_id, tags FROM ai_contents WHERE tags IS NOT NULL`
  )

  const tagIdCache = new Map<string, number>()
  let linkCount = 0

  for (const row of aiRows) {
    const list: string[] = Array.isArray(row.tags)
      ? (row.tags as string[])
      : (typeof row.tags === "string" ? safeParseArray(row.tags) : [])

    for (const raw of list) {
      const name = String(raw).trim()
      if (!name) continue

      let tagId = tagIdCache.get(name)
      if (tagId === undefined) {
        const slug = slugify(name, tagIdCache.size + 1)
        const upsert = await client.query<{ id: number }>(
          `INSERT INTO tags (name, slug) VALUES ($1, $2)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [name, slug]
        )
        tagId = upsert.rows[0].id
        tagIdCache.set(name, tagId)
      }

      await client.query(
        `INSERT INTO video_tags (video_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [row.video_id, tagId]
      )
      linkCount++
    }
  }

  // usage_count を再集計
  await client.query(`
    UPDATE tags t SET usage_count = sub.cnt
    FROM (SELECT tag_id, COUNT(*) cnt FROM video_tags GROUP BY tag_id) sub
    WHERE t.id = sub.tag_id
  `)

  console.log(`✓ tags backfilled: ${tagIdCache.size} tags, ${linkCount} video-tag links`)

  // 結果サマリ
  const summary = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM tags)         AS tags,
      (SELECT COUNT(*) FROM video_tags)   AS video_tags,
      (SELECT COUNT(*) FROM video_casts)  AS casts,
      (SELECT COUNT(*) FROM playlists)    AS playlists,
      (SELECT COUNT(*) FROM playlist_items) AS playlist_items
  `)
  console.log("Counts:", summary.rows[0])

  await client.end()
  console.log("\nHardening migration complete.")
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1) })
