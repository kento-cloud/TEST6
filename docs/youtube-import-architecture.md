# YouTube Import + 共通AIパイプライン — 設計書

## 1. 統一パイプライン

```
┌──────────────────┐   ┌──────────────────┐
│  Local Upload    │   │  YouTube Import   │
│  (動画ファイル)    │   │  (YouTube URL)    │
└───────┬──────────┘   └───────┬──────────┘
        │                      │
        │  ffmpeg音声抽出       │  YouTube字幕取得
        │  → Whisper API       │  or 手動入力
        │                      │
        └──────────┬───────────┘
                   │
            ┌──────▼──────┐
            │ transcript  │  ← ここが共通の入口
            │ (fullText)  │
            └──────┬──────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
    ┌────▼───┐ ┌───▼───┐ ┌───▼────┐
    │ summary│ │chapter│ │article │
    └────────┘ └───────┘ └────────┘
                   │
              ┌────▼────┐
              │thumbnail│
              └─────────┘
                   │
              ┌────▼────┐
              │ publish │
              └─────────┘
```

sourceTypeに関わらず、transcriptのfullTextが存在すれば同一のClaude APIパイプラインに流す。

## 2. DB変更

### videos テーブル拡張

```sql
ALTER TABLE videos ADD COLUMN source_type TEXT DEFAULT 'local';
  -- 'local' | 'youtube'

ALTER TABLE videos ADD COLUMN youtube_video_id TEXT;
  -- YouTube動画ID (例: 'dQw4w9WgXcQ')

ALTER TABLE videos ADD COLUMN youtube_url TEXT;
  -- 元のYouTube URL

ALTER TABLE videos ADD COLUMN youtube_metadata TEXT;
  -- JSON: { channelTitle, publishedAt, viewCount, duration, tags, ... }
```

### transcriptions テーブル拡張

```sql
ALTER TABLE transcriptions ADD COLUMN source TEXT DEFAULT 'whisper';
  -- 'whisper' | 'youtube_caption' | 'manual' | 'external_api'
```

### 変更しないテーブル
- ai_contents: そのまま（videoIdでリレーション）
- thumbnails: そのまま
- metrics: そのまま
- job_queue: そのまま

## 3. ステータス管理

```
video.status の遷移（共通）:

  draft
    │ アップロード or YouTube URL登録
    ▼
  uploaded
    │ 文字起こし取得（方法はsource_typeにより異なる）
    ▼
  transcribing
    │ 完了
    ▼
  uploaded (transcript ready)
    │ AI生成
    ▼
  generating
    │ 完了
    ▼
  review
    │ 公開
    ▼
  published

transcription.source で方法を識別:
  - local → 'whisper' (ffmpeg + Whisper API)
  - youtube (字幕あり) → 'youtube_caption'
  - youtube (字幕なし) → 'manual' or 将来的に音声DL+whisper
  - どちらでも → 'manual' (手動入力)
```

## 4. YouTube Import フロー

```
管理画面: YouTube URL入力
  │
  POST /api/videos/import-youtube
  body: { url: "https://www.youtube.com/watch?v=xxx" }
  │
  ├── 1. videoId抽出 (URLパース)
  ├── 2. YouTube oEmbed APIでメタデータ取得 (API Key不要)
  │     → title, author_name, thumbnail_url
  ├── 3. サムネイル画像をダウンロード保存
  ├── 4. DB insert: videos (source_type='youtube', youtube_video_id, youtube_url, youtube_metadata)
  ├── 5. status = 'uploaded'
  │
  └── 6. レスポンス: { id, title, thumbnailUrl }

管理画面: 「字幕を取得」ボタン
  │
  POST /api/videos/{id}/transcribe
  │
  ├── source_type === 'youtube' の場合:
  │     → YouTube字幕取得を試行
  │     → 成功: transcription.source = 'youtube_caption'
  │     → 失敗: エラー返却 (手動入力を促す)
  │
  ├── source_type === 'local' の場合:
  │     → ffmpeg + Whisper (既存フロー)
  │
  └── transcription保存

管理画面: 「AI生成」ボタン
  │
  POST /api/videos/{id}/generate  ← 既存APIをそのまま使用
  │
  └── transcription.fullText があれば実行可能
      （sourceTypeに依存しない）
```

## 5. YouTube メタデータ取得

oEmbed API（API Key不要）:
```
GET https://www.youtube.com/oembed?url={youtubeUrl}&format=json
→ { title, author_name, thumbnail_url, ... }
```

サムネイル取得:
```
https://img.youtube.com/vi/{videoId}/maxresdefault.jpg
→ fallback: hqdefault.jpg
```

## 6. 管理画面の変更

### /admin/videos/upload → タブ追加

```
┌─ アップロード ────────────────────────────┐
│                                          │
│  [ファイルアップロード]  [YouTube URL]      │ ← タブ切替
│                                          │
│  === YouTube URL タブ ===                 │
│  URL: [https://youtube.com/watch?v=...] │
│  [取得]                                  │
│                                          │
│  プレビュー:                              │
│  [YouTube embed]                         │
│  タイトル: xxx                            │
│  チャンネル: xxx                          │
│                                          │
│  [登録する]                               │
└──────────────────────────────────────────┘
```

### /admin/videos/[id] → sourceType表示

```
動画情報:
  ソース: YouTube / ローカル
  YouTube URL: https://...  (YouTubeの場合)
  [YouTube embed preview]   (YouTubeの場合)
```

## 7. フロント反映

### movie/[episodeId]/page.tsx

```tsx
// YouTube動画の場合はiframe embed表示
if (video.sourceType === 'youtube' && video.youtubeVideoId) {
  return <iframe src={`https://www.youtube.com/embed/${video.youtubeVideoId}`} />
}
// ローカル動画の場合はサムネイル表示（既存）
return <Image src={video.thumbnailPath} ... />
```

チャプター・記事・タグの表示は共通（sourceTypeに依存しない）。

## 8. API一覧（変更・追加分のみ）

```
POST /api/videos/import-youtube     YouTube URL登録（新規）
PUT  /api/videos/[id]               メタ情報更新（sourceType対応追加）
POST /api/videos/[id]/transcribe    文字起こし（YouTube字幕対応追加）
POST /api/videos/[id]/generate      AI生成（変更なし、共通パイプライン）
```

## 9. 実装順序

```
Step 1: DB拡張
  - videos にsource_type, youtube_video_id, youtube_url, youtube_metadata カラム追加
  - transcriptions にsource カラム追加

Step 2: YouTube Import API
  - /api/videos/import-youtube: URL解析 + oEmbed + サムネDL + DB保存

Step 3: 管理画面 Upload ページ拡張
  - タブ切替 (ファイルアップロード / YouTube URL)
  - YouTube URLプレビュー + 登録フォーム

Step 4: 文字起こしAPI拡張
  - /api/videos/[id]/transcribe でsource_type判定
  - YouTube字幕取得ロジック追加

Step 5: 管理画面 動画詳細 拡張
  - sourceType表示、YouTube embed表示

Step 6: フロント movie/[id] 拡張
  - YouTube embed表示対応
```
