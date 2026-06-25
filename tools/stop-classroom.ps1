# Dừng tất cả services
Write-Host "Dang dung tat ca services..." -ForegroundColor Yellow

Get-Process -Name "livekit-server" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "mediamtx" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Da dung xong." -ForegroundColor Green
