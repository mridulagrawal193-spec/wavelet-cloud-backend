FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install ffmpeg for HLS transcoding
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads/audio /app/uploads/hls /app/uploads/artwork /app/data

EXPOSE 4000
ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
