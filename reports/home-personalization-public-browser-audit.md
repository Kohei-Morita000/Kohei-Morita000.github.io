# 境界夜話 公開サイト読書機能 実ブラウザー監査

- 実行日時: 2026-07-23T04:10:51.509Z
- 実行対象: https://allsunday1122.github.io/kyokai-yawa/
- 実行環境: chromium-desktop / webkit-mobile
- 対象操作: トップ/シリーズ検索・読了/保存絞り込み・個別化入口・読書記録検索/状態管理/途中再開・読了切替・あとで読む・途中位置保存/再開・自動読了・次の未読・JSON書き出し/追加復元/置換復元・不正JSON拒否・運用状況4監査表示・54ページ導線・画面反映
- Service Worker: 試験中は無効化し、現在配信中のHTML・JavaScriptを直接検証
- テスト結果: passed
- 成功: 4
- 失敗: 0
- スキップ: 0
- 所要時間: 12.6秒

## ケース別結果

| ブラウザー | テスト | 結果 | 時間 |
|---|---|---:|---:|
| chromium-desktop | reading-discovery.spec.mjs › 再訪履歴から続き・最近・保存・未読おすすめを分類JSONなしでも重複なく表示する | passed | 1017ms |
| chromium-desktop | reading-discovery.spec.mjs › 履歴がない初回訪問では個別化欄と続きナビを表示しない | passed | 644ms |
| webkit-mobile | reading-discovery.spec.mjs › 再訪履歴から続き・最近・保存・未読おすすめを分類JSONなしでも重複なく表示する | passed | 6916ms |
| webkit-mobile | reading-discovery.spec.mjs › 履歴がない初回訪問では個別化欄と続きナビを表示しない | passed | 1090ms |

## エラー

- なし
