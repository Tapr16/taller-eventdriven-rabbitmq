FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev --no-audit --no-fund
COPY producer.js .
CMD ["node", "producer.js"]
