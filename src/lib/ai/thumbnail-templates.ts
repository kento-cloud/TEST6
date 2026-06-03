/**
 * サムネイル デザインテンプレート モジュール（横型 A〜E）
 *
 * docs/thumbnail-design-system.md でナレッジ化したデザイン定義を
 * 「再現可能なモジュール」としてコード化したもの。
 *
 * 各テンプレートは
 *  - UI表示用メタ情報（name / palette / diagram / slots）
 *  - サーバー専用の buildPrompt()（画像生成モデル gpt-image-2 向けの構造化プロンプト）
 * を持つ。
 *
 * 管理画面ではテンプレを選び、スロット（見出し・配色・話数など）を埋めるだけで、
 * そのデザイン定義に沿ったサムネイルを画像生成できる。
 */

export type SlotType = "text" | "textarea" | "color" | "select"

export interface TemplateSlot {
  readonly key: string
  readonly label: string
  readonly type: SlotType
  readonly placeholder?: string
  readonly default?: string
  readonly options?: ReadonlyArray<{ value: string; label: string }>
  /** 未入力でも生成可能か（true=任意） */
  readonly optional?: boolean
}

export interface TemplateInput {
  readonly title: string
  readonly summary?: string
  readonly slots: Record<string, string>
}

/** UI に渡せるメタ情報（buildPrompt を除いた部分） */
export interface TemplateMeta {
  readonly id: string
  readonly name: string
  readonly category: "horizontal"
  readonly aspect: "16:9"
  readonly tagline: string
  readonly description: string
  readonly palette: ReadonlyArray<string>
  readonly diagram: ReadonlyArray<string>
  /** このデザイン型を代表する見本サムネ画像（視覚選択用） */
  readonly sample: string
  readonly slots: ReadonlyArray<TemplateSlot>
}

export interface ThumbnailTemplate extends TemplateMeta {
  readonly buildPrompt: (input: TemplateInput) => string
}

// ---- 共通ヘルパ -------------------------------------------------------------

/** スロット値を取得（空ならフォールバック） */
function slot(input: TemplateInput, key: string, fallback = ""): string {
  const v = input.slots?.[key]
  return v && v.trim() ? v.trim() : fallback
}

/** 全テンプレ共通のベース指示（編集型サムネ・テキスト忠実・実在人物NG） */
function basePreamble(): string[] {
  return [
    "Design a premium 16:9 web video thumbnail (1792x1024) for a Japanese AI-knowledge media platform called \"AI MEDIA\".",
    "This is a LAYOUT-DRIVEN editorial thumbnail: composition, typography and color hierarchy matter more than scenery. Keep it clean, not cluttered.",
    "Leave a ~24px safe margin on all edges (no important text or logo in the margin).",
  ]
}

/** 日本語見出しを「正確に」描かせる指示 */
function renderText(label: string, text: string, note = ""): string {
  return `Render this EXACT Japanese text ${label}, spelled letter-for-letter with no additions, translations or random extra characters: 「${text}」.${note ? " " + note : ""}`
}

/** 人物の扱い（実在人物の写実顔は禁止、スタイライズ図像で表情を出す） */
function peoplePolicy(): string {
  return "If human figures appear, use clean stylized/illustrated presenter figures or anonymous silhouettes that can show clear emotion — never realistic photographs of identifiable real people."
}

function accentNote(input: TemplateInput, fallback: string): string {
  const a = slot(input, "accent", fallback)
  return `Dominant accent color: ${a}.`
}

// ---- テンプレート定義 -------------------------------------------------------

export const THUMBNAIL_TEMPLATES: ReadonlyArray<ThumbnailTemplate> = [
  // ===== A: PIVOT TALK 対談テンプレート（基幹） =====
  {
    id: "A",
    name: "対談・インタビュー（基幹）",
    category: "horizontal",
    aspect: "16:9",
    tagline: "ブランドロックアップ＋人物＋実写背景",
    description:
      "左下にブランドロックアップを固定。上部に白/黒の極太見出し、下部に切り抜き人物（1〜4名）、背景はテーマを象徴する実写調。シリーズ感と信頼感。",
    palette: ["#0a1812", "#16a34a", "#38bdf8", "#ffffff"],
    diagram: [
      "┌───────────────────────┐",
      "│ 見出し（白/黒・極太）     │",
      "│              (実写背景)  │",
      "│ [BRAND]   ● ● ● ●        │",
      "└───────────────────────┘",
    ],
    sample: "/images/static/converted/chapter/14287/ogp/14287.webp",
    slots: [
      { key: "headline", label: "見出し（2〜3行・改行可）", type: "textarea", placeholder: "例: GPT-5は\n人間を超えたか", default: "" },
      { key: "brand", label: "ブランド/番組名（左下ロックアップ）", type: "text", placeholder: "AI MEDIA TALK", default: "AI MEDIA TALK" },
      { key: "genre", label: "ジャンル表記（ロックアップ下段）", type: "text", placeholder: "BUSINESS / SCIENCE / GLOBAL", default: "BUSINESS", optional: true },
      { key: "episodeNo", label: "話数（任意）", type: "text", placeholder: "#2", default: "", optional: true },
      { key: "people", label: "人物数", type: "select", default: "2", options: [
        { value: "1", label: "1名（半身・片側）" },
        { value: "2", label: "2名（並列バスト）" },
        { value: "4", label: "4名（円形カット）" },
      ] },
      { key: "scene", label: "背景シーン描写", type: "text", placeholder: "例: 抽象的なAIデータ空間 / 都市夜景", default: "", optional: true },
      { key: "accent", label: "アクセント色", type: "color", default: "#38bdf8" },
    ],
    buildPrompt: (input) => {
      const headline = slot(input, "headline", input.title)
      const brand = slot(input, "brand", "AI MEDIA TALK")
      const genre = slot(input, "genre")
      const episodeNo = slot(input, "episodeNo")
      const people = slot(input, "people", "2")
      const scene = slot(input, "scene", `an abstract setting that symbolizes: ${input.summary || input.title}`)
      const peopleDesc = people === "1"
        ? "one stylized presenter figure as a large half-body cutout on one side"
        : people === "4"
        ? "four small circular portrait cutouts evenly spaced along the bottom"
        : "two stylized presenter figures as side-by-side busts"
      return [
        ...basePreamble(),
        "TEMPLATE A — Talk/interview flagship layout.",
        "COMPOSITION: brand lockup fixed at the BOTTOM-LEFT; bold headline placed in the UPPER area; people cutouts along the bottom; topical background fills the frame.",
        `Background: ${scene}. Subtle, not competing with the headline.`,
        `${peopleDesc}, lightly drop-shadowed and cleanly cut out from the background.`,
        `Brand lockup (bottom-left), two lines: top line "${brand}"${genre ? `, bottom line "${genre}"` : ""}; set the genre name on a small ${accentNoteRaw(input, "#38bdf8")} gradient bar.`,
        episodeNo ? `Add a small episode marker "${episodeNo}" near the headline.` : "",
        renderText("as the main headline (heavy bold gothic, strong outline/shadow, 1–3 short lines)", headline, "White text on dark areas, dark text on light areas — maximize contrast."),
        accentNote(input, "#38bdf8"),
        peoplePolicy(),
      ].filter(Boolean).join("\n")
    },
  },

  // ===== B: ナンバー型インタビュー「N questions」 =====
  {
    id: "B",
    name: "ナンバー型インタビュー",
    category: "horizontal",
    aspect: "16:9",
    tagline: "特大の数字＋questions＋縦積み見出し",
    description:
      "左に特大の数字（画面高の約6割）と小さな単位語。右に強調見出しを縦積み。ダークでニュートラルな地に白文字、強調語に黄。構成が決まったインタビューに。",
    palette: ["#2b2f24", "#f5d90a", "#ffffff", "#9ca3af"],
    diagram: [
      "┌───────────────────────┐",
      "│ ⬛9  questions  ┌─────┐ │",
      "│  ↑特大        │強調   │ │",
      "│ (人物)        │見出し │ │",
      "└───────────────────────┘",
    ],
    sample: "/images/static/converted/chapter/14328/ogp/14328.webp",
    slots: [
      { key: "number", label: "特大の数字/記号", type: "text", placeholder: "9", default: "9" },
      { key: "unit", label: "単位語", type: "text", placeholder: "questions / の論点", default: "questions" },
      { key: "headline", label: "右の強調見出し", type: "textarea", placeholder: "例: 5年で\n株価3倍の秘密", default: "" },
      { key: "accent", label: "強調色", type: "color", default: "#f5d90a" },
    ],
    buildPrompt: (input) => {
      const number = slot(input, "number", "5")
      const unit = slot(input, "unit", "questions")
      const headline = slot(input, "headline", input.title)
      return [
        ...basePreamble(),
        "TEMPLATE B — Numbered interview layout.",
        "COMPOSITION: a GIANT number on the LEFT occupying about 60% of the frame height, with a small unit word beside it; a stacked emphasis headline on the RIGHT.",
        "Background: dark olive / neutral flat color. Mostly white type.",
        `The giant number is "${number}" (very thin-to-regular weight, dominant size). The small unit word next to it is "${unit}".`,
        renderText("for the giant number and the small unit word exactly as given", `${number} ${unit}`),
        renderText("as the right-side stacked headline (bold gothic, key word highlighted in the accent color)", headline),
        "Optionally place one stylized presenter figure in the center-left.",
        accentNote(input, "#f5d90a"),
        peoplePolicy(),
      ].join("\n")
    },
  },

  // ===== C: マネー/エンタメ ハイテンション =====
  {
    id: "C",
    name: "ハイテンション（数字インパクト）",
    category: "horizontal",
    aspect: "16:9",
    tagline: "高彩度・数字訴求・驚き顔・矢印",
    description:
      "上段に数字インパクトの見出しを2段。白文字＋太い黒/赤フチで実写の上でも視認性確保。矢印(↑↓)や記号で増減を可視化。複数の驚き顔を賑やかに。クリック誘引型。",
    palette: ["#e11d2a", "#ffd400", "#ffffff", "#111111"],
    diagram: [
      "┌───────────────────────┐",
      "│▌借金1000万↑  😲😆😲    │",
      "│▌資産2.5億              │",
      "│ [BRAND]               │",
      "└───────────────────────┘",
    ],
    sample: "/images/static/converted/chapter/14325/ogp/14325.webp",
    slots: [
      { key: "headline", label: "見出し（数字インパクト・2行推奨）", type: "textarea", placeholder: "例: 借金1000万円→\n資産2.5億円", default: "" },
      { key: "brand", label: "ブランド/番組名", type: "text", placeholder: "AI活用ラボ", default: "", optional: true },
      { key: "accent", label: "アクセント色", type: "color", default: "#e11d2a" },
    ],
    buildPrompt: (input) => {
      const headline = slot(input, "headline", input.title)
      const brand = slot(input, "brand")
      return [
        ...basePreamble(),
        "TEMPLATE C — High-energy money/entertainment layout (YouTube-style click magnet).",
        "COMPOSITION: a punchy headline at the TOP in two stacked bands; multiple exaggerated reaction figures (surprise/excitement) arranged on the lower/right.",
        "High-saturation palette: red, yellow, white. Use arrows (↑ ↓) and symbols to visualize increase/decrease.",
        renderText("as the headline in two stacked bands (extra-bold, white fill with thick black or red outline for readability over any background)", headline),
        brand ? `Add a small brand label "${brand}" near the bottom.` : "",
        "Use 2–4 stylized reaction figures with big expressions to amplify the hook.",
        accentNote(input, "#e11d2a"),
        peoplePolicy(),
      ].filter(Boolean).join("\n")
    },
  },

  // ===== D: ランキング/比較 =====
  {
    id: "D",
    name: "ランキング・比較",
    category: "horizontal",
    aspect: "16:9",
    tagline: "ジャンルバッジ＋キーワード色分け＋等間隔バスト",
    description:
      "左上に小さなジャンルバッジ（角丸・色背景）。見出しはキーワードごとに色分け。人物は横一列の等間隔バスト。末尾に対象名＋話数。序列・比較を示す均等配置。",
    palette: ["#dc2626", "#22c55e", "#ffffff", "#1f2937"],
    diagram: [
      "┌───────────────────────┐",
      "│[BADGE] 生成AIで学ぶ術    │",
      "│  🧑 🧑 🧑 🧑            │",
      "│            対象名 #2    │",
      "└───────────────────────┘",
    ],
    sample: "/images/static/converted/chapter/14317/ogp/14317.webp",
    slots: [
      { key: "badge", label: "ジャンルバッジ文言（左上）", type: "text", placeholder: "ランキング超分析", default: "ランキング超分析" },
      { key: "headline", label: "見出し", type: "textarea", placeholder: "例: 生成AIで学ぶ・稼ぐ術", default: "" },
      { key: "keyword", label: "色分け強調キーワード（任意）", type: "text", placeholder: "生成AI", default: "", optional: true },
      { key: "item", label: "対象名＋話数（右下）", type: "text", placeholder: "Gemini #2", default: "", optional: true },
      { key: "accent", label: "強調色", type: "color", default: "#22c55e" },
    ],
    buildPrompt: (input) => {
      const badge = slot(input, "badge", "ランキング超分析")
      const headline = slot(input, "headline", input.title)
      const keyword = slot(input, "keyword")
      const item = slot(input, "item")
      return [
        ...basePreamble(),
        "TEMPLATE D — Ranking / comparison layout.",
        "COMPOSITION: a small rounded GENRE BADGE at the TOP-LEFT (colored background); the headline beside/below it; a single row of evenly spaced presenter busts; an item name with episode number at the bottom-right.",
        renderText("on the top-left genre badge", badge),
        renderText("as the headline (bold gothic)", headline, keyword ? `Render the key word 「${keyword}」 in the accent color, the rest in white.` : ""),
        "Place four stylized presenter busts in one evenly spaced horizontal row (suggesting comparison/ranking).",
        item ? renderText("at the bottom-right as the subject + episode marker", item) : "",
        accentNote(input, "#22c55e"),
        peoplePolicy(),
      ].filter(Boolean).join("\n")
    },
  },

  // ===== E: 「虎の巻」サブブランド =====
  {
    id: "E",
    name: "サブブランド（虎の巻型）",
    category: "horizontal",
    aspect: "16:9",
    tagline: "固定サブブランドロゴ＋2行見出し＋緑系背景",
    description:
      "左下にサブブランドロゴ（白ゴシック＋黄背景×黒の筆書き風斜体）を固定。見出しは2行・白（赤強調可）。人物は2〜3名のバスト。背景は緑系フラット/グラデ。シリーズ識別。",
    palette: ["#16a34a", "#f5e800", "#111111", "#ffffff"],
    diagram: [
      "┌───────────────────────┐",
      "│  思考が10倍加速する      │",
      "│  AI壁打ち術    🧑🧑🧑   │",
      "│ ▟ビジネス[虎の巻]▙       │",
      "└───────────────────────┘",
    ],
    sample: "/images/static/converted/chapter/14316/ogp/14316.webp",
    slots: [
      { key: "headline", label: "見出し（2行推奨）", type: "textarea", placeholder: "例: 思考が10倍加速する\nAI壁打ち術", default: "" },
      { key: "subbrand1", label: "サブブランド・上段（白ゴシック）", type: "text", placeholder: "ビジネス", default: "ビジネス" },
      { key: "subbrand2", label: "サブブランド・下段（黄背景×黒筆文字）", type: "text", placeholder: "虎の巻", default: "虎の巻" },
      { key: "people", label: "人物数", type: "select", default: "3", options: [
        { value: "2", label: "2名" },
        { value: "3", label: "3名" },
      ] },
      { key: "accent", label: "背景の緑トーン", type: "color", default: "#16a34a" },
    ],
    buildPrompt: (input) => {
      const headline = slot(input, "headline", input.title)
      const sb1 = slot(input, "subbrand1", "ビジネス")
      const sb2 = slot(input, "subbrand2", "虎の巻")
      const people = slot(input, "people", "3")
      return [
        ...basePreamble(),
        "TEMPLATE E — Sub-brand series layout (\"torano-maki\" style).",
        "COMPOSITION: a fixed SUB-BRAND LOGO at the BOTTOM-LEFT; a two-line headline filling the upper-left; 2–3 stylized presenter busts on the right; flat/gradient green background.",
        `Sub-brand logo: top word "${sb1}" in white gothic, below it "${sb2}" set in a black brush-style italic font inside a bright yellow box.`,
        renderText("for the sub-brand logo wording exactly", `${sb1} ${sb2}`),
        renderText("as the two-line headline (heavy white gothic; an emphasis word may be red)", headline),
        `Use ${people} stylized presenter busts on the right.`,
        accentNote(input, "#16a34a (green base)"),
        peoplePolicy(),
      ].join("\n")
    },
  },
]

// accentNote が文字列を返す版（lockupバー色などに使う内部用）
function accentNoteRaw(input: TemplateInput, fallback: string): string {
  return slot(input, "accent", fallback)
}

// ---- 公開ヘルパ -------------------------------------------------------------

export function getThumbnailTemplate(id: string): ThumbnailTemplate | undefined {
  return THUMBNAIL_TEMPLATES.find((t) => t.id === id)
}

/** UI 配信用：buildPrompt を除いたメタ情報の一覧 */
export function listTemplateMeta(): TemplateMeta[] {
  return THUMBNAIL_TEMPLATES.map(({ buildPrompt: _omit, ...meta }) => meta)
}

/** テンプレ＋スロットから最終プロンプトを構築（サーバー専用） */
export function buildTemplatePrompt(id: string, input: TemplateInput): string | null {
  const template = getThumbnailTemplate(id)
  if (!template) return null
  return template.buildPrompt(input)
}
