# install-services.ps1 — Cài MediaMTX + Cloudflare Tunnel thành Windows Service
# Yêu cầu: chạy với quyền Administrator
# Download nssm: https://nssm.cc/download — giải nén, copy nssm.exe vào tools/

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
$TOOLS = $PSScriptRoot

# Kiểm tra nssm
$nssm = "$TOOLS\nssm.exe"
if (-not (Test-Path $nssm)) {
    Write-Host "Chua tim thay nssm.exe trong $TOOLS" -ForegroundColor Red
    Write-Host "Download tai: https://nssm.cc/download" -ForegroundColor Yellow
    Write-Host "Copy nssm.exe (win64) vao thu muc tools/" -ForegroundColor Yellow
    exit 1
}

# ─── MediaMTX Service ─────────────────────────────────────
$mtxName = "MediaMTX-Live"
$mtxExe = "$TOOLS\mediamtx\mediamtx.exe"
$mtxConf = "$TOOLS\mediamtx\mediamtx.yml"

if (-not (Test-Path $mtxExe)) {
    Write-Host "Khong tim thay $mtxExe" -ForegroundColor Red
    exit 1
}

Write-Host "Cai dat service: $mtxName" -ForegroundColor Cyan
& $nssm install $mtxName $mtxExe $mtxConf
& $nssm set $mtxName DisplayName "MediaMTX Live Classroom"
& $nssm set $mtxName Description "RTMP->HLS server cho lop hoc truc tuyen"
& $nssm set $mtxName Start SERVICE_AUTO_START
& $nssm set $mtxName AppStdout "$TOOLS\mediamtx\stdout.log"
& $nssm set $mtxName AppStderr "$TOOLS\mediamtx\stderr.log"
& $nssm set $mtxName AppRotateFiles 1
& $nssm set $mtxName AppRotateBytes 1048576

# ─── Cloudflare Tunnel Service ─────────────────────────────
$cfName = "Cloudflare-Tunnel-Live"
$cfExe = "$TOOLS\cloudflared.exe"

Write-Host "Cai dat service: $cfName" -ForegroundColor Cyan
& $nssm install $cfName $cfExe "tunnel run"
& $nssm set $cfName DisplayName "Cloudflare Tunnel (stream.ngocthaigiasu.id.vn)"
& $nssm set $cfName Description "Named tunnel cho HLS stream qua Cloudflare"
& $nssm set $cfName Start SERVICE_AUTO_START
& $nssm set $cfName AppStdout "$TOOLS\cloudflare-stdout.log"
& $nssm set $cfName AppStderr "$TOOLS\cloudflare-stderr.log"
& $nssm set $cfName AppRotateFiles 1
& $nssm set $cfName AppRotateBytes 1048576

# ─── Khởi động ─────────────────────────────────────────────
Write-Host ""
Write-Host "Khoi dong services..." -ForegroundColor Green
& $nssm start $mtxName
& $nssm start $cfName

Write-Host ""
Write-Host "Da cai dat thanh cong!" -ForegroundColor Green
Write-Host "  - $mtxName : RTMP :1935, HLS :8888"
Write-Host "  - $cfName : stream.ngocthaigiasu.id.vn"
Write-Host ""
Write-Host "Quan ly: services.msc hoac 'nssm status <ten>'" -ForegroundColor Yellow
Write-Host "Go bo:   nssm remove <ten> confirm" -ForegroundColor Yellow
