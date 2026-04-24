FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY backend/package.json ./backend/
RUN pnpm install --filter=backend...
COPY packages/types ./packages/types
COPY backend ./backend
WORKDIR /app/backend
EXPOSE 4000
CMD ["pnpm", "dev"]
