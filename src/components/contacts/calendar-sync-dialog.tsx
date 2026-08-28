'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { requestGoogleCalendarAccessToken } from '@/lib/firebase/auth';
import { 
  syncGoogleCalendarAction, 
  syncICloudCalendarAction, 
  saveSingleSyncedContactAction,
  batchApproveSyncedContacts,
  SyncedContactPreview 
} from '@/app/(dashboard)/contacts/sync-actions';
import { WhatsAppChatContact, Template, WishMode, AiTone } from '@/types';
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
  Users, 
  Edit3, 
  Phone, 
  FileText, 
  PenTool, 
  ShieldCheck, 
  Zap, 
  MessageSquare
} from 'lucide-react';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const TONES: Array<{ id: AiTone; label: string; icon: string }> = [
  { id: 'casual', label: 'Casual', icon: '😊' },
  { id: 'divertido', label: 'Divertido', icon: '🎉' },
  { id: 'emotivo', label: 'Emotivo', icon: '❤️' },
  { id: 'formal', label: 'Formal', icon: '🤝' },
];

interface CalendarSyncDialogProps {
  onClose: () => void;
  templates?: Template[];
}

export function CalendarSyncDialog({ onClose, templates = [] }: CalendarSyncDialogProps) {
  const [step, setStep] = useState<'connect' | 'deck' | 'completed'>('connect');
  const [activeTab, setActiveTab] = useState<'google' | 'apple'>('google');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // iCloud Input
  const [iCloudUrl, setICloudUrl] = useState('');

  // Review Deck State
  const [cards, setCards] = useState<SyncedContactPreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableWhatsAppContacts, setAvailableWhatsAppContacts] = useState<WhatsAppChatContact[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // WhatsApp Change Modal
  const [showChangeWaModal, setShowChangeWaModal] = useState(false);
  const [waSearchTerm, setWaSearchTerm] = useState('');

  // 1. Handle Google Calendar 1-Click Connect
  const handleGoogleSync = async () => {
    setLoading(true);
    setStatusMessage('Abriendo autorización segura con Google...');

    try {
      const accessToken = await requestGoogleCalendarAccessToken();
      setStatusMessage('Analizando cumpleaños y rescatando fotos de WhatsApp...');

      const result = await syncGoogleCalendarAction(accessToken);

      if (!result.success || !result.items || result.items.length === 0) {
        toast.error(result.error || 'No se encontraron eventos de cumpleaños.');
        setLoading(false);
        return;
      }

      setCards(result.items);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setAvailableWhatsAppContacts(result.availableWhatsAppContacts || []);
      setStep('deck');
      toast.success(`🎉 ¡${result.items.length} cumpleaños detectados!`);
    } catch (err: any) {
      console.error('Google sync error:', err);
      toast.error(err.message || 'Error al conectar con Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Apple iCloud Calendar Sync
  const handleICloudSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iCloudUrl.trim()) {
      toast.error('Pega el enlace de suscripción de tu calendario de iCloud');
      return;
    }

    setLoading(true);
    setStatusMessage('Descargando calendario de Apple y buscando contactos...');

    try {
      const result = await syncICloudCalendarAction(iCloudUrl.trim());

      if (!result.success || !result.items || result.items.length === 0) {
        toast.error(result.error || 'No se encontraron eventos en el enlace de iCloud.');
        setLoading(false);
        return;
      }

      setCards(result.items);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setAvailableWhatsAppContacts(result.availableWhatsAppContacts || []);
      setStep('deck');
      toast.success(`🍏 ¡${result.items.length} cumpleaños detectados en Apple Calendar!`);
    } catch (err: any) {
      console.error('iCloud sync error:', err);
      toast.error(err.message || 'Error al sincronizar con iCloud');
    } finally {
      setLoading(false);
    }
  };

  // Current Card Data
  const currentCard = cards[currentIndex];

  // Update field of current card
  const updateCurrentCard = (updates: Partial<SyncedContactPreview>) => {
    setCards(prev => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], ...updates };
      return next;
    });
  };

  // Advance index or finish
  const advanceDeck = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setStep('completed');
    }
  };

  // Save current card and advance
  const handleSaveAndNext = async () => {
    if (!currentCard) return;

    if (!currentCard.matchedPhone || currentCard.matchedPhone.trim().length < 6) {
      toast.error('Vincula un teléfono o chat de WhatsApp para este contacto.');
      setShowChangeWaModal(true);
      return;
    }

    if (currentCard.mode === 'manual' && !currentCard.customMessage?.trim()) {
      toast.error('Escribe el mensaje personalizado o cambia al modo IA.');
      return;
    }

    if (currentCard.mode === 'template' && !currentCard.templateId && templates.length > 0) {
      updateCurrentCard({ templateId: templates[0].id });
    }

    setIsSavingCurrent(true);
    try {
      const res = await saveSingleSyncedContactAction({
        name: currentCard.name,
        phone: currentCard.matchedPhone,
        birthDay: currentCard.birthDay,
        birthMonth: currentCard.birthMonth,
        birthYear: null,
        source: currentCard.source,
        profilePictureUrl: currentCard.profilePictureUrl,
        mode: currentCard.mode,
        templateId: currentCard.templateId,
        customMessage: currentCard.customMessage,
        aiTone: currentCard.aiTone,
        aiNotes: currentCard.aiNotes,
        autoSend: currentCard.autoSend,
        sendTimeStart: currentCard.sendTimeStart,
        sendTimeEnd: currentCard.sendTimeEnd,
      });

      if (res.success) {
        setSavedCount(prev => prev + 1);
        toast.success(`✅ ${currentCard.name} añadido`, { duration: 1500 });
        advanceDeck();
      } else {
        toast.error(res.error || 'Error al guardar contacto');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar contacto');
    } finally {
      setIsSavingCurrent(false);
    }
  };

  // Skip current card
  const handleSkipCurrent = () => {
    setSkippedCount(prev => prev + 1);
    advanceDeck();
  };

  // Fast Pass: Approve all remaining with default AI
  const handleApproveAllRemaining = async () => {
    const remainingCards = cards.slice(currentIndex).filter(c => c.matchedPhone && c.matchedPhone.trim().length >= 6);
    if (remainingCards.length === 0) {
      toast.error('Ninguno de los contactos restantes tiene un teléfono vinculado.');
      return;
    }

    setIsSavingCurrent(true);
    try {
      const res = await batchApproveSyncedContacts(
        remainingCards.map(c => ({
          name: c.name,
          phone: c.matchedPhone,
          birthDay: c.birthDay,
          birthMonth: c.birthMonth,
          birthYear: null,
          source: c.source,
          profilePictureUrl: c.profilePictureUrl,
          mode: c.mode || 'ai',
          templateId: c.templateId,
          customMessage: c.customMessage,
          aiTone: c.aiTone || 'casual',
          aiNotes: c.aiNotes,
          autoSend: c.autoSend ?? false,
          sendTimeStart: c.sendTimeStart || '09:30',
          sendTimeEnd: c.sendTimeEnd || '11:45',
        }))
      );

      if (res.success) {
        setSavedCount(prev => prev + (res.count || 0));
        toast.success(`🎉 ¡${res.count} contactos guardados con éxito!`);
        setStep('completed');
      } else {
        toast.error(res.error || 'Error al guardar contactos restantes');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar lote');
    } finally {
      setIsSavingCurrent(false);
    }
  };

  // Filtered WhatsApp chats for search modal
  const filteredWhatsApp = availableWhatsAppContacts.filter(c => {
    const q = waSearchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.pushName?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {step === 'connect' ? 'Sincronizar Calendario' : step === 'deck' ? `Revisar Cumpleaños (${currentIndex + 1} de ${cards.length})` : '¡Sincronización Completada!'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'connect' 
                  ? 'Importa automáticamente desde Google o Apple sin archivos' 
                  : step === 'deck' 
                  ? 'Revisa a quién se enviará la felicitación y personalízala'
                  : 'Contactos añadidos a tu agenda'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {/* ========================================================= */}
          {/* STEP 1: CONECTAR CALENDARIO                               */}
          {/* ========================================================= */}
          {step === 'connect' && (
            <div className="space-y-6">
              
              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'google'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('apple')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'apple'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.8-12.04-14.15-5.88-8.6-10.46-18.42-13.73-29.47-3.28-11.05-4.92-21.73-4.92-32.04 0-14.42 3.65-26.07 10.96-34.96 7.31-8.89 16.53-13.43 27.67-13.62 4.48 0 9.56 1.15 15.24 3.44 5.68 2.29 9.38 3.51 11.09 3.66 1.83-.22 5.63-1.46 11.41-3.73 5.78-2.27 10.81-3.32 15.09-3.15 12.98.66 23.23 5.48 30.74 14.46-11.45 6.94-17.06 16.48-16.83 28.62.24 9.5 3.86 17.47 10.86 23.91 7 6.44 15.35 10.05 25.06 10.84-2.12 6.53-4.77 13.1-7.94 19.71zM119.22 31.84c0-7.72 2.76-14.89 8.28-21.51 5.53-6.62 12.37-10.33 20.53-11.13.11 1.09.16 2.06.16 2.92 0 7.6-2.92 14.86-8.76 21.78-5.83 6.92-12.79 10.66-20.88 11.23-.22-1.08-.33-2.18-.33-3.29z" />
                  </svg>
                  <span>Apple Calendar</span>
                </button>
              </div>

              {/* GOOGLE TAB */}
              {activeTab === 'google' && (
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>

                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-lg font-black text-slate-900">
                      Conecta con Google Calendar
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Extraeremos automáticamente tus eventos anuales y el calendario de cumpleaños de tus contactos de Google.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSync}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{statusMessage || 'Conectando...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Conectar Google Calendar en 1 Clic</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 pt-2">
                    <span>🔒 Solo lectura</span>
                    <span>•</span>
                    <span>⚡ Cero descargas</span>
                    <span>•</span>
                    <span>📸 Fotos de WhatsApp</span>
                  </div>
                </div>
              )}

              {/* APPLE TAB */}
              {activeTab === 'apple' && (
                <form onSubmit={handleICloudSync} className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 fill-current text-slate-800" viewBox="0 0 170 170">
                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.8-12.04-14.15-5.88-8.6-10.46-18.42-13.73-29.47-3.28-11.05-4.92-21.73-4.92-32.04 0-14.42 3.65-26.07 10.96-34.96 7.31-8.89 16.53-13.43 27.67-13.62 4.48 0 9.56 1.15 15.24 3.44 5.68 2.29 9.38 3.51 11.09 3.66 1.83-.22 5.63-1.46 11.41-3.73 5.78-2.27 10.81-3.32 15.09-3.15 12.98.66 23.23 5.48 30.74 14.46-11.45 6.94-17.06 16.48-16.83 28.62.24 9.5 3.86 17.47 10.86 23.91 7 6.44 15.35 10.05 25.06 10.84-2.12 6.53-4.77 13.1-7.94 19.71zM119.22 31.84c0-7.72 2.76-14.89 8.28-21.51 5.53-6.62 12.37-10.33 20.53-11.13.11 1.09.16 2.06.16 2.92 0 7.6-2.92 14.86-8.76 21.78-5.83 6.92-12.79 10.66-20.88 11.23-.22-1.08-.33-2.18-.33-3.29z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Enlace de tu Calendario Apple</h3>
                      <p className="text-xs text-slate-500">Pega el enlace webcal o público de tu calendario iCloud</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="webcal://p123-caldav.icloud.com/published/..."
                      value={iCloudUrl}
                      onChange={e => setICloudUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !iCloudUrl.trim()}
                    className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-md transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{statusMessage || 'Conectando...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Sincronizar Calendario Apple</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: REVISIÓN LIMPIA Y CLARA 1 A 1                      */}
          {/* ========================================================= */}
          {step === 'deck' && currentCard && (
            <div className="space-y-4">
              
              {/* Progress Bar & Counters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-violet-900">Contacto {currentIndex + 1} de {cards.length}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                      ✨ {savedCount} guardados
                    </span>
                    {skippedCount > 0 && (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold text-[11px]">
                        ⏭️ {skippedCount} omitidos
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* MAIN CONTACT CARD */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 sm:p-5 shadow-lg shadow-slate-200/50 space-y-4 text-left">
                
                {/* 1. VISUAL COMPARISON: CALENDAR EVENT vs WHATSAPP MATCH */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
                  
                  {/* Calendar Event Source */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-violet-600" />
                        Calendario:
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 truncate" title={currentCard.rawSummary || currentCard.name}>
                        &ldquo;{currentCard.rawSummary || currentCard.name}&rdquo;
                      </span>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black text-xs">
                      🎂 {currentCard.birthDay} de {MONTH_NAMES[currentCard.birthMonth - 1]}
                    </span>
                  </div>

                  {/* WhatsApp Matched Target with Photo */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar / Photo with WhatsApp badge */}
                      <div className="relative shrink-0">
                        {currentCard.profilePictureUrl ? (
                          <img 
                            src={currentCard.profilePictureUrl} 
                            alt="" 
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm border-2 border-white ring-2 ring-emerald-400" 
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm border-2 border-white ring-2 ring-emerald-400">
                            {currentCard.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow border-2 border-white" title="WhatsApp">
                          💬
                        </span>
                      </div>

                      {/* WhatsApp Contact Details */}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Destino en WhatsApp:
                        </p>
                        {currentCard.matchedPhone ? (
                          <>
                            <p className="font-black text-sm sm:text-base text-slate-900 truncate">
                              {currentCard.matchedName || currentCard.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500 font-mono">+{currentCard.matchedPhone}</span>
                              {currentCard.matchScore > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                  {currentCard.matchScore}% Match
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs font-bold text-amber-700">⚠️ No se encontró chat automático</p>
                        )}
                      </div>
                    </div>

                    {/* Change Button */}
                    <button
                      type="button"
                      onClick={() => setShowChangeWaModal(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-violet-700 shadow-sm shrink-0 transition-colors"
                    >
                      {currentCard.matchedPhone ? 'Cambiar' : '➕ Vincular'}
                    </button>
                  </div>

                </div>

                {/* 2. GREETING CONFIGURATION (3 MODES: AI | TEMPLATE | MANUAL) */}
                <div className="space-y-3 pt-1">
                  
                  {/* Mode Selector Tabs */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      ¿Cómo quieres felicitar a este contacto?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'ai' })}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'ai'
                            ? 'bg-white text-violet-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        <span>IA Mágica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'template' })}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'template'
                            ? 'bg-white text-violet-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Plantilla</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'manual' })}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'manual'
                            ? 'bg-white text-violet-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mensaje Fijo</span>
                      </button>
                    </div>
                  </div>

                  {/* MODE A: AI GENERATION */}
                  {currentCard.mode === 'ai' && (
                    <div className="space-y-2.5 bg-violet-50/50 border border-violet-100 p-3.5 rounded-2xl">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">
                          Tono de la felicitación IA:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {TONES.map(tone => {
                            const isSelected = currentCard.aiTone === tone.id;
                            return (
                              <button
                                key={tone.id}
                                type="button"
                                onClick={() => updateCurrentCard({ aiTone: tone.id })}
                                className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all border ${
                                  isSelected
                                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm font-black'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{tone.icon}</span>
                                <span>{tone.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="💡 Notas opcionales para la IA (ej: Le gusta el tenis y viajar...)"
                          value={currentCard.aiNotes || ''}
                          onChange={e => updateCurrentCard({ aiNotes: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* MODE B: TEMPLATE SELECTION */}
                  {currentCard.mode === 'template' && (
                    <div className="space-y-2 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Selecciona una Plantilla:
                      </label>
                      {templates.length === 0 ? (
                        <p className="text-xs text-slate-500">No tienes plantillas creadas todavía. Se usará el mensaje por defecto.</p>
                      ) : (
                        <select
                          value={currentCard.templateId || templates[0]?.id || ''}
                          onChange={e => updateCurrentCard({ templateId: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {templates.map(tpl => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* MODE C: MANUAL CUSTOM MESSAGE */}
                  {currentCard.mode === 'manual' && (
                    <div className="space-y-1.5 bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">
                          Mensaje Personalizado:
                        </label>
                        <button
                          type="button"
                          onClick={() => updateCurrentCard({ customMessage: (currentCard.customMessage || '') + ' {nombre}' })}
                          className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-50"
                        >
                          + Insertar &ldquo;{'{nombre}'}&rdquo;
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="¡Muchas felicidades {nombre}! Que tengas un día genial 🎂"
                        value={currentCard.customMessage || ''}
                        onChange={e => updateCurrentCard({ customMessage: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  )}

                  {/* 3. SEND MODE TOGGLE */}
                  <div className="pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ autoSend: false })}
                        className={`p-2.5 rounded-2xl text-left border transition-all ${
                          !currentCard.autoSend
                            ? 'bg-violet-50/80 border-violet-500 text-violet-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-xs flex items-center gap-1">
                          🛡️ Pedir Aprobación
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Te avisa por WhatsApp el día del cumple para dar el visto bueno.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ autoSend: true })}
                        className={`p-2.5 rounded-2xl text-left border transition-all ${
                          currentCard.autoSend
                            ? 'bg-violet-50/80 border-violet-500 text-violet-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-xs flex items-center gap-1">
                          🚀 Envío Automático
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Se envía solo en la mañana de su cumpleaños.</p>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                
                {/* Skip Button */}
                <button
                  type="button"
                  onClick={handleSkipCurrent}
                  disabled={isSavingCurrent}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-200/80 hover:border-red-200"
                >
                  <span>❌ Omitir contacto</span>
                </button>

                {/* Save & Next Button */}
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  disabled={isSavingCurrent}
                  className="py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingCurrent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span>Guardar y Siguiente</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Batch Remaining Option */}
              {cards.length - currentIndex > 1 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleApproveAllRemaining}
                    disabled={isSavingCurrent}
                    className="text-xs text-violet-600 hover:text-violet-800 font-bold underline inline-flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Guardar los restantes ({cards.length - currentIndex}) con IA rápida</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: CELEBRACIÓN Y FIN                                 */}
          {/* ========================================================= */}
          {step === 'completed' && (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
                🎉
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">
                  ¡Sincronización Completada!
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Has configurado y añadido <strong className="text-emerald-700 font-bold">{savedCount} contactos</strong> listos para recibir felicitaciones personalizadas en su cumpleaños.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition-all text-sm"
              >
                Ver mis Contactos
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================= */}
      {/* WHATSAPP SELECTOR MODAL                                   */}
      {/* ========================================================= */}
      {showChangeWaModal && currentCard && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-slate-900 text-base">Vincular Chat de WhatsApp</h4>
                <p className="text-xs text-slate-500">Para: <strong>{currentCard.name}</strong></p>
              </div>
              <button 
                onClick={() => setShowChangeWaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={waSearchTerm}
                onChange={e => setWaSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
            </div>

            {/* Direct Number Input */}
            <div className="bg-violet-50/70 p-3 rounded-2xl border border-violet-100 flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-600 shrink-0" />
              <input
                type="text"
                placeholder="O escribe el número (ej: 34612345678)"
                value={waSearchTerm}
                onChange={e => setWaSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-mono w-full focus:outline-none placeholder:text-violet-400"
              />
              {waSearchTerm.replace(/\D/g, '').length >= 8 && (
                <button
                  type="button"
                  onClick={() => {
                    const digits = waSearchTerm.replace(/\D/g, '');
                    updateCurrentCard({
                      matchedPhone: digits,
                      matchedName: currentCard.name,
                      matchScore: 100,
                    });
                    setShowChangeWaModal(false);
                    toast.success('Teléfono asignado');
                  }}
                  className="px-2.5 py-1 bg-violet-600 text-white rounded-lg font-bold text-[11px] shrink-0"
                >
                  Usar
                </button>
              )}
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-60 pr-1">
              {filteredWhatsApp.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No se encontraron chats con ese nombre.</p>
              ) : (
                filteredWhatsApp.slice(0, 30).map(c => {
                  const cleanPhone = c.phone.replace(/\D/g, '');
                  return (
                    <button
                      key={c.jid || c.phone}
                      type="button"
                      onClick={() => {
                        updateCurrentCard({
                          matchedPhone: cleanPhone,
                          matchedName: c.name,
                          matchedPushName: c.pushName,
                          profilePictureUrl: c.profilePictureUrl || null,
                          matchScore: 100,
                        });
                        setShowChangeWaModal(false);
                        toast.success(`Vinculado a ${c.name}`);
                      }}
                      className="w-full p-2.5 text-left rounded-xl hover:bg-violet-50 transition-colors flex items-center justify-between border border-transparent hover:border-violet-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.profilePictureUrl ? (
                          <img src={c.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-xs text-slate-800 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{c.phone}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-violet-600 shrink-0">Seleccionar</span>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
