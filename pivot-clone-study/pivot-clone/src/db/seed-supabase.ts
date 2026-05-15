import { createClient } from "@supabase/supabase-js"
import { ulid } from "ulid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hbqtbiykewgakinduomk.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log("Seeding Supabase...")

  // Programs
  const programsData = [
    { id: 48, name: "PIVOT TALK", description: "各界のトップランナーに迫るインタビュー番組", thumbnail_path: "/images/programs/thumbnail_vertical/68a44eea919df.png", logo_path: "/images/programs/logo_banner/68f892ba65fed.svg" },
    { id: 19, name: "MONEY SKILL SET", description: "お金の教養を身につける", thumbnail_path: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logo_path: "/images/programs/logo_banner/688dc66289db3.svg" },
    { id: 2, name: "9 questions", description: "時代を切り拓くリーダーに9つの質問", thumbnail_path: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logo_path: "/images/programs/logo_banner/6789c5483cb7d.svg" },
    { id: 76, name: "ランキング超分析", description: "ランキングを専門家と共に徹底分析", thumbnail_path: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logo_path: "/images/programs/logo_banner/68baf2526844c.svg" },
    { id: 10, name: "EDUCATION SKILL SET", description: "教育の最前線を探る", thumbnail_path: "/images/programs/thumbnail_vertical/68fecee954a36.png", logo_path: null },
    { id: 6, name: "BODY SKILL SET", description: "カラダの教養を身につける", thumbnail_path: "/images/programs/thumbnail_vertical/6992adf73eb7a.png", logo_path: null },
    { id: 13, name: "EXTREME SCIENCE", description: "科学の最前線に迫る", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae170452c.png", logo_path: "/images/programs/logo_banner/68f89a4e14742.svg" },
    { id: 27, name: "TOP TALK", description: "日本を代表する経営者の戦略に迫る", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logo_path: "/images/programs/logo_banner/68b86024e30ae.svg" },
    { id: 100, name: "ビジネス虎の巻", description: "実践的なビジネスノウハウを伝授", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae66c1a19.png", logo_path: null },
    { id: 42, name: "PIVOT GLOBAL", description: "世界のビジネストレンドを読む", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae87d58d4.png", logo_path: null },
  ]

  console.log("  Programs...")
  const { error: progErr } = await supabase.from("programs").upsert(programsData, { onConflict: "id" })
  if (progErr) console.error("  Programs error:", progErr.message)
  else console.log(`  ✓ ${programsData.length} programs`)

  // Episodes (as videos)
  const episodesData = [
    { id: "EP_14365", title: "宇宙開発の課題 \"交通整備\"は誰がする？", program_id: 48, program_name: "PIVOT TALK SCIENCE", duration: 1204, category_code: "technology", view_count: 12000, rating: 4.5 },
    { id: "EP_14328", title: "100年に一度の変化。次世代タバコでJTは勝てるのか？【筒井岳彦社長】", program_id: 27, program_name: "TOP TALK", duration: 1709, category_code: "business", view_count: 38000, rating: 4.3 },
    { id: "EP_14325", title: "「山下本気うどん」売却までの経緯【オモロー山下】", program_id: 19, program_name: "MONEY SKILL SET", duration: 2322, category_code: "money", view_count: 74000, rating: 4.5 },
    { id: "EP_14287", title: "【宇宙のミステリー】人体に起きる「謎の症状」", program_id: 13, program_name: "EXTREME SCIENCE", duration: 1243, category_code: "technology", view_count: 21000, rating: 4.7 },
    { id: "EP_14317", title: "Geminiで学ぶ・稼ぐ術／NotebookLMによるAI家庭教師／穴場の稼ぎ方", program_id: 76, program_name: "ランキング超分析", duration: 1932, category_code: "technology", view_count: 83000, rating: 4.8 },
    { id: "EP_14305", title: "北朝鮮・迎撃不可能なドローン攻撃の恐怖", program_id: 2, program_name: "9 questions", duration: 1618, category_code: "global", view_count: 67000, rating: 4.2 },
    { id: "EP_14364", title: "新たなヒットの方程式。アニメ×バイラル＝グローバル", program_id: 48, program_name: "PIVOT TALK", duration: 1416, category_code: "business", view_count: 18000, rating: 4.1 },
    { id: "EP_14316", title: "【コピペで使える】企画を成功に導く最強AI壁打ち", program_id: 100, program_name: "ビジネス虎の巻", duration: 1665, category_code: "business", view_count: 32000, rating: 4.5 },
    { id: "EP_14362", title: "資産が残る街と消える街【のらえもん】", program_id: 19, program_name: "MONEY SKILL SET", duration: 1809, category_code: "money", view_count: 41000, rating: 4.3 },
    { id: "EP_14357", title: "少子化対策は全く効かない。シンガポール・韓国の教訓", program_id: 2, program_name: "9 questions", duration: 3349, category_code: "global", view_count: 55000, rating: 4.4 },
  ]

  console.log("  Videos...")
  for (const ep of episodesData) {
    const numId = ep.id.replace("EP_", "")
    const thumbPath = `/images/static/converted/chapter/${numId}/ogp/${numId}.webp`

    const { error: vErr } = await supabase.from("videos").upsert({
      id: ep.id,
      title: ep.title,
      description: `${ep.program_name}の人気エピソード`,
      file_path: null,
      thumbnail_path: thumbPath,
      duration: ep.duration,
      publish_status: "published",
      processing_step: "none",
      source_type: "local",
      category_code: ep.category_code,
      program_id: ep.program_id,
      published_at: new Date().toISOString(),
    }, { onConflict: "id" })
    if (vErr) console.error(`  Video ${ep.id} error:`, vErr.message)

    // Metrics
    await supabase.from("metrics").upsert({
      video_id: ep.id,
      view_count: ep.view_count,
      rating: ep.rating,
      rating_count: Math.floor(ep.view_count / 5000),
      comment_count: Math.floor(ep.view_count / 10000),
    }, { onConflict: "video_id" })

    // Thumbnail
    await supabase.from("thumbnails").upsert({
      id: ulid(),
      video_id: ep.id,
      file_path: thumbPath,
      source: "manual",
      is_primary: true,
      status: "done",
    }, { onConflict: "id" })

    // Transcription
    await supabase.from("transcriptions").upsert({
      id: ulid(),
      video_id: ep.id,
      full_text: `${ep.title}の文字起こしテキスト。${ep.program_name}の人気エピソード`,
      segments: [],
      source: "manual",
      status: "done",
    }, { onConflict: "id" })

    // AI Content
    await supabase.from("ai_contents").upsert({
      id: ulid(),
      video_id: ep.id,
      summary: `${ep.title}の要約。${ep.program_name}の人気エピソード。`,
      chapters: [
        { title: "イントロ", startTime: 0, endTime: Math.floor(ep.duration / 3), summary: "導入" },
        { title: "メイン", startTime: Math.floor(ep.duration / 3), endTime: Math.floor(ep.duration * 2 / 3), summary: "本題" },
        { title: "まとめ", startTime: Math.floor(ep.duration * 2 / 3), endTime: ep.duration, summary: "結論" },
      ],
      article: `## ${ep.title}\n\n${ep.program_name}の人気エピソードです。\n\n### ポイント\n\n- 重要な知見を提供\n- 実践的なアドバイス\n- 最新のトレンドを解説`,
      tags: [ep.program_name, ep.category_code, "PIVOT"],
      related_category_codes: [ep.category_code],
      status: "done",
      version: 1,
    }, { onConflict: "id" })

    console.log(`  ✓ ${ep.title.slice(0, 30)}...`)
  }

  // Thumbnail Style Presets
  const presetsData = [
    {
      id: ulid(),
      name: "ビジネスプロフェッショナル",
      prompt_template: "プロフェッショナルなビジネスメディア風のサムネイル画像。タイトル: {{title}}。洗練されたデザイン、ダークブルーとパープルの配色。日本語テキストは含めない。",
      style_params: JSON.stringify({ style: "professional", colorScheme: "dark-blue-purple" }),
      is_default: true,
    },
    {
      id: ulid(),
      name: "テクノロジー",
      prompt_template: "テクノロジー系メディアのサムネイル画像。タイトル: {{title}}。デジタル感のあるデザイン、ネオンブルーとグリーンのアクセント。日本語テキストは含めない。",
      style_params: JSON.stringify({ style: "technology", colorScheme: "neon-blue-green" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "インタビュー",
      prompt_template: "インタビュー番組風のサムネイル画像。タイトル: {{title}}。人物シルエットとスタジオ風背景。日本語テキストは含めない。",
      style_params: JSON.stringify({ style: "interview", colorScheme: "warm-studio" }),
      is_default: false,
    },
  ]

  console.log("  Thumbnail Style Presets...")
  for (const preset of presetsData) {
    const { error: presetErr } = await supabase.from("thumbnail_style_presets").upsert(preset, { onConflict: "id" })
    if (presetErr) console.error(`  Preset error:`, presetErr.message)
  }
  console.log(`  ✓ ${presetsData.length} presets`)

  console.log("\nSeed complete.")
  console.log(`  Programs: ${programsData.length}`)
  console.log(`  Videos: ${episodesData.length} (with transcriptions, ai_contents, thumbnails, metrics)`)
  console.log(`  Thumbnail Presets: ${presetsData.length}`)
}

seed().catch(console.error)
