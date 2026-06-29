FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
RUN CI=true pnpm install --frozen-lockfile=false

COPY . .

EXPOSE 3001

CMD ["pnpm", "run", "start:dev"]