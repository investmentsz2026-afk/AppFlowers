'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Flower2, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data;
      
      // Guardar en Zustand (y localStorage implicitamente)
      login(user, accessToken);
      
      // Redirigir al Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'No se pudo conectar con el servidor. Verifique sus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Fondo estético con círculos de degradado */}
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-500/10 blur-[80px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-[80px]" />

      <div className="w-full max-w-md hover-premium">
        {/* Caja Principal con Glassmorphism */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-md">
          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center gap-3 text-center">
            <img 
              src="/logo.png" 
              alt="Logo RossyFlowers" 
              className="h-20 w-auto object-contain select-none drop-shadow-lg"
            />
            <h1 
              className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 bg-clip-text text-transparent select-none"
              style={{
                filter: 'drop-shadow(1px 1px 0px #fb7185) drop-shadow(2px 2px 0px #f43f5e) drop-shadow(3px 4px 6px rgba(0,0,0,0.45))'
              }}
            >
              RossyFlowers
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sistema de Gestión Administrativo
            </p>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-center text-foreground">
            Iniciar Sesión
          </h2>

          {/* Formulario */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Correo Electrónico
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apkexcel.com"
                  className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Alerta de Error */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium">
                {error}
              </div>
            )}

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Ingresar al Panel'
              )}
            </button>
          </form>

          {/* Credenciales rápidas para el usuario (Seed Info) */}
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-[10px] text-gray-400">
              © 2026 RossyFlowers | Todos los derechos reservados | Diseñado con ❤️ <span className="font-semibold text-gray-500 dark:text-gray-300"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
