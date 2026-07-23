# 境界夜話 公開サイト実ブラウザー定期監査 設定監査

- 実行対象: GitHub Pages公開サイト
- 定期実行: 毎日06:30 JST
- 追加実行: 主要読書ワークフロー完了後・設定変更時・手動
- ブラウザー: Chromium desktop / WebKit mobile
- 操作対象: トップ/シリーズ検索・読了/保存絞り込み・個別化入口・読書記録検索/状態管理/途中再開・読了切替・あとで読む・途中位置保存/再開・自動読了・次の未読・JSON書き出し/追加復元/置換復元・不正JSON拒否・画面反映
- 再試行: 最大2回
- 実行上限: 30分
- 失敗資料: HTML・trace・screenshot・videoを14日保存
- 障害通知: 初回失敗でIssue作成、連続失敗は追記、復旧時に自動クローズ
- 重複防止: 固定タイトル・専用ラベル・本文マーカー
- エラー: 8
- 警告: 0

## エラー

- 障害Issue管理権限がありません
- 障害Issueライフサイクル試験がありません
- GitHub Issue操作がありません
- 障害Issue管理処理がありません
- 監査失敗判定の受け渡しがありません
- 監査成果物がありません: reports/public-audit-incident-audit.md
- 読書導線監査の変更監視がありません: scripts/public-audit-incident.mjs
- 読書導線監査の変更監視がありません: scripts/test-public-audit-incident.mjs

## 警告

- なし
