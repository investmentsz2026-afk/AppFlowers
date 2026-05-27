'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Phone, 
  FileText, 
  CreditCard, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  UserPlus,
  Coins,
  FileSpreadsheet,
  Upload
} from 'lucide-react';

const formatUtcDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export default function ClientsPage() {
  const queryClient = useQueryClient();
  
  // 1. Estados de Filtros y Paginación
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // 2. Estados de Modales y Selección
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentClient, setPaymentClient] = useState<any | null>(null);

  // C. Estados para Importación Masiva
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // A. Formularios Locales - Crear/Editar Cliente
  const [clientForm, setClientForm] = useState({
    fullName: '',
    contactName: '',
    dni: '',
    phone: '',
    address: '',
    flowers: '',
    amount: 10.0,
    sectorId: '',
    remarks: '',
    lastPaymentDate: '',
    nextDueDate: '',
  });

  // B. Formularios Locales - Registrar Pago
  const [paymentForm, setPaymentForm] = useState({
    amount: 50,
    paymentMethod: 'CASH',
    monthsToRenew: 1,
    remarks: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 3. CONSULTA: Obtener Sectores para dropdowns de filtros y formularios
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectorsList'],
    queryFn: async () => {
      const response = await api.get('/sectors');
      return response.data;
    },
  });

  // 4. CONSULTA: Obtener Lista Paginada de Clientes
  const { data: clientsData, isLoading, isError } = useQuery({
    queryKey: ['clientsList', search, statusFilter, sectorFilter, page],
    queryFn: async () => {
      const response = await api.get('/clients', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          sectorId: sectorFilter || undefined,
          page,
          limit,
        },
      });
      return response.data;
    },
  });

  // 5. MUTACIONES (MUTATIONS)
  // Mutation: Crear/Editar Cliente
  const clientMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingClient) {
        return api.patch(`/clients/${editingClient.id}`, data);
      }
      return api.post('/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setClientModalOpen(false);
      resetClientForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error en la petición.');
    },
  });

  // Mutation: Registrar Pago
  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setPaymentModalOpen(false);
      setPaymentClient(null);
      setPaymentForm({ amount: 50, paymentMethod: 'CASH', monthsToRenew: 1, remarks: '' });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error al procesar pago.');
    },
  });

  // Mutation: Eliminar Cliente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientsList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportResult(null);
      setFormError(null);
    }
  };

  const handleProcessImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setFormError(null);
    setImportResult(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          let parsedData: any[] = [];

          if (importFile.name.endsWith('.csv')) {
            const text = data as string;
            const lines = text.split('\n');
            if (lines.length <= 1) throw new Error('El archivo CSV está vacío.');

            const headerLine = lines[0];
            const separator = headerLine.includes(';') ? ';' : ',';
            const headers = headerLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));

            // Helper para parsear una línea de CSV respetando comillas y comas internas
            const parseCsvLine = (textLine: string, sep: string) => {
              const result: string[] = [];
              let inQuotes = false;
              let token = '';
              for (let j = 0; j < textLine.length; j++) {
                const char = textLine[j];
                if (char === '"' || char === "'") {
                  inQuotes = !inQuotes;
                } else if (char === sep && !inQuotes) {
                  result.push(token.trim().replace(/^["']|["']$/g, ''));
                  token = '';
                } else {
                  token += char;
                }
              }
              result.push(token.trim().replace(/^["']|["']$/g, ''));
              return result;
            };

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              const values = parseCsvLine(line, separator);
              
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              parsedData.push(row);
            }
          } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(sheet);
          }

          if (parsedData.length === 0) {
            throw new Error('No se encontraron registros válidos en el archivo.');
          }

          // Normalizar columnas en español a campos esperados
          const normalizedData = parsedData.map(row => {
            const findValue = (keys: string[]) => {
              const foundKey = Object.keys(row).find(k => 
                keys.some(key => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(key.toLowerCase()))
              );
              return foundKey ? row[foundKey] : undefined;
            };

            return {
              fullName: findValue(['fullName', 'nombre completo', 'difunto', 'nombre']),
              dni: findValue(['dni', 'documento', 'identidad']),
              contactName: findValue(['contactName', 'contacto', 'familiar', 'responsable']),
              phone: findValue(['phone', 'telefono', 'celular']),
              address: findValue(['address', 'direccion', 'ubicacion', 'parcela', 'nicho']),
              flowers: findValue(['flowers', 'flores', 'arreglo']),
              amount: parseFloat(findValue(['amount', 'monto', 'precio', 'mensualidad', 'pago'])?.toString() || '0') || undefined,
              remarks: findValue(['remarks', 'observaciones', 'notas', 'comentarios']),
              sectorName: findValue(['sectorName', 'sector', 'zona']),
              lastPaymentDate: findValue(['lastPaymentDate', 'inicio', 'fecha inicio', 'ultimo pago']),
              nextDueDate: findValue(['nextDueDate', 'vencimiento', 'fecha vencimiento', 'limite']),
            };
          });

          const response = await api.post('/clients/bulk', normalizedData);
          setImportResult(response.data);
          
          queryClient.invalidateQueries({ queryKey: ['clientsList'] });
          queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        } catch (err: any) {
          setFormError(err.response?.data?.message || err.message || 'Error al procesar el archivo. Verifique el formato.');
        } finally {
          setImporting(false);
        }
      };

      if (importFile.name.endsWith('.csv')) {
        reader.readAsText(importFile, 'UTF-8');
      } else {
        reader.readAsBinaryString(importFile);
      }
    } catch (err: any) {
      setFormError('No se pudo leer el archivo.');
      setImporting(false);
    }
  };

  // Helpers de formularios
  const resetClientForm = () => {
    setClientForm({
      fullName: '',
      contactName: '',
      dni: '',
      phone: '',
      address: '',
      flowers: '',
      amount: 10.0,
      sectorId: sectors.length > 0 ? sectors[0].id : '',
      remarks: '',
      lastPaymentDate: '',
      nextDueDate: '',
    });
    setEditingClient(null);
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetClientForm();
    if (sectors.length > 0) {
      setClientForm(prev => ({ ...prev, sectorId: sectors[0].id }));
    }
    setClientModalOpen(true);
  };

  const handleOpenEditModal = (client: any) => {
    setEditingClient(client);
    setClientForm({
      fullName: client.fullName,
      contactName: client.contactName || '',
      dni: client.dni,
      phone: client.phone,
      address: client.address,
      flowers: client.flowers || '',
      amount: client.amount ? parseFloat(client.amount) : 10.0,
      sectorId: client.sectorId,
      remarks: client.remarks || '',
      lastPaymentDate: client.lastPaymentDate ? new Date(client.lastPaymentDate).toISOString().split('T')[0] : '',
      nextDueDate: client.nextDueDate ? new Date(client.nextDueDate).toISOString().split('T')[0] : '',
    });
    setClientModalOpen(true);
  };

  const handleOpenPaymentModal = (client: any) => {
    setPaymentClient(client);
    setPaymentModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validaciones básicas
    if (!clientForm.fullName || !clientForm.dni) {
      setFormError('Por favor ingrese al menos el Nombre completo y el DNI.');
      return;
    }

    const payload: any = { 
      ...clientForm,
      phone: clientForm.phone ? clientForm.phone.trim() : undefined,
      address: clientForm.address ? clientForm.address.trim() : undefined,
      sectorId: clientForm.sectorId || undefined,
      lastPaymentDate: clientForm.lastPaymentDate || undefined,
      nextDueDate: clientForm.nextDueDate || undefined,
      amount: parseFloat(clientForm.amount.toString()) || 0.0
    };

    clientMutation.mutate(payload);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    paymentMutation.mutate({
      clientId: paymentClient.id,
      amount: parseFloat(paymentForm.amount.toString()),
      paymentMethod: paymentForm.paymentMethod,
      monthsToRenew: parseInt(paymentForm.monthsToRenew.toString(), 10),
      remarks: paymentForm.remarks || undefined,
    });
  };

  const handleDeleteClient = (client: any) => {
    if (window.confirm(`¿Está seguro de eliminar definitivamente a ${client.fullName}? Se perderán todos sus pagos registrados.`)) {
      deleteMutation.mutate(client.id);
    }
  };

  // Helper Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">
            Activo
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500 border border-amber-500/20">
            Próximo a Vencer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-500 border border-red-500/20 animate-pulse">
            Vencido
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Gestión de Clientes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Administra el padrón de clientes, ubicaciones y vigencias de servicios.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setImportFile(null);
                setImportResult(null);
                setFormError(null);
                setImportModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 active:scale-95"
            >
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <span className="hidden sm:inline">Importar Excel/CSV</span>
              <span className="sm:hidden">Importar</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              Nuevo Cliente
            </button>
          </div>
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
                setPage(1); // Reiniciar paginación al filtrar
              }}
              className="block w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Selector de Estado y Sector */}
          <div className="flex flex-wrap w-full md:w-auto gap-3 items-center">
            {/* Filtro Sector */}
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

            {/* Filtro Estado */}
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-2.5 py-1.5 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-sm outline-none border-none pr-6 cursor-pointer w-full"
              >
                <option value="">Todos los Estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="PENDING">Próximos a Vencer</option>
                <option value="EXPIRED">Vencidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. LISTADO DE CLIENTES */}
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError || !clientsData ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al consultar clientes. Intente recargando la página.
          </div>
        ) : clientsData.data.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400 shadow-sm">
            <Plus className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No se encontraron clientes</h3>
            <p className="mt-1 text-xs text-gray-500">Intenta reajustando tus filtros o registra un cliente nuevo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TABLA DE ESCRITORIO (MD+) */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-border">
                      <th className="px-3 py-3">Contacto</th>
                      <th className="px-3 py-3">Difunto</th>
                      <th className="px-3 py-3">DNI</th>
                      <th className="px-3 py-3">Teléfono</th>
                      <th className="px-3 py-3">Sector</th>
                      <th className="px-3 py-3">Ubicación</th>
                      <th className="px-3 py-3">Monto</th>
                      <th className="px-3 py-3">Flores</th>
                      <th className="px-3 py-3">Inicio</th>
                      <th className="px-3 py-3 text-center">Días</th>
                      <th className="px-3 py-3">Vencimiento</th>
                      <th className="px-3 py-3 text-center">Días Venc.</th>
                      <th className="px-3 py-3 text-center">Estado</th>
                      <th className="px-3 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {clientsData.data.map((client: any) => {
                      const today = new Date();
                      const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                      let daysElapsed = 0;
                      if (client.lastPaymentDate) {
                        const startDate = new Date(client.lastPaymentDate);
                        const startReset = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
                        const diffTime = todayReset.getTime() - startReset.getTime();
                        daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                      }

                      let daysRemaining = 0;
                      if (client.nextDueDate) {
                        const dueDate = new Date(client.nextDueDate);
                        const dueReset = new Date(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
                        const diffTime = dueReset.getTime() - todayReset.getTime();
                        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      }

                      return (
                        <tr key={client.id} className="hover:bg-secondary/15 transition-colors">
                          <td className="px-3 py-3.5 font-medium text-gray-700 dark:text-gray-300">{client.contactName || '-'}</td>
                          <td className="px-3 py-3.5 font-bold text-foreground">{client.fullName}</td>
                          <td className="px-3 py-3.5 text-gray-500 font-mono">{client.dni}</td>
                          <td className="px-3 py-3.5 text-gray-500 font-mono">{client.phone}</td>
                          <td className="px-3 py-3.5">
                            <span className="inline-flex items-center gap-1 font-medium text-primary dark:text-blue-400 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                              {client.sector?.name}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-gray-600 dark:text-gray-400">{client.address}</td>
                          <td className="px-3 py-3.5 font-bold text-emerald-500 font-mono">S/. {client.amount ? client.amount.toFixed(2) : '0.00'}</td>
                          <td className="px-3 py-3.5 text-gray-600 dark:text-gray-400 italic">{client.flowers || '-'}</td>
                          <td className="px-3 py-3.5 text-gray-500 font-mono">
                            {formatUtcDate(client.lastPaymentDate)}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-indigo-500 dark:text-indigo-400">
                            {daysElapsed}
                          </td>
                          <td className="px-3 py-3.5 text-gray-500 font-mono">
                            {formatUtcDate(client.nextDueDate)}
                          </td>
                          <td className={`px-3 py-3.5 text-center font-mono font-bold ${
                            daysRemaining < 0 
                              ? 'text-red-500' 
                              : daysRemaining <= 7 
                              ? 'text-amber-500' 
                              : 'text-emerald-500'
                          }`}>
                            {daysRemaining < 0 ? `Vencido (${Math.abs(daysRemaining)}d)` : `${daysRemaining}d`}
                          </td>
                          <td className="px-3 py-3.5 text-center">{getStatusBadge(client.status)}</td>
                          <td className="px-3 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenPaymentModal(client)}
                                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-200"
                                title="Cobrar Pago Express"
                              >
                                <Coins className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(client)}
                                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all duration-200"
                                title="Editar Datos"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client)}
                                className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
 
            {/* TARJETAS MÓVILES (TIPO APP) - PARA MD- Y DESKTOP CON POCO ESPACIO */}
            <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
              {clientsData.data.map((client: any) => {
                const today = new Date();
                const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                let daysElapsed = 0;
                if (client.lastPaymentDate) {
                  const startDate = new Date(client.lastPaymentDate);
                  const startReset = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
                  const diffTime = todayReset.getTime() - startReset.getTime();
                  daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                }

                let daysRemaining = 0;
                if (client.nextDueDate) {
                  const dueDate = new Date(client.nextDueDate);
                  const dueReset = new Date(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
                  const diffTime = dueReset.getTime() - todayReset.getTime();
                  daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return (
                  <div key={client.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground text-sm leading-snug">{client.fullName}</h4>
                        <p className="text-[11px] text-gray-400">Contacto: <span className="font-semibold text-gray-600 dark:text-gray-300">{client.contactName || '-'}</span></p>
                        <p className="text-[10px] text-gray-400">DNI: {client.dni}</p>
                      </div>
                      {getStatusBadge(client.status)}
                    </div>
 
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[11px] border-t border-border pt-3">
                      <div>
                        <p className="text-gray-400">Sector</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{client.sector?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Ubicación</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 font-mono">{client.address}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Monto</p>
                        <p className="font-bold text-emerald-500 font-mono">S/. {client.amount ? client.amount.toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Flores</p>
                        <p className="font-semibold text-gray-600 dark:text-gray-300 italic">{client.flowers || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Teléfono</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 font-mono">{client.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Días Transc.</p>
                        <p className="font-bold text-indigo-500 font-mono">{daysElapsed} días</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Inicio / Vence</p>
                        <p className="font-medium text-gray-600 dark:text-gray-300 font-mono text-[10px]">
                          {formatUtcDate(client.lastPaymentDate)} / {formatUtcDate(client.nextDueDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Días Restantes</p>
                        <p className={`font-bold font-mono ${
                          daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {daysRemaining < 0 ? `Vencido (${Math.abs(daysRemaining)}d)` : `${daysRemaining} días`}
                        </p>
                      </div>
                    </div>
 
                    <div className="flex gap-2 border-t border-border pt-3">
                      <button
                        onClick={() => handleOpenPaymentModal(client)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white py-2 text-xs font-bold shadow-md hover:bg-emerald-600 transition-colors"
                      >
                        <Coins className="h-3.5 w-3.5" /> Cobrar
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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

        {/* 3. MODAL: CREAR O EDITAR CLIENTE */}
        {clientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setClientModalOpen(false)} />
            <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Botón X */}
              <button
                onClick={() => setClientModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
                {editingClient ? 'Editar Datos del Cliente / Campo Santo' : 'Registrar Nuevo Cliente / Campo Santo'}
              </h3>

              <form onSubmit={handleSaveClient} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COLUMNA 1: Datos Personales e Identificación */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider border-b border-border pb-1">
                        Información del Difunto y Ubicación
                      </h4>

                      {/* Nombre del difunto */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nombres y Apellidos del Difunto *</label>
                        <input
                          type="text"
                          required
                          value={clientForm.fullName}
                          onChange={(e) => setClientForm(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Ej. Betty Doris Gomez Cardenas"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* DNI */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DNI *</label>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={clientForm.dni}
                            onChange={(e) => setClientForm(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                            placeholder="8 dígitos"
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Teléfono</label>
                          <input
                            type="text"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Ej. 997125631"
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Sector */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Sector Físico</label>
                          <select
                            value={clientForm.sectorId}
                            onChange={(e) => setClientForm(prev => ({ ...prev, sectorId: e.target.value }))}
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="">Ninguno / Sin Sector</option>
                            {sectors.map((sec: any) => (
                              <option key={sec.id} value={sec.id}>
                                {sec.name} (Disp: {sec.available})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Ubicación */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Ubicación (Parcela/Nicho)</label>
                          <input
                            type="text"
                            value={clientForm.address}
                            onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Ej. N:FO20-03"
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Nombre del contacto */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre del Contacto (Pariente/Responsable)</label>
                        <input
                          type="text"
                          value={clientForm.contactName}
                          onChange={(e) => setClientForm(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Ej. Jhosep Gomez Cardenas"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* COLUMNA 2: Flores, Monto, Fechas y Observaciones */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider border-b border-border pb-1">
                        Servicio, Plazos y Observaciones
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Flores */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Flores / Arreglo</label>
                          <input
                            type="text"
                            value={clientForm.flowers}
                            onChange={(e) => setClientForm(prev => ({ ...prev, flowers: e.target.value }))}
                            placeholder="Ej. Ramo Variado"
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Monto */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Monto S/. *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={clientForm.amount}
                            onChange={(e) => setClientForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0.0 }))}
                            placeholder="Ej. 10.00"
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-emerald-500 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Fecha Inicio */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha de Inicio</label>
                          <input
                            type="date"
                            value={clientForm.lastPaymentDate}
                            onChange={(e) => setClientForm(prev => ({ ...prev, lastPaymentDate: e.target.value }))}
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary font-mono text-gray-700 dark:text-gray-300"
                          />
                        </div>

                        {/* Fecha Vencimiento */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha Vencimiento</label>
                          <input
                            type="date"
                            value={clientForm.nextDueDate}
                            onChange={(e) => setClientForm(prev => ({ ...prev, nextDueDate: e.target.value }))}
                            className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary font-mono text-gray-700 dark:text-gray-300"
                          />
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Observaciones / Detalles Especiales</label>
                        <textarea
                          value={clientForm.remarks}
                          onChange={(e) => setClientForm(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Ej. Observaciones generales del servicio..."
                          rows={3}
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Errores */}
                  {formError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium animate-bounce">
                      {formError}
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setClientModalOpen(false)}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={clientMutation.isPending}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {clientMutation.isPending ? 'Guardando...' : editingClient ? 'Confirmar Edición' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL: REGISTRAR PAGO EXPRESS */}
        {paymentModalOpen && paymentClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
            <div className="relative w-full max-w-md max-h-[90vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* X */}
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="shrink-0">
                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                  <Coins className="h-6 w-6 text-emerald-500" />
                  Registrar Pago Exprés
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Cliente: <span className="font-bold text-foreground">{paymentClient.fullName}</span> (DNI: {paymentClient.dni})
                </p>
              </div>

              <form onSubmit={handleSavePayment} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 scrollbar-thin">
                  {/* Monto del Pago */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Monto Recibido (S/.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none font-bold text-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Método de Pago */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Método *</label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none cursor-pointer"
                      >
                        <option value="CASH">Efectivo</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="TRANSFER">Transferencia</option>
                      </select>
                    </div>

                    {/* Meses a Renovar */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Renovar por (Meses) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={paymentForm.monthsToRenew}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, monthsToRenew: parseInt(e.target.value, 10) || 1 }))}
                        className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* Comentarios del Pago */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Notas del Pago / Recibo</label>
                    <input
                      type="text"
                      value={paymentForm.remarks}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Ej. Recibo de florería adicional. Nro de Operación..."
                      className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  {/* Simulación del Vencimiento */}
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    💡 Este pago extenderá automáticamente el vencimiento de este cliente por {paymentForm.monthsToRenew} mes(es) y re-activará su estado de pago.
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium">
                      {formError}
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={paymentMutation.isPending}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 active:scale-95 disabled:opacity-60"
                  >
                    {paymentMutation.isPending ? 'Procesando...' : 'Confirmar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. MODAL: IMPORTACIÓN MASIVA */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !importing && setImportModalOpen(false)} />
            <div className="relative w-full max-w-xl max-h-[95vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <button
                disabled={importing}
                onClick={() => setImportModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary disabled:opacity-40 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2 shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-emerald-500" />
                Importar Clientes Masivamente
              </h3>
              <p className="text-xs text-gray-500 mb-4 shrink-0">
                Carga múltiples clientes desde un archivo Excel (`.xlsx`, `.xls`) o archivo separado por comas (`.csv`).
              </p>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin text-xs">
                {/* Instrucciones del formato */}
                <div className="rounded-xl bg-secondary/50 p-4 space-y-2 text-gray-600 dark:text-gray-300">
                  <p className="font-bold text-foreground">Formato de Columnas Admitido:</p>
                  <p>La aplicación asocia de forma inteligente las siguientes columnas (mayúsculas, minúsculas o tildes):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-foreground">Nombre completo / Difunto:</strong> Nombre del difunto (Obligatorio)</li>
                    <li><strong className="text-foreground">DNI:</strong> Documento nacional de identidad - 8 dígitos (Obligatorio)</li>
                    <li><strong className="text-foreground">Contacto / Pariente:</strong> Nombre del responsable de los pagos (Opcional)</li>
                    <li><strong className="text-foreground">Teléfono:</strong> Teléfono de contacto (Opcional)</li>
                    <li><strong className="text-foreground">Dirección / Ubicación / Parcela:</strong> Ubicación física (Opcional)</li>
                    <li><strong className="text-foreground">Sector / Zona:</strong> Nombre del sector (Opcional, se creará si no existe)</li>
                    <li><strong className="text-foreground">Flores:</strong> Tipo de flores o arreglo (Opcional)</li>
                    <li><strong className="text-foreground">Monto:</strong> Costo del servicio (Opcional, por defecto 0.0)</li>
                    <li><strong className="text-foreground">Inicio / Fecha Inicio:</strong> Fecha del último pago (AAAA-MM-DD, Opcional)</li>
                    <li><strong className="text-foreground">Vencimiento / Límite:</strong> Fecha de vencimiento (AAAA-MM-DD, Opcional)</li>
                  </ul>
                </div>

                {/* Subir archivo */}
                {!importResult && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Seleccionar Archivo</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-background hover:bg-secondary/20 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="mb-1 text-sm font-semibold text-gray-500 text-center px-4">
                            {importFile ? importFile.name : 'Haz clic para subir o arrastra'}
                          </p>
                          <p className="text-[10px] text-gray-400 text-center">Excel (.xlsx, .xls) o CSV (.csv)</p>
                        </div>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleImportFileChange}
                          className="hidden"
                          disabled={importing}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Resultados del procesamiento */}
                {importResult && (
                  <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/20">
                    <h4 className="font-bold text-sm text-foreground">Resultado de la Importación:</h4>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                        <p className="text-[20px] font-bold text-emerald-500">{importResult.successCount}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Exitosos</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                        <p className="text-[20px] font-bold text-red-500">{importResult.failedCount}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Fallidos</p>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <p className="font-bold text-[11px] text-red-500">Listado de Errores encontrados:</p>
                        <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-card divide-y divide-border p-2 space-y-1 scrollbar-thin">
                          {importResult.errors.map((err: any, idx: number) => (
                            <div key={idx} className="text-[10px] py-1 flex items-start gap-2">
                              <span className="bg-red-500/15 text-red-500 font-bold px-1 rounded shrink-0">Fila {err.row}</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">{err.client}:</span>
                              <span className="text-gray-500">{err.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-500 font-medium">
                    ⚠️ {formError}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4 shrink-0">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setImportModalOpen(false)}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  {importResult ? 'Cerrar' : 'Cancelar'}
                </button>
                {!importResult && (
                  <button
                    type="button"
                    disabled={!importFile || importing}
                    onClick={handleProcessImport}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-5 py-2 text-sm font-semibold shadow-md hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Importando...
                      </>
                    ) : (
                      'Procesar Archivo'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
