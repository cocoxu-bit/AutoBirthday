'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getWhatsAppRecentChatsForSyncAction,
  saveSingleSyncedContactAction,
  WhatsAppSyncItem 
} from '@/app/(dashboard)/contacts/sync-actions';
import { WhatsAppGroup, Template, WishMode, AiTone, TargetType } from '@/types';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Check, 
  ArrowRight, 
  ChevronLeft,
  Users, 
  User,
  Phone, 
  FileText, 
  PenTool, 
  MessageSquare,
  Smartphone,
  Calendar as CalendarIcon
} from 'lucide-react';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DEFAULT_FIXED_MESSAGE = '¡Muchas felicidades {nombre}! 🎂🥳 Que pases un día genial y lo disfrutes al máximo.';

const TONES: Array<{ id: AiTone; label: string; icon: string }> = [
  { id: 'casual', label: 'Casual', icon: '😊' },
  { id: 'divertido', label: 'Divertido', icon: '🎉' },
  { id: 'emotivo', label: 'Emotivo', icon: '❤️' },
  { id: 'formal', label: 'Formal', icon: '🤝' },
];

const AI_TONE_EXAMPLES: Record<AiTone, string> = {
  casual: '¡Muchas felicidades {nombre}! 🎉🎂 Que tengas un día genial rodeado de los tuyos. ¡Un abrazo grande!',
  divertido: '¡Feliz cumple {nombre}! 🍻🎂 ¡A celebrarlo por todo lo alto como se merece y que no falten las risas!',
  emotivo: '¡Feliz cumpleaños {nombre}! ❤️✨ Deseo de todo corazón que pases un día maravilloso y súper especial. ¡Te mando un abrazo enorme!',
  formal: '¡Feliz cumpleaños, {nombre}! 🎂 Le deseo un excelente día y muchos éxitos tanto personales como profesionales.',
};

function getDaysUntilBirthday(day: number, month: number): { text: string; isToday: boolean; isTomorrow: boolean } | null {
  if (!day || !month) return null;
  const today = new Date();
  const currentYear = today.getFullYear();
  let nextBday = new Date(currentYear, month - 1, day);
  
  today.setHours(0, 0, 0, 0);
  nextBday.setHours(0, 0, 0, 0);
  
  if (nextBday.getTime() < today.getTime()) {
    nextBday = new Date(currentYear + 1, month - 1, day);
  }
  
  const diffTime = nextBday.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days === 0) return { text: '¡Hoy!', isToday: true, isTomorrow: false };
  if (days === 1) return { text: '¡Mañana!', isToday: false, isTomorrow: true };
  return { text: `Faltan ${days} días`, isToday: false, isTomorrow: false };
}

interface WhatsAppSyncDialogProps {
  onClose: () => void;
  templates?: Template[];
}

export function WhatsAppSyncDialog({ onClose, templates = [] }: WhatsAppSyncDialogProps) {
  const [step, setStep] = useState<'connect' | 'deck' | 'completed'>('connect');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Scroll Container Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const birthdayRef = useRef<HTMLDivElement>(null);

  // Review Deck State
  const [cards, setCards] = useState<WhatsAppSyncItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<WhatsAppGroup[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [birthdayError, setBirthdayError] = useState(false);

  // Auto-scroll to top when moving to next or previous card
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setBirthdayError(false);
  }, [currentIndex, step]);

  // Load WhatsApp Chats
  const handleStartWhatsAppSync = async () => {
    setLoading(true);
    setStatusMessage('Cargando tus conversaciones recientes de WhatsApp...');

    try {
      const result = await getWhatsAppRecentChatsForSyncAction();

      if (!result.success || !result.items || result.items.length === 0) {
        toast.error(result.error || 'No se encontraron conversaciones recientes para sincronizar.');
        setLoading(false);
        return;
      }

      setCards(result.items);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setAvailableGroups(result.availableGroups || []);
      setStep('deck');
      toast.success(`💬 ¡${result.items.length} contactos de WhatsApp listos para añadir!`);
    } catch (err: any) {
      console.error('WhatsApp sync error:', err);
      toast.error(err.message || 'Error al conectar con WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Current Card Data
  const currentCard = cards[currentIndex];

  // Update field of current card
  const updateCurrentCard = (updates: Partial<WhatsAppSyncItem>) => {
    if (updates.birthDay || updates.birthMonth) {
      setBirthdayError(false);
    }
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

  // Go back to previous card
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Save current card and advance
  const handleSaveAndNext = async () => {
    if (!currentCard) return;

    if (!currentCard.birthDay || !currentCard.birthMonth || currentCard.birthDay <= 0 || currentCard.birthMonth <= 0) {
      setBirthdayError(true);
      toast.error('Indica el día y mes de cumpleaños para guardar este contacto.', {
        duration: 3000,
      });
      if (birthdayRef.current) {
        birthdayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (currentCard.targetType === 'group' && !currentCard.groupId && availableGroups.length > 0) {
      const defaultGroup = availableGroups[0];
      updateCurrentCard({ groupId: defaultGroup.id, groupName: defaultGroup.subject });
    }

    const messageToSave = currentCard.mode === 'manual' 
      ? (currentCard.customMessage?.trim() || DEFAULT_FIXED_MESSAGE)
      : undefined;

    const templateIdToSave = currentCard.mode === 'template'
      ? (currentCard.templateId || templates[0]?.id)
      : undefined;

    setIsSavingCurrent(true);
    try {
      const res = await saveSingleSyncedContactAction({
        name: currentCard.name,
        phone: currentCard.phone,
        birthDay: currentCard.birthDay,
        birthMonth: currentCard.birthMonth,
        birthYear: null,
        source: 'whatsapp_sync' as any,
        profilePictureUrl: currentCard.profilePictureUrl,
        targetType: currentCard.targetType || 'individual',
        groupId: currentCard.targetType === 'group' ? (currentCard.groupId || availableGroups[0]?.id) : undefined,
        groupName: currentCard.targetType === 'group' ? (currentCard.groupName || availableGroups[0]?.subject) : undefined,
        mentionInGroup: currentCard.targetType === 'group' ? (currentCard.mentionInGroup ?? true) : undefined,
        mode: currentCard.mode || 'manual',
        templateId: templateIdToSave,
        customMessage: messageToSave,
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

  // Calculate live preview text for WhatsApp bubble
  const contactFirstName = currentCard 
    ? currentCard.name.split(' ')[0] 
    : 'Amigo/a';

  let livePreviewBody = '';
  if (currentCard) {
    if (currentCard.mode === 'manual') {
      const raw = currentCard.customMessage?.trim() || DEFAULT_FIXED_MESSAGE;
      livePreviewBody = raw.replace(/\{nombre\}/gi, contactFirstName);
    } else if (currentCard.mode === 'template') {
      const tpl = templates.find(t => t.id === currentCard.templateId) || templates[0];
      const raw = tpl ? tpl.content : DEFAULT_FIXED_MESSAGE;
      livePreviewBody = raw.replace(/\{nombre\}/gi, contactFirstName);
    } else if (currentCard.mode === 'ai') {
      const example = AI_TONE_EXAMPLES[currentCard.aiTone || 'casual'];
      livePreviewBody = example.replace(/\{nombre\}/gi, contactFirstName);
      if (currentCard.aiNotes?.trim()) {
        livePreviewBody += `\n\n*(La IA adaptará el texto según tus notas: "${currentCard.aiNotes.trim()}")*`;
      }
    }
  }

  const daysInfo = currentCard ? getDaysUntilBirthday(currentCard.birthDay, currentCard.birthMonth) : null;
  const currentGroupName = currentCard?.groupName || (availableGroups.find(g => g.id === currentCard?.groupId)?.subject) || 'Grupo de WhatsApp';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* STICKY HEADER (ALWAYS FIXED AT TOP WITH PROGRESS) */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md shrink-0 space-y-3">
          
          {/* Top Row: Title, Back Button & Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {step === 'deck' && currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-sm hover:scale-105 transition-all"
                  title="Volver al contacto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {step === 'connect' ? 'Sincronizar por WhatsApp' : step === 'deck' ? 'Revisar Conversaciones' : '¡Sincronización Completada!'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {step === 'connect' 
                    ? 'Importa rápidamente tus contactos frecuentes y programa sus cumpleaños' 
                    : step === 'deck' 
                    ? `Contacto ${currentIndex + 1} de ${cards.length}`
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

          {/* Sticky Progress Bar & Badges */}
          {step === 'deck' && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="text-emerald-900 font-black">Contacto {currentIndex + 1} de {cards.length}</span>
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
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* ========================================================= */}
          {/* STEP 1: CONECTAR / INICIAR SYNC WHATSAPP                  */}
          {/* ========================================================= */}
          {step === 'connect' && (
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl shadow-inner border border-emerald-200 flex items-center justify-center mx-auto text-3xl">
                💬
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-xl font-black text-slate-900">
                  Importar Contactos de WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Recorreremos tus chats recientes de WhatsApp 1 a 1 para que solo tengas que indicar su fecha de cumpleaños y programar su felicitación.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartWhatsAppSync}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{statusMessage || 'Cargando conversaciones...'}</span>
                  </>
                ) : (
                  <>
                    <span>Comenzar Sincronización</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 pt-2">
                <span>⚡ En orden de actividad</span>
                <span>•</span>
                <span>📸 Con fotos de perfil</span>
                <span>•</span>
                <span>🔒 Privado y seguro</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: REVISIÓN LIMPIA Y DETALLADA 1 A 1                  */}
          {/* ========================================================= */}
          {step === 'deck' && currentCard && (
            <div className="space-y-5">

              {/* MAIN CONTACT CARD */}
              <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-200/40 space-y-6 text-center">
                
                {/* 1. BIG CENTERED AVATAR / PROFILE PHOTO */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {currentCard.profilePictureUrl ? (
                      <img 
                        src={currentCard.profilePictureUrl} 
                        alt={currentCard.name} 
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-4 border-white ring-4 ring-emerald-100" 
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-3xl shadow-xl border-4 border-white ring-4 ring-emerald-100">
                        {currentCard.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span 
                      className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white" 
                      title="Contacto de WhatsApp"
                    >
                      💬
                    </span>
                  </div>

                  {/* Contact Name & Phone */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
                    {currentCard.name}
                  </h3>

                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      +{currentCard.phone}
                    </span>
                    {currentCard.pushName && currentCard.pushName !== currentCard.name && (
                      <span className="text-[11px] text-slate-400">
                        ({currentCard.pushName})
                      </span>
                    )}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* 🌟 2. CRITICAL HIGHLIGHTED REQUIRED BIRTHDAY FIELD 🌟 */}
                <div 
                  ref={birthdayRef}
                  className={`p-4 sm:p-5 rounded-2xl text-left space-y-3 transition-all ${
                    birthdayError 
                      ? 'bg-rose-50 border-2 border-rose-400 ring-4 ring-rose-100 animate-pulse'
                      : currentCard.birthDay && currentCard.birthMonth
                      ? 'bg-emerald-50/80 border-2 border-emerald-300/80 shadow-sm'
                      : 'bg-amber-50/90 border-2 border-amber-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span className="text-base">🎂</span>
                      <span>¿Cuándo es su cumpleaños?</span>
                    </label>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      currentCard.birthDay && currentCard.birthMonth
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {currentCard.birthDay && currentCard.birthMonth ? 'Listo' : 'Obligatorio'}
                    </span>
                  </div>

                  {/* Day and Month Selectors */}
                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Day Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Día:
                      </label>
                      <select
                        value={currentCard.birthDay || ''}
                        onChange={e => updateCurrentCard({ birthDay: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        <option value="">Seleccionar Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mes:
                      </label>
                      <select
                        value={currentCard.birthMonth || ''}
                        onChange={e => updateCurrentCard({ birthMonth: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs capitalize"
                      >
                        <option value="">Seleccionar Mes</option>
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={m} value={idx + 1} className="capitalize">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Days Info Badge */}
                  {daysInfo ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span>🎉</span>
                      <span>{currentCard.birthDay} de {MONTH_NAMES[currentCard.birthMonth - 1]} — <strong>{daysInfo.text}</strong></span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      💡 Selecciona el día y el mes en el que cumple años para programar su mensaje automático.
                    </p>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* 3. DESTINO DE LA FELICITACIÓN (CHAT PRIVADO VS GRUPO) */}
                <div className="space-y-2.5 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    ¿Dónde quieres enviar la felicitación?
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateCurrentCard({ targetType: 'individual' })}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                        currentCard.targetType !== 'group'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black">Chat Privado</p>
                        <p className="text-[10px] text-slate-500 font-normal">Directo a su WhatsApp</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultGroup = availableGroups[0];
                        updateCurrentCard({ 
                          targetType: 'group',
                          groupId: currentCard.groupId || defaultGroup?.id,
                          groupName: currentCard.groupName || defaultGroup?.subject,
                          mentionInGroup: currentCard.mentionInGroup ?? true,
                        });
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                        currentCard.targetType === 'group'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black">Grupo de WhatsApp</p>
                        <p className="text-[10px] text-slate-500 font-normal">Amigos, familia, etc.</p>
                      </div>
                    </button>
                  </div>

                  {/* Group Selector Sub-block */}
                  {currentCard.targetType === 'group' && (
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2.5 mt-2 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-emerald-900 uppercase">
                          Selecciona el Grupo de WhatsApp:
                        </label>
                        {availableGroups.length === 0 ? (
                          <p className="text-xs text-emerald-700">No se detectaron grupos en tu cuenta de WhatsApp.</p>
                        ) : (
                          <select
                            value={currentCard.groupId || availableGroups[0]?.id || ''}
                            onChange={e => {
                              const selectedId = e.target.value;
                              const group = availableGroups.find(g => g.id === selectedId);
                              updateCurrentCard({
                                groupId: selectedId,
                                groupName: group?.subject || '',
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {availableGroups.map(g => (
                              <option key={g.id} value={g.id}>
                                {g.subject}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Mention Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={currentCard.mentionInGroup ?? true}
                          onChange={e => updateCurrentCard({ mentionInGroup: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-emerald-900">
                          Etiquetar con mención @{contactFirstName} en el grupo
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* 4. GREETING CONFIGURATION */}
                <div className="space-y-4 text-left">
                  
                  {/* Mode Selector Tabs */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Configuración del Mensaje:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                      
                      {/* TAB 1: MENSAJE FIJO */}
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'manual' })}
                        className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'manual'
                            ? 'bg-white text-emerald-900 shadow-sm font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mensaje Fijo</span>
                      </button>

                      {/* TAB 2: PLANTILLA */}
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'template' })}
                        className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'template'
                            ? 'bg-white text-emerald-900 shadow-sm font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Plantilla</span>
                      </button>

                      {/* TAB 3: IA MÁGICA */}
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ mode: 'ai' })}
                        className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          currentCard.mode === 'ai'
                            ? 'bg-white text-emerald-900 shadow-sm font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        <span>IA Mágica</span>
                      </button>
                    </div>
                  </div>

                  {/* MODE A: MANUAL FIXED MESSAGE */}
                  {currentCard.mode === 'manual' && (
                    <div className="space-y-2 bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase">
                          Texto del mensaje:
                        </label>
                        <button
                          type="button"
                          onClick={() => updateCurrentCard({ customMessage: (currentCard.customMessage || DEFAULT_FIXED_MESSAGE) + ' {nombre}' })}
                          className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 shadow-2xs"
                        >
                          + Añadir &ldquo;{'{nombre}'}&rdquo;
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        placeholder={DEFAULT_FIXED_MESSAGE}
                        value={currentCard.customMessage ?? DEFAULT_FIXED_MESSAGE}
                        onChange={e => updateCurrentCard({ customMessage: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
                      />
                    </div>
                  )}

                  {/* MODE B: TEMPLATE SELECTION */}
                  {currentCard.mode === 'template' && (
                    <div className="space-y-2 bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Elige una de tus plantillas:
                      </label>
                      {templates.length === 0 ? (
                        <p className="text-xs text-slate-500">No tienes plantillas creadas todavía. Se usará el mensaje por defecto.</p>
                      ) : (
                        <select
                          value={currentCard.templateId || templates[0]?.id || ''}
                          onChange={e => updateCurrentCard({ templateId: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

                  {/* MODE C: AI GENERATION */}
                  {currentCard.mode === 'ai' && (
                    <div className="space-y-3 bg-violet-50/40 border border-violet-100 p-4 rounded-2xl">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase">
                          Tono de la felicitación IA:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {TONES.map(tone => {
                            const isSelected = currentCard.aiTone === tone.id;
                            return (
                              <button
                                key={tone.id}
                                type="button"
                                onClick={() => updateCurrentCard({ aiTone: tone.id })}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                                  isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-black'
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
                          placeholder="💡 Notas opcionales para la IA (ej: Le gusta el fútbol, cumple 25...)"
                          value={currentCard.aiNotes || ''}
                          onChange={e => updateCurrentCard({ aiNotes: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. REALISTIC WHATSAPP CHAT PREVIEW */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Vista previa en WhatsApp
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {currentCard.targetType === 'group' ? `en el grupo "${currentGroupName}"` : `así lo recibirá ${contactFirstName}`}
                      </span>
                    </div>

                    <div className="bg-[#efeae2] p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-inner">
                      {currentCard.targetType === 'group' && (
                        <div className="flex items-center justify-center pb-2">
                          <span className="bg-slate-800/60 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            👥 Grupo: {currentGroupName}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <div className="bg-[#dcf8c6] text-slate-900 rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[92%] sm:max-w-[88%] shadow-sm text-xs sm:text-sm leading-relaxed space-y-1">
                          {currentCard.targetType === 'group' && currentCard.mentionInGroup && (
                            <span className="font-bold text-emerald-800 mr-1.5">
                              @{contactFirstName}
                            </span>
                          )}
                          <span className="whitespace-pre-wrap font-sans text-slate-900">{livePreviewBody}</span>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-medium pt-0.5">
                            <span>09:30</span>
                            <span className="text-sky-500 font-bold">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. SEND MODE TOGGLE */}
                  <div className="pt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                      Momento de Envío:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ autoSend: false })}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          !currentCard.autoSend
                            ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-xs flex items-center gap-1">
                          🛡️ Pedir Aprobación
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Te avisa por WhatsApp el día del cumple para dar el OK.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCurrentCard({ autoSend: true })}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          currentCard.autoSend
                            ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-xs flex items-center gap-1">
                          🚀 Envío Automático
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Se envía solo en la mañana de su cumpleaños.</p>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

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
                  Has configurado y añadido <strong className="text-emerald-700 font-bold">{savedCount} contactos</strong> de WhatsApp con sus cumpleaños listos para felicitar automáticamente.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 transition-all text-sm"
              >
                Ver mis Contactos
              </button>
            </div>
          )}

        </div>

        {/* STICKY FOOTER ACTION BUTTONS (ALWAYS VISIBLE IN DECK REVIEW) */}
        {step === 'deck' && currentCard && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 flex items-center gap-2.5 shadow-xs">
            {/* Previous Button */}
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSavingCurrent}
                className="py-3 px-3.5 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm border border-slate-200 shadow-sm transition-all shrink-0 flex items-center justify-center gap-1 disabled:opacity-50"
                title="Volver al contacto anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkipCurrent}
              disabled={isSavingCurrent}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border border-slate-200/80 hover:border-red-200"
            >
              <span>❌ Omitir</span>
            </button>

            {/* Save & Next Button */}
            <button
              type="button"
              onClick={handleSaveAndNext}
              disabled={isSavingCurrent}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSavingCurrent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>Guardar Contacto</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
