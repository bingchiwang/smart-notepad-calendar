@echo off
chcp 65001 >nul
echo 正在同步變更至 GitHub...
git add .
set /p commit_msg="請輸入提交訊息 (直接按 Enter 則預設為 Update): "
if "%commit_msg%"=="" set commit_msg=Update: 更新檔案內容
git commit -m "%commit_msg%"
git push origin main
echo 同步完成！
pause
