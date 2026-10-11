FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/storage/tmp /app/storage/files \
    && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "server.js"]