FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev --no-audit --no-fund
COPY consumer.js index.html ./
EXPOSE 8080
CMD ["node", "consumer.js"]
