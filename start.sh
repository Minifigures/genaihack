#!/usr/bin/env bash
# VIGIL - One-command startup (macOS / Linux)
# Usage: ./start.sh
# Starts backend (port 8000) and frontend (port 3000) side-by-side.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Check .env ──────────────────────────────────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
    echo ""
    echo "  [VIGIL] .env not found — copying from .env.example"
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo "  [VIGIL] Edit .env with your API keys (demo mode works without them)"
    echo ""
fi

# ── 2. Python venv ─────────────────────────────────────────────────────────────
if [ ! -f "$ROOT/.venv/bin/activate" ]; then
    echo "  [VIGIL] Creating Python virtual environment..."
    python3 -m venv "$ROOT/.venv"
fi

echo "  [VIGIL] Installing Python dependencies..."
"$ROOT/.venv/bin/pip" install -r "$ROOT/requirements.txt" --quiet

# ── 3. Node dependencies ───────────────────────────────────────────────────────
if [ ! -d "$ROOT/frontend/node_modules" ]; then
    echo "  [VIGIL] Installing Node dependencies..."
    (cd "$ROOT/frontend" && npm install --silent)
fi

# ── 4. Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo "  [VIGIL] Shutting down servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── 5. Launch servers ──────────────────────────────────────────────────────────
echo ""
echo "  [VIGIL] Starting backend  → http://localhost:8000"
(cd "$ROOT" && source .venv/bin/activate && uvicorn backend.main:app --reload --port 8000) &
BACKEND_PID=$!

sleep 2

echo "  [VIGIL] Starting frontend → http://localhost:3000"
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "  Both servers are running."
echo "  Open http://localhost:3000 in your browser."
echo "  Press Ctrl+C to stop."
echo ""

wait
