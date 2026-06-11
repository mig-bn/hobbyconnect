# ════════════════════════════════════════════════════════════════
#  Stage 1 — deps
#  Instala dependencias con npm ci en un layer separado para
#  que no se reconstruya si solo cambia el código fuente.
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

WORKDIR /app

# Solo copia los manifiestos para aprovechar la cache de Docker
COPY package.json package-lock.json ./

RUN npm ci --prefer-offline

# ════════════════════════════════════════════════════════════════
#  Stage 2 — dev
#  Servidor de desarrollo con hot reload.
#  docker-compose monta el código fuente como volumen, por lo
#  que los cambios locales se reflejan instantáneamente.
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS dev

WORKDIR /app

ENV NODE_ENV=development
# Deshabilita telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Copia node_modules del stage anterior (no los del host)
COPY --from=deps /app/node_modules ./node_modules

# Copia el código fuente (será sobreescrito por el volumen en docker-compose)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
