/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce la salida "standalone" que Vercel necesita para servir la app
  output: 'standalone',

  // Indica que usamos el App Router (carpeta src/app)
  experimental: {
    appDir: true,
  },

  // (Opcional) desactiva la telemetría si no la quieres
  // telemetry: false,
};

module.exports = nextConfig;
