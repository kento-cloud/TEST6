# CLAUDE.md

## 現在のフェーズ

**バックエンド構築フェーズ**

フロントエンドUI（PIVOT級再現）は完成済み。
現在は、AI動画メディアCMSとして実際に動作するバックエンドを構築するフェーズである。

## プロジェクト構造

```
フロント: src/app/(front)/     — PIVOTクローンUI（完成済み、触らない）
管理画面: src/app/admin/        — CMS管理画面（完成済み、必要時のみ拡張）
API:     src/app/api/           — バックエンドAPI（構築中）
DB:      src/db/                — SQLite + Drizzle ORM
AI:      src/lib/ai/            — Whisper / Claude / Images API
データ:  src/lib/data-source.ts — 全データ取得の集約層（★バックエンドの中核）
認証:    src/contexts/AuthContext.tsx — Supabase Auth（ユーザー認証）
```

## 最重要ルール

### 1. フロントUIを壊さない

フロントのUI品質は既に本家PIVOTに近い水準で完成している。
バックエンド構築時に以下を絶対に壊さない。

- コンポーネントのレイアウト・スタイル
- レスポンシブ挙動（PC/SP）
- ヘッダー・サイドバー・BottomNav
- フィーチャードスライダー
- カードのホバー・アニメーション
- セクション間の余白・フォントサイズ

### 2. data-source.ts を中核にする

全データ取得は `src/lib/data-source.ts` に集約されている。
バックエンドDB化する際は、**このファイルの関数内部だけを変更する**。

```
getPublishedEpisodes()  → DB公開動画
getAllEpisodes()         → 全エピソード
getRankings()           → ランキング
getFeaturedItems()      → フィーチャード
getCategoryEpisodes()   → カテゴリ別新着
getCategoryFeatured()   → カテゴリ別フィーチャード
getPlaylists()          → プレイリスト
getPrograms()           → 番組一覧
getVideoDetail()        → 動画詳細+AI生成コンテンツ
searchEpisodes()        → 全文検索（スタブ、将来DB対応）
getUserPlaylists()      → マイリスト（スタブ、将来ユーザー認証連携）
```

コンポーネントは全てpropsでデータを受け取る。
コンポーネントからdata/*.tsを直接importすることは禁止。

### 3. 型を壊さない

`Episode.id` は `string` 型。DB動画のULIDもそのまま使える。
型定義は `src/types/index.ts` と `src/types/admin.ts` に集約。
型を変更する場合は影響範囲を必ず確認する。

### 4. 認証の分離を維持する

**ユーザー認証（Supabase Auth）:**
- `src/contexts/AuthContext.tsx` — AuthProvider + useAuth フック
- `src/lib/supabase.ts` の `createBrowserClient()` を使用（anon key）
- sign_up / sign_in ページで `supabase.auth.signUp()` / `signInWithPassword()`
- HeaderTabs: ログイン状態でボタン切替（ログイン/会員登録 ⇔ アカウント名）
- AuthGate: 未ログイン時にコンテンツをブロックし、ログイン誘導を表示
- 動画詳細ページ: サムネイル+タイトルは全員表示、フルコンテンツはログイン必須

**管理者認証（パスワード + Cookie）:**
- 管理系API（POST/PUT/DELETE）は `requireAdmin()` で認証必須
- 公開API（GET /api/videos, GET /api/search等）は認証不要
- `/admin-login` でパスワード認証 → `admin_session` Cookie 設定
- この分離を壊さない

### 5. publish_status / processing_step を使う

旧 `status` カラムは @deprecated。
読み書きは `publishStatus` と `processingStep` のみ使用する。

### 6. テスト後にコミット

変更後は必ず以下を確認してからコミットする。

```bash
npx tsc --noEmit    # 型チェック
npm run build       # ビルド
# ブラウザで / と /admin を確認
```

## DB設計

9テーブル: videos, programs, transcriptions, ai_contents, thumbnails, thumbnail_style_presets, ai_generation_logs, job_queue, metrics

テーブル間リレーション:
```
videos (1) → (0..1) transcriptions
videos (1) → (0..1) ai_contents
videos (1) → (0..N) thumbnails
videos (1) → (0..1) metrics
videos (1) → (0..N) ai_generation_logs
videos (N) → (0..1) programs
```

FOREIGN KEY制約はSQLiteレベルではなし。アプリケーション層で管理。
DELETE時はカスケード削除を実装済み。

## AIパイプライン

```
動画アップロード or YouTube URL登録
  → 文字起こし（Whisper or 手動入力）
  → AI生成（Claude: 要約/チャプター/記事/タグ — 個別再生成可能）
  → サムネイル生成（gpt-image-1 — 手動アップロードも可能）
  → 公開チェック（title + transcript + thumbnail 必須）
  → 公開 → フロント反映
```

pipeline.ts で個別生成関数に分離済み。タイムアウト120秒。ログ記録。
AI API未接続時はモックフォールバックでステータス遷移を模擬。

## 環境変数

```
ADMIN_PASSWORD              — 管理画面ログイン (デフォルト: admin)
OPENAI_API_KEY              — Whisper + Images API
ANTHROPIC_API_KEY           — Claude
NEXT_PUBLIC_SUPABASE_URL    — Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY   — Supabase Service Role Key
```

## 禁止事項

- フロントUIの見た目を変更する
- コンポーネントにdata/*.tsのimportを追加する
- Episode.idをnumberに戻す
- requireAdmin()を削除する
- publish_statusではなく旧statusを使う
- SELECT * でデータコピーする（カラム順ずれの原因）
- .nextキャッシュを消さずに新ルートを追加する
- AuthGateを経由せずにコンテンツを直接表示する（動画詳細等）

## コマンド

```bash
npm run dev          # 開発サーバー (localhost:3000)
npm run build        # ビルド
npm run db:migrate   # DBマイグレーション
npm run db:seed      # サンプルデータ投入
npm run db:studio    # Drizzle Studio
```
