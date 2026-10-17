#!/bin/bash
set -e

# docScribe / DocTalk - Native Production Runner
echo "=== docScribe / DocTalk ==="

# Build React frontend if not already built
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend static assets..."
    cd frontend
    npm run build
    cd ..
fi

echo "Starting FastAPI server on http://localhost:8000..."
cd backend
source venv/bin/activate
exec uvicorn main:app --host 0.0.0.0 --port 8000
