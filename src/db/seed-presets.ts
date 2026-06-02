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
      name: "A: 最新ニュース",
      prompt_template: "Dynamic AI tech news thumbnail. Topic: {{title}}. Deep teal background with glowing cyan circuit lines and energy streaks. Abstract neural network silhouette. No text, no faces, no Japanese characters. 16:9 aspect ratio, premium tech media design.",
      style_params: JSON.stringify({ colorScheme: "teal-cyan", layout: "tech-dynamic", mood: "exciting" }),
      is_default: true,
    },
    {
      id: ulid(),
      name: "B: データ・AI分析",
      prompt_template: "Data-driven AI analysis thumbnail. Topic: {{title}}. Dark background with electric green grid lines and holographic data visualizations. Abstract figure made of glowing data points. No text, no faces, no Japanese characters. 16:9 aspect ratio, tech analytics aesthetic.",
      style_params: JSON.stringify({ colorScheme: "dark-green-neon", layout: "data-grid", mood: "analytical" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "C: インタビュー・対談",
      prompt_template: "Warm AI interview thumbnail. Topic: {{title}}. Soft gradient from warm amber to deep indigo. Abstract studio setting with bokeh lights and faint circuit patterns in background. Two silhouette figures suggesting conversation. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "amber-indigo-warm", layout: "conversation", mood: "intimate" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "D: AIの基礎",
      prompt_template: "Elegant AI fundamentals thumbnail. Topic: {{title}}. Deep indigo to cream gradient. Abstract knowledge graph with node-link diagram elements. Refined, intellectual atmosphere. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "indigo-cream", layout: "knowledge-graph", mood: "prestigious" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "E: 海外動向",
      prompt_template: "Global AI trends thumbnail. Topic: {{title}}. Royal blue and gold palette. Abstract glowing globe with data connection arcs between continents, subtle world map grid as accents. Majestic and cosmopolitan feel. No text, no faces, no Japanese characters. 16:9 aspect ratio.",
      style_params: JSON.stringify({ colorScheme: "royal-blue-gold", layout: "global", mood: "majestic" }),
      is_default: false,
    },
    {
      id: ulid(),
      name: "F: AIサイエンス",
      prompt_template: "Scientific AI research thumbnail. Topic: {{title}}. Deep teal to midnight blue gradient. Abstract neural network and transformer architecture visualization with flowing attention links and glowing nodes. No text, no faces, no Japanese characters. 16:9 aspect ratio, wonder-evoking science design.",
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
      name: "ニュースレポート",
      description: "AIの新発表やアップデートを簡潔に伝えるニュース記事スタイル。結論ファーストで歯切れよく。",
      prompt_template: "ニュースレポート形式で書いてください。冒頭に結論（何が発表されたか・何が新しいか）を置き、性能・価格・提供時期を明確にする。修飾語を最小限に抑え、歯切れの良い文体で。感想ではなく事実とデータで語る。今後の影響も一言添える。",
      is_default: 1,
      sort_order: 1,
    },
    {
      id: `preset_${ulid()}`,
      name: "技術解説コラム",
      description: "AIの仕組みや背景技術を丁寧に解説する読み物スタイル。",
      prompt_template: "技術解説コラム形式で書いてください。「なぜこの技術が有効なのか」を軸に背景を掘り下げる。アーキテクチャの特徴、学習手法の影響、既存手法との違いを具体例と共に解説。専門用語（Attention、埋め込み、ファインチューニング等）は初出時に噛み砕いて説明する。ベンチマークなどのデータを必ず含める。",
      is_default: 0,
      sort_order: 2,
    },
    {
      id: `preset_${ulid()}`,
      name: "活用ハウツー",
      description: "読者がすぐ実践できるAI活用術・プロンプトテクニックのスタイル。",
      prompt_template: "実践的なAI活用ハウツー形式で書いてください。「今日から使える」具体的テクニックを最低3つ含める。各ポイントには実際のプロンプト例や手順を添える。上から目線ではなく、一緒に使いこなしていく仲間のような口調で。見出しは行動を促す動詞で始める（例:「指示する」「検証する」「自動化する」）。",
      is_default: 0,
      sort_order: 3,
    },
    {
      id: `preset_${ulid()}`,
      name: "インタビュー要約",
      description: "経営者・研究者・開発者の対話を読み物に再構成するスタイル。",
      prompt_template: "インタビュー要約形式で書いてください。話者の印象的な発言を「」で引用し、地の文で文脈を補完する。AIにかける思いや開発の裏側が伝わるエピソードを選んで構成する。「〜と語った」の連続は避け、「振り返る」「力を込める」「目を細める」など多様な描写動詞を使う。読者の心に響く瞬間を切り取る。",
      is_default: 0,
      sort_order: 4,
    },
    {
      id: `preset_${ulid()}`,
      name: "データドリブン分析",
      description: "数字とファクトを軸にしたモデル・市場分析スタイル。",
      prompt_template: "データドリブンな分析形式で書いてください。主張には必ず数字的根拠（ベンチマークスコア、トークン単価、シェア等）を添える。「優れている」「劣る」ではなく具体的な数値で語る。比較対象を明示し、過去バージョンや競合との差異を示す。推測と事実を明確に区別する（推測は「〜とみられる」で統一）。意外性のあるデータを冒頭に持ってくる。",
      is_default: 0,
      sort_order: 5,
    },
    {
      id: `preset_${ulid()}`,
      name: "ストーリーテリング",
      description: "技術革新や企業の挑戦の物語を描く読み物スタイル。起承転結のある展開。",
      prompt_template: "ストーリーテリング形式で書いてください。冒頭は具体的な場面描写（発表の瞬間、開発現場の緊張等）で読者を引き込む。研究者・開発者・企業の背景と感情を描き、読者が感情移入できる構成にする。結末は余韻を残すか、未来への問いかけで締める。AIがもたらす変革のドラマ性を最大限に活かした散文体で。",
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
