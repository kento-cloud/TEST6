import Database from "better-sqlite3"
import path from "path"
import { ulid } from "ulid"

const DB_PATH = path.join(process.cwd(), "data", "pivot.db")
const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")

const now = new Date().toISOString()

// === 番組データ投入 ===
const programsData = [
  { id: 48, name: "PIVOT TALK", description: "各界のトップランナーに迫るインタビュー番組", thumbnailPath: "/images/programs/thumbnail_vertical/68a44eea919df.png", logoPath: "/images/programs/logo_banner/68f892ba65fed.svg" },
  { id: 19, name: "MONEY SKILL SET", description: "お金の教養を身につける", thumbnailPath: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logoPath: "/images/programs/logo_banner/688dc66289db3.svg" },
  { id: 2, name: "9 questions", description: "時代を切り拓くリーダーに9つの質問", thumbnailPath: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logoPath: "/images/programs/logo_banner/6789c5483cb7d.svg" },
  { id: 76, name: "ランキング超分析", description: "ランキングを専門家と共に徹底分析", thumbnailPath: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logoPath: "/images/programs/logo_banner/68baf2526844c.svg" },
  { id: 10, name: "EDUCATION SKILL SET", description: "教育の最前線を探る", thumbnailPath: "/images/programs/thumbnail_vertical/68fecee954a36.png" },
  { id: 6, name: "BODY SKILL SET", description: "カラダの教養を身につける", thumbnailPath: "/images/programs/thumbnail_vertical/6992adf73eb7a.png" },
  { id: 13, name: "EXTREME SCIENCE", description: "科学の最前線に迫る", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae170452c.png", logoPath: "/images/programs/logo_banner/68f89a4e14742.svg" },
  { id: 27, name: "TOP TALK", description: "日本を代表する経営者の戦略に迫る", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logoPath: "/images/programs/logo_banner/68b86024e30ae.svg" },
  { id: 100, name: "ビジネス虎の巻", description: "実践的なビジネスノウハウを伝授", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae66c1a19.png" },
  { id: 42, name: "PIVOT GLOBAL", description: "世界のビジネストレンドを読む", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae87d58d4.png" },
]

console.log("Seeding programs...")
const insertProgram = sqlite.prepare("INSERT OR REPLACE INTO programs (id, name, description, thumbnail_path, logo_path, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
for (const p of programsData) {
  insertProgram.run(p.id, p.name, p.description, p.thumbnailPath, p.logoPath ?? null, now)
  console.log(`  ✓ ${p.name}`)
}

// === エピソードデータ投入 ===
const episodesData = [
  { id: 14365, title: "宇宙開発の課題 \"交通整備\"は誰がする？", programId: 48, programName: "PIVOT TALK SCIENCE", duration: 1204, categoryCode: "technology", viewCount: 12000, rating: 4.5 },
  { id: 14328, title: "100年に一度の変化。次世代タバコでJTは勝てるのか？【筒井岳彦社長】", programId: 27, programName: "TOP TALK", duration: 1709, categoryCode: "business", viewCount: 38000, rating: 4.3 },
  { id: 14325, title: "「山下本気うどん」売却までの経緯【オモロー山下】", programId: 19, programName: "MONEY SKILL SET", duration: 2322, categoryCode: "money", viewCount: 74000, rating: 4.5 },
  { id: 14287, title: "【宇宙のミステリー】人体に起きる「謎の症状」", programId: 13, programName: "EXTREME SCIENCE", duration: 1243, categoryCode: "technology", viewCount: 21000, rating: 4.7 },
  { id: 14317, title: "Geminiで学ぶ・稼ぐ術／NotebookLMによるAI家庭教師／穴場の稼ぎ方", programId: 76, programName: "ランキング超分析", duration: 1932, categoryCode: "technology", viewCount: 83000, rating: 4.8 },
  { id: 14305, title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖", programId: 2, programName: "9 questions", duration: 1618, categoryCode: "global", viewCount: 67000, rating: 4.2 },
  { id: 14364, title: "新たなヒットの方程式。アニメ×バイラル＝グローバル", programId: 48, programName: "PIVOT TALK", duration: 1416, categoryCode: "business", viewCount: 18000, rating: 4.1 },
  { id: 14316, title: "【コピペで使える】企画を成功に導く最強AI壁打ち", programId: 100, programName: "ビジネス虎の巻", duration: 1665, categoryCode: "business", viewCount: 32000, rating: 4.5 },
  { id: 14362, title: "資産が残る街と消える街【のらえもん】", programId: 19, programName: "MONEY SKILL SET", duration: 1809, categoryCode: "money", viewCount: 41000, rating: 4.3 },
  { id: 14357, title: "少子化対策は全く効かない。シンガポール・韓国の教訓", programId: 2, programName: "9 questions", duration: 3349, categoryCode: "global", viewCount: 55000, rating: 4.4 },
]

console.log("\nSeeding episodes as videos...")
const insertVideo = sqlite.prepare("INSERT OR IGNORE INTO videos (id, title, description, file_path, thumbnail_path, duration, status, publish_status, processing_step, source_type, category_code, program_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', 'published', 'none', 'local', ?, ?, ?, ?, ?)")
const insertMetric = sqlite.prepare("INSERT OR IGNORE INTO metrics (video_id, view_count, rating, rating_count, comment_count) VALUES (?, ?, ?, ?, ?)")
const insertThumb = sqlite.prepare("INSERT OR IGNORE INTO thumbnails (id, video_id, file_path, source, is_primary, status, created_at) VALUES (?, ?, ?, 'manual', 1, 'done', ?)")

for (const ep of episodesData) {
  const videoId = `EP_${ep.id}`
  const thumbPath = `/images/static/converted/chapter/${ep.id}/ogp/${ep.id}.webp`
  const desc = `${ep.programName}の人気エピソード`

  insertVideo.run(videoId, ep.title, desc, "", thumbPath, ep.duration, ep.categoryCode, ep.programId, now, now, now)
  insertMetric.run(videoId, ep.viewCount, ep.rating, Math.floor(ep.viewCount / 5000), Math.floor(ep.viewCount / 10000))
  insertThumb.run(ulid(), videoId, thumbPath, now)

  // Transcription + AI Content（フロント表示用モックデータ）
  const transId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO transcriptions (id, video_id, full_text, segments, source, status, created_at) VALUES (?, ?, ?, '[]', 'manual', 'done', ?)").run(
    transId, videoId, `${ep.title}の文字起こしテキスト。${desc}`, now
  )

  const aiId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO ai_contents (id, video_id, summary, chapters, article, tags, related_category_codes, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'done', 1, ?, ?)").run(
    aiId, videoId,
    `${ep.title}の要約。${ep.programName}の人気エピソード。`,
    JSON.stringify([{ title: "イントロ", startTime: 0, endTime: Math.floor(ep.duration / 3), summary: "導入" }, { title: "メイン", startTime: Math.floor(ep.duration / 3), endTime: Math.floor(ep.duration * 2 / 3), summary: "本題" }, { title: "まとめ", startTime: Math.floor(ep.duration * 2 / 3), endTime: ep.duration, summary: "結論" }]),
    `## ${ep.title}\n\n${ep.programName}の人気エピソードです。\n\n### ポイント\n\n- 重要な知見を提供\n- 実践的なアドバイス\n- 最新のトレンドを解説`,
    JSON.stringify([ep.programName, ep.categoryCode, "PIVOT"]),
    JSON.stringify([ep.categoryCode]),
    now, now
  )

  console.log(`  ✓ ${ep.title.slice(0, 30)}...`)
}

console.log("\nSeed complete.")
console.log(`  Programs: ${programsData.length}`)
console.log(`  Videos: ${episodesData.length}`)

sqlite.close()
