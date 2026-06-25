# ============================================================
# Script khởi động hệ thống lớp học live
# Chạy: Right-click → "Run with PowerShell"
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Khoi dong he thong lop hoc live" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── 1. Khởi động MediaMTX ───────────────────────────────
Write-Host "[1/3] Khoi dong MediaMTX (RTMP + HLS)..." -ForegroundColor Yellow
$mediamtxProc = Start-Process -FilePath "$ROOT\mediamtx\mediamtx.exe" `
    -ArgumentList "`"$ROOT\mediamtx\mediamtx.yml`"" `
    -PassThru -WindowStyle Minimized
Write-Host "      MediaMTX PID: $($mediamtxProc.Id)" -ForegroundColor Green
Write-Host "      RTMP: rtmp://localhost:1935/live/{room}" -ForegroundColor Gray
Write-Host "      HLS:  http://localhost:8888/live/{room}/index.m3u8" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 1

# ─── 2. Khởi động LiveKit ────────────────────────────────
Write-Host "[2/3] Khoi dong LiveKit (kiem tra ket noi cloud)..." -ForegroundColor Yellow
# LiveKit Cloud - không cần chạy server local nữa
Write-Host "      LiveKit Cloud: wss://ngocthaigiasu-5ejt8drc.livekit.cloud" -ForegroundColor Green
Write-Host ""

# ─── 3. Khởi động Cloudflare Named Tunnel ────────────────
Write-Host "[3/3] Mo Cloudflare Named Tunnel (stream.ngocthaigiasu.id.vn)..." -ForegroundColor Yellow
$tunnelProc = Start-Process -FilePath "$ROOT\cloudflared.exe" `
    -ArgumentList "tunnel", "run" `
    -PassThru -WindowStyle Minimized
Write-Host "      Tunnel PID: $($tunnelProc.Id)" -ForegroundColor Green
Write-Host "      HLS URL: https://stream.ngocthaigiasu.id.vn" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TAT CA DA KHOI DONG!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "BUOC TIEP THEO DE MO LOP HOC:" -ForegroundColor White
Write-Host ""
Write-Host "1. Vao https://www.ngocthaigiasu.id.vn/live" -ForegroundColor Yellow
Write-Host "2. Tim session -> bam 'Mo lop hoc'" -ForegroundColor Yellow
Write-Host "3. Copy RTMP URL -> paste vao Meld Studio" -ForegroundColor Yellow
Write-Host "4. Bat dau stream tren Meld Studio" -ForegroundColor Yellow
Write-Host ""
Write-Host "Hoc sinh vao /live/{id} la xem duoc ngay!" -ForegroundColor Green
Write-Host ""
Write-Host "Nhan Enter de dong script nay (cac process van chay)..." -ForegroundColor Gray
Read-Host
