# 境界夜話 公開監査障害Issue通知 設定監査

- 監視対象: Public Reading Browser Audit
- 障害判定: failure・cancelled・timed_out・skipped等の非success
- 通知方法: GitHub Issueを1件だけ作成し、連続失敗は同じIssueへ追記
- 復旧処理: 次回success時に復旧コメントを追加して自動クローズ
- 実行制限: 同一リポジトリ・mainブランチのみ
- ラベル: site-monitoring（未作成なら自動作成）
- 外部送信: なし
- エラー: 0
- 警告: 0

## エラー

- なし

## 警告

- なし
