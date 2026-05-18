/**
 * サムネイル生成のデフォルトプロンプト
 * 目的: ユーザーの関心を引き、クリック→コンテンツ消費を促すサムネイル
 * YouTube上位チャンネルのサムネイル設計思想を踏襲
 */
export function getDefaultThumbnailPrompt(title: string, summary?: string): string {
  const context = summary
    ? `Video title: "${title}"\nContent summary: "${summary}"`
    : `Video title: "${title}"`

  return [
    "Generate a YouTube-style thumbnail designed to maximize click-through rate.",
    "",
    context,
    "",
    "DESIGN GOALS (in priority order):",
    "1. INSTANTLY communicate what this video is about in under 1 second",
    "2. Create curiosity gap — viewer must feel 'I need to know more'",
    "3. Stand out in a feed of other thumbnails",
    "",
    "REQUIRED ELEMENTS:",
    "- A short, punchy Japanese text overlay (2-8 characters max) that captures the hook or key takeaway",
    "  Examples: '衝撃の結末', '年収3倍', '逆転劇', '知らないと損', '禁断の手法'",
    "  The text must be derived from the actual video content, not generic clickbait",
    "- Bold, thick typography with strong outlines/shadows for maximum readability",
    "- A clear visual element that represents the topic (objects, icons, illustrations, diagrams)",
    "- High-contrast color scheme (2-3 colors max) with one dominant accent color",
    "- Split composition or diagonal lines to create visual tension",
    "",
    "VISUAL STYLE:",
    "- 16:9 aspect ratio, web thumbnail resolution",
    "- YouTube Premium channel quality (think: 中田敦彦, 両学長, PIVOT, NewsPicks)",
    "- Background: gradient, solid color, or simple blurred scene — never cluttered",
    "- Text placement: large, occupying 30-50% of the frame, positioned for immediate eye contact",
    "- Use arrows, circles, underlines, or highlight effects to draw attention to key elements",
    "",
    "STRICTLY FORBIDDEN:",
    "- Human faces or photographs of real people",
    "- Random English text or unrelated words (only use Japanese text derived from the content)",
    "- The word 'AI' anywhere on the image",
    "- Small or hard-to-read text",
    "- More than 8 characters of text total",
    "- Cluttered or busy backgrounds that compete with the text",
    "- Generic stock imagery",
    "",
    "The thumbnail must make a viewer scrolling through a feed stop and think: 'What is this? I need to watch.'",
  ].join("\n")
}
