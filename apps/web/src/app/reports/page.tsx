'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  FileText, 
  Search, 
  Calendar, 
  Layers, 
  Filter, 
  Download, 
  Printer, 
  RotateCcw,
  Users,
  Coins,
  AlertOctagon,
  Clock
} from 'lucide-react';

export default function ReportsPage() {
  // 1. Estados para Filtros
  const [search, setSearch] = useState('');
  const [dateType, setDateType] = useState<'nextDueDate' | 'lastPaymentDate' | 'createdAt'>('nextDueDate');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Filtro de Sectores Múltiples (Set)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  // Filtro de Estados Múltiples (Set)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['ACTIVE', 'PENDING', 'EXPIRED']);

  // 2. Consulta de Sectores para los filtros
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectorsListReports'],
    queryFn: async () => {
      const response = await api.get('/sectors');
      return response.data;
    },
  });

  // 3. Consulta de Reportes filtrados
  const { data: reportData, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'reportsData',
      startDate,
      endDate,
      dateType,
      selectedStatuses.join(','),
      selectedSectors.join(','),
      search
    ],
    queryFn: async () => {
      const response = await api.get('/clients/reports', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          dateType,
          status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
          sectorIds: selectedSectors.length > 0 ? selectedSectors.join(',') : undefined,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  // Alternar selección de sectores
  const toggleSector = (id: string) => {
    setSelectedSectors((prev) => 
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Alternar selección de estados
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => 
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    setSearch('');
    setDateType('nextDueDate');
    setStartDate('');
    setEndDate('');
    setSelectedSectors([]);
    setSelectedStatuses(['ACTIVE', 'PENDING', 'EXPIRED']);
  };

  // Exportar a Excel (CSV compatible en español)
  const handleExportExcel = () => {
    if (!reportData || reportData.clients.length === 0) return;

    // Cabeceras
    const headers = [
      'DNI',
      'Difunto (Nombre Completo)',
      'Responsable (Contacto)',
      'Teléfono',
      'Dirección / Ubicación',
      'Sector',
      'Flores / Arreglo',
      'Monto (S/.)',
      'Fecha Inicio / Pago',
      'Fecha Vencimiento',
      'Estado'
    ];

    // Filas
    const rows = reportData.clients.map((c: any) => [
      c.dni,
      c.fullName,
      c.contactName || '',
      c.phone || '',
      c.address || '',
      c.sector?.name || 'Sin Sector',
      c.flowers || '',
      c.amount ? c.amount.toFixed(2) : '0.00',
      c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('es-PE') : 'N/A',
      c.nextDueDate ? new Date(c.nextDueDate).toLocaleDateString('es-PE') : 'N/A',
      c.status === 'ACTIVE' ? 'Activo' : c.status === 'PENDING' ? 'Próximo a Vencer' : 'Vencido'
    ]);

    // Crear el string CSV con formato de punto y coma ';' y BOM para UTF-8 (soporte completo de tildes en Excel)
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map((row: any[]) => row.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // Descarga del archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_administracion_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir Reporte
  const handlePrint = () => {
    window.print();
  };

  // Helper Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">Activo</span>;
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/20">Próximo</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-500 border border-red-500/20">Vencido</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera de Reportes (Oculta en Impresión) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl flex items-center gap-2">
              <FileText className="h-8 w-8 text-rose-500" />
              Reportes y Estadísticas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Genera reportes específicos, filtra la información y expórtala en Excel o imprímela.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading || !reportData || reportData.clients.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 disabled:opacity-40 active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isLoading || !reportData || reportData.clients.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 disabled:opacity-40 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* 1. SECCIÓN DE FILTROS (Oculta en Impresión) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              Filtros del Reporte
            </h3>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtros de Fecha */}
            <div className="space-y-3.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Filtrar por Fechas</label>
              <div className="space-y-2">
                <select
                  value={dateType}
                  onChange={(e: any) => setDateType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none"
                >
                  <option value="nextDueDate">Fecha de Vencimiento</option>
                  <option value="lastPaymentDate">Fecha de Inicio / Pago</option>
                  <option value="createdAt">Fecha de Registro</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-2 text-xs outline-none font-mono"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-2 text-xs outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros de Estado */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Filtrar por Estado</label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { key: 'ACTIVE', label: 'Activos' },
                  { key: 'PENDING', label: 'Próximos' },
                  { key: 'EXPIRED', label: 'Vencidos' }
                ].map((st) => {
                  const isSelected = selectedStatuses.includes(st.key);
                  return (
                    <button
                      key={st.key}
                      onClick={() => toggleStatus(st.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card border-border text-gray-500 hover:bg-secondary'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Búsqueda de Persona */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Buscar Persona</label>
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="DNI, Nombre o Teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Filtro por Sectores */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              Sectores Físicos (Selecciona uno o varios)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSectors([])}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedSectors.length === 0
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-gray-500 hover:bg-secondary'
                }`}
              >
                Todos los Sectores
              </button>
              {sectors.map((sec: any) => {
                const isSelected = selectedSectors.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    onClick={() => toggleSector(sec.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected 
                        ? 'bg-primary/95 text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-gray-500 hover:bg-secondary'
                    }`}
                  >
                    {sec.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. RESUMEN ESTADÍSTICO (Visible en pantalla e Impresión) */}
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError || !reportData ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al procesar el reporte. Intente de nuevo.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header del Reporte al Imprimir */}
            <div className="hidden print:block border-b-2 border-foreground pb-4 space-y-1">
              <h1 className="text-2xl font-black uppercase text-center">Rossy Flowers</h1>
              <h2 className="text-sm font-bold text-center uppercase tracking-wide">Reporte de Clientes y Pagos de Administración</h2>
              <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-3">
                <span>Generado el: {new Date().toLocaleDateString('es-PE')} {new Date().toLocaleTimeString('es-PE')}</span>
                <span>Filtros activos: {startDate || 'N/A'} al {endDate || 'N/A'} ({dateType})</span>
              </div>
            </div>

            {/* Grid de Resumen Estadístico */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 print:grid-cols-5">
              <div className="rounded-2xl border border-border bg-card p-4 text-center print:border-foreground/30">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Clientes</p>
                <p className="text-2xl font-extrabold mt-1 text-foreground">{reportData.summary.totalClients}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center print:border-foreground/30">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Monto Estimado</p>
                <p className="text-2xl font-extrabold mt-1 text-emerald-500 font-mono">S/. {reportData.summary.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center print:border-foreground/30">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Activos
                </p>
                <p className="text-2xl font-extrabold mt-1 text-foreground">{reportData.summary.activeCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center print:border-foreground/30">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Próximos
                </p>
                <p className="text-2xl font-extrabold mt-1 text-foreground">{reportData.summary.pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center col-span-2 sm:col-span-1 print:border-foreground/30">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide flex items-center justify-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span> Vencidos
                </p>
                <p className="text-2xl font-extrabold mt-1 text-foreground">{reportData.summary.expiredCount}</p>
              </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            {reportData.clients.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400">
                No se encontraron registros con los filtros seleccionados.
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm print:shadow-none print:border-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-full">
                    <thead>
                      <tr className="bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-border print:bg-gray-100 print:text-black">
                        <th className="px-3 py-3">DNI</th>
                        <th className="px-3 py-3">Nombre Difunto</th>
                        <th className="px-3 py-3">Responsable (Contacto)</th>
                        <th className="px-3 py-3">Teléfono</th>
                        <th className="px-3 py-3">Sector</th>
                        <th className="px-3 py-3">Ubicación</th>
                        <th className="px-3 py-3">Flores</th>
                        <th className="px-3 py-3">Monto</th>
                        <th className="px-3 py-3">F. Inicio</th>
                        <th className="px-3 py-3 font-bold text-red-500 print:text-black">F. Venc.</th>
                        <th className="px-3 py-3 text-center print:text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs print:divide-gray-400">
                      {reportData.clients.map((c: any) => (
                        <tr key={c.id} className="hover:bg-secondary/15 transition-colors print:hover:bg-transparent">
                          <td className="px-3 py-2.5 font-mono text-gray-500 print:text-black">{c.dni}</td>
                          <td className="px-3 py-2.5 font-bold text-foreground print:text-black">{c.fullName}</td>
                          <td className="px-3 py-2.5 text-gray-600 print:text-black">{c.contactName || '-'}</td>
                          <td className="px-3 py-2.5 text-gray-500 font-mono print:text-black">{c.phone || '-'}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-primary dark:text-blue-400 print:text-black">
                              {c.sector?.name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-gray-600 print:text-black">{c.address || '-'}</td>
                          <td className="px-3 py-2.5 text-gray-500 italic print:text-black">{c.flowers || '-'}</td>
                          <td className="px-3 py-2.5 font-bold text-emerald-500 font-mono print:text-black">S/. {c.amount ? c.amount.toFixed(2) : '0.00'}</td>
                          <td className="px-3 py-2.5 text-gray-500 font-mono print:text-black">
                            {c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('es-PE') : 'N/A'}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-gray-700 dark:text-gray-300 print:text-black">
                            {c.nextDueDate ? new Date(c.nextDueDate).toLocaleDateString('es-PE') : 'N/A'}
                          </td>
                          <td className="px-3 py-2.5 text-center print:text-right print:font-bold">
                            <span className="print:hidden">
                              {getStatusBadge(c.status)}
                            </span>
                            <span className="hidden print:inline">
                              {c.status === 'ACTIVE' ? 'Activo' : c.status === 'PENDING' ? 'Próximo' : 'Vencido'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
