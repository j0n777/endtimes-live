# Stage 1: Build
FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
# Note: We assume .env is present in the directory or variables are passed via build-args if needed.
# Since .env exists locally, we copy it above with "COPY . ."
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine as serve

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Worker
FROM node:22-alpine as worker

WORKDIR /app

# Copy from builder (node_modules and source)
COPY --from=builder /app /app

# Install simple process manager or just use shell loop
# We'll use a shell loop for simplicity to run every hour (3600s)
CMD ["sh", "-c", "while true; do echo '🚀 Starting scheduled collection...'; ./node_modules/.bin/tsx scripts/run-all-collectors.ts; echo '💤 Sleeping for 2 minutes...'; sleep 120; done"]
