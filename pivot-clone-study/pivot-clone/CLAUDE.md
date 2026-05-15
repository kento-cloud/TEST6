@AGENTS.md

# PIVOT Clone - 完全再現プロジェクト

## 目的

https://pivotmedia.co.jp/ と見た目・動作・構造が完全に同一のサイトを Next.js で新規構築する。
ミラーリング（本家HTML保存）ではなく、本家の構造を理解した上でゼロから再実装する。

## 技術スタック

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: @iconify/react (Material Icons, Material Symbols)
- **Carousel**: Swiper 12
- **Video**: Uliza HTML5 Player (外部スクリプト埋め込み)
- **Font**: Noto Sans JP (system fallback)
- **Package Manager**: npm

## 本家サイト構造

### ページ一覧（全ルート）

| ルート | 説明 | 優先度 |
|--------|------|--------|
| `/` | トップページ（メイン動画 + カテゴリタブ + セクション群） | P0 |
| `/category?category_code=xxx` | カテゴリ別一覧（business, money, career, life, technology, global） | P0 |
| `/movie/[episodeId]` | 動画詳細・再生ページ | P0 |
| `/program/[id]` | 番組詳細（エピソード一覧） | P1 |
| `/program/list` | 番組一覧 | P1 |
| `/playlist/[playlistId]` | プレイリスト詳細 | P1 |
| `/playlist/staff/recommend` | スタッフおすすめプレイリスト | P1 |
| `/search` | 検索ページ | P2 |
| `/new_arrival/episode` | 新着エピソード一覧 | P2 |
| `/mylist` | マイリスト | P2 |
| `/action` | アクション/ミッション | P2 |
| `/account` | アカウント設定 | P3 |
| `/ranking/overall` | ランキング詳細 | P2 |

### レイアウト構造

```
┌──────────────────────────────────────────────┐
│ [Sidebar 72px]  [Main Content Area]          │
│                                              │
│  PIVOTロゴ       ┌─ Header (88px) ──────────┐│
│  ホーム          │ タブ: トップ|ビジネス|... ││
│  さがす          │         ログイン|会員登録 ││
│  アクション      └──────────────────────────┘│
│  マイリスト      ┌─ Featured Video ─────────┐│
│  アカウント      │ Uliza Player + 番組情報   ││
│                  └──────────────────────────┘│
│                  ┌─ Program Banners ────────┐│
│                  │ 横スクロール番組アイコン   ││
│                  └──────────────────────────┘│
│                  ┌─ Content Sections ───────┐│
│                  │ 新着 / ランキング / etc.  ││
│                  └──────────────────────────┘│
└──────────────────────────────────────────────┘
```

SP (390px以下):
- サイドバー → 画面下部の BottomNavigation に変化
- Header タブは横スクロール
- カードは2列表示

### デザイントークン

```
背景グラデーション: linear-gradient(135deg, #3d084a, #092638)
                    background-size: 200% 200%
                    animation: pivotgradient 10s ease infinite

色:
  --neutral-dark:       #0e1226  (最暗背景)
  --neutral-night:      #1d2030  (サイドバー背景)
  --neutral-mid:        #303240  (カード背景)
  --neutral-border:     #606370  (ボーダー)
  --neutral-pale:       #a9abb8  (非アクティブテキスト)
  --neutral-bright:     #ffffff  (メインテキスト)
  --neutral-subtext:    #999999  (サブテキスト)
  --accent-purple:      #cd1cfa  (PIVOTパープル)
  --accent-blue:        #1e82be  (PIVOTブルー)
  --brand-gradient:     linear-gradient(90deg, #cd1cfa, #1e82be)
  --card-bg:            rgba(14, 18, 38, 0.5)

フォント: Noto Sans JP
  - Regular 400
  - Medium 500
  - Bold 700

間隔:
  - セクション間: 40px (PC), 24px (SP)
  - カード間: 10px
  - サイドバー幅: 72px (PC), 非表示 (SP)
  - ヘッダー高さ: 88px
  - BottomNav高さ: 60px (SP)
```

### PIVOTロゴ

本家ロゴは SVG で以下の形状:
- "PIVOT" のテキスト
- P: パープル (#cd1cfa)
- I: パープル
- V: パープルからブルーへのグラデーション
- O: ブルー (#1e82be)
- T: ブルー
- フォント: カスタム（太字サンセリフ）
- サイドバーでは小さいアイコン版（22x25px）を使用

### コンポーネント一覧

| コンポーネント | ファイル | 説明 |
|---------------|---------|------|
| Sidebar | `components/Sidebar.tsx` | 左サイドバー (PC) / BottomNav (SP) |
| HeaderTabs | `components/HeaderTabs.tsx` | カテゴリタブバー |
| FeaturedVideo | `components/FeaturedVideo.tsx` | メイン動画プレーヤー + 番組情報 |
| ProgramBannerList | `components/ProgramBannerList.tsx` | 番組バナー横スクロール |
| EpisodeCard | `components/EpisodeCard.tsx` | エピソードカード（サムネ+タイトル+メタ） |
| EpisodeSection | `components/EpisodeSection.tsx` | エピソード一覧セクション（Swiper） |
| RankingSection | `components/RankingSection.tsx` | ランキングセクション（タブ切替） |
| ProgramGrid | `components/ProgramGrid.tsx` | 番組一覧グリッド |
| PlaylistSection | `components/PlaylistSection.tsx` | プレイリストセクション |
| SectionHeader | `components/SectionHeader.tsx` | セクションタイトル + すべて表示リンク |
| VideoPlayer | `components/VideoPlayer.tsx` | Uliza動画プレーヤー |
| CategoryPage | `app/category/page.tsx` | カテゴリ別ページ |
| MoviePage | `app/movie/[episodeId]/page.tsx` | 動画詳細ページ |

### エピソードカード構造

```
┌─────────────────────┐
│ [サムネイル画像]     │  aspect-ratio: 16/9 (1029/540)
│              15:32  │  右下: 再生時間バッジ
├─────────────────────┤
│ タイトル（2行max）   │  font-size: 14px, bold
│ 1.4万回視聴 · 3か月前│  font-size: 12px, #999
│ □0  ★4.5           │  コメント数 + 評価
└─────────────────────┘
カード幅: calc(25% - 7.5px) (PC), calc(50% - 5px) (SP)
角丸: 0.5vw (PC), 1vw (SP)
```

### ランキングカード構造

```
┌─────────────────────┐
│ 1 [サムネイル画像]   │  左上に大きなランク番号
│              15:32  │
├─────────────────────┤
│ タイトル             │
│ メタ情報             │
└─────────────────────┘
ランク番号: 64px bold, 影付き
上位3位: ゴールド(1), シルバー(2), ブロンズ(3)
```

## データソース

本家APIレスポンスは `/Users/kazumaogata/TEST5/mirror-tool/output/api-responses/` に347件保存済み。
これらをJSON化して `src/data/` に配置し、静的データとして使用する。

### 主要データ

- `/api/v1/web/home` → トップページのフィーチャード動画、セクション構成
- `/api/v1/chapter/movie/new_arrival` → 新着エピソード
- `/api/v1/chapter/movie/ranking` → ランキング
- `/connect/content/.../ListPrograms` → 番組一覧
- `/connect/content/.../ListStaffPlaylists` → スタッフプレイリスト
- `/connect/content/.../BatchGetEpisodeMetrics` → 視聴数・評価

### 画像

本家画像は以下から取得済み:
- `mirror-tool/output/assets/images/` — 番組サムネイル、OGP画像
- `pivot-clone-study/pivotmedia.co.jp/images/` — 追加画像

画像パスの形式:
- サムネイル: `/images/static/converted/chapter/{id}/ogp/{id}.webp`
- 番組ロゴ: `/images/programs/thumbnail_vertical/{hash}.png`
- 番組メインロゴ: `/images/programs/logo_main/{hash}.svg`

## 開発ルール

### ファイル構成

```
src/
  app/
    layout.tsx              # ルートレイアウト（Sidebar含む）
    page.tsx                # トップページ
    category/page.tsx       # カテゴリページ
    movie/[episodeId]/page.tsx  # 動画詳細
    program/[id]/page.tsx   # 番組詳細
    program/list/page.tsx   # 番組一覧
    playlist/[playlistId]/page.tsx
    search/page.tsx
    globals.css
  components/               # 共通コンポーネント
  data/                     # 静的JSONデータ
  types/                    # 型定義
  lib/                      # ユーティリティ
public/
  images/                   # 画像アセット
  favicon/                  # ファビコン
```

### コーディング規約

- Tailwind CSS のユーティリティクラスを使用（本家は `tw-` プレフィックス付きだが、クローンでは標準Tailwindを使用）
- コンポーネントは `"use client"` を必要な場合のみ付与
- データは `src/data/` にJSON配置、import で読み込み
- 型定義は `src/types/` に集約
- 画像は `public/images/` に配置、`<Image>` コンポーネントで表示
- レスポンシブは `md:` ブレークポイント（768px）で PC/SP 切替
- アニメーション付きグラデーション背景は `animate-gradient` クラス

### 本家との一致確認

各コンポーネント実装後、以下を確認:
1. PC (1440px) でのレイアウトが本家スクリーンショットと一致
2. SP (390px) でのレイアウトが本家と一致
3. hover/active 状態の色・アニメーション
4. Swiper カルーセルの挙動（ドラッグ、ナビゲーション矢印）
5. フォントサイズ・ウェイト・行間

### 参照ファイル

- 本家PC スクリーンショット: `mirror-tool/output/screenshots/live-pc.png`
- 本家SP スクリーンショット: `mirror-tool/output/screenshots/live-sp.png`
- 本家HTML (raw): `mirror-tool/output/raw-rendered.html`
- 本家CSS: `mirror-tool/output/assets/_next/static/css/*.css`
- APIレスポンス: `mirror-tool/output/api-responses/`
- APIマニフェスト: `mirror-tool/output/api-manifest.json`

## コマンド

```bash
npm run dev    # 開発サーバー起動 (localhost:3000)
npm run build  # プロダクションビルド
npm run lint   # ESLint実行
```
