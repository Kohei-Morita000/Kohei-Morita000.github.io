# 境界夜話 公開オフライン・PWA実ブラウザー監査 設定監査

- 実行対象: GitHub Pages公開サイト
- 定期実行: 毎日07:00 JST
- 追加実行: 公開読書監査成功後・関連ファイル変更時・手動
- ブラウザー: Chromium desktop / WebKit mobile
- Service Worker: 実際に許可して登録・制御・Cache Storageを検証
- 通信遮断: Playwright browser contextをofflineへ切り替えて検証
- 対象: 閲覧済み作品・未保存作品・読書記録・manifest・icon
- 再試行: 最大1回
- 実行上限: 20分
- 失敗資料: HTML・trace・screenshot・videoを14日保存
- エラー: 0
- 警告: 0

## エラー

- なし

## 警告

- なし
