FROM node:18-alpine

WORKDIR /app

# 安装curl用于健康检查
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads

# 构建Next.js应用
RUN npm run build

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/init -X POST || exit 1

CMD ["npm", "start"]
