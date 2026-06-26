@echo off
echo Dang tat MediaMTX va Cloudflare Tunnel...
taskkill /IM mediamtx.exe /F >nul 2>&1
taskkill /IM cloudflared.exe /F >nul 2>&1
echo Da tat thanh cong.
timeout /t 2
