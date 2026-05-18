import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DB_DIR, "pivot.db")

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

const migrations = [
  `CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    duration INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    category_code TEXT,
    program_id INTEGER,
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_path TEXT,
    logo_path TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS transcriptions (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    full_text TEXT NOT NULL,
    segments TEXT,
    language TEXT DEFAULT 'ja',
    model TEXT DEFAULT 'whisper-1',
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    processing_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS ai_contents (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    summary TEXT,
    chapters TEXT,
    article TEXT,
    tags TEXT,
    related_ids TEXT,
    model TEXT DEFAULT 'claude-sonnet-4-20250514',
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    processing_ms INTEGER,
    is_edited INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS job_queue (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS thumbnails (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    prompt TEXT,
    style_preset TEXT,
    is_primary INTEGER DEFAULT 0,
    status TEXT DEFAULT 'done',
    error_message TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS thumbnail_style_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    style_params TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    step TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    model TEXT,
    prompt TEXT,
    result_preview TEXT,
    error_message TEXT,
    processing_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL UNIQUE,
    view_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0
  )`,
]

// ALTER TABLE migrations (safe to re-run)
const alterations = [
  // Phase 1: YouTube support
  { table: "videos", column: "source_type", sql: "ALTER TABLE videos ADD COLUMN source_type TEXT DEFAULT 'local'" },
  { table: "videos", column: "youtube_video_id", sql: "ALTER TABLE videos ADD COLUMN youtube_video_id TEXT" },
  { table: "videos", column: "youtube_url", sql: "ALTER TABLE videos ADD COLUMN youtube_url TEXT" },
  { table: "videos", column: "youtube_metadata", sql: "ALTER TABLE videos ADD COLUMN youtube_metadata TEXT" },
  { table: "transcriptions", column: "source", sql: "ALTER TABLE transcriptions ADD COLUMN source TEXT DEFAULT 'whisper'" },

  // Phase 2: MVP hardening — status分離
  { table: "videos", column: "publish_status", sql: "ALTER TABLE videos ADD COLUMN publish_status TEXT DEFAULT 'draft'" },
  { table: "videos", column: "processing_step", sql: "ALTER TABLE videos ADD COLUMN processing_step TEXT DEFAULT 'none'" },

  // Phase 2: MVP hardening — youtube_metadata昇格
  { table: "videos", column: "youtube_channel", sql: "ALTER TABLE videos ADD COLUMN youtube_channel TEXT" },
  { table: "videos", column: "youtube_duration", sql: "ALTER TABLE videos ADD COLUMN youtube_duration INTEGER" },

  // Phase 2: MVP hardening — thumbnails
  { table: "thumbnails", column: "style_preset_id", sql: "ALTER TABLE thumbnails ADD COLUMN style_preset_id TEXT" },

  // Phase 2: MVP hardening — ai_contents
  { table: "ai_contents", column: "related_category_codes", sql: "ALTER TABLE ai_contents ADD COLUMN related_category_codes TEXT" },
  { table: "ai_contents", column: "version", sql: "ALTER TABLE ai_contents ADD COLUMN version INTEGER DEFAULT 1" },
]

console.log("Running migrations...")
for (const sql of migrations) {
  sqlite.exec(sql)
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
  console.log(`  ✓ ${tableName}`)
}

console.log("Running alterations...")
for (const alt of alterations) {
  try {
    sqlite.exec(alt.sql)
    console.log(`  ✓ ${alt.table}.${alt.column} added`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("duplicate column")) {
      console.log(`  - ${alt.table}.${alt.column} already exists`)
    } else {
      throw e
    }
  }
}
// Phase 3: Make file_path nullable in videos and thumbnails
console.log("Running nullable file_path migration...")
try {
  // Check if videos.file_path is already nullable by attempting INSERT with NULL
  const testStmt = sqlite.prepare("INSERT INTO videos (id, title, file_path) VALUES (?, ?, NULL)")
  try {
    testStmt.run("__nullable_test__", "__test__")
    // If it succeeded, column is already nullable — clean up test row
    sqlite.exec("DELETE FROM videos WHERE id = '__nullable_test__'")
    console.log("  - videos.file_path already nullable")
  } catch {
    // Column is NOT NULL — need to migrate
    console.log("  Migrating videos.file_path to nullable...")
    sqlite.exec(`
      CREATE TABLE videos_new (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        file_path TEXT,
        thumbnail_path TEXT,
        duration INTEGER DEFAULT 0,
        file_size INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        publish_status TEXT DEFAULT 'draft',
        processing_step TEXT DEFAULT 'none',
        source_type TEXT DEFAULT 'local',
        youtube_video_id TEXT,
        youtube_url TEXT,
        youtube_metadata TEXT,
        youtube_channel TEXT,
        youtube_duration INTEGER,
        category_code TEXT,
        program_id INTEGER,
        published_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    sqlite.exec("INSERT INTO videos_new (id, title, description, file_path, thumbnail_path, duration, file_size, status, publish_status, processing_step, source_type, youtube_video_id, youtube_url, youtube_metadata, youtube_channel, youtube_duration, category_code, program_id, published_at, created_at, updated_at) SELECT id, title, description, file_path, thumbnail_path, duration, file_size, status, publish_status, processing_step, source_type, youtube_video_id, youtube_url, youtube_metadata, youtube_channel, youtube_duration, category_code, program_id, published_at, created_at, updated_at FROM videos")
    sqlite.exec("DROP TABLE videos")
    sqlite.exec("ALTER TABLE videos_new RENAME TO videos")
    console.log("  ✓ videos.file_path is now nullable")
  }

  // Check thumbnails
  const testThumb = sqlite.prepare("INSERT INTO thumbnails (id, video_id, file_path, source) VALUES (?, ?, NULL, 'test')")
  try {
    testThumb.run("__nullable_test__", "__test__")
    sqlite.exec("DELETE FROM thumbnails WHERE id = '__nullable_test__'")
    console.log("  - thumbnails.file_path already nullable")
  } catch {
    console.log("  Migrating thumbnails.file_path to nullable...")
    sqlite.exec(`
      CREATE TABLE thumbnails_new (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        file_path TEXT,
        source TEXT NOT NULL DEFAULT 'manual',
        prompt TEXT,
        style_preset TEXT,
        style_preset_id TEXT,
        is_primary INTEGER DEFAULT 0,
        status TEXT DEFAULT 'done',
        error_message TEXT,
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        model TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)
    sqlite.exec("INSERT INTO thumbnails_new (id, video_id, file_path, source, prompt, style_preset, style_preset_id, is_primary, status, error_message, width, height, file_size, model, created_at) SELECT id, video_id, file_path, source, prompt, style_preset, style_preset_id, is_primary, status, error_message, width, height, file_size, model, created_at FROM thumbnails")
    sqlite.exec("DROP TABLE thumbnails")
    sqlite.exec("ALTER TABLE thumbnails_new RENAME TO thumbnails")
    console.log("  ✓ thumbnails.file_path is now nullable")
  }
} catch (e) {
  console.error("  Nullable migration error:", e)
}

// Create indexes
console.log("Creating indexes...")
const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_videos_publish_status ON videos(publish_status, published_at)",
  "CREATE INDEX IF NOT EXISTS idx_transcriptions_video_id ON transcriptions(video_id)",
  "CREATE INDEX IF NOT EXISTS idx_ai_contents_video_id ON ai_contents(video_id)",
  "CREATE INDEX IF NOT EXISTS idx_thumbnails_video_id ON thumbnails(video_id)",
  "CREATE INDEX IF NOT EXISTS idx_metrics_video_id ON metrics(video_id)",
  "CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_video_id ON ai_generation_logs(video_id)",
]
for (const sql of indexes) {
  sqlite.exec(sql)
  const indexName = sql.match(/INDEX IF NOT EXISTS (\w+)/)?.[1]
  console.log(`  ✓ ${indexName}`)
}

console.log("Migrations complete.")

sqlite.close()
