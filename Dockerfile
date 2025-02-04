# Stage 1: Build Stage
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Stage 2: Slim Runtime Stage
FROM node:20-slim AS runtime

# Set working directory
WORKDIR /app

# Install system dependencies required for Puppeteer and Chromium
RUN apt-get update && apt-get install -y \
    wget curl gnupg ca-certificates \
    libx11-xcb1 libxcomposite1 libxrandr2 libxi6 libxdamage1 \
    libxtst6 libcups2 libnss3 libnspr4 libdbus-1-3 \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libgbm1 libglib2.0-0 libgtk-3-0 libasound2 \
    libpangocairo-1.0-0 libxshmfence1 fonts-liberation \
    libappindicator3-1 libxss1 \
    chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy only the necessary files from the build stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY wait-for-it.sh /app/wait-for-it.sh

# Make the wait-for-it script executable
RUN chmod +x /app/wait-for-it.sh

# Expose application port
EXPOSE 9001

# Use the wait-for-it script to wait for the database, then start the app
CMD ["sh", "-c", "./wait-for-it.sh sipartan-db:5432 -- node src/app.js && pkill -f chrome || true"]
