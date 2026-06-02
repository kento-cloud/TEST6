import Database from "better-sqlite3"
import path from "path"
import { ulid } from "ulid"
import { aiContentMap } from "./ai-content-data"

const DB_PATH = path.join(process.cwd(), "data", "pivot.db")
const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")

const now = new Date().toISOString()

// === 番組データ投入 ===
const programsData = [
  { id: 48, name: "AI MEDIA TALK", description: "AI業界の第一人者に迫るインタビュー番組", thumbnailPath: "/images/programs/thumbnail_vertical/68a44eea919df.png", logoPath: "/images/programs/logo_banner/68f892ba65fed.svg" },
  { id: 19, name: "プロンプトラボ", description: "実践プロンプトで生成AIを使いこなす", thumbnailPath: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logoPath: "/images/programs/logo_banner/688dc66289db3.svg" },
  { id: 2, name: "AI進化クロニクル", description: "ブレイクスルーの系譜を紐解く", thumbnailPath: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logoPath: "/images/programs/logo_banner/6789c5483cb7d.svg" },
  { id: 76, name: "最新モデル超分析", description: "注目AIモデルを専門家と共に徹底分析", thumbnailPath: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logoPath: "/images/programs/logo_banner/68baf2526844c.svg" },
  { id: 10, name: "開発ウォッチ", description: "AIプロダクト開発の最前線を追う", thumbnailPath: "/images/programs/thumbnail_vertical/68fecee954a36.png" },
  { id: 6, name: "ツール実機チェック", description: "話題のAIツールを実機で徹底検証", thumbnailPath: "/images/programs/thumbnail_vertical/6992adf73eb7a.png" },
  { id: 13, name: "AIサイエンス", description: "AIの仕組みを科学的に解き明かす", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae170452c.png", logoPath: "/images/programs/logo_banner/68f89a4e14742.svg" },
  { id: 27, name: "経営者EYE", description: "経営者が語るAIビジネスの真実", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logoPath: "/images/programs/logo_banner/68b86024e30ae.svg" },
  { id: 100, name: "活用の虎の巻", description: "実践的なAI活用テクニックを伝授", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae66c1a19.png" },
  { id: 42, name: "AI MEDIA GLOBAL", description: "世界のAIトレンドを読む", thumbnailPath: "/images/programs/thumbnail_vertical/6992ae87d58d4.png" },
]

console.log("Seeding programs...")
const insertProgram = sqlite.prepare("INSERT OR REPLACE INTO programs (id, name, description, thumbnail_path, logo_path, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)")
for (const p of programsData) {
  insertProgram.run(p.id, p.name, p.description, p.thumbnailPath, p.logoPath ?? null, now)
  console.log(`  + ${p.name}`)
}

// === エピソードデータ投入 ===
const episodesData = [
  { id: 14365, title: "GPT-5は本当に人間を超えたのか？徹底検証", programId: 48, programName: "AI MEDIA TALK", duration: 1204, categoryCode: "race", viewCount: 12000, rating: 4.5 },
  { id: 14328, title: "OpenAI一強時代は終わるのか？【業界キーパーソン】", programId: 27, programName: "経営者EYE", duration: 1709, categoryCode: "breeding", viewCount: 38000, rating: 4.3 },
  { id: 14325, title: "ChatGPTだけで月収100万円。AI副業の全手順【実践者タケシ】", programId: 19, programName: "プロンプトラボ", duration: 2322, categoryCode: "betting", viewCount: 74000, rating: 4.5 },
  { id: 14287, title: "【LLMの科学】Transformerはなぜ賢いのか、その仕組みに迫る", programId: 13, programName: "AIサイエンス", duration: 1243, categoryCode: "science", viewCount: 21000, rating: 4.7 },
  { id: 14317, title: "主要AIモデルを徹底比較／ベンチマーク分析／用途別の選び方", programId: 76, programName: "最新モデル超分析", duration: 1932, categoryCode: "race", viewCount: 83000, rating: 4.8 },
  { id: 14305, title: "米中AI開発競争。日本が遅れる本当の理由", programId: 2, programName: "AI MEDIA GLOBAL", duration: 1618, categoryCode: "global", viewCount: 67000, rating: 4.2 },
  { id: 14364, title: "次に来る注目AIスタートアップ。資金調達から見える可能性", programId: 48, programName: "AI進化クロニクル", duration: 1416, categoryCode: "breeding", viewCount: 18000, rating: 4.1 },
  { id: 14316, title: "【実践】業務で使えるAIツール5選と導入のコツ", programId: 100, programName: "活用の虎の巻", duration: 1665, categoryCode: "training", viewCount: 32000, rating: 4.5 },
  { id: 14362, title: "RAG構築完全ガイド／社内データをAIに繋ぐ手順【実践】", programId: 19, programName: "プロンプトラボ", duration: 1809, categoryCode: "training", viewCount: 41000, rating: 4.3 },
  { id: 14357, title: "OpenAI・Google・Anthropic。主要AI企業の戦略を読む", programId: 2, programName: "AI MEDIA GLOBAL", duration: 3349, categoryCode: "global", viewCount: 55000, rating: 4.4 },
]

console.log("\nSeeding episodes as videos...")
const insertVideo = sqlite.prepare("INSERT OR IGNORE INTO videos (id, title, description, file_path, thumbnail_path, duration, status, publish_status, processing_step, source_type, category_code, program_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'published', 'published', 'none', 'local', ?, ?, ?, ?, ?)")
const insertMetric = sqlite.prepare("INSERT OR IGNORE INTO metrics (video_id, view_count, rating, rating_count, comment_count) VALUES (?, ?, ?, ?, ?)")
const insertThumb = sqlite.prepare("INSERT OR IGNORE INTO thumbnails (id, video_id, file_path, source, is_primary, status, created_at) VALUES (?, ?, ?, 'manual', 1, 'done', ?)")

// === エピソード別AIコンテンツ ===

for (const ep of episodesData) {
  const videoId = `EP_${ep.id}`
  const thumbPath = `/images/static/converted/chapter/${ep.id}/ogp/${ep.id}.webp`
  const desc = `${ep.programName}の人気エピソード`

  insertVideo.run(videoId, ep.title, desc, "", thumbPath, ep.duration, ep.categoryCode, ep.programId, now, now, now)
  insertMetric.run(videoId, ep.viewCount, ep.rating, Math.floor(ep.viewCount / 5000), Math.floor(ep.viewCount / 10000))
  insertThumb.run(ulid(), videoId, thumbPath, now)

  // Transcription + AI Content
  const transId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO transcriptions (id, video_id, full_text, segments, source, status, created_at) VALUES (?, ?, ?, '[]', 'manual', 'done', ?)").run(
    transId, videoId, `${ep.title}の文字起こしテキスト。${desc}`, now
  )

  const aiContent = aiContentMap[ep.id]
  const aiId = ulid()
  sqlite.prepare("INSERT OR IGNORE INTO ai_contents (id, video_id, summary, chapters, article, tags, related_category_codes, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'done', 1, ?, ?)").run(
    aiId, videoId,
    aiContent.summary,
    JSON.stringify(aiContent.chapters),
    aiContent.article,
    JSON.stringify(aiContent.tags),
    JSON.stringify([ep.categoryCode]),
    now, now
  )

  console.log(`  + ${ep.title.slice(0, 30)}...`)
}

// === サムネイルスタイルプリセット投入 ===
console.log("\nSeeding thumbnail style presets...")
const thumbnailPresets = [
  {
    id: ulid(),
    name: "最新ニュース",
    promptTemplate: "A dynamic AI tech news thumbnail with an abstract neural network background and glowing circuit lines. Bold typography, energy streaks, professional tech media atmosphere. Dark teal and electric cyan color scheme. No text, no faces.",
    styleParams: JSON.stringify({ colorScheme: "teal-cyan", layout: "tech-news", fontStyle: "bold-sans", mood: "exciting" }),
    isDefault: 1,
  },
  {
    id: ulid(),
    name: "データ・AI分析",
    promptTemplate: "A data-driven AI analysis thumbnail with charts, graphs, and abstract data-point silhouettes. Tech-inspired design with neon accents on dark background. Electric blue and green palette. No text, no faces.",
    styleParams: JSON.stringify({ colorScheme: "neon-dark", layout: "data", fontStyle: "monospace", mood: "analytical" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "AIの基礎",
    promptTemplate: "An elegant AI fundamentals themed thumbnail with abstract knowledge-graph and node-link imagery. Warm, refined atmosphere with soft gradients. Deep indigo and cream tones. No text, no faces.",
    styleParams: JSON.stringify({ colorScheme: "indigo-cream", layout: "elegant", fontStyle: "serif", mood: "prestigious" }),
    isDefault: 0,
  },
  {
    id: ulid(),
    name: "海外動向",
    promptTemplate: "A global AI trends thumbnail featuring an abstract glowing globe with data connection arcs between continents. Subtle world map grid, dramatic sky. Royal blue and gold palette with cosmopolitan feel. No text, no faces.",
    styleParams: JSON.stringify({ colorScheme: "blue-gold", layout: "global", fontStyle: "bold-serif", mood: "majestic" }),
    isDefault: 0,
  },
]

const insertPreset = sqlite.prepare("INSERT OR IGNORE INTO thumbnail_style_presets (id, name, prompt_template, style_params, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)")
for (const preset of thumbnailPresets) {
  insertPreset.run(preset.id, preset.name, preset.promptTemplate, preset.styleParams, preset.isDefault, now)
  console.log(`  + ${preset.name}`)
}

console.log("\nSeed complete.")
console.log(`  Programs: ${programsData.length}`)
console.log(`  Videos: ${episodesData.length}`)
console.log(`  Thumbnail presets: ${thumbnailPresets.length}`)

sqlite.close()
