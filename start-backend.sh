#!/bin/bash
# 啟動後端 API Server 腳本

cd /home/node/.openclaw/workspace/taiwan-landlord-vietnam-tenant-system

echo "🚀 啟動後端 API Server..."

# Check if already running
if pgrep -f "node simple-api-fixed.js" > /dev/null; then
    echo "⚠️  後端服務已在運行"
    echo "停止舊服務..."
    pkill -f "node simple-api-fixed.js"
    sleep 2
fi

# Start backend
echo "啟動新的後端服務..."
nohup node simple-api-fixed.js > ./server.log 2>&1 &
BACKEND_PID=$!

sleep 3

# Check if started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 後端服務已啟動 (PID: $BACKEND_PID)"
    echo "📊 日誌:"
    tail -20 ./server.log
else
    echo "❌ 後端服務啟動失敗"
    echo "檢查日誌..."
    tail -30 ./server.log
fi