# AIサムネイル生成 — 構造設計書

## 概要

動画ごとに複数のAIサムネイル候補を生成・管理し、1枚をプライマリとして選択してフロントに反映する構造。
現時点では画像生成品質は作り込まず、後から綺麗に組み込める設計のみ構築する。

## 1. DB設計

```sql
CREATE TABLE IF NOT EXISTS thumbnails (
  id              TEXT PRIMARY KEY,          -- ULID
  video_id        TEXT NOT NULL,             -- videos.id
  file_path       TEXT NOT NULL,             -- /uploads/thumbnails/{id}.webp
  source          TEXT NOT NULL DEFAULT 'manual', -- manual | ffmpeg | ai
  prompt          TEXT,                      -- AI生成時のプロンプト
  style_preset    TEXT,                      -- 使用したスタイルプリセット名
  is_primary      INTEGER DEFAULT 0,         -- 1=フロント表示用
  status          TEXT DEFAULT 'done',       -- pending | generating | done | error
  error_message   TEXT,
  width           INTEGER,
  height          INTEGER,
  file_size       INTEGER,
  model           TEXT,                      -- gpt-image-1 (OpenAI Images API)
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS thumbnail_style_presets (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,             -- "PIVOT標準", "ビジネス", "テクノロジー"
  prompt_template TEXT NOT NULL,             -- "ビジネスメディア風のサムネイル。{title}..."
  style_params    TEXT,                      -- JSON: {model, size, quality, etc.}
  is_default      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);
```

## 2. ステータス管理

```
サムネイルのライフサイクル:

  (動画アップロード時)
    │
    ├── ffmpegで自動抽出 → source='ffmpeg', status='done', is_primary=1
    │
  (管理画面から手動アップロード)
    │
    ├── ファイル保存 → source='manual', status='done'
    │
  (AI生成リクエスト)
    │
    ├── status='pending' → 'generating' → 'done' or 'error'
    │   source='ai', prompt='{使用プロンプト}', model='{使用モデル}'
    │
  (プライマリ選択)
    │
    └── 選択された1枚のis_primary=1, 他はis_primary=0
        → videos.thumbnail_path を更新
        → フロントに反映
```

## 3. API設計

```
GET    /api/videos/[id]/thumbnails           サムネイル一覧
POST   /api/videos/[id]/thumbnails           手動アップロード
POST   /api/videos/[id]/thumbnails/generate  AI生成リクエスト
PUT    /api/videos/[id]/thumbnails/[thumbId]  プライマリ選択
DELETE /api/videos/[id]/thumbnails/[thumbId]  削除

GET    /api/thumbnail-presets                 プリセット一覧
POST   /api/thumbnail-presets                 プリセット作成
```

## 4. 管理画面UI（/admin/videos/[id] 内）

```
┌─ 動画詳細ページ ─────────────────────────────┐
│                                              │
│  [既存: プログレスステップ / 動画情報 / AI状態]   │
│                                              │
│  ┌─ サムネイル管理 ──────────────────────────┐ │
│  │                                          │ │
│  │  現在のサムネイル: [画像] ✅ プライマリ      │ │
│  │                                          │ │
│  │  ── AI生成 ──                             │ │
│  │  プリセット: [▼ PIVOT標準]                 │ │
│  │  プロンプト: [________________] [生成]     │ │
│  │  ステータス: ⏳ 生成中... / ✅ 完了        │ │
│  │                                          │ │
│  │  ── 生成済みサムネイル ──                   │ │
│  │  [画像1] [画像2] [画像3]                   │ │
│  │  [プライマリに設定] [削除]                  │ │
│  │                                          │ │
│  │  ── 手動アップロード ──                     │ │
│  │  [ファイルを選択]                          │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## 5. フロント反映

- `videos.thumbnail_path` にプライマリサムネイルのパスを保持
- フロント側は既存の `thumbnailUrl` をそのまま使用
- プライマリ変更時に `videos.thumbnail_path` を更新するだけで反映完了
- 既存UIコンポーネントに変更不要

## 6. 将来のAI生成フロー（未実装、構造のみ）

```
管理画面: 「AI生成」ボタン
  ↓
POST /api/videos/[id]/thumbnails/generate
  body: { prompt, stylePreset, model }
  ↓
thumbnails INSERT (status='pending')
  ↓
(将来実装) AI画像生成API呼び出し
  ↓
thumbnails UPDATE (status='done', file_path=保存先)
  ↓
管理画面: 生成済み一覧に表示
  ↓
「プライマリに設定」→ videos.thumbnail_path 更新
  ↓
フロント反映
```
