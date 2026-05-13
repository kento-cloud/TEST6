# セキュリティ堅牢化 — 影響範囲・修正計画

## 修正1: API認証

**対象**: 18 API routeのうち、管理系を認証必須にする

| API | 現状 | 修正後 |
|-----|------|--------|
| POST /api/admin/login | 不要 | 不要（維持） |
| POST /api/admin/logout | 不要 | 不要（維持） |
| GET/PUT /api/admin/settings | 不要 | **認証必須** |
| GET /api/admin/settings/ffmpeg | 不要 | **認証必須** |
| GET /api/search | 不要 | 不要（公開API） |
| GET /api/programs | 不要 | 不要（公開API） |
| POST /api/programs | 不要 | **認証必須** |
| GET /api/programs/[id] | 不要 | 不要（公開API） |
| PUT /api/programs/[id] | 不要 | **認証必須** |
| GET /api/videos | 不要 | 不要（公開API） |
| POST /api/videos | 不要 | **認証必須** |
| POST /api/videos/import-youtube | 不要 | **認証必須** |
| GET /api/videos/[id] | 不要 | 不要（公開API） |
| DELETE /api/videos/[id] | 不要 | **認証必須** |
| POST /api/videos/[id]/transcribe | 不要 | **認証必須** |
| POST /api/videos/[id]/generate | 不要 | **認証必須** |
| POST /api/videos/[id]/publish | 不要 | **認証必須** |
| GET /api/videos/[id]/publish-info | 不要 | **認証必須** |
| POST /api/videos/[id]/reset | 不要 | **認証必須** |
| GET /api/videos/[id]/thumbnails | 不要 | 不要（公開API） |
| POST /api/videos/[id]/thumbnails | 不要 | **認証必須** |
| POST /api/videos/[id]/thumbnails/generate | 不要 | **認証必須** |
| PUT /api/videos/[id]/thumbnails/[thumbId] | 不要 | **認証必須** |
| DELETE /api/videos/[id]/thumbnails/[thumbId] | 不要 | **認証必須** |

**実装方法**: middleware.tsを拡張してAPIも対象にする。または共通ヘルパー`requireAuth()`を作成。

→ **middleware拡張方式を採用**。mutation系(POST/PUT/DELETE)をmatcherに追加。

## 修正2: file_path nullable migration

SQLite RENAME TABLE方式で新テーブル作成→データコピー→旧テーブル削除→新テーブルrename

**影響ファイル**: src/db/migrate.ts のみ

## 修正3: status二重管理整理

**対象**: status カラムを参照している全箇所

書き込み: 既にdual-write → 新カラムのみに変更
読み取り: publish_status / processing_step のみ使用

## 修正4: AI処理の失敗耐性

**対象**: transcribe, generate, thumbnails/generate の3 API

確認項目:
- 開始時 processing_step 更新 → 既に実装済み
- 成功時 none → 既に実装済み
- 失敗時 error → 既に実装済み
- error_message保存 → transcriptions/ai_contentsに保存済み
- 再実行 → 既存レコードを削除して再作成
- reset → 既に実装済み

→ **概ね実装済み。thumbnails/generateのprocessing_step連動のみ追加。**

## 修正5: publish前チェック

**対象**: /api/videos/[id]/publish/route.ts

現状: title + transcript必須。summary/articleは警告。
追加: thumbnail必須。processing_step!='error'チェック。

## 修正6: settings安全性

**対象**: /api/admin/settings/route.ts

追加:
- 書き込み前に.env.local.bak作成
- 空文字で上書きしない（既にスキップ実装）
- try-catchでエラー時復旧

## 修正7: 削除処理安全性

**対象**: /api/videos/[id]/route.ts DELETE

確認: カスケード削除実装済み。ファイル削除はtry-catchで失敗無視。
追加: ログ出力、thumbnailsのファイルも削除。
