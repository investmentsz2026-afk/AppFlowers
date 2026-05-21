# Copiamos solo los package.json (para aprovechar la capa de caché)
COPY package*.json ./
RUN npm install   # instala dependencias (no necesita lock‑file)

# Copiamos todo el código del backend
COPY . .

# ---------- Prisma generation ----------
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copiamos el schema.prisma desde la carpeta “database”
COPY ../database/schema.prisma ./prisma/schema.prisma

# Generamos el cliente Prisma
RUN npm run db:generate   # → prisma@5.22.0 generate --schema=./prisma/schema.prisma
