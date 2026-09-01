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
  UserCheck,
  Trash2,
  AlertTriangle,
  Activity,
  Bot,
  Zap,
  Power,
  RotateCw,
  Send,
  AlertCircle,
  Clock,
  Check,
  HelpCircle,
  Radio,
  Eye
} from 'lucide-react';
import { 
  AdminAnalyticsData, 
  AdminUserRecord, 
  AdminWishRecord,
  AdminSystemTelemetry,
  AdminWhatsAppDiagnostics,
  getAdminAnalyticsDataAction, 
  getAdminGlobalWishesAction,
  getAdminSystemTelemetryAction,
  getUserWhatsAppDiagnosticsAction,
  adminDeleteUserAction,
  adminTestWhatsAppInstanceAction,
  adminRestartWhatsAppInstanceAction,
  adminToggleUserStatusAction,
  adminRetryWishAction,
  adminImpersonateUserAction
} from '@/app/admin/actions';
import { 
  Cpu, 
  Server, 
  HardDrive, 
  Database, 
  Gauge 
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { toast } from 'sonner';

interface AdminDashboardProps {
  initialData: AdminAnalyticsData;
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data, setData] = useState<AdminAnalyticsData>(initialData);
  const [activeTab, setActiveTab] = useState<'users' | 'wishes' | 'system'>('users');
  
  // System Telemetry state
  const [telemetry, setTelemetry] = useState<AdminSystemTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  
  // Users tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'at_risk' | 'suspended'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Diagnostic states
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsAppTestResult, setWhatsAppTestResult] = useState<{ state?: string; message?: string; phone?: string | null } | null>(null);
  const [restartingWhatsApp, setRestartingWhatsApp] = useState(false);
  const [togglingSuspension, setTogglingSuspension] = useState(false);

  // Full WhatsApp Diagnostics Breakdown Modal
  const [diagModalUser, setDiagModalUser] = useState<AdminUserRecord | null>(null);
  const [diagnosticsData, setDiagnosticsData] = useState<AdminWhatsAppDiagnostics | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [diagTab, setDiagTab] = useState<'ready' | 'excluded'>('ready');

  const handleOpenDiagnostics = async (user: AdminUserRecord) => {
    setDiagModalUser(user);
    setDiagnosticsData(null);
    setLoadingDiagnostics(true);
    setDiagTab('ready');
    try {
      const res = await getUserWhatsAppDiagnosticsAction(user.id);
      if (res.success && res.data) {
        setDiagnosticsData(res.data);
      } else {
        toast.error(res.error || 'Error al obtener diagnóstico de WhatsApp');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error de conexión');
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  // Impersonation state
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  const handleImpersonate = async (user: AdminUserRecord) => {
    if (impersonatingUserId) return;
    setImpersonatingUserId(user.id);
    const toastId = toast.loading(`Iniciando sesión como ${user.displayName}...`);

    try {
      const res = await adminImpersonateUserAction(user.id);
      if (!res.success || !res.customToken) {
        toast.error(res.error || 'Error al iniciar sesión como usuario', { id: toastId });
        setImpersonatingUserId(null);
        return;
      }

      const { signInWithCustomToken } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase/config');

      const credential = await signInWithCustomToken(auth, res.customToken);
      const idToken = await credential.user.getIdToken(true);

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast.success(`Conectado como ${user.displayName}. Redirigiendo...`, { id: toastId });
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Impersonate error:', err);
      toast.error('Error al cambiar de sesión.', { id: toastId });
      setImpersonatingUserId(null);
    }
  };

  // Global Wishes tab state
  const [wishes, setWishes] = useState<AdminWishRecord[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [wishFilter, setWishFilter] = useState<'all' | 'sent' | 'needs_approval' | 'pending' | 'failed'>('all');
  const [retryingWishId, setRetryingWishId] = useState<string | null>(null);
  const [previewWish, setPreviewWish] = useState<AdminWishRecord | null>(null);

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

      if (activeTab === 'wishes') {
        await loadGlobalWishes();
      } else if (activeTab === 'system') {
        await loadSystemTelemetry();
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadGlobalWishes = async () => {
    setLoadingWishes(true);
    try {
      const res = await getAdminGlobalWishesAction();
      if (res.success && res.wishes) {
        setWishes(res.wishes);
      } else {
        toast.error(res.error || 'Error al cargar felicitaciones globales');
      }
    } catch {
      toast.error('Error al conectar con la base de datos');
    } finally {
      setLoadingWishes(false);
    }
  };

  const loadSystemTelemetry = async () => {
    setLoadingTelemetry(true);
    try {
      const res = await getAdminSystemTelemetryAction();
      if (res.success && res.data) {
        setTelemetry(res.data);
      } else {
        toast.error(res.error || 'Error al consultar telemetría del servidor');
      }
    } catch {
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleTabChange = (tab: 'users' | 'wishes' | 'system') => {
    setActiveTab(tab);
    if (tab === 'wishes' && wishes.length === 0) {
      loadGlobalWishes();
    } else if (tab === 'system') {
      loadSystemTelemetry();
    }
  };

  // Support Actions
  const handleTestWhatsApp = async (userId: string) => {
    setTestingWhatsApp(true);
    setWhatsAppTestResult(null);
    try {
      const res = await adminTestWhatsAppInstanceAction(userId);
      if (res.success) {
        setWhatsAppTestResult({ state: res.state, message: res.message, phone: res.phone });
        toast.success(`Estado WhatsApp: ${res.state?.toUpperCase()}`);
      } else {
        toast.error(res.error || 'Error al comprobar WhatsApp');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleRestartWhatsApp = async (userId: string) => {
    setRestartingWhatsApp(true);
    try {
      const res = await adminRestartWhatsAppInstanceAction(userId);
      if (res.success) {
        toast.success('Instancia de WhatsApp reiniciada correctamente.');
        handleTestWhatsApp(userId);
      } else {
        toast.error(res.error || 'Error al reiniciar instancia');
      }
    } catch {
      toast.error('Error al enviar orden de reinicio');
    } finally {
      setRestartingWhatsApp(false);
    }
  };

  const handleToggleSuspension = async (user: AdminUserRecord) => {
    setTogglingSuspension(true);
    const newSuspended = !user.isSuspended;
    try {
      const res = await adminToggleUserStatusAction(user.id, newSuspended);
      if (res.success) {
        toast.success(newSuspended ? 'Usuario suspendido temporalmente.' : 'Usuario reactivado.');
        setData(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === user.id ? { ...u, isSuspended: newSuspended } : u),
        }));
        if (selectedUser?.id === user.id) {
          setSelectedUser(prev => prev ? { ...prev, isSuspended: newSuspended } : null);
        }
      } else {
        toast.error(res.error || 'Error al cambiar estado');
      }
    } catch {
      toast.error('Error de red');
    } finally {
      setTogglingSuspension(false);
    }
  };

  const handleRetryWish = async (wish: AdminWishRecord) => {
    setRetryingWishId(wish.id);
    try {
      const res = await adminRetryWishAction(wish.id, wish.userId);
      if (res.success) {
        toast.success('Envío reencolado y ejecutado.');
        setWishes(prev => prev.map(w => w.id === wish.id ? { ...w, status: 'sent', errorMessage: undefined } : w));
      } else {
        toast.error(res.error || 'Error al reintentar felicitación');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setRetryingWishId(null);
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
    if (statusFilter === 'at_risk') return u.isAtRisk;
    if (statusFilter === 'suspended') return u.isSuspended;
    return true;
  });

  const filteredWishes = wishes.filter(w => {
    if (wishFilter === 'all') return true;
    if (wishFilter === 'sent') return w.status === 'sent';
    if (wishFilter === 'needs_approval') return w.status === 'needs_approval' || w.status === 'approved';
    if (wishFilter === 'pending') return w.status === 'pending' || w.status === 'queued';
    if (wishFilter === 'failed') return w.status === 'failed';
    return true;
  });

  const { summary } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#285953] to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Centro de Mando & Analítica
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Supervisión de negocio, salud de WhatsApp VPS, métricas de retención y control de usuarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50"
            title="Recargar datos en vivo"
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

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios & Analítica</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'users' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
          }`}>
            {summary.totalUsers}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('wishes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'wishes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Monitor de Felicitaciones & Errores</span>
          {summary.totalFailedWishes > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              {summary.totalFailedWishes} fallos
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('system')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'system'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Sistema, Tokens & VPS</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* PRIMARY KPI SUMMARY CARDS */}
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
                  Total entregadas vía WhatsApp
                </p>
              </div>
              <div className="text-[11px] text-indigo-600 border-t border-slate-100 pt-2 font-bold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{summary.totalTemplates} plantillas creadas</span>
              </div>
            </div>

          </div>

          {/* SECONDARY RETENTION & OPERATIONS INSIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric A: Ratio de Activación Real */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Activación Real (≥5 contactos)</span>
                <Activity className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black">{summary.activatedUsersRate}%</p>
                <span className="text-xs text-indigo-200">({summary.activatedUsersCount} usuarios)</span>
              </div>
              <p className="text-[11px] text-indigo-200/80">Usuarios con suficiente volumen para experimentar el valor central.</p>
            </div>

            {/* Metric B: Preferencia de Modo Automático */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Modo Auto Directo</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900">{summary.autoSendContactsRate}%</p>
                <span className="text-xs text-slate-400">de contactos</span>
              </div>
              <p className="text-[11px] text-slate-500">Envío 100% desatendido vs Aprobación manual previa.</p>
            </div>

            {/* Metric C: Desglose de Mensajería (Fijo vs Plantilla vs IA) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipos de Mensaje</span>
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">✍️ Fijo</span>
                  <span className="font-bold text-slate-900">{summary.totalFixedModeContacts} ({summary.fixedModeContactsRate}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">📋 Plantilla</span>
                  <span className="font-bold text-slate-900">{summary.totalTemplateModeContacts} ({summary.templateModeContactsRate}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-purple-700">
                  <span className="flex items-center gap-1 font-bold">🤖 Con IA</span>
                  <span className="font-bold text-purple-900">{summary.totalAiModeContacts} ({summary.aiModeContactsRate}%)</span>
                </div>
              </div>
            </div>

            {/* Metric D: Usuarios en Riesgo (Desconectados) */}
            <div className={`p-5 rounded-3xl border shadow-xs space-y-2 ${
              summary.atRiskUsersCount > 0 
                ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">En Riesgo (Sin WhatsApp)</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-rose-900">{summary.atRiskUsersCount}</p>
                <span className="text-xs text-rose-700">usuarios</span>
              </div>
              <p className="text-[11px] text-rose-700/80">Tienen contactos en su agenda pero WhatsApp desconectado.</p>
            </div>

          </div>

          {/* USER LIST & DIRECTORY TABLE */}
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

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Todos ({data.users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('connected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'connected' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Conectados ({summary.whatsappConnectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('disconnected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'disconnected' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sin WhatsApp ({data.users.length - summary.whatsappConnectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('at_risk')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === 'at_risk' ? 'bg-rose-100 text-rose-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ⚠️ En Riesgo ({summary.atRiskUsersCount})
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
                    <th className="pb-3 px-3 text-center">Estado</th>
                    <th className="pb-3 px-3 text-right">Acciones</th>
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
                          onClick={() => {
                            setSelectedUser(u);
                            setWhatsAppTestResult(null);
                          }}
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
                                  {u.isSuspended && (
                                    <span className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded font-extrabold">SUSPENDIDO</span>
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

                          {/* Activation State */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {u.isActivated ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Activo
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">
                                Inicial
                              </span>
                            )}
                          </td>

                          {/* Action Detail */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                disabled={Boolean(impersonatingUserId)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImpersonate(u);
                                }}
                                title={`Iniciar sesión como ${u.displayName}`}
                                className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDiagnostics(u);
                                }}
                                title="Diagnóstico de sincronización WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                              {u.email !== 'lucasjimeneznavarro@gmail.com' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserToDelete(u);
                                  }}
                                  title="Eliminar usuario"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      ) : activeTab === 'wishes' ? (
        /* GLOBAL WISHES MONITOR & AUDIT LOG TAB */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Auditoría Global de Felicitaciones</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Seguimiento de envíos de toda la app, estados de entrega y reintento de fallos
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setWishFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wishFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todas ({wishes.length})
              </button>
              <button
                type="button"
                onClick={() => setWishFilter('sent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wishFilter === 'sent' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Enviadas ({wishes.filter(w => w.status === 'sent').length})
              </button>
              <button
                type="button"
                onClick={() => setWishFilter('needs_approval')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wishFilter === 'needs_approval' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Esperando Aprobación ({wishes.filter(w => w.status === 'needs_approval' || w.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setWishFilter('failed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  wishFilter === 'failed' ? 'bg-rose-100 text-rose-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Fallidas ({wishes.filter(w => w.status === 'failed').length})
              </button>
            </div>
          </div>

          {loadingWishes ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs font-bold">Consultando felicitaciones globales...</p>
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              No hay felicitaciones con este estado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 px-3">Destinatario</th>
                    <th className="pb-3 px-3">Remitente (Usuario)</th>
                    <th className="pb-3 px-3">Mensaje</th>
                    <th className="pb-3 px-3">Fecha / Hora</th>
                    <th className="pb-3 px-3">Estado</th>
                    <th className="pb-3 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWishes.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{w.contactName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">+{w.contactPhone}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800">{w.userName}</p>
                        <p className="text-[11px] text-slate-400">{w.userEmail}</p>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p 
                          onClick={() => setPreviewWish(w)}
                          className="truncate text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                          title="Click para ver completo"
                        >
                          {w.message}
                        </p>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {w.scheduledFor} {w.sentAt && `· ${w.sentAt}`}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {w.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3" /> Enviada
                          </span>
                        ) : w.status === 'needs_approval' || w.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" /> Aprobación
                          </span>
                        ) : w.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" /> Fallida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {w.status === 'failed' || w.status === 'queued' ? (
                          <button
                            type="button"
                            disabled={retryingWishId === w.id}
                            onClick={() => handleRetryWish(w)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>{retryingWishId === w.id ? 'Reintentando...' : 'Reintentar'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewWish(w)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                            title="Ver mensaje"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SYSTEM, TOKENS & VPS RESOURCES TELEMETRY TAB */
        <div className="space-y-6">
          {loadingTelemetry ? (
            <div className="py-24 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-sm font-bold text-slate-700">Midiendo telemetría de VPS, RAM y Tokens IA en tiempo real...</p>
              <p className="text-xs text-slate-400">Consultando métricas de Node.js, Evolution API Docker y Google Gemini</p>
            </div>
          ) : !telemetry ? (
            <div className="py-16 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-500">
              <p className="font-bold">No se pudieron cargar los datos de telemetría.</p>
              <button 
                onClick={loadSystemTelemetry}
                className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* NON-TECHNICAL QUICK GUIDE HERO */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#1f4742] text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 border border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💡</span>
                  <h3 className="font-black text-sm sm:text-base text-white">Guía Sencilla: Cómo interpretar estos paneles</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                    <span className="font-bold text-emerald-400 block">1. VPS WhatsApp</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      El servidor donde corre WhatsApp. Si está en verde (&lt;800ms), las felicitaciones y sincronizaciones responden al instante.
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                    <span className="font-bold text-blue-400 block">2. Memoria RAM</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      La web usa solo ~40–60 MB (un 4% del servidor). V8 libera memoria tras cada petición. Cero riesgo de saturación.
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                    <span className="font-bold text-purple-400 block">3. Tokens IA (Gemini)</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      El volumen de mensajes redactados por IA. Opera 100% gratis dentro del cupo oficial de 1.500 mensajes/día de Google.
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1">
                    <span className="font-bold text-amber-400 block">4. Base de Datos</span>
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Donde se guardan los contactos de forma encriptada. Ocupa &lt; 1 MB del límite gratuito de 1 GB de Google Firebase.
                    </p>
                  </div>
                </div>
              </div>

              {/* TELEMETRY TOP SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. VPS Status & Latency */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Radio className="w-5 h-5" />
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      telemetry.vps.status === 'online' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : telemetry.vps.status === 'degraded' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        telemetry.vps.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                      {telemetry.vps.status === 'online' ? 'VPS ONLINE' : telemetry.vps.status === 'degraded' ? 'LATENCIA ALTA' : 'OFFLINE'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{telemetry.vps.latencyMs}</span>
                      <span className="text-xs font-bold text-slate-400">ms ping</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5" title={telemetry.vps.apiUrl}>
                      {telemetry.vps.apiUrl}
                    </p>
                  </div>
                </div>

                {/* 2. Server RAM & Memory Heap */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      🟢 Óptimo (~{telemetry.server.memory.heapUsagePercent}%)
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{telemetry.server.memory.heapUsedMb}</span>
                      <span className="text-xs font-bold text-slate-400">MB en uso</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      De 1.024 MB disponibles en servidor
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.max(4, Math.min(100, telemetry.server.memory.heapUsagePercent))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Total AI Gemini Tokens */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Free Tier Activo
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{telemetry.aiTokens.totalTokens.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-400">tokens IA</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {telemetry.aiTokens.totalAiWishes} felicitaciones generadas
                    </p>
                  </div>
                </div>

                {/* 4. WhatsApp Instances in Docker */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      Docker VPS
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{telemetry.vps.connectedInstances}</span>
                      <span className="text-xs font-bold text-slate-400">/ {telemetry.vps.totalInstances} activas</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {telemetry.vps.connectedInstances > 0 ? 'Sesiones sincronizadas' : 'Esperando sesión o reconexión'}
                    </p>
                  </div>
                </div>

              </div>

              {/* DETAILED MONITORING SECTIONS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* SECTION 1: GOOGLE GEMINI AI TOKENS BREAKDOWN */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Google Gemini & Tokens IA</h3>
                        <p className="text-xs text-slate-500 font-medium">Consumo acumulado y métricas del modelo generativo</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      telemetry.aiTokens.geminiStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {telemetry.aiTokens.geminiStatus === 'healthy' ? 'API Operativa' : 'Sin API Key'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Modelo Oficial</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.aiTokens.model}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-800 block uppercase">Plan de Uso</span>
                      <span className="text-sm font-extrabold text-emerald-900">100% Gratuito (Free Tier)</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Tokens Prompt (Input)</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.aiTokens.estimatedPromptTokens.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Tokens Completion (Output)</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.aiTokens.estimatedCompletionTokens.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-100/80 rounded-2xl space-y-2 text-xs text-purple-900">
                    <div className="flex items-center justify-between font-bold">
                      <span>Promedio por felicitación personalizada:</span>
                      <span>~{telemetry.aiTokens.avgTokensPerWish} tokens / msg</span>
                    </div>
                    <p className="text-[11px] text-purple-700/90 leading-relaxed">
                      ✨ Toda la infraestructura opera bajo los niveles 100% gratuitos de las plataformas: <strong>Google Gemini API</strong> (1.500 peticiones/día gratuitas), <strong>Firebase Spark Plan</strong> (1 GB / 50k lecturas/día gratis) y <strong>Vercel Hobby</strong>.
                    </p>
                  </div>
                </div>

                {/* SECTION 2: SERVER & NODE.JS MEMORY TELEMETRY */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Servidor & Memoria RAM</h3>
                        <p className="text-xs text-slate-500 font-medium">Uso de memoria del proceso Node.js y host</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                      {telemetry.server.nodeVersion}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Heap Usado</span>
                      <span className="text-sm font-extrabold text-blue-700">{telemetry.server.memory.heapUsedMb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Heap Total</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.server.memory.heapTotalMb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Memoria RSS</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.server.memory.rssMb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">RAM Total Host</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.server.memory.systemTotalRamMb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">RAM Libre Host</span>
                      <span className="text-sm font-extrabold text-emerald-700">{telemetry.server.memory.systemFreeRamMb} MB</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Uptime Proceso</span>
                      <span className="text-sm font-extrabold text-slate-800">
                        {Math.floor(telemetry.server.uptimeSeconds / 3600)}h {Math.floor((telemetry.server.uptimeSeconds % 3600) / 60)}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium border-t border-slate-100">
                    <span>Plataforma: <strong className="text-slate-800 font-mono">{telemetry.server.platform} ({telemetry.server.arch})</strong></span>
                    <span>Carga media (Load avg): <strong className="text-slate-800 font-mono">{telemetry.server.loadAvg.map(l => l.toFixed(2)).join(', ')}</strong></span>
                  </div>
                </div>

                {/* SECTION 3: EVOLUTION API DOCKER INSTANCES */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Instancias en VPS (Evolution API)</h3>
                        <p className="text-xs text-slate-500 font-medium">Contenedores Docker de Baileys activos</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/70 px-2.5 py-0.5 rounded-full">
                      {telemetry.vps.totalInstances} en total
                    </span>
                  </div>

                  {telemetry.vps.instancesList.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      No se encontraron instancias activas en la VPS.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {telemetry.vps.instancesList.map((inst, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 text-xs transition-colors">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              inst.status === 'open' ? 'bg-emerald-500' : inst.status === 'connecting' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'
                            }`} />
                            <span className="font-extrabold text-slate-800 font-mono">{inst.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {inst.ownerPhone && (
                              <span className="text-slate-500 font-mono text-[11px]">+{inst.ownerPhone}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              inst.status === 'open' ? 'bg-emerald-100 text-emerald-800' : inst.status === 'connecting' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {inst.status === 'open' ? 'Conectada' : inst.status === 'connecting' ? 'Conectando' : inst.status === 'qrcode' ? 'QR Code' : 'Cerrada'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: FIRESTORE DATABASE & STORAGE */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Base de Datos Firestore</h3>
                        <p className="text-xs text-slate-500 font-medium">Documentos almacenados y cuotas de Firebase</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Firebase Online
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Colección Usuarios</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.firestore.totalUsersCount} docs</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Colección Contactos</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.firestore.totalContactsCount} docs</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Colección Felicitaciones</span>
                      <span className="text-sm font-extrabold text-slate-800">{telemetry.firestore.totalWishesCount} docs</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 block uppercase">Espacio Estimado</span>
                      <span className="text-sm font-extrabold text-amber-700">~{telemetry.firestore.estimatedStorageMb} MB</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                    <span className="font-bold">Capacidad Gratuita Spark Firestore:</span>
                    <span>1 GB Almacenamiento / 50k lecturas/día</span>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      )}

      {/* USER DETAIL & OPS ACTIONS MODAL */}
      {selectedUser && (
        <div 
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#285953] to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  {selectedUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight flex items-center gap-2">
                    <span>{selectedUser.displayName}</span>
                    {selectedUser.isSuspended && (
                      <span className="text-[10px] bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded font-extrabold">SUSPENDIDO</span>
                    )}
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

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Fecha Registro</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedUser.createdAt}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Contactos</span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">{selectedUser.contactsCount} ({selectedUser.activeContactsCount} act.)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Felicitaciones</span>
                <span className="text-xs font-black text-emerald-800 block mt-0.5">{selectedUser.wishesSentCount} enviadas</span>
              </div>
            </div>

            {/* Contact Modes Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Tipos de Mensaje Configurados</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">✍️ Mensaje Fijo</span>
                  <span className="font-bold text-slate-900">{selectedUser.fixedModeContactsCount}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">📋 Plantilla</span>
                  <span className="font-bold text-slate-900">{selectedUser.templateModeContactsCount}</span>
                </div>
                <div className="bg-purple-50 p-2 rounded-xl border border-purple-200/60">
                  <span className="text-[10px] text-purple-700 block font-semibold">🤖 Con IA</span>
                  <span className="font-bold text-purple-900">{selectedUser.aiModeContactsCount}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Ops & Diagnostics Section */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <WhatsAppIcon className="w-4 h-4" size={16} />
                  <span>Soporte Técnico de WhatsApp</span>
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedUser.whatsappStatus === 'connected' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedUser.whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {selectedUser.whatsappPhone && (
                <p className="text-xs text-emerald-800 font-mono">
                  Teléfono: +{selectedUser.whatsappPhone}
                </p>
              )}

              {/* Live Test Diagnostic Output */}
              {whatsAppTestResult && (
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">Resultado del test en vivo:</p>
                  <p className="text-slate-600">{whatsAppTestResult.message}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={testingWhatsApp}
                  onClick={() => handleTestWhatsApp(selectedUser.id)}
                  className="flex-1 py-2 bg-white hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs"
                >
                  <Radio className={`w-3.5 h-3.5 ${testingWhatsApp ? 'animate-pulse text-emerald-600' : ''}`} />
                  <span>{testingWhatsApp ? 'Probando...' : 'Test Conexión'}</span>
                </button>

                <button
                  type="button"
                  disabled={restartingWhatsApp}
                  onClick={() => handleRestartWhatsApp(selectedUser.id)}
                  className="flex-1 py-2 bg-white hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${restartingWhatsApp ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{restartingWhatsApp ? 'Reiniciando...' : 'Reiniciar Instancia'}</span>
                </button>
              </div>

              <button
                type="button"
                disabled={Boolean(impersonatingUserId)}
                onClick={() => handleImpersonate(selectedUser)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>{impersonatingUserId === selectedUser.id ? 'Iniciando sesión...' : 'Iniciar Sesión como este Usuario'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDiagnostics(selectedUser)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Ver Desglose y Diagnóstico de Chats</span>
              </button>
            </div>

            {/* Account Status / Danger Zone */}
            {selectedUser.email !== 'lucasjimeneznavarro@gmail.com' && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={togglingSuspension}
                    onClick={() => handleToggleSuspension(selectedUser)}
                    className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Power className="w-4 h-4" />
                    <span>{selectedUser.isSuspended ? 'Reactivar Cuenta' : 'Suspender Temporalmente'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedUser;
                      setSelectedUser(null);
                      setUserToDelete(target);
                    }}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>
              </div>
            )}

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

      {/* PREVIEW WISH MESSAGE MODAL */}
      {previewWish && (
        <div 
          onClick={() => setPreviewWish(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Mensaje para {previewWish.contactName}</h3>
                <p className="text-xs text-slate-400">De: {previewWish.userName} ({previewWish.userEmail})</p>
              </div>
              <button 
                onClick={() => setPreviewWish(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-medium">
              {previewWish.message}
            </div>

            {previewWish.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                <span className="font-bold block">Error reportado:</span>
                {previewWish.errorMessage}
              </div>
            )}

            <div className="flex items-center gap-2">
              {(previewWish.status === 'failed' || previewWish.status === 'queued') && (
                <button
                  type="button"
                  onClick={() => {
                    handleRetryWish(previewWish);
                    setPreviewWish(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Reintentar Envío Ahora</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewWish(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FULL DIAGNOSTICS MODAL */}
      {diagModalUser && (
        <div 
          onClick={() => !loadingDiagnostics && setDiagModalUser(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <WhatsAppIcon className="w-6 h-6 text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base leading-tight flex items-center gap-2">
                    <span>Diagnóstico de Sincronización WhatsApp</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {diagModalUser.displayName} <span className="text-slate-400">({diagModalUser.email})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingDiagnostics}
                  onClick={() => handleOpenDiagnostics(diagModalUser)}
                  title="Re-ejecutar diagnóstico en vivo"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDiagnostics ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                <button 
                  onClick={() => setDiagModalUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingDiagnostics ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">Analizando conversaciones y libreta de WhatsApp...</p>
                <p className="text-xs text-slate-400">Consultando Evolution API y caché de Firestore</p>
              </div>
            ) : !diagnosticsData ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No se pudieron cargar los datos de diagnóstico.
              </div>
            ) : !diagnosticsData.connected ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="font-black text-slate-900 text-sm">WhatsApp No Conectado</p>
                <p className="text-xs text-slate-600">
                  El usuario no tiene una sesión de WhatsApp activa en este momento (estado: <code className="font-bold">{diagnosticsData.instanceState}</code>).
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 4 Top KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Chats</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">{diagnosticsData.totalRawChats}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">Listos p/ Sync</span>
                    <span className="text-lg font-black text-emerald-900 block mt-0.5">{diagnosticsData.readyToSyncCount}</span>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-teal-700 block">En Agenda</span>
                    <span className="text-lg font-black text-teal-900 block mt-0.5">{diagnosticsData.savedInAgendaCount}</span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-purple-700 block">Caché Firestore</span>
                    <span className="text-lg font-black text-purple-900 block mt-0.5">{diagnosticsData.cachedInFirestoreCount}</span>
                  </div>
                </div>

                {/* Categorization Grid */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <span className="text-xs font-black text-slate-900 block uppercase tracking-wider">
                    Desglose Completo de Conversaciones
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 font-bold block">🟢 1 a 1 Listos</span>
                      <span className="text-base font-black text-emerald-900">{diagnosticsData.readyToSyncCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Personas reales (nombre/foto)</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-teal-200">
                      <span className="text-[10px] text-teal-700 font-bold block">🛡️ Ya en Agenda</span>
                      <span className="text-base font-black text-teal-900">{diagnosticsData.alreadySavedCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Excluidos (sin duplicados)</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">👥 Grupos (@g.us)</span>
                      <span className="text-base font-black text-slate-800">{diagnosticsData.groupsCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Excluidos de sync indiv.</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-indigo-200">
                      <span className="text-[10px] text-indigo-700 font-bold block">🔒 IDs Privacidad (@lid)</span>
                      <span className="text-base font-black text-indigo-900">{diagnosticsData.businessLidsCount || 0}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Identificadores Meta/LID</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-purple-200">
                      <span className="text-[10px] text-purple-700 font-bold block">📢 Canales (@newsletter)</span>
                      <span className="text-base font-black text-purple-900">{diagnosticsData.newslettersCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Excluidos</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-700 font-bold block">⏳ Inactivos (+18 meses)</span>
                      <span className="text-base font-black text-amber-900">{diagnosticsData.olderThan18MonthsCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Excluidos por ventana</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-rose-200">
                      <span className="text-[10px] text-rose-700 font-bold block">❓ Sin Nombre ni Foto</span>
                      <span className="text-base font-black text-rose-900">{diagnosticsData.namelessOrVoceCount}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Bots / Números anónimos</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setDiagTab('ready')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                        diagTab === 'ready'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Listos para Sincronizar ({diagnosticsData.sampleReady.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDiagTab('excluded')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                        diagTab === 'excluded'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Muestra Descartados ({diagnosticsData.sampleExcluded.length})</span>
                    </button>
                  </div>

                  {diagTab === 'ready' ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {diagnosticsData.sampleReady.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400">No hay contactos pendientes de sincronizar.</p>
                      ) : (
                        diagnosticsData.sampleReady.map((item, idx) => (
                          <div 
                            key={`${item.phone}-${idx}`}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 text-[11px] font-bold text-slate-400">{idx + 1}</span>
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{item.phone}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.hasPic ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {item.hasPic ? 'Foto ✅' : 'Sin foto'}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.lastActivity.includes('T') ? new Date(item.lastActivity).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : item.lastActivity}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {diagnosticsData.sampleExcluded.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                        >
                          <span className="font-medium text-slate-700 truncate max-w-[280px]">{item.name}</span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 whitespace-nowrap">
                            {item.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDiagModalUser(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Cerrar Diagnóstico
            </button>
          </div>
        </div>
      )}

      {/* DANGEROUS ACTION: DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div 
          onClick={() => !isDeleting && setUserToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-rose-100 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg leading-tight">
                  ¿Eliminar usuario definitivamente?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Esta acción es irreversible y destruirá todos los datos asociados al usuario.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-xs text-rose-900">
              <p className="font-bold">Se eliminarán permanentemente:</p>
              <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
                <li>Cuenta de acceso: <strong className="font-semibold text-rose-950">{userToDelete.email}</strong></li>
                <li>Instancia y sesión de WhatsApp ({userToDelete.whatsappPhone || 'Sin vincular'})</li>
                <li>{userToDelete.contactsCount} contactos guardados en su agenda</li>
                <li>{userToDelete.wishesTotalCount} felicitaciones e historial</li>
                <li>{userToDelete.templatesCount} plantillas personalizadas</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!userToDelete) return;
                  setIsDeleting(true);
                  try {
                    const res = await adminDeleteUserAction(userToDelete.id);
                    if (res.success) {
                      toast.success(`Cuenta de ${userToDelete.displayName} eliminada.`);
                      setData(prev => {
                        const updatedUsers = prev.users.filter(u => u.id !== userToDelete.id);
                        const isConnected = userToDelete.whatsappStatus === 'connected';
                        return {
                          summary: {
                            ...prev.summary,
                            totalUsers: Math.max(0, prev.summary.totalUsers - 1),
                            whatsappConnectedCount: isConnected 
                              ? Math.max(0, prev.summary.whatsappConnectedCount - 1) 
                              : prev.summary.whatsappConnectedCount,
                            totalContacts: Math.max(0, prev.summary.totalContacts - userToDelete.contactsCount),
                            totalActiveContacts: Math.max(0, prev.summary.totalActiveContacts - userToDelete.activeContactsCount),
                            totalWishesSent: Math.max(0, prev.summary.totalWishesSent - userToDelete.wishesSentCount),
                            totalTemplates: Math.max(0, prev.summary.totalTemplates - userToDelete.templatesCount),
                          },
                          users: updatedUsers,
                        };
                      });
                      setUserToDelete(null);
                    } else {
                      toast.error(res.error || 'Error al eliminar el usuario.');
                    }
                  } catch {
                    toast.error('Error de red al intentar eliminar el usuario.');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
