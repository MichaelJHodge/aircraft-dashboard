FROM node:20-alpine AS base
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY shared ./shared

RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start"]
