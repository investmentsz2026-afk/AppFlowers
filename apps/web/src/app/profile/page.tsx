'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import { User, Mail, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, token, login } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar datos actuales del usuario al cargar la página
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones básicas
    if (!form.name.trim() || !form.email.trim()) {
      setError('El nombre y el correo electrónico son campos obligatorios.');
      return;
    }

    if (form.password) {
      if (form.password.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setSaving(true);

    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.password.trim() !== '') {
        payload.password = form.password;
      }

      const response = await api.put('/auth/profile', payload);
      
      // Actualizar el estado global de Zustand y localStorage con el nuevo token y usuario
      login(response.data.user, response.data.accessToken);

      setSuccess('¡Perfil actualizado con éxito!');
      setForm(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Ocurrió un error al actualizar el perfil. Intente nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Mi Perfil
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra tus credenciales personales de acceso y datos del sistema.
          </p>
        </div>

        {/* Tarjeta de Información de Usuario */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 text-white shadow-md">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{user?.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/10">
                  Rol: {user?.role === 'ADMIN' ? 'Administrador' : 'Trabajador'}
                </span>
                <span className="text-xs text-gray-400 font-mono">{user?.email}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensajes de feedback */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 font-medium animate-shake">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombres */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nombres y Apellidos *</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Rossy Diaz"
                    className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
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
                    placeholder="correo@ejemplo.com"
                    className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <h4 className="text-xs font-bold text-primary dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Seguridad / Cambiar Contraseña (Dejar en blanco para no modificar)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nueva Contraseña</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Confirmar Contraseña</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Repite la contraseña"
                      className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end pt-4 mt-6 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Guardando Cambios...' : 'Guardar Cambios de Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
