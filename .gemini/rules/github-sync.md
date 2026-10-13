---
description: 檔案修改後自動同步上傳 GitHub
---

# GitHub 自動同步規則

在每次修改、新增或刪除本專案的任何程式碼、樣式或說明文件後，**必須主動且自動**執行以下 Git 操作，將最新進度即時推送到 GitHub：

1. `git add .`
2. `git commit -m "<清楚描述變更內容的語意化提交訊息>"`
3. `git push origin main`

無需等待使用者再次指示，每次調整完成後即刻自動完成提交與推送。
