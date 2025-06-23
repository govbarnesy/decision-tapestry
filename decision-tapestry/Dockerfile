# Stage 1: Build - Install dependencies
FROM node:18 AS builder
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Stage 2: Production - Copy app and dependencies
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy dependencies from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose the application port
EXPOSE 8080

# The command to run the application
# We use an array to avoid issues with shell string parsing.
CMD [ "node", "server.mjs" ] 