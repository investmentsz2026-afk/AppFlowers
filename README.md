# ApkExcel - Sistema Administrativo para Campo Santo y Florería 🌸🪦

Bienvenido a **ApkExcel**, un sistema administrativo moderno, responsivo y ultra rápido diseñado para reemplazar hojas de cálculo tradicionales (como Excel) en la administración de cementerios y florerías. Esta plataforma permite controlar de forma eficiente el padrón de clientes, cuotas de pagos, estados de vencimiento, ubicaciones físicas de parcelas (sectores) e historial completo de auditoría.

---

## 🚀 Arquitectura y Tecnologías Obligatorias

El sistema adopta una arquitectura desacoplada y modular tipo Monorepo:

*   **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Zustand (Estado Global) y TanStack Query (fetching asíncrono y caché en vivo).
*   **Backend API**: NestJS (Arquitectura limpia de módulos, controladores y servicios), Passport JWT, Bcrypt hashing, class-validator DTOs y Schedule (Cron Jobs).
*   **Base de Datos**: PostgreSQL y Prisma ORM para consultas y migraciones seguras y tipadas.
*   **Diseño**: UI/UX premium responsiva tipo Aplicación Móvil (APK-Ready), con soporte nativo de Modo Oscuro, micro-animaciones fluidas y notificaciones visuales semánticas.

---

## 📂 Estructura del Repositorio

El proyecto está organizado de la siguiente manera:

```text
/ApkExcel
  ├── /database       # Esquemas de Prisma ORM, semilla (seed) de prueba e inicializador
  ├── /server         # API Backend en NestJS (Lógica de Auth, Clientes, Sectores, Pagos)
  ├── /apps
  │     └── /web      # Aplicación Web Next.js 15 (Dashboard, Formularios, Listados)
  ├── package.json    # Orquestador raíz con accesos directos npm
  └── README.md       # Documentación principal
```

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1.  **Node.js** (versión 18 o superior recomendada).
2.  **PostgreSQL** (servicio activo localmente o en la nube).
3.  **npm** (instalado por defecto con Node.js).

---

## ⚙️ Configuración Ambiental (Variables de Entorno)

Antes de levantar el sistema, debes crear los archivos de ambiente `.env` basados en las plantillas provistas:

1.  **Base de Datos (`/database/.env`)**:
    Crea el archivo `/database/.env` y establece tu URL de conexión de PostgreSQL:
    ```env
    DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/apkexcel?schema=public"
    ```

2.  **Backend API (`/server/.env`)**:
    Crea el archivo `/server/.env` con el puerto, URL de base de datos y firma secreta para tokens JWT:
    ```env
    PORT=4000
    DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/apkexcel?schema=public"
    JWT_SECRET="clave-secreta-altamente-segura-para-desarrollo-local"
    JWT_EXPIRATION="7d"
    ```

3.  **Frontend Web (`/apps/web/.env`)**:
    Crea el archivo `/apps/web/.env` indicando la ruta pública de la API de NestJS:
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:4000/api"
    ```

---

## 📥 Instalación y Puesta en Marcha (Paso a Paso)

Ejecuta los siguientes comandos desde la **raíz del proyecto** (`/ApkExcel`):

### 1. Instalar todas las dependencias
Este comando instalará de manera secuencial los paquetes del backend, base de datos y la aplicación Next.js:
```bash
npm run install:all
```

### 2. Generar y Ejecutar Migraciones de Base de Datos
Crea las tablas físicas en tu base de datos PostgreSQL mediante Prisma:
```bash
npm run db:migrate
```

### 3. Cargar Datos Semilla (Seed) de Prueba
Puebla tu base de datos con un administrador por defecto, sectores (Sector A, B, C) y clientes reales en estados `Activo`, `Pendiente` y `Vencido`:
```bash
npm run db:seed
```

### 4. Arrancar Servidores de Desarrollo
*   **Servidor Backend (NestJS)** en el puerto `4000`:
    ```bash
    npm run dev:server
    ```
*   **Servidor Frontend (Next.js 15)** en el puerto `3000`:
    ```bash
    npm run dev:web
    ```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) e ingresa con las credenciales demo:
*   **Correo**: `admin@apkexcel.com`
*   **Contraseña**: `admin123`

---

## ⚡ Reglas de Negocio Clave Implementadas

1.  **Capacidad de Sectores Física Estricta**: Al registrar un cliente en un sector, el backend valida si quedan parcelas disponibles. Si el sector está lleno (`totalCapacity` alcanzada), deniega la operación devolviendo una alerta clara al operador.
2.  **Sincronización Inteligente de Vencimientos (100% Real-Time)**: Cada vez que se consulta la lista de clientes o se visualiza el dashboard, el sistema compara de forma asíncrona la fecha de vencimiento (`nextDueDate`) con la fecha de hoy. Si el estado en base de datos difiere de la realidad, se actualiza de forma silenciosa e instantánea.
    *   **Activo (`ACTIVE`)**: Vencimiento superior a 7 días.
    *   **Próximo a Vencer (`PENDING`)**: Vencimiento dentro de los próximos 7 días.
    *   **Vencido (`EXPIRED`)**: Fecha de vencimiento menor al día actual.
3.  **Renovación de Pagos sin Pérdida de Días**: Si un cliente paga por adelantado (antes de vencer), el nuevo vencimiento se suma a su fecha de vencimiento futura. Si el cliente está vencido, su periodo inicia desde hoy, extendiéndose el número de meses pagados (`monthsToRenew`).
4.  **Historial Permanente**: Al eliminar un cliente, el sistema borra en cascada sus pagos asociados, pero primero guarda un historial huérfano detallado de la eliminación (describiendo nombre completo, DNI y sector), garantizando la auditoría eterna de las acciones operativas.

---

## 🌍 Preparación para Producción y Despliegue

### Despliegue Backend (NestJS) en Railway / Render:
*   La API NestJS cuenta con un puerto dinámico (`PORT = process.env.PORT || 4000`) ideal para plataformas en la nube.
*   En tu proveedor Cloud, conecta el directorio `/server`.
*   Crea una base de datos PostgreSQL administrada en la nube y asóciala configurando las variables ambientales correspondientes (`DATABASE_URL`, `JWT_SECRET`).

### Despliegue Frontend (Next.js) en Vercel:
*   Next.js 15 está optimizado de fábrica para Vercel.
*   Conecta la carpeta `/apps/web` en tu panel de Vercel.
*   Declara la variable de producción `NEXT_PUBLIC_API_URL` apuntando al dominio de tu backend desplegado en Railway/Render.
