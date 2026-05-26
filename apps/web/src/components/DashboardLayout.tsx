'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Users, 
  Layers, 
  History, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User as UserIcon,
  Flower2,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen, darkMode, toggleDarkMode } = useUiStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Sectores', href: '/sectors', icon: Layers },
    { name: 'Historial', href: '/history', icon: History },
    { name: 'Reportes', href: '/reports', icon: FileText },
  ];

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. BARRA LATERAL (ESCRITORIO) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border shadow-sm print:hidden">
        {/* Logo / Cabecera Sidebar */}
        <div className="flex h-16 items-center px-4 gap-1.5 border-b border-border">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain select-none" />
          <span 
            className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 bg-clip-text text-transparent select-none"
            style={{
              filter: 'drop-shadow(1px 1px 0px #fb7185) drop-shadow(2px 2px 0px #f43f5e) drop-shadow(3px 4px 6px rgba(0,0,0,0.45))'
            }}
          >
            RossyFlowers
          </span>
        </div>
        
        {/* Enlaces de Navegación */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-gray-500 hover:bg-secondary hover:text-foreground dark:text-gray-400'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-primary-foreground' : 'text-gray-400 group-hover:text-foreground'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (Usuario y Config) */}
        <div className="border-t border-border p-4 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold">{user?.name || 'Administrador'}</p>
              <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase() || 'admin'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MENÚ LATERAL MÓVIL (DESPLEGABLE / DRAWER) */}
      <div className={`fixed inset-0 z-50 flex md:hidden transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Fondo Translúcido (Backdrop) */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        
        {/* Caja de Navegación del Drawer */}
        <div className={`relative flex w-full max-w-xs flex-col bg-card border-r border-border pt-5 pb-4 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Botón de Cierre */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-secondary focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center px-4 gap-1.5 h-16 border-b border-border">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain select-none" />
            <span 
              className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 bg-clip-text text-transparent select-none"
              style={{
                filter: 'drop-shadow(1px 1px 0px #fb7185) drop-shadow(2px 2px 0px #f43f5e) drop-shadow(3px 4px 6px rgba(0,0,0,0.45))'
              }}
            >
              RossyFlowers
            </span>
          </div>

          {/* Enlaces */}
          <nav className="mt-5 flex-1 space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-lg px-3 py-2.5 text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-gray-500 hover:bg-secondary hover:text-foreground dark:text-gray-400'
                  }`}
                >
                  <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Perfil en Drawer */}
          <div className="border-t border-border p-4 bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{user?.name || 'Administrador'}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase() || 'admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTENEDOR PRINCIPAL */}
      <div className="flex-1 md:pl-64 print:pl-0 flex flex-col min-h-screen w-full min-w-0">
        {/* Cabecera Superior (Navbar) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-8 shadow-sm print:hidden">
          {/* Lado Izquierdo: Toggle/Logo y Título */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-secondary md:hidden focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo de la Empresa */}
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Logo RossyFlowers" 
                className="h-11 sm:h-13 w-auto object-contain select-none"
              />
            </div>

            <div className="hidden md:block h-6 w-px bg-border mx-1"></div>
            
            <div className="hidden md:block">
              <h2 className="text-sm font-medium text-gray-400">Sistema Administrativo</h2>
            </div>
          </div>

          {/* Lado Derecho: Acciones (Tema, Perfil, Salir) */}
          <div className="flex items-center gap-3">
            {/* Toggle de Modo Oscuro */}
            <button
              onClick={toggleDarkMode}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-secondary transition-colors duration-200"
              title="Cambiar Tema"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
            </button>

            {/* Separador */}
            <div className="h-6 w-px bg-border"></div>

            {/* Botón Salir */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all duration-200"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* 4. ÁREA DE CONTENIDO */}
        <main className="flex-1 p-4 md:p-8 print:p-0 overflow-y-auto w-full min-w-0">
          {children}
        </main>
      </div>
      {/* OVERLAY: Cerrando Sesión */}
      {loggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
          <img src="/logo.png" alt="Logo RossyFlowers" className="h-20 w-auto object-contain mb-6 animate-pulse" />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mb-4"></div>
          <p 
            className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-violet-600 bg-clip-text text-transparent"
            style={{
              filter: 'drop-shadow(1px 1px 0px #fb7185) drop-shadow(2px 2px 0px #f43f5e) drop-shadow(3px 4px 6px rgba(0,0,0,0.45))'
            }}
          >
            Cerrando sesión...
          </p>
        </div>
      )}
    </div>
  );
}
