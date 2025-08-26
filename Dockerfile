FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy application code
COPY . .

# Build the application
RUN pnpm build

EXPOSE 3000

# Use next start instead of pnpm start for production
CMD ["pnpm", "start"]