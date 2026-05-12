# MVP堅牢化 — 最終修正計画

## 修正一覧（18項目）

### 原案10項目

| # | 項目 | 変更内容 |
|---|------|---------|
| 1 | videos.file_path nullable | NOT NULL → NULLable。YouTube動画でnull許可 |
| 2 | thumbnails.file_path nullable | NOT NULL → NULLable。pending/generating時にnull |
| 3 | status分離 | status → publish_status + **processing_step**（stepに変更） |
| 4 | style_preset → style_preset_id | 名前参照→ID参照。**NULLable**（プリセット未使用時） |
| 5 | related_ids命名明確化 | → related_category_codes |
| 6 | publish前チェック | **緩め条件**: title + transcript必須。thumbnail/summary/articleは警告のみ |
| 7 | トップページDB対応 | getPublishedEpisodes()使用。**dynamic回避**: revalidateで対応 |
| 8 | 検索DB対応 | **search abstraction層**導入。DB/静的データ統合検索 |
| 9 | 管理画面認証 | cookie簡易認証。**/admin/loginはmiddleware除外** |
| 10 | job_queue明確化 | ドキュメント明記のみ |

### 追加8項目

| # | 項目 | 変更内容 |
|---|------|---------|
| 11 | processing_status → processing_step | 「status」ではなく「step」。現在の処理段階を示す名称に |
| 12 | style_preset_id nullable | プリセット未使用でのAI生成を許可 |
| 13 | publish条件を緩める | 必須: title + transcript。推奨: thumbnail, summary, article（警告表示、公開は可能） |
| 14 | youtube_metadata分割検討 | JSON1カラム維持。ただしよく使うフィールド（channel_title, youtube_duration）を個別カラムに昇格するか検討 |
| 15 | search abstraction導入 | SearchService層を作り、DB検索と静的データ検索を統合 |
| 16 | middleware login除外 | /admin/loginだけはmiddleware認証チェックをスキップ |
| 17 | dynamic全体適用回避 | トップページにforce-dynamicを使わない。revalidate=60 or generateStaticParamsで対応 |
| 18 | 将来versioning前提 | ai_contentsにversion番号を持たせる設計を設計書に追記。現時点では未実装 |

---

## DB Schema 変更詳細

### videos テーブル

```
変更前:
  file_path TEXT NOT NULL
  status TEXT DEFAULT 'draft'

変更後:
  file_path TEXT                              ← NULLable化
  publish_status TEXT DEFAULT 'draft'         ← 新規: draft/review/published/unpublished
  processing_step TEXT DEFAULT 'none'         ← 新規: none/transcribing/generating/error
  youtube_channel TEXT                        ← 新規: youtube_metadataから昇格（検索用）
  youtube_duration INTEGER                    ← 新規: youtube_metadataから昇格（表示用）
  status TEXT DEFAULT 'draft'                 ← 既存維持（段階廃止予定）
```

### thumbnails テーブル

```
変更前:
  file_path TEXT NOT NULL
  style_preset TEXT

変更後:
  file_path TEXT                              ← NULLable化
  style_preset_id TEXT                        ← 新規: NULLable、presets.id参照
  style_preset TEXT                           ← 既存維持（段階廃止予定）
```

### ai_contents テーブル

```
変更前:
  related_ids TEXT

変更後:
  related_category_codes TEXT                 ← 新規: カテゴリコード配列
  version INTEGER DEFAULT 1                  ← 新規: バージョニング用
  related_ids TEXT                            ← 既存維持（段階廃止予定）
```

### マイグレーション（全てALTER TABLE ADD COLUMN）

```sql
-- videos
ALTER TABLE videos ADD COLUMN publish_status TEXT DEFAULT 'draft';
ALTER TABLE videos ADD COLUMN processing_step TEXT DEFAULT 'none';
ALTER TABLE videos ADD COLUMN youtube_channel TEXT;
ALTER TABLE videos ADD COLUMN youtube_duration INTEGER;

-- thumbnails
ALTER TABLE thumbnails ADD COLUMN style_preset_id TEXT;

-- ai_contents
ALTER TABLE ai_contents ADD COLUMN related_category_codes TEXT;
ALTER TABLE ai_contents ADD COLUMN version INTEGER DEFAULT 1;
```

既存カラム（status, file_path, style_preset, related_ids）は削除しない。新カラムと並行運用し、全参照箇所の移行完了後に廃止。

---

## API Route 修正対象

| API | 修正内容 | 影響度 |
|-----|---------|--------|
| POST /api/videos | file_path=null許可 | 低 |
| POST /api/videos/import-youtube | file_path=null, youtube_channel/duration保存 | 低 |
| POST /api/videos/[id]/transcribe | processing_step='transcribing'→'none' | 中 |
| POST /api/videos/[id]/generate | processing_step='generating'→'none' | 中 |
| POST /api/videos/[id]/publish | publish_status操作 + チェック条件 | 中 |
| POST /api/videos/[id]/reset | processing_step='none' | 低 |
| GET /api/videos | publish_status, processing_step返却 | 低 |
| 新規: GET /api/search | SearchService経由 | 新規 |
| 新規: POST /api/admin/login | パスワード検証+cookie | 新規 |
| 新規: POST /api/admin/logout | cookie削除 | 新規 |

## フロント修正対象

| ページ | 修正内容 | 影響度 |
|--------|---------|--------|
| (front)/page.tsx | revalidate=60でDB読み出し | 中 |
| (front)/search/page.tsx | SearchService連携 | 中 |
| (front)/movie/[id]/page.tsx | publish_status判定 | 低 |

## 管理画面修正対象

| ページ | 修正内容 | 影響度 |
|--------|---------|--------|
| admin/layout.tsx | cookie認証チェック | 中 |
| 新規: admin/login/page.tsx | ログインフォーム | 新規 |
| admin/page.tsx | publish_status/processing_step統計 | 低 |
| admin/videos/page.tsx | ステータス表示変更 | 低 |
| admin/videos/[id]/page.tsx | 2ステータス表示 | 中 |
| admin/videos/[id]/publish/page.tsx | 緩め条件チェック表示 | 中 |
| admin/queue/page.tsx | 「現在はAPI直実行」メッセージ | 低 |

## 新規ファイル

```
src/lib/search.ts                    ← SearchService
src/app/api/search/route.ts          ← 検索API
src/app/api/admin/login/route.ts     ← 認証API
src/app/api/admin/logout/route.ts    ← ログアウトAPI
src/app/admin/login/page.tsx         ← ログイン画面
src/middleware.ts                    ← /admin認証（/admin/login除外）
```

---

## publish条件（緩め版）

```
必須（満たさないと公開不可）:
  ✅ title が存在する
  ✅ transcription (status='done') が存在する

推奨（警告表示、公開は可能）:
  ⚠️ thumbnail_path がある
  ⚠️ ai_contents.summary がある
  ⚠️ ai_contents.article がある

ブロック（公開不可）:
  ❌ processing_step が 'error'
  ❌ processing_step が 'transcribing' or 'generating'（処理中）
```

---

## search abstraction

```typescript
// src/lib/search.ts

interface SearchResult {
  type: 'video' | 'program'
  id: string
  title: string
  description: string
  thumbnailUrl: string
  categoryCode?: string
  matchField: string    // どのフィールドにマッチしたか
}

class SearchService {
  search(query: string): SearchResult[] {
    // 1. DB: videos (title, description) WHERE publish_status='published'
    // 2. DB: ai_contents (summary, article, tags) JOIN videos
    // 3. DB: programs (name, description)
    // 4. 静的データ: data/episodes.ts (フォールバック)
    // 5. 重複除去 + スコアソート
  }
}
```

---

## dynamic回避方針

```typescript
// トップページ
// ❌ export const dynamic = "force-dynamic"
// ✅ export const revalidate = 60  // 60秒キャッシュ

// or ISR的アプローチ
// ✅ unstable_cache で DB クエリをラップ
```

---

## 認証フロー

```
GET /admin/*  (middleware.ts)
  ├── /admin/login → スキップ（認証不要）
  ├── cookie 'admin_session' あり → 通過
  └── cookie なし → /admin/login にリダイレクト

POST /api/admin/login
  body: { password }
  ├── password === process.env.ADMIN_PASSWORD → cookie設定 → 200
  └── 不一致 → 401

POST /api/admin/logout
  └── cookie削除 → 200
```

---

## youtube_metadata分割

```
現状: youtube_metadata TEXT (JSON全体)
  → {title, authorName, thumbnailUrl}

追加カラム:
  youtube_channel TEXT     ← authorName昇格（検索・表示用）
  youtube_duration INTEGER ← 将来、YouTube API v3で取得時に使用

youtube_metadata JSONは残す（フルメタデータ保持用）。
よく参照するフィールドだけ個別カラムに昇格する方針。
```

---

## バージョニング設計（将来用、現時点では未実装）

```
ai_contents.version INTEGER DEFAULT 1

- 再生成時: version をインクリメント
- 過去バージョンは別テーブル or JSON に保持（将来）
- 現時点: 再生成時は上書き（version=1固定）
- 設計書にのみ記載、コード変更はversionカラム追加のみ
```

---

## 実装順序

```
Step 1: DB ALTER + schema.ts + migrate.ts （修正1,2,3,4,5,11,12,14,18）
Step 2: API修正（修正3,6のAPI部分）
Step 3: 管理画面ステータス表示更新（修正3の管理画面部分）
Step 4: publish前チェック（修正6,13）
Step 5: 認証（修正9,16）
Step 6: トップページDB対応（修正7,17）
Step 7: 検索DB対応（修正8,15）
Step 8: job_queue + ドキュメント（修正10,18）
```

---

## 完了条件

- [ ] npm run build が通る
- [ ] ローカル動画アップロードが壊れていない
- [ ] YouTube URL登録が壊れていない
- [ ] 手動transcript登録ができる
- [ ] AI生成フローが壊れていない
- [ ] publish前チェックが効く（必須: title+transcript）
- [ ] published動画がトップページに反映される
- [ ] DB検索が動く
- [ ] /admin が認証なしで開けない
- [ ] /admin/login は認証なしで開ける
