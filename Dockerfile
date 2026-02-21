# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server + API
COPY server.js ./
COPY api ./api

# Copy self-hosted video
COPY public/videos ./public/videos

# Data directory for purchases.json / events.json (mount as volume for persistence)
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.js"]
