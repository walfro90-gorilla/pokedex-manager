# Multi-stage: deps -> build -> runtime mínimo (standalone de Next).
# NOTA: las vars NEXT_PUBLIC_* se INLINEAN en el bundle en build time — web/.env.local
# debe existir ANTES de `docker compose build` (son valores públicos por diseño:
# URL de Supabase + anon key; la seguridad real es RLS, no el secreto de estas vars).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
