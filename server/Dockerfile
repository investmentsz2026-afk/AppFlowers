# ==============================
#  Dockerfile – backend NestJS (Render)
# ==============================
# ---------- Build stage ----------
FROM node:20-alpine AS builder

# Instalar OpenSSL que Prisma necesita
RUN apk add --no-cache openssl

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los package.json (para aprovechar la capa de caché)
COPY package*.json ./
RUN npm ci   # instala dependencias exactamente como en tu lockfile

# Copiamos todo el código del backend
COPY . .

# ---------- Prisma generation ----------
# Necesitamos la variable DATABASE_URL para que Prisma genere el cliente.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copiamos el schema.prisma desde la carpeta “database” (está en el repo raíz)
#   → la ruta en el contenedor será ./prisma/schema.prisma
COPY ../database/schema.prisma ./prisma/schema.prisma

# Generamos el cliente Prisma
RUN npm run db:generate   # → prisma generate --schema=./prisma/schema.prisma

# ---------- Build the Nest app ----------
RUN npm run build          # nest build → genera /dist

# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario del stage anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Puerto que escuchará la aplicación (igual que en .env.production)
EXPOSE 4000

# Lanzamos la API
CMD ["node", "dist/main"]
