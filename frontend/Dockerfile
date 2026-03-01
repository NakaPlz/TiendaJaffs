# ---------- Frontend: Next.js Production Build ----------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# URL del backend en producción
ENV NEXT_PUBLIC_API_URL=https://jaffslomos-backend.l55xrw.easypanel.host

RUN npm run build

# --- Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
