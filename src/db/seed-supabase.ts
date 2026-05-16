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

  // Thumbnail Style Presets（サムネイル生成テンプレート A〜F）
  const thumbnailPresetsData = [
    {
      id: ulid(),
      name: "A: ビジネスシンプル",
      prompt_template: "Clean, minimal business media thumbnail. Topic: {{title}}. White background with deep navy blue accent lines. Abstract geometric shapes suggesting professionalism. No text, no faces, no Japanese characters. 16:9 aspect ratio, modern editorial design.",
      style_params: JSON.stringify({ colorScheme: "white-navy", layout: "minimal-centered", mood: "professional" }),
      is_default: true,
    },
    {
      id: ulid(),
      name: "B: テクノロジーダーク",
      prompt_template: "Dark futuristic technology thumbnail. Topic: {{title}}. Black background with electric blue and cyan neon glow accents. Circuit board patterns and data visualization elements. No text, no faces, no Japanese characters. 16:9 aspect ratio, sci-fi editorial aesthetic.",
      style_params: JSON.stringify({ colorScheme: "black-cyan-neon", layout: "dark-tech", mood: "futuristic" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "C: ウォーム対話",
      prompt_template: "Warm, inviting interview-style thumbnail. Topic: {{title}}. Soft gradient from warm amber to deep brown. Two abstract chair silhouettes suggesting conversation. Bokeh studio lights in background. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "amber-brown-warm", layout: "conversation", mood: "intimate" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "D: マネー&経済",
      prompt_template: "Sophisticated finance and economics thumbnail. Topic: {{title}}. Deep green to gold gradient background. Abstract rising graph lines and currency symbols subtly integrated. No text, no faces, no Japanese characters. 16:9 aspect ratio, premium magazine aesthetic.",
      style_params: JSON.stringify({ colorScheme: "green-gold", layout: "finance", mood: "premium" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "E: グローバル・地政学",
      prompt_template: "Bold geopolitical and global affairs thumbnail. Topic: {{title}}. Dark charcoal background with crimson red accent strips. Abstract globe wireframe and connection lines. No text, no faces, no Japanese characters. 16:9 aspect ratio, serious news magazine style.",
      style_params: JSON.stringify({ colorScheme: "charcoal-crimson", layout: "global", mood: "serious" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "F: サイエンス・知的好奇心",
      prompt_template: "Inspiring science and discovery thumbnail. Topic: {{title}}. Deep space purple to midnight blue gradient. Abstract molecular structures, stars, and light particles floating. No text, no faces, no Japanese characters. 16:9 aspect ratio, wonder-evoking design.",
      style_params: JSON.stringify({ colorScheme: "purple-midnight", layout: "science", mood: "wonder" }),
      is_default: false,
    },
  ]

  console.log("  Thumbnail Style Presets...")
  for (const preset of thumbnailPresetsData) {
    const { error: presetErr } = await supabase.from("thumbnail_style_presets").upsert(preset, { onConflict: "id" })
    if (presetErr) console.error(`  Preset error:`, presetErr.message)
  }
  console.log(`  ✓ ${thumbnailPresetsData.length} thumbnail presets`)

  // AI Style Presets（記事スタイルプリセット）
  const aiStylePresetsData = [
    {
      id: `preset_${ulid()}`,
      name: "ストレートニュース",
      description: "事実を簡潔に伝えるニュース記事スタイル。結論ファーストで余計な装飾を排除。",
      prompt_template: "ストレートニュース形式で書いてください。冒頭に結論を置き、5W1Hを明確にする。修飾語を最小限に抑え、一文は60字以内。読者の時間を奪わない、歯切れの良い文体で。感想や主観は入れず事実のみ伝える。",
      is_default: true,
      sort_order: 1,
    },
    {
      id: `preset_${ulid()}`,
      name: "解説コラム",
      description: "背景や文脈を丁寧に解説する読み物スタイル。なぜそうなるのかを深掘り。",
      prompt_template: "解説コラム形式で書いてください。「なぜ？」を軸に背景・文脈を掘り下げる。専門用語は初出時に噛み砕いて説明する。読者が友人に内容を説明できるレベルのわかりやすさを目指す。具体的な数字やデータを必ず含め、抽象論で終わらせない。語り口は落ち着いた知的好奇心を刺激するトーンで。",
      is_default: false,
      sort_order: 2,
    },
    {
      id: `preset_${ulid()}`,
      name: "実践ハウツー",
      description: "読者がすぐ行動できるアクション重視のスタイル。ステップや具体例を多用。",
      prompt_template: "実践的なハウツー形式で書いてください。「読んだ翌日に使える」具体的アクションを最低3つ含める。各ポイントには実例やシーンを添える。上から目線の「〜しましょう」ではなく、同僚に教えるようなフラットな口調で。見出しは行動を促す動詞で始める（例: 「試す」「見直す」「切り替える」）。",
      is_default: false,
      sort_order: 3,
    },
    {
      id: `preset_${ulid()}`,
      name: "インタビュー要約",
      description: "対話形式の内容を読み物に再構成するスタイル。話者の言葉を活かす。",
      prompt_template: "インタビュー要約形式で書いてください。話者の印象的な発言を「」で引用し、地の文で文脈を補完する。話者の人柄や熱量が伝わるエピソードを選んで構成する。時系列ではなく、インパクトの大きい話題から配置する。「〜と語った」の連続は避け、「振り返る」「力を込める」「笑う」など多様な描写動詞を使う。",
      is_default: false,
      sort_order: 4,
    },
    {
      id: `preset_${ulid()}`,
      name: "データドリブン分析",
      description: "数字とファクトを軸にした分析記事スタイル。客観的で説得力のある論展開。",
      prompt_template: "データドリブンな分析形式で書いてください。主張には必ず数字的根拠を添える。「多い」「少ない」ではなく具体的な数値や比率で語る。比較対象を明示し、変化の方向性と規模を示す。推測と事実を明確に区別する（推測は「〜とみられる」で統一）。冷静だが退屈にならないよう、意外性のあるデータを冒頭に持ってくる。",
      is_default: false,
      sort_order: 5,
    },
    {
      id: `preset_${ulid()}`,
      name: "ストーリーテリング",
      description: "物語的な構成で引き込む読み物スタイル。起承転結のある展開。",
      prompt_template: "ストーリーテリング形式で書いてください。冒頭は具体的な場面描写やエピソードで読者を引き込む。時系列や因果関係で自然に展開し、途中に意外な転換点を入れる。登場人物の感情や葛藤を描き、読者が感情移入できる構成にする。結末は余韻を残すか、未来への問いかけで締める。箇条書きは使わず、流れるような散文体で。",
      is_default: false,
      sort_order: 6,
    },
  ]

  console.log("  AI Style Presets...")
  for (const preset of aiStylePresetsData) {
    const { error: presetErr } = await supabase.from("ai_style_presets").upsert(preset, { onConflict: "id" })
    if (presetErr) console.error(`  AI Preset error:`, presetErr.message)
  }
  console.log(`  ✓ ${aiStylePresetsData.length} ai style presets`)

  console.log("\nSeed complete.")
  console.log(`  Programs: ${programsData.length}`)
  console.log(`  Videos: ${episodesData.length} (with transcriptions, ai_contents, thumbnails, metrics)`)
  console.log(`  Thumbnail Presets: ${thumbnailPresetsData.length}`)
  console.log(`  AI Style Presets: ${aiStylePresetsData.length}`)
}

seed().catch(console.error)
