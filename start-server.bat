@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 설담화 서버를 켭니다. 이 창을 닫으면 서버가 꺼져요.
start "" http://localhost:5500/admin-index.html
python server.py %*
pause
