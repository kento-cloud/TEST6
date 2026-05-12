# AI動画メディアCMS — 実装設計書

## 1. システム全体像

```
┌─────────────────────────────────────────────────────────────────┐
│                        フロントエンド                              │
│   PIVOT級UI（既存）   ← データ取得 →   管理画面（新規）              │
│   localhost:3000                       localhost:3000/admin       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Next.js API Routes
                    (localhost:3000/api)
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │ SQLite  │   │ ローカル │   │ 外部API  │
         │   DB    │   │ストレージ│   │         │
         │(Drizzle)│   │ /uploads │   │Claude   │
         └─────────┘   └─────────┘   │Whisper  │
                                      └─────────┘
```

## 2. 使用するAPI候補

| 機能 | API | 理由 |
|------|-----|------|
| 文字起こし | **OpenAI Whisper API** | 日本語精度が高い。`whisper-1`モデル。25MB/リクエスト |
| 要約・チャプター・記事・タグ生成 | **Claude API (claude-sonnet-4-20250514)** | 日本語の文章生成品質が高い。長文コンテキスト対応 |
| 関連動画推薦 | **Claude API** | タグ・カテゴリ・内容の類似度から推薦。初期はルールベース→AI強化 |

### 代替候補
- 文字起こし: Google Cloud Speech-to-Text、Azure Speech Services
- 要約: OpenAI GPT-4o、Gemini 2.5
- 今後の拡張でモデル切替可能な設計にする

## 3. 環境変数設計

```env
# .env.local（gitignore対象）

# AI APIs
OPENAI_API_KEY=sk-...              # Whisper文字起こし用
ANTHROPIC_API_KEY=sk-ant-...       # Claude要約・記事生成用

# Database
DATABASE_URL=file:./data/pivot.db  # SQLite（ローカル開発）

# Storage
UPLOAD_DIR=./uploads               # 動画アップロード先
MAX_FILE_SIZE=500000000            # 500MB

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=admin               # 初期管理パスワード（後で認証強化）
```

## 4. DB設計（SQLite + Drizzle ORM）

```typescript
// src/db/schema.ts

// 動画
videos: {
  id:           text PK (ULID)
  title:        text NOT NULL
  description:  text
  filePath:     text NOT NULL           // /uploads/videos/{id}.mp4
  thumbnailPath: text                   // /uploads/thumbnails/{id}.webp
  duration:      integer                // 秒
  fileSize:      integer                // bytes
  status:        text DEFAULT 'uploaded' // uploaded | processing | ready | error
  categoryCode:  text                   // business | money | career | life | technology | global
  programId:     integer REFERENCES programs(id)
  publishedAt:   text                   // ISO8601
  createdAt:     text DEFAULT NOW
  updatedAt:     text DEFAULT NOW
}

// 番組
programs: {
  id:            integer PK AUTOINCREMENT
  name:          text NOT NULL
  description:   text
  thumbnailPath: text
  logoPath:      text
  createdAt:     text DEFAULT NOW
}

// 文字起こし
transcriptions: {
  id:        text PK (ULID)
  videoId:   text REFERENCES videos(id)
  text:      text NOT NULL              // 全文テキスト
  segments:  text                       // JSON: [{start, end, text}]
  language:  text DEFAULT 'ja'
  model:     text                       // whisper-1
  status:    text DEFAULT 'pending'     // pending | processing | done | error
  createdAt: text DEFAULT NOW
}

// AI生成コンテンツ
aiContents: {
  id:         text PK (ULID)
  videoId:    text REFERENCES videos(id)
  summary:    text                      // 要約テキスト
  chapters:   text                      // JSON: Chapter[]
  article:    text                      // 記事HTML/Markdown
  tags:       text                      // JSON: string[]
  relatedIds: text                      // JSON: string[] (関連動画ID)
  model:      text                      // claude-sonnet-4-20250514
  status:     text DEFAULT 'pending'    // pending | processing | done | error
  createdAt:  text DEFAULT NOW
  updatedAt:  text DEFAULT NOW
}

// 視聴データ（将来用）
metrics: {
  id:         integer PK AUTOINCREMENT
  videoId:    text REFERENCES videos(id)
  viewCount:  integer DEFAULT 0
  rating:     real DEFAULT 0
  ratingCount: integer DEFAULT 0
  commentCount: integer DEFAULT 0
}
```

## 5. 動画保存先

```
uploads/
├── videos/
│   ├── {videoId}.mp4          # オリジナル動画
│   └── {videoId}_audio.mp3   # 抽出音声（文字起こし用）
├── thumbnails/
│   └── {videoId}.webp         # サムネイル画像
└── temp/                      # 処理中一時ファイル
```

- アップロード: Next.js API Route (`/api/videos/upload`)
- 保存: ローカルファイルシステム (`./uploads/`)
- サムネイル: ffmpegで動画から自動抽出 or 手動アップロード
- 音声抽出: ffmpegで `.mp4` → `.mp3` 変換

## 6. 文字起こし処理フロー

```
POST /api/videos/upload
  → 動画保存 → DBにvideo作成(status='uploaded')
  → レスポンス返却

POST /api/videos/{id}/transcribe
  → ffmpegで音声抽出(.mp3)
  → 25MBチャンクに分割（必要時）
  → OpenAI Whisper APIに送信
  → segments付きレスポンス受信
  → transcriptionsテーブルに保存(status='done')
  → video.status = 'processing'
```

### Whisper APIリクエスト
```typescript
const response = await openai.audio.transcriptions.create({
  file: fs.createReadStream(audioPath),
  model: "whisper-1",
  language: "ja",
  response_format: "verbose_json",  // segments付き
  timestamp_granularities: ["segment"],
});
```

## 7. 要約・チャプター・記事生成フロー

```
POST /api/videos/{id}/generate
  → transcriptionsからテキスト取得
  → Claude APIに送信（1リクエストで全生成）
  → 結果をaiContentsテーブルに保存
  → video.status = 'ready'
```

### Claude APIプロンプト設計
```typescript
const prompt = `
以下は動画「${title}」の文字起こしテキストです。

${transcriptionText}

以下のJSON形式で出力してください:
{
  "summary": "200文字程度の要約",
  "chapters": [
    { "title": "チャプタータイトル", "startTime": 0, "endTime": 120, "summary": "概要" }
  ],
  "article": "記事本文（Markdown形式、1000-2000文字）",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "relatedCategories": ["business", "technology"]
}
`;
```

## 8. JSONの型定義

```typescript
// src/types/ai.ts

interface TranscriptionSegment {
  readonly start: number     // 秒
  readonly end: number       // 秒
  readonly text: string
}

interface Chapter {
  readonly title: string
  readonly startTime: number  // 秒
  readonly endTime: number    // 秒
  readonly summary: string
}

interface AIGeneratedContent {
  readonly summary: string
  readonly chapters: readonly Chapter[]
  readonly article: string          // Markdown
  readonly tags: readonly string[]
  readonly relatedCategories: readonly string[]
}

interface VideoWithAI {
  readonly video: Video
  readonly transcription: Transcription | null
  readonly aiContent: AIGeneratedContent | null
}
```

## 9. 管理画面構成

```
/admin                        # ダッシュボード（動画一覧+ステータス）
/admin/videos                 # 動画一覧
/admin/videos/upload          # 動画アップロード
/admin/videos/{id}            # 動画詳細（メタ情報編集）
/admin/videos/{id}/transcript # 文字起こし確認・編集
/admin/videos/{id}/ai         # AI生成結果確認・編集
/admin/videos/{id}/article    # 記事プレビュー・編集
/admin/programs               # 番組管理
/admin/settings               # API設定・環境確認
```

### 管理画面デザイン方針
- PIVOT UIとは独立したシンプルなデザイン
- 左サイドバー + メインエリア
- 白/グレー系のクリーンなUI
- 既存のPIVOT UIコンポーネントを壊さない

## 10. フロント反映方法

### 現在の静的データ → DB読み出しへの移行

```
現在:  data/episodes.ts (ハードコード)
      ↓
移行:  DB (videos + aiContents + metrics)
      ↓ API Route or Server Component
      フロント表示
```

### 段階的移行
1. **Phase A**: 既存の `data/episodes.ts` を維持しつつ、DBにも同じデータを投入
2. **Phase B**: 新規投稿動画はDBから読み出し、既存データは `data/` から読み出し（並行運用）
3. **Phase C**: 全データをDBに移行、`data/` ファイルを削除

### フロント表示の変更点
- `movie/[episodeId]/page.tsx`: DBからvideo+aiContent取得→チャプター表示・記事表示を追加
- トップページ: 新着セクションをDBから取得（既存UIレイアウトは変えない）
- 検索: DBのタグ・タイトルでフルテキスト検索

## 11. 実装順序

```
Phase 1: データ基盤（UIに影響なし）
├── 1-1. Drizzle ORM + SQLite セットアップ
├── 1-2. スキーマ定義
├── 1-3. 既存データのDB投入スクリプト
└── 1-4. 環境変数テンプレート (.env.example)

Phase 2: 動画アップロード
├── 2-1. /api/videos/upload API Route
├── 2-2. ffmpegによるサムネイル自動生成
├── 2-3. /admin レイアウト + 動画一覧ページ
└── 2-4. /admin/videos/upload アップロードフォーム

Phase 3: 文字起こし
├── 3-1. ffmpegによる音声抽出
├── 3-2. Whisper APIクライアント
├── 3-3. /api/videos/{id}/transcribe API Route
├── 3-4. /admin/videos/{id}/transcript 確認画面
└── 3-5. 文字起こし結果の手動編集機能

Phase 4: AI生成
├── 4-1. Claude APIクライアント
├── 4-2. プロンプト設計・テスト
├── 4-3. /api/videos/{id}/generate API Route
├── 4-4. /admin/videos/{id}/ai 生成結果確認・編集
└── 4-5. 記事プレビュー

Phase 5: フロント反映
├── 5-1. movie/[episodeId] にチャプター・記事表示追加
├── 5-2. トップページの新着をDB読み出しに段階移行
├── 5-3. 検索をDB検索に切替
├── 5-4. ランキング・関連動画をDB連動
└── 5-5. data/*.ts の完全廃止

Phase 6: 仕上げ
├── 6-1. 管理画面の認証強化
├── 6-2. エラーハンドリング・リトライ
├── 6-3. バッチ処理（複数動画の一括生成）
└── 6-4. パフォーマンス最適化
```

## 12. 追加パッケージ（予定）

```json
{
  "dependencies": {
    "drizzle-orm": "^0.38",
    "better-sqlite3": "^11",
    "@anthropic-ai/sdk": "^0.52",
    "openai": "^4"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30"
  }
}
```

- ffmpeg: システムにインストール済みであること（`brew install ffmpeg`）

## 13. リスク・注意点

| リスク | 対策 |
|--------|------|
| Whisper APIの25MB制限 | 長い動画は音声チャンク分割して送信 |
| Claude APIのレート制限 | リトライ+exponential backoff |
| 大きな動画ファイルのアップロード | ストリーミングアップロード、500MB上限 |
| UI崩壊 | 管理画面は`/admin`以下に完全分離、既存コンポーネントに触らない |
| DB移行中の二重管理 | Phase Bで並行運用、段階的に移行 |
| ffmpeg未インストール | セットアップスクリプトで事前チェック |

## 14. 変更しないもの

以下は本設計で**一切変更しない**:

- `src/components/` の既存コンポーネント
- `src/app/` の既存ページレイアウト
- `globals.css` のデザイントークン
- `public/images/` の既存画像
- フロントエンドの見た目・操作感

変更するのは:
- `src/app/admin/` 以下の新規ページ（管理画面）
- `src/app/api/` 以下の新規API Routes
- `src/db/` 新規DB関連コード
- `src/types/` への型追加
- `src/app/movie/[episodeId]/page.tsx` へのAIコンテンツ表示追加（Phase 5以降）
