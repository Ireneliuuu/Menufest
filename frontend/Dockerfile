# frontend/Dockerfile
# 把前端開發伺服器（Vite）放進容器跑，外部從 5173 連入

FROM node:20
WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
EXPOSE 5173
# 使用 Vite 開發伺服器，讓外部可連（--host 0.0.0.0）
CMD ["npm","run","dev","--","--host","0.0.0.0"]