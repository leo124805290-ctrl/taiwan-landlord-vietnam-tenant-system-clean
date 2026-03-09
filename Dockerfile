# Zeabur 後端 API 部署配置

FROM node:20-alpine

# 設定工作目錄
WORKDIR /app

# 復制依賴文件
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 復制專案檔案
COPY simple-api-fixed.js .

# 設定環境變數
ENV PORT=3001
ENV DATABASE_URL=postgresql://root:Qyd36iUVa7s0O2c5XpDz9fGYZr814TxW@43.167.190.238:32048/zeabur
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 啟動指令
CMD ["node", "simple-api-fixed.js"]