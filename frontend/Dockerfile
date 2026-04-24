FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY frontend/package.json ./frontend/
RUN pnpm install --filter=frontend...
COPY packages/types ./packages/types
COPY frontend ./frontend
WORKDIR /app/frontend
EXPOSE 3000
CMD ["pnpm", "dev"]
