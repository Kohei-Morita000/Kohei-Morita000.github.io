# 境界夜話 読書機能 実ブラウザー監査

- 実行日時: 2026-07-22T23:37:34.086Z
- 実行対象: ローカル生成サイト
- 実行環境: chromium-desktop / webkit-mobile
- 対象操作: 読了切替・あとで読む・途中位置保存/再開・自動読了・次の未読・JSON書き出し/追加復元/置換復元・不正JSON拒否・画面反映
- Service Worker: 試験中は無効化し、現在配信中のHTML・JavaScriptを直接検証
- テスト結果: failed
- 成功: 34
- 失敗: 9
- スキップ: 1
- 所要時間: 593.2秒

## ケース別結果

| ブラウザー | テスト | 結果 | 時間 |
|---|---|---:|---:|
| chromium-desktop | offline-pwa.spec.mjs › manifestとアプリアイコンが公開されている | passed | 284ms |
| chromium-desktop | offline-pwa.spec.mjs › Service Workerが登録され、PWA共通資産を事前保存する | timedOut（再試行1） | 32413ms |
| chromium-desktop | offline-pwa.spec.mjs › 一度開いた作品を通信遮断後も本文付きで再読できる | timedOut（再試行1） | 32223ms |
| chromium-desktop | offline-pwa.spec.mjs › 未保存の作品は通信遮断時にオフライン案内を表示する | timedOut（再試行1） | 32111ms |
| chromium-desktop | offline-pwa.spec.mjs › 読書記録ページを未訪問でもオフラインで開ける | timedOut（再試行1） | 32351ms |
| chromium-desktop | reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 700ms |
| chromium-desktop | reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | skipped | 257ms |
| chromium-desktop | reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 521ms |
| chromium-desktop | reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 516ms |
| chromium-desktop | reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1240ms |
| chromium-desktop | reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1286ms |
| chromium-desktop | reading-state.spec.mjs › 作品ページの読了とあとで読むを切り替え、読書記録へ即時反映する | passed | 1209ms |
| chromium-desktop | reading-state.spec.mjs › 本文末尾で自動読了し、途中位置を削除して次の未読作品へ進める | passed | 1960ms |
| chromium-desktop | reading-state.spec.mjs › 途中位置を保存し、ボタンとresume=1の両方から再開する | passed | 1222ms |
| chromium-desktop | site-health.spec.mjs › トップのアクセシビリティと実行時品質 | passed | 4330ms |
| chromium-desktop | site-health.spec.mjs › 単独作品のアクセシビリティと実行時品質 | passed | 2087ms |
| chromium-desktop | site-health.spec.mjs › 境界観測記のアクセシビリティと実行時品質 | passed | 2128ms |
| chromium-desktop | site-health.spec.mjs › 榊怪異相談所のアクセシビリティと実行時品質 | passed | 2059ms |
| chromium-desktop | site-health.spec.mjs › 真壁夜話のアクセシビリティと実行時品質 | passed | 2157ms |
| chromium-desktop | site-health.spec.mjs › 読書記録のアクセシビリティと実行時品質 | passed | 3008ms |
| chromium-desktop | site-health.spec.mjs › 連作作品のアクセシビリティと実行時品質 | passed | 2133ms |
| chromium-desktop | site-health.spec.mjs › 黒瀬蒐集録のアクセシビリティと実行時品質 | passed | 2158ms |
| webkit-mobile | offline-pwa.spec.mjs › manifestとアプリアイコンが公開されている | passed | 443ms |
| webkit-mobile | offline-pwa.spec.mjs › Service Workerが登録され、PWA共通資産を事前保存する | timedOut（再試行1） | 31367ms |
| webkit-mobile | offline-pwa.spec.mjs › 一度開いた作品を通信遮断後も本文付きで再読できる | timedOut（再試行1） | 31313ms |
| webkit-mobile | offline-pwa.spec.mjs › 未保存の作品は通信遮断時にオフライン案内を表示する | timedOut（再試行1） | 31448ms |
| webkit-mobile | offline-pwa.spec.mjs › 読書記録ページを未訪問でもオフラインで開ける | timedOut（再試行1） | 31450ms |
| webkit-mobile | reading-backup.spec.mjs › JSON書き出しに読了・履歴・保存・途中位置・文字サイズを収録する | passed | 769ms |
| webkit-mobile | reading-backup.spec.mjs › モバイル幅でバックアップ操作が横にはみ出さずタップできる | passed | 618ms |
| webkit-mobile | reading-backup.spec.mjs › 壊れたJSONを拒否し、現在の記録を変更しない | passed | 639ms |
| webkit-mobile | reading-backup.spec.mjs › 未知の作品IDを含むJSONを拒否し、復元確認を表示しない | passed | 636ms |
| webkit-mobile | reading-backup.spec.mjs › 置換復元で旧記録と旧途中位置を消し、バックアップ状態だけを表示する | passed | 1382ms |
| webkit-mobile | reading-backup.spec.mjs › 追加復元で現在記録を残し、より進んだ途中位置と画面件数を反映する | passed | 1513ms |
| webkit-mobile | reading-state.spec.mjs › 作品ページの読了とあとで読むを切り替え、読書記録へ即時反映する | passed | 2157ms |
| webkit-mobile | reading-state.spec.mjs › 本文末尾で自動読了し、途中位置を削除して次の未読作品へ進める | passed | 1154ms |
| webkit-mobile | reading-state.spec.mjs › 途中位置を保存し、ボタンとresume=1の両方から再開する | passed | 1476ms |
| webkit-mobile | site-health.spec.mjs › トップのアクセシビリティと実行時品質 | failed（再試行1） | 4485ms |
| webkit-mobile | site-health.spec.mjs › 単独作品のアクセシビリティと実行時品質 | passed | 2225ms |
| webkit-mobile | site-health.spec.mjs › 境界観測記のアクセシビリティと実行時品質 | passed | 2369ms |
| webkit-mobile | site-health.spec.mjs › 榊怪異相談所のアクセシビリティと実行時品質 | passed | 2398ms |
| webkit-mobile | site-health.spec.mjs › 真壁夜話のアクセシビリティと実行時品質 | passed | 2459ms |
| webkit-mobile | site-health.spec.mjs › 読書記録のアクセシビリティと実行時品質 | passed | 2946ms |
| webkit-mobile | site-health.spec.mjs › 連作作品のアクセシビリティと実行時品質 | passed | 2299ms |
| webkit-mobile | site-health.spec.mjs › 黒瀬蒐集録のアクセシビリティと実行時品質 | passed | 2403ms |

## エラー

- chromium-desktop / offline-pwa.spec.mjs › Service Workerが登録され、PWA共通資産を事前保存する: [31mTest timeout of 30000ms exceeded.[39m
- chromium-desktop / offline-pwa.spec.mjs › 一度開いた作品を通信遮断後も本文付きで再読できる: [31mTest timeout of 30000ms exceeded.[39m
- chromium-desktop / offline-pwa.spec.mjs › 未保存の作品は通信遮断時にオフライン案内を表示する: [31mTest timeout of 30000ms exceeded.[39m
- chromium-desktop / offline-pwa.spec.mjs › 読書記録ページを未訪問でもオフラインで開ける: [31mTest timeout of 30000ms exceeded.[39m
- webkit-mobile / offline-pwa.spec.mjs › Service Workerが登録され、PWA共通資産を事前保存する: [31mTest timeout of 30000ms exceeded.[39m
- webkit-mobile / offline-pwa.spec.mjs › 一度開いた作品を通信遮断後も本文付きで再読できる: [31mTest timeout of 30000ms exceeded.[39m
- webkit-mobile / offline-pwa.spec.mjs › 未保存の作品は通信遮断時にオフライン案内を表示する: [31mTest timeout of 30000ms exceeded.[39m
- webkit-mobile / offline-pwa.spec.mjs › 読書記録ページを未訪問でもオフラインで開ける: [31mTest timeout of 30000ms exceeded.[39m
- webkit-mobile / site-health.spec.mjs › トップのアクセシビリティと実行時品質: Error: トップで品質問題を1件検出しました。
