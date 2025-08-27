FROM node:18-alpine

# Install dependencies only when needed
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm


WORKDIR /app
COPY . .
# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install 

# Build the application
RUN pnpm build

CMD ["pnpm", "start"]