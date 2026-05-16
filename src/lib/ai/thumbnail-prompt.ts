/**
 * サムネイル生成のデフォルトプロンプト
 * 汎用型: タイトル/要約からテーマと感情を抽出し、抽象ビジュアルで表現
 * ジャンル非依存（ニュース・スポーツ・ビジネス・エンタメ・教育等すべて対応）
 */
export function getDefaultThumbnailPrompt(title: string, summary?: string): string {
  const context = summary
    ? `Video title: "${title}"\nSummary: "${summary}"`
    : `Video title: "${title}"`

  return [
    "Create a premium magazine-quality editorial thumbnail for a video.",
    "",
    context,
    "",
    "Use the above information to extract the main theme and emotional tone.",
    "Represent the content through abstract visual metaphor — symbols, silhouettes, props, light, and color.",
    "",
    "Requirements:",
    "- Premium magazine-quality composition with dramatic, cinematic lighting",
    "- High contrast, visually striking color palette that reflects the video's topic and mood",
    "- Abstract imagery: geometric shapes, gradients, symbolic objects, light effects, silhouettes",
    "- 16:9 aspect ratio, high-resolution, suitable for web thumbnail",
    "- Clean composition with strong focal point and intentional negative space",
    "- Genre-agnostic: works for news, sports, business, entertainment, education, science, etc.",
    "",
    "STRICTLY FORBIDDEN:",
    "- Any text, letters, numbers, typography, or writing in any language",
    "- Human faces or recognizable people (use silhouettes or abstract forms instead)",
    "- Cluttered or busy compositions",
    "- Generic stock photo aesthetics",
    "- Logos, watermarks, or brand marks",
    "",
    "The thumbnail should intrigue viewers and make them want to click, purely through visual storytelling.",
  ].join("\n")
}
