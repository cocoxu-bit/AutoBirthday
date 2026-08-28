'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { requestGoogleCalendarAccessToken } from '@/lib/firebase/auth';
import { 
  syncGoogleCalendarAction, 
  syncICloudCalendarAction, 
  batchApproveSyncedContacts,
  SyncedContactPreview 
} from '@/app/(dashboard)/contacts/sync-actions';
import { WhatsAppChatContact } from '@/types';
import { 
  X, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Check, 
  ArrowRight, 
  HelpCircle,
  Users,
  ChevronDown,
  Trash2,
  Edit3
} from 'lucide-react';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

interface CalendarSyncDialogProps {
  onClose: () => void;
}

export function CalendarSyncDialog({ onClose }: CalendarSyncDialogProps) {
  const [step, setStep] = useState<'connect' | 'review' | 'saving'>('connect');
  const [activeTab, setActiveTab] = useState<'google' | 'apple'>('google');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // iCloud Input
  const [iCloudUrl, setICloudUrl] = useState('');
  const [showICloudGuide, setShowICloudGuide] = useState(false);

  // Review State
  const [syncedContacts, setSyncedContacts] = useState<SyncedContactPreview[]>([]);
  const [availableWhatsAppContacts, setAvailableWhatsAppContacts] = useState<WhatsAppChatContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ready' | 'missing'>('all');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);

  // 1. Handle Google Calendar 1-Click Connect
  const handleGoogleSync = async () => {
    setLoading(true);
    setStatusMessage('Abriendo autorización segura con Google...');

    try {
      const accessToken = await requestGoogleCalendarAccessToken();
      setStatusMessage('Extrayendo cumpleaños de tu Google Calendar...');

      const res = await syncGoogleCalendarAction(accessToken);

      if (res.success && res.items && res.items.length > 0) {
        setSyncedContacts(res.items);
        setAvailableWhatsAppContacts(res.availableWhatsAppContacts || []);
        setStep('review');
        toast.success(`¡${res.items.length} cumpleaños detectados en Google Calendar! 🎉`);
      } else {
        toast.error(res.error || 'No se encontraron cumpleaños en tu Google Calendar.');
      }
    } catch (err: any) {
      if (!err.message?.includes('cerrado la ventana')) {
        toast.error(err.message || 'Error al conectar con Google Calendar');
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // 2. Handle Apple iCloud Calendar Sync
  const handleICloudSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iCloudUrl.trim()) {
      toast.error('Pega el enlace de tu calendario de iCloud');
      return;
    }

    setLoading(true);
    setStatusMessage('Sincronizando con Apple iCloud Calendar...');

    try {
      const res = await syncICloudCalendarAction(iCloudUrl.trim());

      if (res.success && res.items && res.items.length > 0) {
        setSyncedContacts(res.items);
        setAvailableWhatsAppContacts(res.availableWhatsAppContacts || []);
        setStep('review');
        toast.success(`¡${res.items.length} cumpleaños detectados en Apple Calendar! 🍏`);
      } else {
        toast.error(res.error || 'No se encontraron cumpleaños en el enlace de iCloud.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al sincronizar con Apple iCloud');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSyncedContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  // Select/Deselect all
  const handleSelectAll = (select: boolean) => {
    setSyncedContacts(prev => prev.map(c => ({ ...c, selected: select })));
  };

  // Discard contact from queue
  const handleDiscard = (id: string) => {
    setSyncedContacts(prev => prev.filter(c => c.id !== id));
  };

  // Update contact phone manually
  const handleSetPhone = (id: string, phone: string, waName?: string) => {
    setSyncedContacts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          matchedPhone: phone,
          matchedName: waName || c.matchedName || c.name,
          isAutoMatched: !!phone,
          selected: !!phone,
        };
      }
      return c;
    }));
    setEditingContactId(null);
  };

  // Batch Save Approved Contacts
  const handleApproveAndSave = async () => {
    const selected = syncedContacts.filter(c => c.selected && c.matchedPhone);
    if (selected.length === 0) {
      toast.error('Selecciona al menos un contacto con teléfono válido para guardar.');
      return;
    }

    setStep('saving');
    try {
      const res = await batchApproveSyncedContacts(
        selected.map(c => ({
          name: c.name,
          phone: c.matchedPhone,
          birthDay: c.birthDay,
          birthMonth: c.birthMonth,
          birthYear: c.birthYear,
          source: c.source,
        }))
      );

      if (res.success) {
        toast.success(`¡${res.count} contactos sincronizados y guardados con éxito! 🎂🎉`);
        onClose();
      } else {
        toast.error(res.error || 'Error al guardar los contactos');
        setStep('review');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al guardar');
      setStep('review');
    }
  };

  // Filtered contacts
  const filteredContacts = syncedContacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.matchedPhone.includes(searchTerm) ||
      c.matchedName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'ready') return !!c.matchedPhone;
    if (filterType === 'missing') return !c.matchedPhone;
    return true;
  });

  const readyCount = syncedContacts.filter(c => c.matchedPhone).length;
  const selectedCount = syncedContacts.filter(c => c.selected && c.matchedPhone).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {step === 'connect' ? 'Sincronizar Calendario en 1 Clic' : 'Aprobación Rápida de Cumpleaños'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'connect' 
                  ? 'Conecta directamente con tu Google Calendar o Apple Calendar sin descargar archivos.' 
                  : 'Revisa las coincidencias con tus contactos de WhatsApp y aprueba en 1 toque.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1: CONNECT TO CLOUD CALENDAR */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 'connect' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              
              {/* TABS */}
              <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'google'
                      ? 'bg-white text-violet-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Calendar (Recomendado)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('apple')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'apple'
                      ? 'bg-white text-violet-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="text-base leading-none">🍏</span>
                  <span>Apple / iCloud Calendar</span>
                </button>
              </div>

              {/* GOOGLE CALENDAR CARD */}
              {activeTab === 'google' && (
                <div className="p-6 sm:p-8 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 rounded-3xl border border-violet-100 shadow-sm text-center space-y-5">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center">
                    <svg className="w-9 h-9" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900">
                      Conecta con Google Calendar
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Extraeremos automáticamente tus eventos anuales y el calendario de cumpleaños de tus contactos de Google.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGoogleSync}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{statusMessage || 'Sincronizando...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Conectar Google Calendar en 1 Clic</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 font-medium">
                    <span>🔒 Solo lectura</span>
                    <span>•</span>
                    <span>⚡ Cero descargas</span>
                    <span>•</span>
                    <span>🤖 Cruce con WhatsApp</span>
                  </div>
                </div>
              )}

              {/* APPLE ICLOUD CARD */}
              {activeTab === 'apple' && (
                <form onSubmit={handleICloudSync} className="p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div className="text-center space-y-1.5">
                    <div className="text-3xl mb-1">🍏</div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Sincroniza tu Apple Calendar
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Pega el enlace de suscripción de tu calendario de iCloud para extraer tus cumpleaños automáticamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Enlace de Calendario de iCloud</label>
                    <input
                      type="text"
                      placeholder="webcal://p68-caldav.icloud.com/published/2/..."
                      value={iCloudUrl}
                      onChange={(e) => setICloudUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none shadow-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowICloudGuide(!showICloudGuide)}
                    className="text-xs text-violet-600 font-bold hover:underline flex items-center gap-1 mx-auto"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>¿Cómo consigo mi enlace de iCloud en 1 minuto?</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showICloudGuide ? 'rotate-180' : ''}`} />
                  </button>

                  {showICloudGuide && (
                    <div className="p-4 bg-violet-50/70 rounded-2xl border border-violet-100 text-xs text-slate-700 space-y-2 text-left">
                      <p className="font-bold text-violet-900">En tu iPhone, iPad o Mac:</p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                        <li>Abre la app <strong>Calendario</strong>.</li>
                        <li>Pulsa en <strong>Calendarios</strong> (abajo o lateral) y pulsa el botón de información <strong>(i)</strong> en tu calendario.</li>
                        <li>Activa <strong>&ldquo;Calendario público&rdquo;</strong> y pulsa <strong>&ldquo;Compartir enlace&rdquo;</strong> para copiarlo.</li>
                      </ol>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{statusMessage || 'Sincronizando...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Sincronizar con iCloud</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2: SMART REVIEW QUEUE */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(step === 'review' || step === 'saving') && (
            <div className="space-y-4">
              
              {/* METRICS & FILTERS */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-violet-100 text-violet-800 px-3 py-1.5 rounded-xl">
                    🎉 {syncedContacts.length} Detectados
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {readyCount} con WhatsApp
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-xs text-slate-500 hover:text-violet-600 font-bold px-2 py-1"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-xs text-slate-500 hover:text-red-600 font-bold px-2 py-1"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* SEARCH & QUICK FILTERS */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Todos ({syncedContacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('ready')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === 'ready' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Listos ({readyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('missing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterType === 'missing' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sin número ({syncedContacts.length - readyCount})
                  </button>
                </div>
              </div>

              {/* CONTACTS QUEUE LIST */}
              <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No hay contactos con ese filtro.
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                    const monthName = MONTH_NAMES[contact.birthMonth - 1];
                    const isEditing = editingContactId === contact.id;

                    return (
                      <div 
                        key={contact.id}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                          contact.selected ? 'bg-white hover:bg-violet-50/30' : 'bg-slate-50/40 opacity-70'
                        }`}
                      >
                        {/* LEFT: CHECKBOX + NAME & BIRTHDAY */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={contact.selected}
                            disabled={!contact.matchedPhone}
                            onChange={() => handleToggleSelect(contact.id)}
                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300 shrink-0 cursor-pointer"
                          />

                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {contact.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              🎂 {contact.birthDay} de {monthName} {contact.birthYear ? `(${contact.birthYear})` : ''}
                            </p>
                          </div>
                        </div>

                        {/* MIDDLE: WHATSAPP MATCH STATUS */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {contact.matchedPhone ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {contact.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-emerald-950 truncate max-w-[140px]">
                                  {contact.matchedName || contact.name}
                                </p>
                                <p className="text-[10px] text-emerald-700 font-mono">
                                  {contact.matchedPhone}
                                </p>
                              </div>
                              <span className="text-[9px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                                {contact.matchScore}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-[11px] font-semibold">Sin teléfono vinculado</span>
                            </div>
                          )}

                          {/* Quick Edit WhatsApp Picker Button */}
                          <button
                            type="button"
                            onClick={() => setEditingContactId(isEditing ? null : contact.id)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                            title="Cambiar o añadir teléfono de WhatsApp"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Discard Button */}
                          <button
                            type="button"
                            onClick={() => handleDiscard(contact.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Descartar cumpleañero"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* EDIT POPUP / DROPDOWN */}
                        {isEditing && (
                          <div className="w-full sm:col-span-2 pt-2 border-t border-slate-100">
                            <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 space-y-2">
                              <label className="text-xs font-bold text-violet-900">
                                Seleccionar chat de WhatsApp para &ldquo;{contact.name}&rdquo;:
                              </label>
                              <div className="flex gap-2">
                                <select
                                  onChange={(e) => {
                                    const selected = availableWhatsAppContacts.find(c => c.phone === e.target.value);
                                    if (selected) {
                                      handleSetPhone(contact.id, selected.phone, selected.name);
                                    }
                                  }}
                                  defaultValue={contact.matchedPhone}
                                  className="flex-1 px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs font-medium"
                                >
                                  <option value="">-- Elige un chat de WhatsApp --</option>
                                  {availableWhatsAppContacts.map(c => (
                                    <option key={c.jid} value={c.phone}>
                                      {c.name} ({c.phone})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="O teclea +34..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (e.target as HTMLInputElement).value.trim();
                                      if (val) handleSetPhone(contact.id, val);
                                    }
                                  }}
                                  className="w-36 px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {step !== 'connect' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('connect')}
                disabled={step === 'saving'}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-2 disabled:opacity-50"
              >
                ← Volver a conectar
              </button>

              <button
                type="button"
                onClick={handleApproveAndSave}
                disabled={selectedCount === 0 || step === 'saving'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando contactos...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Aprobar y Guardar ({selectedCount})</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs text-slate-600 hover:text-slate-900 font-bold"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
