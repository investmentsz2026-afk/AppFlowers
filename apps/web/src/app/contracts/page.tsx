'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ContractModal } from '../../components/ContractModal';
import { 
  Search, 
  Layers, 
  FileSignature, 
  ChevronLeft, 
  ChevronRight, 
  FileText
} from 'lucide-react';

export default function ContractsPage() {
  // 1. Estados de Filtros y Paginación
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Estados para Modal de Contrato
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractClientId, setContractClientId] = useState<string | null>(null);

  // 2. CONSULTA: Obtener Sectores para dropdown de filtros
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectorsListContracts'],
    queryFn: async () => {
      const response = await api.get('/sectors');
      return response.data;
    },
  });

  // 3. CONSULTA: Obtener Lista Paginada de Clientes (compartiendo la misma lógica que el padrón de clientes)
  const { data: clientsData, isLoading, isError } = useQuery({
    queryKey: ['clientsListContracts', search, sectorFilter, page],
    queryFn: async () => {
      const response = await api.get('/clients', {
        params: {
          search: search || undefined,
          sectorId: sectorFilter || undefined,
          page,
          limit,
        },
      });
      return response.data;
    },
  });

  const handleOpenContract = (clientId: string) => {
    setContractClientId(clientId);
    setContractModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 print:hidden">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Buscador de Contratos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Busca y visualiza los contratos de prestación de servicios de cada cliente.
          </p>
        </div>

        {/* 1. SECCIÓN DE FILTROS */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Buscador */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Nombre, DNI, Teléfono o Sector..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Selector de Sector */}
          <div className="flex flex-wrap w-full md:w-auto gap-3 items-center">
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-2.5 py-1.5 w-full sm:w-auto">
              <Layers className="h-4 w-4 text-gray-400" />
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-sm outline-none border-none pr-6 cursor-pointer w-full"
              >
                <option value="">Todos los Sectores</option>
                {sectors.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. LISTADO DE CONTRATOS */}
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError || !clientsData ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al consultar contratos de clientes. Intente recargando la página.
          </div>
        ) : clientsData.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400 shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No se encontraron contratos</h3>
            <p className="mt-1 text-xs text-gray-500">Intenta reajustando tus filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TABLA DE ESCRITORIO (MD+) */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-border">
                      <th className="px-6 py-4">Cliente Responsable</th>
                      <th className="px-6 py-4">Difunto</th>
                      <th className="px-6 py-4">DNI</th>
                      <th className="px-6 py-4">Sector</th>
                      <th className="px-6 py-4">Ubicación</th>
                      <th className="px-6 py-4">Flores / Arreglo</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {clientsData.data.map((client: any) => (
                      <tr key={client.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-gray-700 dark:text-gray-300">{client.contactName || '-'}</td>
                        <td className="px-6 py-3.5 font-bold text-foreground">{client.fullName}</td>
                        <td className="px-6 py-3.5 text-gray-500 font-mono">{client.dni}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                            {client.sector?.name || 'Sin Sector'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-gray-600 dark:text-gray-400">{client.address || '-'}</td>
                        <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400 italic">{client.flowers || '-'}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenContract(client.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white px-3 py-1.5 text-xs font-bold transition-all duration-200"
                            title="Ver Contrato de Servicio"
                          >
                            <FileSignature className="h-4 w-4" />
                            Ver Contrato
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TARJETAS MÓVILES */}
            <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
              {clientsData.data.map((client: any) => (
                <div key={client.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-foreground text-sm leading-snug">{client.fullName}</h4>
                    <p className="text-[11px] text-gray-400">DNI: <span className="font-mono">{client.dni}</span></p>
                    <p className="text-[11px] text-gray-400">Responsable: <span className="font-semibold text-gray-600 dark:text-gray-300">{client.contactName || '-'}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] border-t border-border pt-3">
                    <div>
                      <p className="text-gray-400">Sector</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">{client.sector?.name || 'Sin Sector'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Ubicación</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 font-mono">{client.address || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400">Flores</p>
                      <p className="font-semibold text-gray-600 dark:text-gray-300 italic">{client.flowers || '-'}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <button
                      onClick={() => handleOpenContract(client.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 text-white py-2 text-xs font-bold shadow-md hover:bg-indigo-600 transition-colors"
                    >
                      <FileSignature className="h-4 w-4" />
                      Ver Contrato de Servicio
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINACIÓN */}
            <div className="flex items-center justify-between border-t border-border bg-card rounded-2xl px-6 py-4 shadow-sm">
              <span className="text-xs text-gray-400 font-semibold">
                Página {page} de {clientsData.meta.totalPages || 1}
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
                  disabled={page >= clientsData.meta.totalPages}
                  onClick={() => setPage(p => Math.min(clientsData.meta.totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-gray-500 disabled:opacity-40 hover:bg-border transition-colors focus:outline-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: VISOR DE CONTRATO */}
      <ContractModal
        clientId={contractClientId}
        isOpen={contractModalOpen}
        onClose={() => {
          setContractModalOpen(false);
          setContractClientId(null);
        }}
      />
    </DashboardLayout>
  );
}
