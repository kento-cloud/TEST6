# PIVOT AI動画メディアCMS

## セットアップ

```bash
npm install
npm run db:migrate   # DBマイグレーション
npm run db:seed      # サンプルデータ投入
npm run dev          # 開発サーバー起動 (localhost:3000)
```

## 環境変数

`.env.local` に以下を設定（管理画面の設定ページからも登録可能）:

```
OPENAI_API_KEY=sk-...          # Whisper文字起こし + Images API
ANTHROPIC_API_KEY=sk-ant-...   # Claude要約・記事生成
ADMIN_PASSWORD=admin           # 管理画面パスワード
```

## URL

| URL | 内容 |
|-----|------|
| `http://localhost:3000` | フロント（PIVOTクローン） |
| `http://localhost:3000/admin` | 管理画面（パスワード: admin） |
| `http://localhost:3000/admin/settings` | APIキー登録 |

## 開発時の注意

### .nextキャッシュ問題

新しいAPIルートやページを追加した後、ルーティングが正しく動かない場合:

```bash
rm -rf .next
npm run dev
```

Turbopackのキャッシュが古い状態で新ルートを認識しないことがあります。

### revalidateキャッシュ

トップページは `revalidate=60` でISRキャッシュしています。
動画の公開/非公開後、最大60秒は反映が遅れます。

## npmスクリプト

```bash
npm run dev          # 開発サーバー
npm run build        # プロダクションビルド
npm run db:migrate   # DBマイグレーション
npm run db:seed      # サンプルデータ投入
npm run db:studio    # Drizzle Studio（DB GUI）
```

## 前提条件

- Node.js 20+
- ffmpeg（動画処理用: `brew install ffmpeg`）
