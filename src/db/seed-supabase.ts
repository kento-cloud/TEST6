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
    { id: 48, name: "PADDOCK TALK", description: "競馬界のトップトレーナー・騎手に迫るインタビュー番組", thumbnail_path: "/images/programs/thumbnail_vertical/68a44eea919df.png", logo_path: "/images/programs/logo_banner/68f892ba65fed.svg" },
    { id: 19, name: "馬券ラボ", description: "データ分析で馬券力を身につける", thumbnail_path: "/images/programs/thumbnail_vertical/68a44f67ce787.png", logo_path: "/images/programs/logo_banner/688dc66289db3.svg" },
    { id: 2, name: "血統クロニクル", description: "名血統の系譜を紐解く", thumbnail_path: "/images/programs/thumbnail_vertical/68a44fe6cf874.png", logo_path: "/images/programs/logo_banner/6789c5483cb7d.svg" },
    { id: 76, name: "レース超分析", description: "注目レースを専門家と共に徹底分析", thumbnail_path: "/images/programs/thumbnail_vertical/68b10dc8e26ae.png", logo_path: "/images/programs/logo_banner/68baf2526844c.svg" },
    { id: 10, name: "調教ウォッチ", description: "追い切り・調教映像の見方を学ぶ", thumbnail_path: "/images/programs/thumbnail_vertical/68fecee954a36.png", logo_path: null },
    { id: 6, name: "馬体チェック", description: "パドックでの馬体診断を極める", thumbnail_path: "/images/programs/thumbnail_vertical/6992adf73eb7a.png", logo_path: null },
    { id: 13, name: "ターフサイエンス", description: "競馬を科学的に解析する", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae170452c.png", logo_path: "/images/programs/logo_banner/68f89a4e14742.svg" },
    { id: 27, name: "オーナーズEYE", description: "馬主が語る競馬ビジネスの真実", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae2d5aaee.png", logo_path: "/images/programs/logo_banner/68b86024e30ae.svg" },
    { id: 100, name: "予想の虎の巻", description: "実践的な予想テクニックを伝授", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae66c1a19.png", logo_path: null },
    { id: 42, name: "PADDOCK GLOBAL", description: "世界の競馬トレンドを読む", thumbnail_path: "/images/programs/thumbnail_vertical/6992ae87d58d4.png", logo_path: null },
  ]

  console.log("  Programs...")
  const { error: progErr } = await supabase.from("programs").upsert(programsData, { onConflict: "id" })
  if (progErr) console.error("  Programs error:", progErr.message)
  else console.log(`  ✓ ${programsData.length} programs`)

  // Episodes (as videos)
  const episodesData = [
    { id: "EP_14365", title: "有馬記念の展望 \"最強ステイヤー\"はどの馬か？", program_id: 48, program_name: "PADDOCK TALK", duration: 1204, category_code: "race", view_count: 12000, rating: 4.5 },
    { id: "EP_14328", title: "ノーザンファーム一強時代は終わるのか？【吉田勝己代表】", program_id: 27, program_name: "オーナーズEYE", duration: 1709, category_code: "breeding", view_count: 38000, rating: 4.3 },
    { id: "EP_14325", title: "馬券で月収100万円を達成した男の回収率管理術【馬券師タケシ】", program_id: 19, program_name: "馬券ラボ", duration: 2322, category_code: "betting", view_count: 74000, rating: 4.5 },
    { id: "EP_14287", title: "【競走馬の科学】筋肉と心肺機能の限界に迫る", program_id: 13, program_name: "ターフサイエンス", duration: 1243, category_code: "science", view_count: 21000, rating: 4.7 },
    { id: "EP_14317", title: "AIで予想する日本ダービー／過去データ分析／穴馬の見つけ方", program_id: 76, program_name: "レース超分析", duration: 1932, category_code: "race", view_count: 83000, rating: 4.8 },
    { id: "EP_14305", title: "凱旋門賞に挑む日本馬。海外遠征の壁とは", program_id: 2, program_name: "PADDOCK GLOBAL", duration: 1618, category_code: "global", view_count: 67000, rating: 4.2 },
    { id: "EP_14364", title: "新種牡馬ランキング。初年度産駒から見える可能性", program_id: 48, program_name: "血統クロニクル", duration: 1416, category_code: "breeding", view_count: 18000, rating: 4.1 },
    { id: "EP_14316", title: "【実践】パドックで馬の調子を見抜く5つのポイント", program_id: 100, program_name: "馬体チェック", duration: 1665, category_code: "training", view_count: 32000, rating: 4.5 },
    { id: "EP_14362", title: "坂路調教のタイム読み方完全ガイド【栗東トレセン】", program_id: 19, program_name: "調教ウォッチ", duration: 1809, category_code: "training", view_count: 41000, rating: 4.3 },
    { id: "EP_14357", title: "ドバイ・香港・サウジ。世界の高額賞金レース戦略", program_id: 2, program_name: "PADDOCK GLOBAL", duration: 3349, category_code: "global", view_count: 55000, rating: 4.4 },
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
      tags: [ep.program_name, ep.category_code, "PADDOCK"],
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
      name: "A: レース分析",
      prompt_template: "Dynamic horse racing analysis thumbnail. Topic: {{title}}. Deep green turf background with golden accent lines. Abstract racecourse silhouette and finish line. No text, no faces, no Japanese characters. 16:9 aspect ratio, premium sports media design.",
      style_params: JSON.stringify({ colorScheme: "green-gold", layout: "racing-dynamic", mood: "exciting" }),
      is_default: true,
    },
    {
      id: ulid(),
      name: "B: データ・AI予想",
      prompt_template: "Data-driven horse racing prediction thumbnail. Topic: {{title}}. Dark background with electric green grid lines and holographic data visualizations. Abstract horse silhouette made of data points. No text, no faces, no Japanese characters. 16:9 aspect ratio, tech-meets-sport aesthetic.",
      style_params: JSON.stringify({ colorScheme: "dark-green-neon", layout: "data-grid", mood: "analytical" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "C: インタビュー・対談",
      prompt_template: "Warm horse racing interview thumbnail. Topic: {{title}}. Soft gradient from warm amber to deep brown. Abstract paddock setting with bokeh lights. Two silhouette figures suggesting conversation. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "amber-brown-warm", layout: "conversation", mood: "intimate" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "D: 血統・生産",
      prompt_template: "Elegant horse breeding and bloodline thumbnail. Topic: {{title}}. Deep burgundy to cream gradient. Abstract family tree / pedigree chart elements with horse silhouettes. No text, no faces, no Japanese characters. 16:9 aspect ratio, prestigious atmosphere.",
      style_params: JSON.stringify({ colorScheme: "burgundy-cream", layout: "pedigree", mood: "prestigious" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "E: 海外競馬",
      prompt_template: "Global horse racing thumbnail. Topic: {{title}}. Royal blue and gold palette. Abstract globe with racecourse markers, international flags as subtle accents. No text, no faces, no Japanese characters. 16:9 aspect ratio, majestic cosmopolitan feel.",
      style_params: JSON.stringify({ colorScheme: "royal-blue-gold", layout: "global", mood: "majestic" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "F: 馬体・調教サイエンス",
      prompt_template: "Scientific horse training and physiology thumbnail. Topic: {{title}}. Deep teal to midnight blue gradient. Abstract horse anatomy with muscle/skeleton overlay, motion capture dots. No text, no faces, no Japanese characters. 16:9 aspect ratio, science design.",
      style_params: JSON.stringify({ colorScheme: "teal-midnight", layout: "science", mood: "wonder" }),
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
      name: "レースレポート",
      description: "レース結果や展望を簡潔に伝えるニュース記事スタイル。結論ファーストで歯切れよく。",
      prompt_template: "レースレポート形式で書いてください。冒頭に結論（勝ち馬・決め手）を置き、展開・ペース・上がりタイムを明確にする。修飾語を最小限に抑え、歯切れの良い文体で。感想ではなく事実とデータで語る。次走展望も一言添える。",
      is_default: true,
      sort_order: 1,
    },
    {
      id: `preset_${ulid()}`,
      name: "血統解説コラム",
      description: "血統の背景や配合理論を丁寧に解説する読み物スタイル。",
      prompt_template: "血統解説コラム形式で書いてください。「なぜこの配合が走るのか」を軸に背景を掘り下げる。種牡馬の特徴、母系の影響、ニックスの有無を具体例と共に解説。専門用語は初出時に噛み砕いて説明する。データ（勝ち上がり率、重賞勝利数等）を必ず含める。",
      is_default: false,
      sort_order: 2,
    },
    {
      id: `preset_${ulid()}`,
      name: "馬券ハウツー",
      description: "読者がすぐ実践できる馬券術・予想テクニックのスタイル。",
      prompt_template: "実践的な馬券ハウツー形式で書いてください。「次のレースから使える」具体的テクニックを最低3つ含める。各ポイントには実際のレース例やデータを添える。上から目線ではなく、一緒に回収率を上げていく仲間のような口調で。見出しは行動を促す動詞で始める（例:「狙う」「切る」「組み立てる」）。",
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
