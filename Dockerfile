FROM node:20 AS base

WORKDIR /app

# Building
FROM base AS builder
RUN mkdir /uploads && chmod 777 /uploads
COPY package*.json ./
RUN npm install
COPY ./src ./src

# Setup App Directory
FROM base AS release
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Run
CMD ["node", "./src/app"]