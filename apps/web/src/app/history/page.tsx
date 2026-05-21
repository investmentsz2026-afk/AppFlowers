'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  User,
  Clock
} from 'lucide-react';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  // CONSULTA: Obtener lista paginada de logs de auditoría
  const { data: historyData, isLoading, isError } = useQuery({
    queryKey: ['historyLogs', page],
    queryFn: async () => {
      const response = await api.get('/history', {
        params: { page, limit },
      });
      return response.data;
    },
    refetchInterval: 20000, // Recarga silenciosa cada 20s
  });

  // Helper de badges para acciones
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CLIENT_CREATE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">
            Registro Cliente
          </span>
        );
      case 'CLIENT_UPDATE':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-500 border border-blue-500/20">
            Modificación
          </span>
        );
      case 'CLIENT_DELETE':
        return (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500 border border-red-500/20">
            Eliminación
          </span>
        );
      case 'PAYMENT_ADD':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 border border-amber-500/20">
            Cobro / Pago
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2 py-0.5 text-xs font-bold text-gray-500 border border-gray-500/20">
            {action}
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full min-w-0">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Historial de Auditoría
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Bitácora de movimientos transaccionales y modificaciones de personal en el sistema.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-secondary/50 rounded-xl px-3 py-1.5 border border-border w-fit">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            Registro de Seguridad Activo
          </div>
        </div>

        {/* Carga Principal */}
        {isLoading ? (
          <div className="flex h-[45vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError || !historyData ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al consultar logs de auditoría. Intente recargando la página.
          </div>
        ) : historyData.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400 shadow-sm">
            <Activity className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Sin actividad registrada</h3>
            <p className="mt-1 text-xs text-gray-500">Los cambios que realicen los administradores aparecerán listados aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TABLA DE AUDITORÍA (APTO PARA MÓVILES E INCREÍBLE EN DESKTOP) */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-secondary/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-border">
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Fecha y Hora</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Acción</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Detalles del Movimiento</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs sm:text-sm">
                    {historyData.data.map((log: any) => (
                      <tr key={log.id} className="hover:bg-secondary/5 transition-colors">
                        {/* Fecha */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="text-gray-300 dark:text-gray-700">|</span>
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>

                        {/* Acción */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        {/* Detalles descriptivos */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <p className="text-foreground font-medium text-xs sm:text-sm max-w-lg leading-relaxed">
                            {log.details}
                          </p>
                        </td>

                        {/* Nombre del Administrador */}
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-semibold">
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span>{log.user?.name || 'Sistema'}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 capitalize">{log.user?.role?.toLowerCase() || 'automático'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINACIÓN */}
            <div className="flex items-center justify-between border-t border-border bg-card rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-xs text-gray-400 font-semibold">
                Página {page} de {historyData.meta.totalPages || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-gray-500 disabled:opacity-40 hover:bg-border transition-colors focus:outline-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= historyData.meta.totalPages}
                  onClick={() => setPage(p => Math.min(historyData.meta.totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-gray-500 disabled:opacity-40 hover:bg-border transition-colors focus:outline-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
