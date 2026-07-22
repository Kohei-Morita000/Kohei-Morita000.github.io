# 境界夜話 読書記録バックアップ 実ブラウザー監査

- 実行日時: 2026-07-22T22:00:51.738Z
- 実行対象: ローカル生成サイト
- 実行環境: unknown
- 対象操作: JSON書き出し・追加復元・置換復元・破損JSON拒否・未知作品ID拒否・復元後画面反映
- Service Worker: 試験中は無効化し、現在配信中のHTML・JavaScriptを直接検証
- テスト結果: passed
- 成功: 11
- 失敗: 0
- スキップ: 1
- 所要時間: 20.8秒

## ケース別結果

| ブラウザー | テスト | 結果 | 時間 |
|---|---|---:|---:|
| unknown | chromium-desktop › reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 688ms |
| unknown | chromium-desktop › reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | skipped | 266ms |
| unknown | chromium-desktop › reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 547ms |
| unknown | chromium-desktop › reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 557ms |
| unknown | chromium-desktop › reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1295ms |
| unknown | chromium-desktop › reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1311ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 7439ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | passed | 653ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 657ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 650ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1394ms |
| unknown | webkit-mobile › reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1734ms |

## エラー

- なし
