# ==============================
#  Dockerfile – backend NestJS
# ==============================
# ---------- Build stage ----------
FROM node:20-alpine AS builder

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los package.json para aprovechar la capa de caché de npm
COPY package*.json ./
RUN npm ci   # instala dependencias exactamente como en tu lockfile

# Copiamos el resto del código del backend
COPY . .

# Compilamos TypeScript → dist/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario del stage anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Puerto que escuchará la aplicación (el mismo que definiste en .env)
EXPOSE 4000

# Lanzamos la API
CMD ["node", "dist/main"]
