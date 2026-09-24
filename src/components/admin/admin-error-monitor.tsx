'use client';

import { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Eye, 
  Filter, 
  Gift, 
  Info, 
  RefreshCw, 
  RotateCw, 
  Send, 
  ShieldAlert, 
  Trash2, 
  XCircle 
} from 'lucide-react';
import { AdminSystemLogsResponse, AdminWishRecord, adminRetryWishAction, clearAdminSystemLogsAction } from '@/app/admin/actions';
import { toast } from 'sonner';

interface AdminErrorMonitorProps {
  logsData: AdminSystemLogsResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AdminErrorMonitor({ logsData, loading, onRefresh }: AdminErrorMonitorProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [retryingWishId, setRetryingWishId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const logs = logsData?.logs || [];
  const failedWishes = logsData?.failedWishes || [];
  const summary = logsData?.summary || { totalErrors24h: 0, totalWarnings24h: 0, totalFailedWishes: 0 };

  const filteredLogs = logs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    return true;
  });

  const handleRetryWish = async (wish: AdminWishRecord) => {
    setRetryingWishId(wish.id);
    try {
      const res = await adminRetryWishAction(wish.id, wish.userId);
      if (res.success) {
        toast.success(`Felicitación reenviada a ${wish.contactName}`);
        onRefresh();
      } else {
        toast.error(res.error || 'Error al reintentar envío');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setRetryingWishId(null);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('¿Deseas vaciar los registros del sistema antiguos?')) return;
    setIsClearing(true);
    try {
      const res = await clearAdminSystemLogsAction();
      if (res.success) {
        toast.success('Registros limpiados');
        onRefresh();
      } else {
        toast.error(res.error || 'Error al limpiar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsClearing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Detalles copiados al portapapeles');
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'cron:daily-scan':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Cron Escaneo</span>;
      case 'cron:send-wishes':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Cron Envíos</span>;
      case 'webhook:evolution':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">WhatsApp Webhook</span>;
      case 'ai:gemini':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800">Gemini IA</span>;
      case 'storage:avatar':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Storage Avatares</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{source}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estado General */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salud Operativa</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              summary.totalErrors24h === 0 && summary.totalFailedWishes === 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-rose-100 text-rose-700'
            }`}>
              {summary.totalErrors24h === 0 && summary.totalFailedWishes === 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">
            {summary.totalErrors24h === 0 && summary.totalFailedWishes === 0 ? 'Normal / Saludable' : 'Requiere Atención'}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {summary.totalErrors24h === 0 ? 'Sin fallos críticos en las últimas 24h' : `${summary.totalErrors24h} errores detectados`}
          </p>
        </div>

        {/* Card 2: Felicitaciones Fallidas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Felicitaciones Fallidas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{summary.totalFailedWishes}</p>
          <p className="text-xs text-slate-500 font-medium">Envíos de cumpleaños que no se pudieron entregar</p>
        </div>

        {/* Card 3: Errores en 24h */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Errores Críticos (24h)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{summary.totalErrors24h}</p>
          <p className="text-xs text-slate-500 font-medium">Excepciones no controladas o fallos de red</p>
        </div>

        {/* Card 4: Advertencias */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advertencias (24h)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{summary.totalWarnings24h}</p>
          <p className="text-xs text-slate-500 font-medium">Retries, fallbacks de IA o degradaciones temporales</p>
        </div>
      </div>

      {/* SECTION 1: FAILED WISHES IMMEDIATE ACTION BOX */}
      {failedWishes.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-red-50/50 rounded-3xl border-2 border-rose-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-200/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">Felicitaciones Fallidas Pendientes de Resolver ({failedWishes.length})</h3>
                <p className="text-xs text-rose-800/80 font-medium">
                  Estos mensajes no pudieron entregarse por WhatsApp. Puedes revisar el motivo exacto y forzar el reenvío.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm bg-white rounded-2xl overflow-hidden border border-rose-100 shadow-2xs">
              <thead>
                <tr className="bg-rose-100/50 border-b border-rose-100 text-[11px] font-black uppercase tracking-wider text-rose-900">
                  <th className="py-2.5 px-3">Destinatario</th>
                  <th className="py-2.5 px-3">Usuario (Remitente)</th>
                  <th className="py-2.5 px-3">Motivo del Error</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                {failedWishes.map((w) => (
                  <tr key={w.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{w.contactName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">+{w.contactPhone}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{w.userName}</p>
                      <p className="text-[11px] text-slate-400">{w.userEmail}</p>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-xs text-rose-700 font-mono bg-rose-50 p-1.5 rounded-lg border border-rose-200/60 break-words">
                        {w.errorMessage}
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                      {w.scheduledFor}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={retryingWishId === w.id}
                        onClick={() => handleRetryWish(w)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{retryingWishId === w.id ? 'Reintentando...' : 'Reintentar Ahora'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: LIVE SYSTEM AUDIT LOG */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>Registro de Eventos e Incidencias en Vivo</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Auditoría en tiempo real de llamadas de cron, webhooks de WhatsApp, Gemini IA y almacenamiento.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                disabled={isClearing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold transition-all shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                severityFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('error')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                severityFilter === 'error' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Errores ({logs.filter(l => l.severity === 'error').length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                severityFilter === 'warning' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Avisos ({logs.filter(l => l.severity === 'warning').length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                severityFilter === 'info' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Info ({logs.filter(l => l.severity === 'info').length})
            </button>
          </div>

          {/* Source Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Origen:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="all">Todos los orígenes</option>
              <option value="cron:daily-scan">Cron Escaneo Diario</option>
              <option value="cron:send-wishes">Cron Envío Felicitaciones</option>
              <option value="webhook:evolution">Webhook WhatsApp</option>
              <option value="ai:gemini">Gemini IA</option>
              <option value="storage:avatar">Storage Avatares</option>
            </select>
          </div>
        </div>

        {/* LOGS TABLE / FEED */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-bold text-slate-700">Consultando registros del sistema...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800">Cero incidencias registradas</p>
            <p className="text-xs text-slate-500">
              {logs.length === 0 
                ? 'El sistema está limpio y funcionando al 100% sin anomalías.'
                : 'No hay eventos que coincidan con los filtros seleccionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 px-3">Fecha / Hora</th>
                  <th className="pb-3 px-3">Gravedad</th>
                  <th className="pb-3 px-3">Origen</th>
                  <th className="pb-3 px-3">Mensaje</th>
                  <th className="pb-3 px-3 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {log.timeFormatted}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {log.severity === 'error' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> ERROR
                          </span>
                        ) : log.severity === 'warning' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> AVISO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Info className="w-3 h-3 text-blue-500" /> INFO
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getSourceBadge(log.source)}
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{log.message}</p>
                        {log.details && (
                          <div className="mt-1">
                            {isExpanded ? (
                              <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[11px] space-y-2 mt-1 shadow-inner">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                                  <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Stack Trace / Detalles</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(log.details || '')}
                                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                                  >
                                    <Copy className="w-3 h-3" /> Copiar
                                  </button>
                                </div>
                                <pre className="whitespace-pre-wrap break-all">{log.details}</pre>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(log.id)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 mt-0.5"
                              >
                                <span>Ver detalles técnicos</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {log.details && (
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title={isExpanded ? 'Contraer' : 'Expandir'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
