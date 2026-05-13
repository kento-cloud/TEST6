# AI Pipeline Stability Phase — 設計書

## 1. 現在のAIパイプラインの問題点

### 問題1: 処理が一括で分離できない

現在の`POST /api/videos/[id]/generate`は1リクエストでClaude APIを呼び、summary+chapters+article+tags+relatedCategoriesを一括生成している。

- summaryだけ再生成できない
- articleだけ直したい時も全部再生成になる
- 1つの項目が失敗すると全部やり直し
- プロンプト調整のイテレーションが遅い

### 問題2: processing_stepが粗すぎる

`none/transcribing/generating/error`の4段階しかない。

- 「何を処理中か」がわからない
- 「どこまで終わったか」がわからない
- stuckした時に原因がわからない

### 問題3: タイムアウト耐性がない

Whisper APIは長い動画で30秒以上かかる。Claude APIも長い文字起こしでタイムアウトする可能性がある。

- Next.js API Routeのデフォルトタイムアウト
- レスポンスを待つ間にブラウザが切断
- 処理中にサーバーが再起動

### 問題4: 再生成の仕組みがない

- resetは全削除（transcription+ai_contents丸ごと消える）
- 「summaryだけやり直す」ができない
- 生成履歴が残らない

### 問題5: 処理履歴がない

- 何回生成したか不明
- どのプロンプトで生成したか不明
- 過去の結果と比較できない

---

## 2. 安定化のための設計

### 2-1. AI処理の段階分離

```
現在:
  transcribe → generate（一括） → thumbnail

今後:
  extract_audio        ffmpegで音声抽出
  transcribe           Whisper APIで文字起こし
  generate_summary     Claude APIで要約
  generate_chapters    Claude APIでチャプター
  generate_article     Claude APIで記事
  generate_tags        Claude APIでタグ
  generate_thumbnail   OpenAI Images APIでサムネイル
```

**実装方針**: Claude APIへのリクエストは依然として1回で全生成するが、**結果の保存と再生成を項目ごとに分離する**。個別再生成時は該当項目だけClaudeに生成させるプロンプトを使う。

### 2-2. processing_step拡張

```sql
-- 現在
processing_step TEXT: none | transcribing | generating | error

-- 拡張（互換性維持）
processing_step TEXT: 
  none                  -- 何もしていない
  extracting_audio      -- ffmpeg音声抽出中
  transcribing          -- Whisper API実行中
  generating_summary    -- 要約生成中
  generating_chapters   -- チャプター生成中
  generating_article    -- 記事生成中
  generating_tags       -- タグ生成中
  generating_thumbnail  -- サムネイル生成中
  error                 -- エラー（error_messageに詳細）
```

既存の`transcribing`/`generating`は互換として残す。新しいステップは追加で入る。

### 2-3. ai_generation_logs テーブル（新規）

```sql
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  step TEXT NOT NULL,           -- summary | chapters | article | tags | thumbnail | transcribe | full_generate
  status TEXT DEFAULT 'pending', -- pending | processing | done | error
  model TEXT,                   -- claude-sonnet-4-20250514, whisper-1, gpt-image-1
  prompt TEXT,                  -- 使用したプロンプト
  result_preview TEXT,          -- 結果の先頭200文字
  error_message TEXT,
  processing_ms INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 2-4. 個別再生成API

```
POST /api/videos/[id]/regenerate
  body: { step: "summary" | "chapters" | "article" | "tags" | "thumbnail" }

  → stepに応じて個別Claude APIリクエスト
  → ai_contentsの該当フィールドのみ更新
  → ai_generation_logsに記録
  → processing_step管理
```

### 2-5. タイムアウト対策

```typescript
// Claude API呼び出しにtimeoutを設定
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 120000) // 2分

try {
  const result = await client.messages.create({...}, { signal: controller.signal })
} finally {
  clearTimeout(timeout)
}

// processing_stepが一定時間更新されない場合のstuck検出
// → 管理画面に「処理がスタックしている可能性があります」表示
```

### 2-6. 管理画面のprogress表示

```
/admin/videos/[id] に以下を追加:

┌─ AI処理状態 ─────────────────────────┐
│                                      │
│  文字起こし:  ✅ 完了  [再生成]       │
│  要約:        ✅ 完了  [再生成]       │
│  チャプター:  ✅ 完了  [再生成]       │
│  記事:        ⏳ 生成中...            │
│  タグ:        ⬜ 未実行               │
│  サムネイル:  ✅ 完了  [再生成]       │
│                                      │
│  処理ログ: 3件  [詳細を見る]          │
└──────────────────────────────────────┘
```

### 2-7. job_queue方針

現段階: **API直実行 + DB status管理**を維持。

将来移行のための準備:
- AI処理のロジックを`src/lib/ai/pipeline.ts`に集約
- API Routeはpipeline関数を呼ぶだけ
- pipeline関数はDB操作+外部API呼び出し
- 将来: pipeline関数をworkerから呼ぶ形に切替

```
現在:
  API Route → pipeline.ts → Claude API → DB保存

将来:
  API Route → job_queue INSERT → worker → pipeline.ts → Claude API → DB保存
```

---

## 3. 影響範囲

### 新規ファイル

```
src/db/schema.ts                → ai_generation_logs テーブル追加
src/db/migrate.ts               → CREATE TABLE追加
src/lib/ai/pipeline.ts          → AI処理ロジック集約
src/app/api/videos/[id]/regenerate/route.ts → 個別再生成API
```

### 修正ファイル

```
src/app/api/videos/[id]/generate/route.ts      → pipeline.ts呼び出しに変更
src/app/api/videos/[id]/transcribe/route.ts    → pipeline.ts呼び出しに変更
src/app/api/videos/[id]/thumbnails/generate/route.ts → processing_step細分化
src/app/admin/videos/[id]/page.tsx             → progress表示追加
src/types/ai.ts                                → ProcessingStep型拡張
```

### 変更しないファイル

- フロントUI全体（(front)/ 以下）
- 管理画面レイアウト
- 認証
- 検索
- DB基本スキーマ（videos, transcriptions, ai_contents）

---

## 4. 実装順序

```
Step 1: DB拡張 + 型定義
  - ai_generation_logs テーブル
  - ProcessingStep型拡張
  - migrate.ts更新

Step 2: pipeline.ts 作成
  - 個別生成関数: generateSummary, generateChapters, generateArticle, generateTags
  - 全体生成関数: generateAll（既存generateの移行）
  - ログ記録関数
  - タイムアウト対策

Step 3: regenerate API
  - POST /api/videos/[id]/regenerate { step }
  - 個別再生成実行
  - ログ記録

Step 4: 既存API移行
  - generate/route.ts → pipeline.generateAll()呼び出し
  - transcribe/route.ts → タイムアウト追加
  - thumbnails/generate/route.ts → ログ記録追加

Step 5: 管理画面progress表示
  - /admin/videos/[id] にAI処理状態セクション追加
  - 個別再生成ボタン
  - ログ表示

Step 6: テスト + レポート
```

---

## 5. 完了条件

- [ ] npm run build が通る
- [ ] 既存のtranscribe/generate/publishフローが壊れていない
- [ ] summaryだけ再生成できる
- [ ] articleだけ再生成できる
- [ ] tagsだけ再生成できる
- [ ] thumbnailだけ再生成できる
- [ ] processing_stepが細かく見える
- [ ] 生成ログが記録される
- [ ] エラー時にprocessing_stepがerrorになる
- [ ] reset後に再実行できる
- [ ] 管理画面に処理状態が表示される
- [ ] タイムアウト時にstuckしない
