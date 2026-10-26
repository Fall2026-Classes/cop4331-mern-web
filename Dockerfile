# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Final Production Runtime Container
FROM node:20-alpine
WORKDIR /app

# Install Express dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy express backend source code
COPY server/ ./server/

# Inject built React static assets from Stage 1 directly into Express public folder
COPY --from=frontend-builder /app/client/dist ./client/dist

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "server/server.js"]
