/**
 * プリセットのみをシードするスクリプト
 * 使い方: npx tsx src/db/seed-presets.ts
 */
import { createClient } from "@supabase/supabase-js"
import { ulid } from "ulid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hbqtbiykewgakinduomk.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

if (!supabaseKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedPresets() {
  console.log("Seeding presets...")

  // --- サムネイルテンプレート（A〜F） ---
  const thumbnailPresets = [
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

  // Clear existing and insert
  await supabase.from("thumbnail_style_presets").delete().neq("id", "")
  for (const preset of thumbnailPresets) {
    const { error } = await supabase.from("thumbnail_style_presets").insert(preset)
    if (error) console.error(`  Thumbnail preset error (${preset.name}):`, error.message)
  }
  console.log(`  ✓ ${thumbnailPresets.length} thumbnail presets (A〜F)`)

  // --- 記事スタイルプリセット ---
  const aiStylePresets = [
    {
      id: `preset_${ulid()}`,
      name: "ストレートニュース",
      description: "事実を簡潔に伝えるニュース記事スタイル。結論ファーストで余計な装飾を排除。",
      prompt_template: "ストレートニュース形式で書いてください。冒頭に結論を置き、5W1Hを明確にする。修飾語を最小限に抑え、一文は60字以内。読者の時間を奪わない、歯切れの良い文体で。感想や主観は入れず事実のみ伝える。",
      is_default: 1,
      sort_order: 1,
    },
    {
      id: `preset_${ulid()}`,
      name: "解説コラム",
      description: "背景や文脈を丁寧に解説する読み物スタイル。なぜそうなるのかを深掘り。",
      prompt_template: "解説コラム形式で書いてください。「なぜ？」を軸に背景・文脈を掘り下げる。専門用語は初出時に噛み砕いて説明する。読者が友人に内容を説明できるレベルのわかりやすさを目指す。具体的な数字やデータを必ず含め、抽象論で終わらせない。語り口は落ち着いた知的好奇心を刺激するトーンで。",
      is_default: 0,
      sort_order: 2,
    },
    {
      id: `preset_${ulid()}`,
      name: "実践ハウツー",
      description: "読者がすぐ行動できるアクション重視のスタイル。ステップや具体例を多用。",
      prompt_template: "実践的なハウツー形式で書いてください。「読んだ翌日に使える」具体的アクションを最低3つ含める。各ポイントには実例やシーンを添える。上から目線の「〜しましょう」ではなく、同僚に教えるようなフラットな口調で。見出しは行動を促す動詞で始める（例: 「試す」「見直す」「切り替える」）。",
      is_default: 0,
      sort_order: 3,
    },
    {
      id: `preset_${ulid()}`,
      name: "インタビュー要約",
      description: "対話形式の内容を読み物に再構成するスタイル。話者の言葉を活かす。",
      prompt_template: "インタビュー要約形式で書いてください。話者の印象的な発言を「」で引用し、地の文で文脈を補完する。話者の人柄や熱量が伝わるエピソードを選んで構成する。時系列ではなく、インパクトの大きい話題から配置する。「〜と語った」の連続は避け、「振り返る」「力を込める」「笑う」など多様な描写動詞を使う。",
      is_default: 0,
      sort_order: 4,
    },
    {
      id: `preset_${ulid()}`,
      name: "データドリブン分析",
      description: "数字とファクトを軸にした分析記事スタイル。客観的で説得力のある論展開。",
      prompt_template: "データドリブンな分析形式で書いてください。主張には必ず数字的根拠を添える。「多い」「少ない」ではなく具体的な数値や比率で語る。比較対象を明示し、変化の方向性と規模を示す。推測と事実を明確に区別する（推測は「〜とみられる」で統一）。冷静だが退屈にならないよう、意外性のあるデータを冒頭に持ってくる。",
      is_default: 0,
      sort_order: 5,
    },
    {
      id: `preset_${ulid()}`,
      name: "ストーリーテリング",
      description: "物語的な構成で引き込む読み物スタイル。起承転結のある展開。",
      prompt_template: "ストーリーテリング形式で書いてください。冒頭は具体的な場面描写やエピソードで読者を引き込む。時系列や因果関係で自然に展開し、途中に意外な転換点を入れる。登場人物の感情や葛藤を描き、読者が感情移入できる構成にする。結末は余韻を残すか、未来への問いかけで締める。箇条書きは使わず、流れるような散文体で。",
      is_default: 0,
      sort_order: 6,
    },
  ]

  // Clear existing and insert
  await supabase.from("ai_style_presets").delete().neq("id", "")
  for (const preset of aiStylePresets) {
    const { error } = await supabase.from("ai_style_presets").insert({
      ...preset,
      created_at: new Date().toISOString(),
    })
    if (error) console.error(`  AI preset error (${preset.name}):`, error.message)
  }
  console.log(`  ✓ ${aiStylePresets.length} AI style presets`)

  console.log("\nPreset seeding complete.")
}

seedPresets().catch(console.error)
