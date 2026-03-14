# VIGIL - One-command startup (Windows PowerShell)
# Usage: .\start.ps1
# Starts backend (port 8000) and frontend (port 3000) in separate windows.

$root = $PSScriptRoot

# ── 1. Check .env ─────────────────────────────────────────────────────────────
if (-not (Test-Path "$root\.env")) {
    Write-Host ""
    Write-Host "  [VIGIL] .env not found — copying from .env.example" -ForegroundColor Yellow
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "  [VIGIL] Edit .env with your API keys (demo mode works without them)" -ForegroundColor Cyan
    Write-Host ""
}

# ── 2. Python venv ─────────────────────────────────────────────────────────────
$venvActivate = "$root\.venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvActivate)) {
    Write-Host "  [VIGIL] Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv "$root\.venv"
}

Write-Host "  [VIGIL] Installing Python dependencies..." -ForegroundColor Cyan
& "$root\.venv\Scripts\pip.exe" install -r "$root\requirements.txt" --quiet

# ── 3. Node dependencies ───────────────────────────────────────────────────────
if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "  [VIGIL] Installing Node dependencies..." -ForegroundColor Cyan
    Push-Location "$root\frontend"
    npm install --silent
    Pop-Location
}

# ── 4. Launch servers in new windows ──────────────────────────────────────────
Write-Host ""
Write-Host "  [VIGIL] Starting backend  → http://localhost:8000" -ForegroundColor Green
Write-Host "  [VIGIL] Starting frontend → http://localhost:3000" -ForegroundColor Green
Write-Host ""

$backendCmd = "Set-Location '$root'; & '.venv\Scripts\Activate.ps1'; uvicorn backend.main:app --reload --port 8000; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

$frontendCmd = "Set-Location '$root\frontend'; npm run dev; Read-Host 'Press Enter to close'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "  Both servers are starting up." -ForegroundColor Green
Write-Host "  Open http://localhost:3000 in your browser." -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop both servers, run: .\kill_servers.ps1" -ForegroundColor Yellow
