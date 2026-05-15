export const SYSTEM_PROMPT = `あなたはビジネスメディア「PIVOT」の編集者です。
動画の文字起こしテキストから、メディアサイトに掲載するためのコンテンツを生成してください。
品質基準: PIVOTの既存コンテンツと同等の質を維持すること。
出力は必ず指定されたJSON形式で返してください。`

export function buildGeneratePrompt(title: string, category: string, transcription: string): string {
  return `## 動画情報
タイトル: ${title}
カテゴリ: ${category || "未設定"}

## 文字起こし
${transcription.slice(0, 30000)}

## 生成指示
以下のJSON形式で出力してください。JSONのみを出力し、他のテキストは含めないでください:

{
  "summary": "150-200文字の要約。動画の核心を端的に伝える。",
  "chapters": [
    {
      "title": "チャプタータイトル（15文字以内）",
      "startTime": 0,
      "endTime": 120,
      "summary": "30文字程度の概要"
    }
  ],
  "article": "1500-2500文字のMarkdown記事。## 見出しと箇条書きを含む。導入→本題→まとめの構成。",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "relatedCategories": ["business"]
}`
}
