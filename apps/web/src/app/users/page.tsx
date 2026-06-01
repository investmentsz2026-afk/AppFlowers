'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import {
  UserPlus,
  Search,
  User,
  Mail,
  Lock,
  Edit2,
  Trash2,
  X,
  Shield,
  Briefcase,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Filtros
  const [search, setSearch] = useState('');

  // Modales
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Formulario
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // 1. CONSULTA: Obtener lista de usuarios
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  // 2. MUTACIONES
  // Mutation: Crear/Editar Usuario
  const userMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return api.patch(`/users/${editingUser.id}`, data);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setUserModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
    },
  });

  // Mutation: Eliminar Usuario
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error al eliminar usuario.');
    },
  });

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'STAFF',
    });
    setEditingUser(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setUserModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '', // Vacía por defecto para edición
      role: user.role,
    });
    setFormError(null);
    setFormSuccess(null);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    if (user.id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario administrador.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar definitivamente al usuario ${user.name}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Por favor ingrese el Nombre y el Correo electrónico.');
      return;
    }

    if (!editingUser && !form.password) {
      setFormError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (form.password && form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    if (form.password.trim() !== '') {
      payload.password = form.password;
    }

    userMutation.mutate(payload);
  };

  // Filtrar en memoria
  const filteredUsers = users.filter((u: any) => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Gestión de Personal y Usuarios
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Registra y administra las cuentas de acceso de trabajadores del sistema.
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95"
            >
              <UserPlus className="h-5 w-5" />
              Nuevo Trabajador
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por Nombre o Correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Listado de Usuarios */}
        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
            Error al consultar personal. Intente recargando la página.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-gray-400 shadow-sm">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No se encontraron trabajadores</h3>
            <p className="mt-1 text-xs text-gray-500">Crea una cuenta nueva para dar acceso al sistema.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TABLA DE ESCRITORIO (MD+) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 border-b border-border">
                      <th className="px-6 py-4">Nombre y Apellidos</th>
                      <th className="px-6 py-4">Correo Electrónico</th>
                      <th className="px-6 py-4 text-center">Rol de Acceso</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <span>{u.name} {u.id === currentUser?.id && <span className="text-[10px] font-normal text-gray-400">(Tú)</span>}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">{u.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          }`}>
                            {u.role === 'ADMIN' ? 'Administrador' : 'Trabajador'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all duration-200"
                              title="Editar Usuario"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={u.id === currentUser?.id}
                              onClick={() => handleDeleteUser(u)}
                              className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg border transition-all duration-200 ${
                                u.id === currentUser?.id
                                  ? 'bg-gray-300/10 text-gray-300 border-gray-300/10 cursor-not-allowed opacity-30'
                                  : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                              }`}
                              title="Eliminar Trabajador"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TARJETAS MÓVILES */}
            <div className="grid gap-4 sm:grid-cols-2 md:hidden">
              {filteredUsers.map((u: any) => (
                <div key={u.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm leading-snug">
                        {u.name} {u.id === currentUser?.id && <span className="text-[10px] font-normal text-gray-400">(Tú)</span>}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      u.role === 'ADMIN'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    }`}>
                      {u.role === 'ADMIN' ? 'Administrador' : 'Trabajador'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        disabled={u.id === currentUser?.id}
                        onClick={() => handleDeleteUser(u)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                          u.id === currentUser?.id
                            ? 'bg-gray-300/10 text-gray-300 border-gray-300/10 cursor-not-allowed opacity-30'
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: REGISTRAR O EDITAR USUARIO */}
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUserModalOpen(false)} />
            <div className="relative w-full max-w-md max-h-[90vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* X */}
              <button
                onClick={() => setUserModalOpen(false)}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-secondary focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <UserPlus className="h-5 w-5 text-primary" />
                {editingUser ? 'Editar Trabajador' : 'Registrar Nuevo Trabajador'}
              </h3>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                  {/* Feedback */}
                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre Completo *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej. Juan Pérez"
                        className="block w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Correo */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Correo Electrónico *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="correo@flowers.com"
                        className="block w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Rol */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Rol de Acceso *</label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Shield className="h-4 w-4" />
                      </div>
                      <select
                        value={form.role}
                        onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                        className="block w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none cursor-pointer"
                      >
                        <option value="STAFF">Trabajador (STAFF)</option>
                        <option value="ADMIN">Administrador (ADMIN)</option>
                      </select>
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {editingUser ? 'Nueva Contraseña (Dejar en blanco para conservar)' : 'Contraseña de Acceso *'}
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required={!editingUser}
                        value={form.password}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                        className="block w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end border-t border-border pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={userMutation.isPending}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {userMutation.isPending ? 'Procesando...' : editingUser ? 'Actualizar' : 'Registrar'}
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
