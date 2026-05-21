'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  Plus, 
  Layers, 
  Trash2, 
  Users, 
  X, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SectorsPage() {
  const queryClient = useQueryClient();
  
  // 1. Estados de Modales y Detalles
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Formulario Local - Crear Sector
  const [sectorForm, setSectorForm] = useState({
    name: '',
    totalCapacity: 50,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // 2. CONSULTA: Obtener Sectores con conteos de capacidad
  const { data: sectors = [], isLoading, isError, error } = useQuery({
    queryKey: ['sectorsList'],
    queryFn: async () => {
      const response = await api.get('/sectors');
      return response.data;
    },
    refetchInterval: 10000, // Recargar cada 10s
  });

  // 3. CONSULTA: Obtener detalle y lista de clientes de un sector específico al expandirse
  const { data: sectorDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['sectorDetail', selectedSectorId],
    queryFn: async () => {
      if (!selectedSectorId) return null;
      const response = await api.get(`/sectors/${selectedSectorId}`);
      return response.data;
    },
    enabled: !!selectedSectorId, // Solo se ejecuta si hay un sector seleccionado
  });

  // 4. MUTACIONES (MUTATIONS)
  // Mutation: Crear Sector
  const createMutation = useMutation({
    mutationFn: async (data: typeof sectorForm) => {
      return api.post('/sectors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectorsList'] });
      setSectorModalOpen(false);
      setSectorForm({ name: '', totalCapacity: 50 });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error al crear sector.');
    },
  });

  // Mutation: Eliminar Sector
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/sectors/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sectorsList'] });
      if (selectedSectorId === id) setSelectedSectorId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'No se pudo eliminar el sector.');
    },
  });

  // Gestores de eventos
  const handleSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!sectorForm.name || sectorForm.totalCapacity <= 0) {
      setFormError('Por favor complete todos los datos correctamente.');
      return;
    }

    createMutation.mutate({
      name: sectorForm.name,
      totalCapacity: parseInt(sectorForm.totalCapacity.toString(), 10),
    });
  };

  const handleDeleteSector = (sector: any) => {
    if (window.confirm(`¿Está seguro de eliminar el ${sector.name}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(sector.id);
    }
  };

  const handleToggleDetails = (sectorId: string) => {
    if (selectedSectorId === sectorId) {
      setSelectedSectorId(null); // Contraer si ya está seleccionado
    } else {
      setSelectedSectorId(sectorId); // Expandir
    }
  };

  // Lógica de color dinámica para la barra de ocupación
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-emerald-500';
    if (percentage < 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage < 70) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (percentage < 90) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Capacidad y Sectores
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitorea el mapa físico del campo santo, parcelas ocupadas y espacios libres.
            </p>
          </div>
          <button
            onClick={() => setSectorModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Crear Sector
          </button>
        </div>

        {/* Carga Principal */}
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al consultar sectores: {error?.message}
          </div>
        ) : sectors.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400 shadow-sm">
            <Layers className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No se han registrado sectores</h3>
            <p className="mt-1 text-xs text-gray-500">Crea el primer sector físico del campo santo para comenzar.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* LADO IZQUIERDO: Tarjetas de Sectores (7 columnas en desktop) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
              {sectors.map((sec: any) => {
                const occupancyRate = sec.totalCapacity > 0 
                  ? Math.round((sec.occupied / sec.totalCapacity) * 100) 
                  : 0;

                const isSelected = selectedSectorId === sec.id;

                return (
                  <div 
                    key={sec.id}
                    className={`rounded-2xl border bg-card p-3 sm:p-5 shadow-sm transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary/30 shadow-md shadow-primary/5' 
                        : 'border-border hover:shadow-md'
                    }`}
                  >
                    {/* Fila superior: Icono, Nombre y Delete */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <div className="rounded-lg sm:rounded-xl p-1.5 sm:p-2 bg-primary/10 text-primary shrink-0">
                          <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground leading-snug text-xs sm:text-sm md:text-base truncate">{sec.name}</h4>
                          <span className="text-[8px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider block truncate">
                            Parcela General
                          </span>
                        </div>
                      </div>
                      
                      {/* Botón Borrar Sector (sólo si no tiene clientes asignados) */}
                      {sec.occupied === 0 && (
                        <button
                          onClick={() => handleDeleteSector(sec)}
                          className="text-gray-400 hover:text-red-500 rounded-lg p-1 sm:p-1.5 hover:bg-red-500/10 transition-colors shrink-0"
                          title="Eliminar Sector Vacío"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>

                    {/* Fila intermedia: Progreso */}
                    <div className="mt-3 sm:mt-5 space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Ocupación</span>
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold ${getProgressBgColor(occupancyRate)}`}>
                          {occupancyRate}%
                        </span>
                      </div>
                      
                      {/* Barra de progreso Tailwind */}
                      <div className="h-1.5 sm:h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(occupancyRate)}`}
                          style={{ width: `${Math.min(100, occupancyRate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Fila inferior: Datos y Botón Ver */}
                    <div className="mt-3 sm:mt-5 border-t border-border pt-3 sm:pt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-2.5 sm:gap-4 text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400">
                        <div>
                          <p className="text-[8px] sm:text-[9px] text-gray-400 font-normal">Ocupado</p>
                          <p className="text-foreground text-xs sm:text-sm">{sec.occupied} <span className="text-[8px] sm:text-[10px] font-normal text-gray-500">p.</span></p>
                        </div>
                        <div className="border-l border-border pl-2.5 sm:pl-4">
                          <p className="text-[8px] sm:text-[9px] text-gray-400 font-normal">Libre</p>
                          <p className="text-foreground text-xs sm:text-sm">{sec.available} <span className="text-[8px] sm:text-[10px] font-normal text-gray-500">p.</span></p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleDetails(sec.id)}
                        className={`flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 border transition-all w-full sm:w-auto ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                            : 'bg-background hover:bg-secondary border-border text-primary'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Clientes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LADO DERECHO: Detalle de Clientes del Sector Seleccionado (5 columnas) */}
            <div className="lg:col-span-5">
              {selectedSectorId ? (
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                  {/* Cabecera Detalle */}
                  <div className="border-b border-border px-6 py-5 bg-secondary/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">
                        Clientes en {sectorDetail?.name || 'Cargando...'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {sectorDetail?.occupied || 0} parcelas ocupadas de {sectorDetail?.totalCapacity || 0} totales.
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSectorId(null)}
                      className="text-gray-400 hover:text-foreground rounded-lg p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cuerpo Detalle */}
                  <div className="flex-1 divide-y divide-border overflow-y-auto max-h-[450px]">
                    {loadingDetail ? (
                      <div className="flex h-40 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : !sectorDetail || sectorDetail.clients.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center h-40 text-gray-400">
                        <Users className="h-8 w-8 mb-2 text-gray-300" />
                        <p className="text-xs font-semibold">No hay clientes asignados en este sector.</p>
                      </div>
                    ) : (
                      sectorDetail.clients.map((cli: any) => (
                        <div key={cli.id} className="px-6 py-3.5 hover:bg-secondary/20 transition-colors flex items-center justify-between text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground leading-snug">{cli.fullName}</span>
                            <span className="text-xs text-gray-400">DNI: {cli.dni}</span>
                          </div>
                          
                          {/* Badge de estado de pago en el visor */}
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cli.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : cli.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
                          }`}>
                            {cli.status === 'ACTIVE' ? 'Activo' : cli.status === 'PENDING' ? 'Próximo' : 'Vencido'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center text-gray-400 h-[280px]">
                  <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
                  <h4 className="font-bold text-foreground text-sm">Visor de Clientes</h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Seleccione un sector a la izquierda para listar en vivo a todos sus ocupantes registrados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. MODAL: CREAR SECTOR */}
        {sectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSectorModalOpen(false)} />
            <div className="relative w-full max-w-sm max-h-[90vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Botón X */}
              <button
                onClick={() => setSectorModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <Layers className="h-5 w-5 text-primary" />
                Registrar Nuevo Sector
              </h3>

              <form onSubmit={handleSaveSector} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 scrollbar-thin">
                  {/* Nombre del Sector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre del Sector *</label>
                    <input
                      type="text"
                      required
                      value={sectorForm.name}
                      onChange={(e) => setSectorForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Sector D, Pabellón Premium"
                      className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Capacidad Total */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Capacidad de Parcelas *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={sectorForm.totalCapacity}
                      onChange={(e) => setSectorForm(prev => ({ ...prev, totalCapacity: parseInt(e.target.value, 10) || 0 }))}
                      placeholder="Ej. 100"
                      className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium">
                      {formError}
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSectorModalOpen(false)}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Confirmar Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
