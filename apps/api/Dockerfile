FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx tsc
EXPOSE 4000
CMD ["node", "dist/main.js"]
