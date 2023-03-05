FROM node:16-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/prisma src/prisma
RUN npm run build:prisma

COPY . .
RUN npm run build

FROM node:16-bullseye AS runner
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist dist

EXPOSE 5000
CMD ["npm", "run", "start:prod"]
