'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  Users, 
  AlertOctagon, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Activity,
  Calendar,
  Layers,
  Phone
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Query para obtener estadísticas en tiempo real
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 15000, // Auto-recarga cada 15 segundos para máxima frescura
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando estadísticas en tiempo real...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
          <h3 className="font-semibold text-lg">Error al cargar datos</h3>
          <p className="text-sm mt-1">{error?.message || 'Verifique la conexión con el servidor backend.'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const kpis = [
    {
      name: 'Clientes Activos',
      value: stats.clients.active,
      sub: `${stats.clients.total} registrados en total`,
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/5',
    },
    {
      name: 'Clientes Vencidos',
      value: stats.clients.expired,
      sub: 'Requieren renovación urgente',
      icon: AlertOctagon,
      color: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/5',
    },
    {
      name: 'Próximos a Vencer',
      value: stats.clients.pending,
      sub: 'Vencen en los próximos 7 días',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/5',
    },
    {
      name: 'Ingresos del Mes',
      value: `S/. ${stats.revenue.monthly.toFixed(2)}`,
      sub: `S/. ${stats.revenue.total.toFixed(2)} acumulado total`,
      icon: DollarSign,
      color: 'bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/5',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Panel Administrativo
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoreo general de parcelas, servicios, clientes y cobranzas.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-secondary/50 rounded-xl px-3 py-1.5 border border-border">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Actualizado en vivo
          </div>
        </div>

        {/* 1. GRID DE TARJETAS KPI */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div 
                key={idx} 
                className={`rounded-2xl border bg-card p-4 sm:p-6 shadow-sm hover-premium ${kpi.color}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 line-clamp-1">
                    {kpi.name}
                  </span>
                  <div className="rounded-xl p-1.5 sm:p-2 bg-background/50 border border-current/10 shrink-0">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-4">
                  <span className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground block truncate">
                    {kpi.value}
                  </span>
                  <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium line-clamp-1">
                    {kpi.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. AREA DE DOS COLUMNAS: VENCIMIENTOS Y HISTORIAL */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LADO IZQUIERDO: Próximos Vencimientos (7 columnas) */}
          <div className="rounded-2xl border border-border bg-card shadow-sm lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h3 className="font-bold text-foreground">Próximos Vencimientos</h3>
                <p className="text-xs text-gray-500">Recordatorios de cobro prioritarios.</p>
              </div>
              <Link
                href="/clients"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Ver clientes <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[400px]">
              {stats.upcomingExpirations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm font-medium text-gray-400">No hay vencimientos en los próximos 7 días.</p>
                </div>
              ) : (
                stats.upcomingExpirations.map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{client.fullName}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-400">
                          <Layers className="h-3.5 w-3.5 text-primary" /> {client.sector?.name || 'Sin Sector'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {client.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                        Vence el {new Date(client.nextDueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LADO DERECHO: Actividad Reciente (5 columnas) */}
          <div className="rounded-2xl border border-border bg-card shadow-sm lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold text-foreground">Actividad Reciente</h3>
                  <p className="text-xs text-gray-500">Historial de movimientos.</p>
                </div>
              </div>
              <Link
                href="/history"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Auditar todo <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex-1 px-6 py-6 overflow-y-auto max-h-[400px]">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No se han registrado movimientos recientes.</p>
              ) : (
                <div className="relative border-l-2 border-border pl-4 space-y-6">
                  {stats.recentActivity.map((log: any) => (
                    <div key={log.id} className="relative">
                      {/* Círculo indicador */}
                      <span className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                      
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          {log.action.replace('_', ' ')}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">{log.details}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                          <span>Realizado por {log.user?.name || 'Sistema'}</span>
                          <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
