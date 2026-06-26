@echo off
title Live Classroom - Ngoc Thai Gia Su
color 0A

echo.
echo ========================================
echo   KHOI DONG LOP HOC LIVE
echo ========================================
echo.

:: Kill process cu neu con chay
taskkill /IM mediamtx.exe /F >nul 2>&1
taskkill /IM cloudflared.exe /F >nul 2>&1
timeout /t 1 /nobreak >nul

:: Lay duong dan thu muc tools
set TOOLS=%~dp0

:: Khoi dong MediaMTX (an cua so)
echo [1/2] Khoi dong MediaMTX...
start "" /min "%TOOLS%mediamtx\mediamtx.exe" "%TOOLS%mediamtx\mediamtx.yml"
echo       OK - RTMP :1935, HLS :8888

:: Khoi dong Cloudflare Tunnel (an cua so)
echo [2/2] Khoi dong Cloudflare Tunnel...
start "" /min "%TOOLS%cloudflared.exe" tunnel run
echo       OK - stream.ngocthaigiasu.id.vn

echo.
echo ========================================
echo   DA KHOI DONG THANH CONG!
echo ========================================
echo.
echo Buoc tiep theo:
echo   1. Vao https://www.ngocthaigiasu.id.vn/live
echo   2. Tao buoi hoc -^> bam "Mo lop hoc"
echo   3. Mo Meld Studio, stream voi key "stream"
echo.
echo Dong cua so nay KHONG lam tat stream.
echo Muon tat stream, bam phim bat ky hoac chay StopClassroom.bat
echo.
pause
