# 境界夜話 読書記録バックアップ 実ブラウザー監査

- 実行日時: 2026-07-22T21:44:05.496Z
- 実行環境: chromium-desktop / webkit-mobile
- 対象操作: JSON書き出し・追加復元・置換復元・破損JSON拒否・未知作品ID拒否・復元後画面反映
- Service Worker: 試験中は無効化し、現在の公開資産を直接検証
- テスト結果: passed
- 成功: 11
- 失敗: 0
- スキップ: 1
- 所要時間: 11.2秒

## ケース別結果

| ブラウザー | テスト | 結果 | 時間 |
|---|---|---:|---:|
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 513ms |
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | skipped | 201ms |
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 407ms |
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 423ms |
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1086ms |
| chromium-desktop | chromium-desktop › reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1102ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 1054ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | passed | 471ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 457ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 484ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1164ms |
| webkit-mobile | webkit-mobile › reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1224ms |

## エラー

- なし
