# ==============================
#  Dockerfile – backend NestJS (Render)
# ==============================
# ---------- Build stage ----------
FROM node:20-alpine AS builder

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos solo los package.json del backend (capa de caché)
COPY server/package*.json ./
# Copiamos el schema.prisma antes de instalar para que los scripts postinstall lo encuentren
RUN mkdir -p prisma
COPY database/schema.prisma ./prisma/schema.prisma
# Copiamos el archivo de semilla de la base de datos
RUN mkdir -p database
COPY database/seed.ts ./database/seed.ts
# Definimos variable de entorno para Prisma (se sobrescribirá en Render)
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apkexcel
ENV DATABASE_URL=${DATABASE_URL}
# Instalamos dependencias (incluye scripts para bcrypt)
# Añadimos herramientas de compilación necesarias para bcrypt
RUN apk add --no-cache --virtual .gyp python3 make g++
# Install dependencies without running postinstall (skip db:push)
RUN npm install --ignore-scripts
# Recompile bcrypt native module
RUN npm rebuild bcrypt --build-from-source
# Remove build tools
RUN apk del .gyp
# Generate Prisma client (no DB needed)
RUN npm run db:generate

# Copiamos todo el código del backend
COPY server/. .

# ---------- Prisma generation ----------
# (Removed duplicate DATABASE_URL definition; already set earlier)

# (Removed duplicate schema copy – already handled in build stage)

# Generamos el cliente Prisma usando la versión local (5.22.0)
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# ---------- Build the Nest app ----------
RUN npm run build          # nest build → genera /dist

# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias nativas para Prisma (OpenSSL 3.x en Alpine moderno)
RUN apk add --no-cache openssl libc6-compat

# Copiamos solo lo necesario del stage anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Copiamos el esquema Prisma para poder hacer db:push en tiempo de ejecución
COPY --from=builder /app/prisma ./prisma
# Copiamos la semilla de la base de datos
COPY --from=builder /app/database ./database

# Puerto que escuchará la aplicación (igual que en .env.production)
EXPOSE 4000

# Lanzamos la API
CMD ["sh", "-c", "npm run db:push && npm run seed && node dist/main"]
