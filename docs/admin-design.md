# 管理画面 構造設計書

## 1. Admin Routing構造

```
/admin                              # ダッシュボード
/admin/videos                       # 動画一覧（ステータス付き）
/admin/videos/upload                # 動画アップロード
/admin/videos/[id]                  # 動画詳細・メタ編集
/admin/videos/[id]/transcript       # 文字起こし確認・編集
/admin/videos/[id]/ai               # AI生成結果（要約・チャプター・タグ）
/admin/videos/[id]/article          # 記事プレビュー・編集
/admin/videos/[id]/publish          # 公開設定
/admin/programs                     # 番組管理
/admin/programs/new                 # 番組新規作成
/admin/programs/[id]                # 番組編集
/admin/queue                        # AI処理キュー状態
/admin/settings                     # API設定・環境確認
```

### レイアウト
```
/admin/layout.tsx
├── 左サイドバー（ナビゲーション）
│   ├── ダッシュボード
│   ├── 動画管理
│   ├── 番組管理
│   ├── 処理キュー
│   └── 設定
└── メインエリア
    └── 各ページ
```

管理画面は `/admin` 以下に完全分離。既存PIVOT UIの `layout.tsx`（Sidebar + グラデーション背景）とは独立した白/グレー系レイアウトを使用。

## 2. DB設計（詳細）

```sql
-- 動画テーブル
CREATE TABLE videos (
  id           TEXT PRIMARY KEY,        -- ULID
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  filePath     TEXT NOT NULL,           -- /uploads/videos/{id}.mp4
  thumbnailPath TEXT,                   -- /uploads/thumbnails/{id}.webp
  duration     INTEGER DEFAULT 0,       -- 秒
  fileSize     INTEGER DEFAULT 0,       -- bytes
  status       TEXT DEFAULT 'draft',    -- draft | uploaded | transcribing | generating | review | published | error
  categoryCode TEXT,                    -- business | money | career | life | technology | global
  programId    INTEGER,
  publishedAt  TEXT,                    -- ISO8601（公開日時）
  createdAt    TEXT DEFAULT (datetime('now')),
  updatedAt    TEXT DEFAULT (datetime('now'))
);

-- 番組テーブル
CREATE TABLE programs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  thumbnailPath TEXT,
  logoPath     TEXT,
  isActive     INTEGER DEFAULT 1,
  createdAt    TEXT DEFAULT (datetime('now'))
);

-- 文字起こしテーブル
CREATE TABLE transcriptions (
  id           TEXT PRIMARY KEY,        -- ULID
  videoId      TEXT NOT NULL REFERENCES videos(id),
  fullText     TEXT NOT NULL,           -- 全文テキスト
  segments     TEXT,                    -- JSON: TranscriptionSegment[]
  language     TEXT DEFAULT 'ja',
  model        TEXT DEFAULT 'whisper-1',
  status       TEXT DEFAULT 'pending',  -- pending | processing | done | error
  errorMessage TEXT,
  processingMs INTEGER,                 -- 処理時間（ミリ秒）
  createdAt    TEXT DEFAULT (datetime('now')),
  UNIQUE(videoId)
);

-- AI生成コンテンツテーブル
CREATE TABLE ai_contents (
  id           TEXT PRIMARY KEY,        -- ULID
  videoId      TEXT NOT NULL REFERENCES videos(id),
  summary      TEXT,                    -- 要約テキスト
  chapters     TEXT,                    -- JSON: Chapter[]
  article      TEXT,                    -- 記事Markdown
  tags         TEXT,                    -- JSON: string[]
  relatedIds   TEXT,                    -- JSON: string[]
  model        TEXT DEFAULT 'claude-sonnet-4-20250514',
  status       TEXT DEFAULT 'pending',  -- pending | processing | done | error
  errorMessage TEXT,
  processingMs INTEGER,
  isEdited     INTEGER DEFAULT 0,       -- 人間が編集したか
  createdAt    TEXT DEFAULT (datetime('now')),
  updatedAt    TEXT DEFAULT (datetime('now')),
  UNIQUE(videoId)
);

-- 処理キューテーブル
CREATE TABLE job_queue (
  id           TEXT PRIMARY KEY,        -- ULID
  videoId      TEXT NOT NULL REFERENCES videos(id),
  jobType      TEXT NOT NULL,           -- transcribe | generate_ai | extract_thumbnail
  status       TEXT DEFAULT 'pending',  -- pending | processing | done | error | cancelled
  priority     INTEGER DEFAULT 0,       -- 高い=優先
  attempts     INTEGER DEFAULT 0,
  maxAttempts  INTEGER DEFAULT 3,
  errorMessage TEXT,
  startedAt    TEXT,
  completedAt  TEXT,
  createdAt    TEXT DEFAULT (datetime('now'))
);

-- 視聴メトリクス
CREATE TABLE metrics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  videoId      TEXT NOT NULL REFERENCES videos(id),
  viewCount    INTEGER DEFAULT 0,
  rating       REAL DEFAULT 0,
  ratingCount  INTEGER DEFAULT 0,
  commentCount INTEGER DEFAULT 0,
  UNIQUE(videoId)
);
```

## 3. 動画保存フロー

```
ユーザー: /admin/videos/upload でフォーム入力
  │
  ├── title, description, categoryCode, programId 入力
  ├── 動画ファイル選択（.mp4, .mov, .webm）
  └── サムネイル選択（任意）
  │
  ▼
POST /api/videos/upload (multipart/form-data)
  │
  ├── 1. ファイルをストリーミング保存
  │     → /uploads/videos/{ulid}.mp4
  │
  ├── 2. DB insert: videos (status='uploaded')
  │
  ├── 3. job_queue insert: extract_thumbnail (priority=2)
  ├── 4. job_queue insert: transcribe (priority=1)
  │
  └── 5. レスポンス: { id, status: 'uploaded' }

バックグラウンド処理:
  ├── extract_thumbnail:
  │     ffmpeg -i input.mp4 -ss 00:00:05 -frames:v 1 thumbnail.webp
  │
  └── transcribe:
        ffmpeg -i input.mp4 -vn -ar 16000 audio.mp3
        → Whisper API → segments保存
        → job_queue insert: generate_ai
```

## 4. AI処理フロー

```
generate_ai ジョブ実行:
  │
  ├── 1. transcriptionsからfullText取得
  │
  ├── 2. Claude APIリクエスト構築
  │     └── System: "あなたはビジネスメディアの編集者です"
  │     └── User: transcription + 生成指示
  │
  ├── 3. Claude APIコール（ストリーミング）
  │
  ├── 4. レスポンスJSON解析
  │     ├── summary: string
  │     ├── chapters: Chapter[]
  │     ├── article: string (Markdown)
  │     ├── tags: string[]
  │     └── relatedCategories: string[]
  │
  ├── 5. ai_contents upsert
  │
  ├── 6. video.status = 'review'
  │
  └── 7. 管理画面で確認可能に
```

### プロンプト設計

```
System:
あなたはビジネスメディア「PIVOT」の編集者です。
動画の文字起こしから、以下を生成してください。
品質基準: PIVOTの既存コンテンツと同等の質を維持すること。

User:
## 動画情報
タイトル: {title}
カテゴリ: {category}
番組: {programName}

## 文字起こし
{transcription}

## 生成指示
以下のJSON形式で出力してください:
{
  "summary": "150-200文字の要約。動画の核心を端的に伝える",
  "chapters": [
    {
      "title": "チャプタータイトル（15文字以内）",
      "startTime": 0,
      "endTime": 120,
      "summary": "30文字程度の概要"
    }
  ],
  "article": "1500-2500文字のMarkdown記事。見出し・箇条書きを含む",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "relatedCategories": ["business"]
}
```

## 5. Queue設計

```typescript
// src/lib/queue.ts

interface Job {
  id: string
  videoId: string
  jobType: 'transcribe' | 'generate_ai' | 'extract_thumbnail'
  status: 'pending' | 'processing' | 'done' | 'error' | 'cancelled'
  priority: number
  attempts: number
  maxAttempts: number
}

// 処理フロー
// 1. API Routeからジョブ投入
// 2. /api/queue/process が定期実行（cron or 手動トリガー）
// 3. pending のジョブを priority 降順で取得
// 4. status='processing' に更新
// 5. 実行
// 6. 成功→status='done' / 失敗→attempts++ → retry or status='error'
```

### ジョブ実行方式（初期）
- Next.js API Route (`/api/queue/process`) を手動 or setInterval で呼び出し
- 1ジョブずつ逐次実行
- 将来: BullMQ + Redis に移行可能な設計

## 6. Status管理

```
動画のライフサイクル:

  draft
    │ アップロード
    ▼
  uploaded
    │ 文字起こし開始
    ▼
  transcribing
    │ 文字起こし完了 → AI生成開始
    ▼
  generating
    │ AI生成完了
    ▼
  review          ← 管理者が確認・編集
    │ 公開ボタン
    ▼
  published       ← フロントに表示される
```

### ステータス別の表示

| ステータス | 管理画面 | フロント |
|-----------|---------|---------|
| draft | 表示（グレー） | 非表示 |
| uploaded | 表示（青） | 非表示 |
| transcribing | 表示（黄、処理中） | 非表示 |
| generating | 表示（黄、処理中） | 非表示 |
| review | 表示（オレンジ） | 非表示 |
| published | 表示（緑） | **表示** |
| error | 表示（赤） | 非表示 |

## 7. フロントとのデータ接続

### API Routes

```
GET  /api/videos                    # 動画一覧（published only for front, all for admin）
GET  /api/videos/[id]               # 動画詳細
POST /api/videos/upload             # 動画アップロード
PUT  /api/videos/[id]               # メタ情報更新
POST /api/videos/[id]/transcribe    # 文字起こし実行
POST /api/videos/[id]/generate      # AI生成実行
PUT  /api/videos/[id]/ai            # AI結果編集保存
POST /api/videos/[id]/publish       # 公開
POST /api/videos/[id]/unpublish     # 非公開
GET  /api/videos/[id]/transcript    # 文字起こしデータ
GET  /api/videos/[id]/chapters      # チャプターデータ
GET  /api/videos/[id]/article       # 記事データ
GET  /api/programs                  # 番組一覧
POST /api/queue/process             # キュー処理実行
GET  /api/queue/status              # キュー状態
```

### フロント表示の切替

```typescript
// src/lib/data-source.ts

// Phase A: 静的データ（現在）
export function getEpisodes() {
  return staticEpisodes  // data/episodes.ts
}

// Phase B: DB優先、フォールバック静的
export function getEpisodes() {
  const dbEpisodes = db.select().from(videos).where(eq(status, 'published'))
  return dbEpisodes.length > 0 ? dbEpisodes : staticEpisodes
}

// Phase C: DB完全移行
export function getEpisodes() {
  return db.select().from(videos).where(eq(status, 'published'))
}
```

## 8. 公開フロー

```
管理者: /admin/videos/{id} で内容確認
  │
  ├── 文字起こし確認 → 修正可能
  ├── 要約確認 → 修正可能
  ├── チャプター確認 → 修正可能
  ├── 記事確認 → 修正可能
  ├── タグ確認 → 修正可能
  ├── サムネイル確認 → 差替え可能
  │
  └── 「公開する」ボタン
        │
        POST /api/videos/{id}/publish
        │
        ├── video.status = 'published'
        ├── video.publishedAt = now()
        ├── metricsレコード作成
        │
        └── フロントで表示開始
```

## 9. 将来的な拡張性

| 拡張 | 現在の設計での対応 |
|------|------------------|
| 複数AI モデル切替 | ai_contents.model フィールドで記録。API Client を差し替え可能 |
| 動画ホスティング外部化 | filePath を URL に変更するだけ (S3, Cloudflare R2) |
| 本格認証 | /admin/layout.tsx に認証ミドルウェア追加 |
| 多言語対応 | transcriptions.language で管理。翻訳ジョブ追加 |
| リアルタイムキュー | job_queue テーブルを BullMQ + Redis に移行 |
| コメント機能 | comments テーブル追加 |
| 課金/サブスク | users + subscriptions テーブル追加 |
| CDN配信 | thumbnailPath/filePath を CDN URL に差替え |

## 10. ファイル構成（追加分）

```
src/
├── app/
│   ├── admin/                    # 管理画面（新規）
│   │   ├── layout.tsx            # 管理画面レイアウト
│   │   ├── page.tsx              # ダッシュボード
│   │   ├── videos/
│   │   │   ├── page.tsx          # 動画一覧
│   │   │   ├── upload/page.tsx   # アップロード
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # 動画詳細
│   │   │       ├── transcript/page.tsx
│   │   │       ├── ai/page.tsx
│   │   │       ├── article/page.tsx
│   │   │       └── publish/page.tsx
│   │   ├── programs/
│   │   ├── queue/page.tsx
│   │   └── settings/page.tsx
│   └── api/                      # API Routes（新規）
│       ├── videos/
│       │   ├── route.ts          # GET (list), POST (upload)
│       │   └── [id]/
│       │       ├── route.ts      # GET, PUT
│       │       ├── transcribe/route.ts
│       │       ├── generate/route.ts
│       │       ├── publish/route.ts
│       │       └── unpublish/route.ts
│       ├── programs/route.ts
│       └── queue/
│           ├── process/route.ts
│           └── status/route.ts
├── db/
│   ├── index.ts                  # DB接続
│   ├── schema.ts                 # テーブル定義
│   └── migrate.ts                # マイグレーション
├── lib/
│   ├── ai/
│   │   ├── whisper.ts            # Whisper API client
│   │   ├── claude.ts             # Claude API client
│   │   └── prompts.ts            # プロンプトテンプレート
│   ├── queue.ts                  # ジョブキュー
│   ├── storage.ts                # ファイル保存
│   └── ffmpeg.ts                 # ffmpegラッパー
└── types/
    └── ai.ts                     # AI関連型定義
```
