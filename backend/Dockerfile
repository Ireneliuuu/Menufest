# backend/Dockerfile
FROM node:20
WORKDIR /app

# 先複製 package 檔並安裝依賴（快取友善）
COPY package*.json ./
RUN npm i

# 再複製其餘原始碼
COPY . .

# 將 8080 port 開放給宿主機存取
EXPOSE 8080
# 用 npm run start 啟動 index.js
CMD ["npm","run","start"]