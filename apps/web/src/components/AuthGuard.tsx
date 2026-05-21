'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const { initializeTheme } = useUiStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Inicializar sesión e inicializar tema
    initializeAuth();
    initializeTheme();
    setLoading(false);
  }, [initializeAuth, initializeTheme]);

  useEffect(() => {
    if (loading) return;

    const isPublicPath = pathname === '/login';

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
    } else if (isAuthenticated && isPublicPath) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando sistema administrativo...</p>
        </div>
      </div>
    );
  }

  // Permitir renderizar login a usuarios no autenticados y vistas privadas a usuarios autenticados
  const isPublicPath = pathname === '/login';
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
