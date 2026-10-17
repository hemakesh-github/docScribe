#!/bin/bash
set -e

# Change directory to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-dev}"

echo "============================================================"
echo "          docScribe / DocTalk - AI Scribe"
echo "============================================================"

# Helper to free occupied ports if needed
free_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        local pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Port $port is currently in use. Stopping existing process ($pids)..."
            kill -9 $pids 2>/dev/null || true
            sleep 0.5
        fi
    fi
}

cleanup() {
    echo ""
    echo "Stopping all docScribe servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

if [ "$MODE" = "prod" ] || [ "$MODE" = "--prod" ]; then
    echo "Mode: PRODUCTION (Single port unified server)"
    free_port 8000

    echo "Building React frontend static assets..."
    cd "$SCRIPT_DIR/frontend"
    npm run build

    echo ""
    echo "Starting Unified FastAPI Server:"
    echo "  👉 Application UI:     http://localhost:8000"
    echo "  👉 Backend API:        http://localhost:8000/api"
    echo "  👉 API Docs (Swagger): http://localhost:8000/docs"
    echo "============================================================"
    echo "Press Ctrl+C to stop."
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    exec uvicorn main:app --host 0.0.0.0 --port 8000
else
    echo "Mode: DEVELOPMENT (Concurrent Vite UI + FastAPI API)"
    free_port 8000
    free_port 5173

    # 1. Start FastAPI backend
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!

    # 2. Start Vite frontend
    cd "$SCRIPT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "docScribe services are running:"
    echo "  👉 Frontend (React Dev): http://localhost:5173 (Hot Reload)"
    echo "  👉 Backend (FastAPI):    http://localhost:8000"
    echo "  👉 API Docs (Swagger):   http://localhost:8000/docs"
    echo "  👉 Production Fallback:  http://localhost:8000 (Built static UI)"
    echo "============================================================"
    echo "Press Ctrl+C to stop both servers."

    wait
fi
