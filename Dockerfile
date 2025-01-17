# Stage 1: Build Stage
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Install dependencies only for production
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Stage 2: Slim Runtime Stage
FROM node:20-slim AS runtime

# Set working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Create and set permissions for uploads folder
# RUN mkdir -p /uploads && chmod 777 /uploads

# Expose application port
EXPOSE 9001

# Run the application
CMD ["node", "src/app.js"]
