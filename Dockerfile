FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p uploads

# 构建Next.js应用
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
