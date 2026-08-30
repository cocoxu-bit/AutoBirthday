'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Smartphone, 
  Gift, 
  FileText, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AdminAnalyticsData, AdminUserRecord, getAdminAnalyticsDataAction } from '@/app/admin/actions';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { toast } from 'sonner';

interface AdminDashboardProps {
  initialData: AdminAnalyticsData;
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data, setData] = useState<AdminAnalyticsData>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminAnalyticsDataAction();
      if (res.success && res.data) {
        setData(res.data);
        toast.success('Métricas actualizadas');
      } else {
        toast.error(res.error || 'Error al actualizar métricas');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = data.users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.whatsappPhone && u.whatsappPhone.includes(searchTerm));

    if (!matchesSearch) return false;
    if (statusFilter === 'connected') return u.whatsappStatus === 'connected';
    if (statusFilter === 'disconnected') return u.whatsappStatus !== 'connected';
    return true;
  });

  const { summary } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Panel de Administración
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Exclusivo
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Analítica global de usuarios, conexiones de WhatsApp y adopción en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50"
            title="Recargar datos de Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
          </button>

          <Link
            href="/dashboard"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#285953] to-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:from-[#1f4742] hover:to-emerald-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la App</span>
          </Link>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Usuarios Totales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Usuarios Registrados</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalUsers}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
              <span className="text-emerald-600 font-bold">+{summary.newUsersLast7Days}</span> en los últimos 7 días
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
            +{summary.newUsersLast30Days} en los últimos 30 días
          </div>
        </div>

        {/* KPI 2: WhatsApp Conectados */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp Conectados</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <WhatsAppIcon className="w-5 h-5" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.whatsappConnectedCount}</p>
              <span className="text-sm font-extrabold text-emerald-600">({summary.whatsappConnectedRate}%)</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {summary.totalUsers - summary.whatsappConnectedCount} pendientes de vincular
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all" 
              style={{ width: `${summary.whatsappConnectedRate}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: Total Contactos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contactos en Agenda</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalContacts}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Promedio: <strong className="text-slate-800 font-bold">{summary.avgContactsPerUser}</strong> contactos / usuario
            </p>
          </div>
          <div className="text-[11px] text-emerald-600 border-t border-slate-100 pt-2 font-bold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{summary.totalActiveContacts} contactos activos</span>
          </div>
        </div>

        {/* KPI 4: Felicitaciones */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Felicitaciones Enviadas</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalWishesSent}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Total procesadas con IA o mensaje fijo
            </p>
          </div>
          <div className="text-[11px] text-indigo-600 border-t border-slate-100 pt-2 font-bold flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{summary.totalTemplates} plantillas creadas</span>
          </div>
        </div>

      </div>

      {/* USER LIST & ANALYTICS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        
        {/* Controls Bar: Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({data.users.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('connected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'connected' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Conectados ({summary.whatsappConnectedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disconnected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'disconnected' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sin WhatsApp ({data.users.length - summary.whatsappConnectedCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 px-3">Usuario</th>
                <th className="pb-3 px-3">Registro</th>
                <th className="pb-3 px-3">WhatsApp</th>
                <th className="pb-3 px-3 text-center">Contactos</th>
                <th className="pb-3 px-3 text-center">Felicitaciones</th>
                <th className="pb-3 px-3 text-center">Plantillas</th>
                <th className="pb-3 px-3 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron usuarios con ese criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isConnected = u.whatsappStatus === 'connected';

                  return (
                    <tr 
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* User Column */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <Image
                              src={u.photoURL}
                              alt={u.displayName}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              {u.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {u.email === 'lucasjimeneznavarro@gmail.com' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-extrabold">ADMIN</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {u.createdAt}
                      </td>

                      {/* WhatsApp Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Conectado</span>
                            {u.whatsappPhone && (
                              <span className="text-[10px] text-emerald-600 font-normal">
                                (+{u.whatsappPhone.slice(0, 3)}...)
                              </span>
                            )}
                          </span>
                        ) : u.whatsappStatus === 'qrcode' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Escaneando QR</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                            <span>Desconectado</span>
                          </span>
                        )}
                      </td>

                      {/* Contacts Count */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                          u.contactsCount > 0 
                            ? 'bg-teal-50 text-teal-800 border border-teal-200/60 font-black' 
                            : 'text-slate-400'
                        }`}>
                          {u.contactsCount}
                          {u.contactsCount > 0 && (
                            <span className="text-[10px] text-teal-600 font-medium ml-1">
                              ({u.activeContactsCount} act.)
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Wishes Count */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                          u.wishesSentCount > 0 
                            ? 'bg-purple-50 text-purple-800 border border-purple-200/60 font-black' 
                            : 'text-slate-400'
                        }`}>
                          {u.wishesSentCount}
                        </span>
                      </td>

                      {/* Templates Count */}
                      <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">
                        {u.templatesCount}
                      </td>

                      {/* Action Detail */}
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div 
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#285953] to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  {selectedUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">ID Usuario</span>
                <span className="text-xs font-mono text-slate-700 truncate block mt-0.5" title={selectedUser.id}>
                  {selectedUser.id}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Fecha Registro</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">
                  {selectedUser.createdAt}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Estado WhatsApp</span>
                <span className={`text-xs font-bold block mt-0.5 ${
                  selectedUser.whatsappStatus === 'connected' ? 'text-emerald-700' : 'text-slate-600'
                }`}>
                  {selectedUser.whatsappStatus === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
                {selectedUser.whatsappPhone && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    +{selectedUser.whatsappPhone}
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Contactos Guardados</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {selectedUser.contactsCount} ({selectedUser.activeContactsCount} activos)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">Felicitaciones Enviadas:</span>
              </div>
              <span className="font-black text-emerald-800 text-sm">{selectedUser.wishesSentCount}</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
