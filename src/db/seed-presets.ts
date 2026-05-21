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
      prompt_template: "Warm horse racing interview thumbnail. Topic: {{title}}. Soft gradient from warm amber to deep brown. Abstract paddock setting with bokeh lights in background. Two silhouette figures suggesting conversation. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "amber-brown-warm", layout: "conversation", mood: "intimate" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "D: 血統・生産",
      prompt_template: "Elegant horse breeding and bloodline thumbnail. Topic: {{title}}. Deep burgundy to cream gradient. Abstract family tree / pedigree chart elements with horse silhouettes. Prestigious, old-money atmosphere. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "burgundy-cream", layout: "pedigree", mood: "prestigious" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "E: 海外競馬",
      prompt_template: "Global horse racing thumbnail. Topic: {{title}}. Royal blue and gold palette. Abstract globe with racecourse markers, international flags as subtle accents. Majestic and cosmopolitan feel. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "royal-blue-gold", layout: "global", mood: "majestic" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "F: 馬体・調教サイエンス",
      prompt_template: "Scientific horse training and physiology thumbnail. Topic: {{title}}. Deep teal to midnight blue gradient. Abstract horse anatomy visualization with muscle/skeleton overlay, motion capture dots. No text, no faces, no Japanese characters. 16:9 aspect ratio, wonder-evoking science design.",
      style_params: JSON.stringify({ colorScheme: "teal-midnight", layout: "science", mood: "wonder" }),
      is_default: false,
    },
  ]

  // Clear existing and insert
  await supabase.from("thumbnail_style_presets").delete().neq("id", "")
  for (const preset of thumbnailPresets) {
    const { error } = await supabase.from("thumbnail_style_presets").insert(preset)
    if (error) console.error(`  Thumbnail preset error (${preset.name}):`, error.message)
  }
  console.log(`  + ${thumbnailPresets.length} thumbnail presets (A-F)`)

  // --- 記事スタイルプリセット ---
  const aiStylePresets = [
    {
      id: `preset_${ulid()}`,
      name: "レースレポート",
      description: "レース結果や展望を簡潔に伝えるニュース記事スタイル。結論ファーストで歯切れよく。",
      prompt_template: "レースレポート形式で書いてください。冒頭に結論（勝ち馬・決め手）を置き、展開・ペース・上がりタイムを明確にする。修飾語を最小限に抑え、歯切れの良い文体で。感想ではなく事実とデータで語る。次走展望も一言添える。",
      is_default: 1,
      sort_order: 1,
    },
    {
      id: `preset_${ulid()}`,
      name: "血統解説コラム",
      description: "血統の背景や配合理論を丁寧に解説する読み物スタイル。",
      prompt_template: "血統解説コラム形式で書いてください。「なぜこの配合が走るのか」を軸に背景を掘り下げる。種牡馬の特徴、母系の影響、ニックスの有無を具体例と共に解説。専門用語（クロス、ニックス等）は初出時に噛み砕いて説明する。データ（勝ち上がり率、重賞勝利数等）を必ず含める。",
      is_default: 0,
      sort_order: 2,
    },
    {
      id: `preset_${ulid()}`,
      name: "馬券ハウツー",
      description: "読者がすぐ実践できる馬券術・予想テクニックのスタイル。",
      prompt_template: "実践的な馬券ハウツー形式で書いてください。「次のレースから使える」具体的テクニックを最低3つ含める。各ポイントには実際のレース例やデータを添える。上から目線ではなく、一緒に回収率を上げていく仲間のような口調で。見出しは行動を促す動詞で始める（例:「狙う」「切る」「組み立てる」）。",
      is_default: 0,
      sort_order: 3,
    },
    {
      id: `preset_${ulid()}`,
      name: "インタビュー要約",
      description: "騎手・調教師・馬主の対話を読み物に再構成するスタイル。",
      prompt_template: "インタビュー要約形式で書いてください。話者の印象的な発言を「」で引用し、地の文で文脈を補完する。馬に対する思いや勝負の裏側が伝わるエピソードを選んで構成する。「〜と語った」の連続は避け、「振り返る」「力を込める」「目を細める」など多様な描写動詞を使う。競馬ファンの心に響く瞬間を切り取る。",
      is_default: 0,
      sort_order: 4,
    },
    {
      id: `preset_${ulid()}`,
      name: "データドリブン分析",
      description: "数字とファクトを軸にしたレース・馬券分析スタイル。",
      prompt_template: "データドリブンな分析形式で書いてください。主張には必ず数字的根拠（勝率、回収率、タイム差等）を添える。「強い」「弱い」ではなく具体的な数値で語る。比較対象を明示し、過去データとの差異を示す。推測と事実を明確に区別する（推測は「〜とみられる」で統一）。意外性のあるデータを冒頭に持ってくる。",
      is_default: 0,
      sort_order: 5,
    },
    {
      id: `preset_${ulid()}`,
      name: "ストーリーテリング",
      description: "名馬や名勝負の物語を描く読み物スタイル。起承転結のある展開。",
      prompt_template: "ストーリーテリング形式で書いてください。冒頭はレースの具体的な場面描写（ゲートが開く瞬間、直線の攻防等）で読者を引き込む。馬・騎手・関係者の背景と感情を描き、読者が感情移入できる構成にする。結末は余韻を残すか、未来への問いかけで締める。競馬の持つドラマ性を最大限に活かした散文体で。",
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
  console.log(`  + ${aiStylePresets.length} AI style presets`)

  console.log("\nPreset seeding complete.")
}

seedPresets().catch(console.error)
