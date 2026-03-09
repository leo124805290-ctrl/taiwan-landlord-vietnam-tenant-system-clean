#!/bin/bash
# 修改前端所有 API URL 指向本地服務

FILE="/home/node/.openclaw/workspace/taiwan-landlord-vietnam-tenant-system/lib/cloudConnection.ts"

echo "修正 cloudConnection.ts..."
sed -i "s|https://taiwan-landlord-vietnam-tenant-system.one29mcd7.vercel.app/api|http://localhost:3001/api|g" "$FILE"

echo "完成！"