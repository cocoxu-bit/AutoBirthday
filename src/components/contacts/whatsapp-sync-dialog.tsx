'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getWhatsAppInitialBatchForSyncAction,
  getWhatsAppChunkedContactsForSyncAction,
  getWhatsAppRemainingContactsForSyncAction,
  saveSingleSyncedContactAction,
  getWhatsAppProfilePicAction,
  WhatsAppSyncItem 
} from '@/app/(dashboard)/contacts/sync-actions';
import { WhatsAppGroup, Template, WishMode, AiTone, TargetType } from '@/types';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { InlineTemplateCreator } from '@/components/templates/inline-template-creator';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Check, 
  ArrowRight, 
  ChevronLeft,
  Users, 
  User,
  FileText, 
  PenTool, 
  MessageSquare,
  Calendar as CalendarIcon,
  Plus,
  Edit3,
  ZoomIn
} from 'lucide-react';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const DEFAULT_FIXED_MESSAGE = '¡Muchas felicidades! 🎂🥳 Que pases un día genial y lo disfrutes al máximo.';

const TONES: Array<{ id: AiTone; label: string }> = [
  { id: 'casual', label: 'Casual' },
  { id: 'divertido', label: 'Divertido' },
  { id: 'emotivo', label: 'Emotivo' },
  { id: 'formal', label: 'Formal' },
];

const AI_TONE_EXAMPLES: Record<AiTone, string> = {
  casual: '¡Muchas felicidades {nombre}! 🎉🎂 Que tengas un día genial rodeado de los tuyos. ¡Un abrazo grande!',
  divertido: '¡Feliz cumple {nombre}! 🍻🎂 ¡A celebrarlo por todo lo alto como se merece y que no falten las risas!',
  emotivo: '¡Feliz cumpleaños {nombre}! ❤️✨ Deseo de todo corazón que pases un día maravilloso y súper especial. ¡Te mando un abrazo enorme!',
  formal: '¡Feliz cumpleaños, {nombre}! 🎂 Le deseo un excelente día y muchos éxitos tanto personales como profesionales.',
};

function getDaysUntilBirthday(day: number, month: number, year?: number | null): { text: string; isToday: boolean; isTomorrow: boolean; age?: number } | null {
  if (!day || !month) return null;
  const today = new Date();
  const currentYear = today.getFullYear();
  let nextBday = new Date(currentYear, month - 1, day);
  
  today.setHours(0, 0, 0, 0);
  nextBday.setHours(0, 0, 0, 0);
  
  let targetYear = currentYear;
  if (nextBday.getTime() < today.getTime()) {
    nextBday = new Date(currentYear + 1, month - 1, day);
    targetYear = currentYear + 1;
  }
  
  const diffTime = nextBday.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const age = year && year > 1900 && year <= currentYear ? (targetYear - year) : undefined;

  if (days === 0) return { text: '¡Hoy!', isToday: true, isTomorrow: false, age };
  if (days === 1) return { text: '¡Mañana!', isToday: false, isTomorrow: true, age };
  return { text: `Faltan ${days} días`, isToday: false, isTomorrow: false, age };
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
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Review Deck State
  const [cards, setCards] = useState<WhatsAppSyncItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<WhatsAppGroup[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [birthdayError, setBirthdayError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);

  // Enlarged photo modal state
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; name: string } | null>(null);

  // Templates state
  const [currentTemplates, setCurrentTemplates] = useState<Template[]>(templates);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Client-side photo cache for instant rendering
  const [photoCache, setPhotoCache] = useState<Record<string, string | null>>({});

  // Auto-scroll to top when moving to next or previous card
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setBirthdayError(false);
    setNameError(false);
  }, [currentIndex, step]);

  // On-demand photo prefetching for current card and upcoming cards
  const fetchAvatarIfNeeded = async (phone: string, initialPic?: string | null) => {
    if (initialPic) {
      if (!photoCache[phone]) {
        setPhotoCache(prev => ({ ...prev, [phone]: initialPic }));
      }
      return;
    }
    if (photoCache[phone] !== undefined) return;

    try {
      const pic = await getWhatsAppProfilePicAction(phone);
      setPhotoCache(prev => ({ ...prev, [phone]: pic }));
    } catch {
      setPhotoCache(prev => ({ ...prev, [phone]: null }));
    }
  };

  useEffect(() => {
    if (cards.length > 0 && step === 'deck') {
      const windowCards = cards.slice(Math.max(0, currentIndex - 1), currentIndex + 8);
      windowCards.forEach(c => {
        if (c.phone) {
          fetchAvatarIfNeeded(c.phone, c.profilePictureUrl);
        }
      });
    }
  }, [currentIndex, cards, step]);

  // Auto-start sync immediately upon dialog open
  useEffect(() => {
    handleStartWhatsAppSync();
  }, []);

  // Load WhatsApp Chats (2-Phase Progressive Fast Sync)
  const handleStartWhatsAppSync = async () => {
    setLoading(true);
    setStatusMessage('Cargando tus contactos...');

    try {
      // Phase 1: Fast initial batch (< 200ms)
      const initialResult = await getWhatsAppInitialBatchForSyncAction();

      if (!initialResult.success || !initialResult.items || initialResult.items.length === 0) {
        toast.error(initialResult.error || 'No se encontraron conversaciones para sincronizar.');
        setLoading(false);
        return;
      }

      // Seed initial photo cache from server batch
      const initialCache: Record<string, string | null> = {};
      initialResult.items.forEach(item => {
        if (item.phone && item.profilePictureUrl) {
          initialCache[item.phone] = item.profilePictureUrl;
        }
      });
      setPhotoCache(initialCache);

      setCards(initialResult.items);
      setCurrentIndex(0);
      setSavedCount(0);
      setSkippedCount(0);
      setAvailableGroups(initialResult.availableGroups || []);
      setStep('deck');
      setLoading(false);

      // Phase 2: Asynchronous Stepped Progressive Loader in Waves (8 -> 33 -> 58 -> 83 -> ...)
      if (initialResult.hasMore) {
        setIsBackgroundSyncing(true);
        const loadRemainingInWaves = async (initialPhones: string[]) => {
          let currentLoaded = [...initialPhones];
          let offset = 0;
          const CHUNK_SIZE = 25;
          let hasMore = true;

          while (hasMore) {
            try {
              const res = await getWhatsAppChunkedContactsForSyncAction(currentLoaded, offset, CHUNK_SIZE);
              if (!res.success || !res.items || res.items.length === 0) {
                hasMore = false;
                break;
              }

              const newItems = res.items;

              // Seed photo cache with newly fetched avatars
              const newCache: Record<string, string | null> = {};
              newItems.forEach(i => {
                if (i.phone && i.profilePictureUrl) newCache[i.phone] = i.profilePictureUrl;
              });
              setPhotoCache(prev => ({ ...prev, ...newCache }));

              // Progressively expand cards list in waves
              setCards(prev => {
                const existingSet = new Set(prev.map(c => c.phone));
                const toAdd = newItems.filter(item => !existingSet.has(item.phone));
                return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
              });

              if (res.availableGroups && res.availableGroups.length > 0) {
                setAvailableGroups(res.availableGroups);
              }

              currentLoaded = [...currentLoaded, ...newItems.map(i => i.phone)];
              offset += newItems.length;
              hasMore = Boolean(res.hasMore);

              // Smooth pacing: wait 200ms between chunks so UI renders seamlessly
              if (hasMore) {
                await new Promise(r => setTimeout(r, 200));
              }
            } catch (e) {
              console.warn('Stepped wave loader note:', e);
              hasMore = false;
            }
          }
          setIsBackgroundSyncing(false);
        };

        loadRemainingInWaves(initialResult.items.map(i => i.phone));
      }
    } catch (err: any) {
      console.error('WhatsApp sync error:', err);
      toast.error(err.message || 'Error al conectar con WhatsApp');
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

  // Finish and continue later
  const handleSaveAndExit = () => {
    if (savedCount > 0) {
      toast.success(`Guardado: ${savedCount} contactos añadidos a tu agenda.`, {
        duration: 3000,
      });
    }
    onClose();
  };

  // Save current card and advance
  const handleSaveAndNext = async () => {
    if (!currentCard) return;

    if (!currentCard.name || !currentCard.name.trim()) {
      setNameError(true);
      toast.error('Por favor, indica el nombre del contacto para guardarlo.', {
        duration: 3000,
      });
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

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
      ? (currentCard.templateId || currentTemplates[0]?.id)
      : undefined;

    const profilePic = photoCache[currentCard.phone] ?? currentCard.profilePictureUrl;

    setIsSavingCurrent(true);
    try {
      const res = await saveSingleSyncedContactAction({
        name: currentCard.name,
        phone: currentCard.phone,
        birthDay: currentCard.birthDay,
        birthMonth: currentCard.birthMonth,
        birthYear: currentCard.birthYear || null,
        source: 'manual',
        profilePictureUrl: profilePic || null,
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
        toast.success(`${currentCard.name} añadido`, { duration: 1500 });
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
      livePreviewBody = currentCard.customMessage?.trim() || DEFAULT_FIXED_MESSAGE;
    } else if (currentCard.mode === 'template') {
      const tpl = currentTemplates.find(t => t.id === currentCard.templateId) || currentTemplates[0];
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

  const daysInfo = currentCard ? getDaysUntilBirthday(currentCard.birthDay, currentCard.birthMonth, currentCard.birthYear) : null;
  const currentGroupName = currentCard?.groupName || (availableGroups.find(g => g.id === currentCard?.groupId)?.subject) || 'Grupo de WhatsApp';
  const activeAvatar = currentCard ? (photoCache[currentCard.phone] ?? currentCard.profilePictureUrl) : null;

  const currentYearNumber = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYearNumber - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* STICKY HEADER */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md shrink-0 space-y-3">
          
          {/* Top Row: Title, Pause Button & Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-xs shrink-0">
                <WhatsAppIcon className="w-5 h-5" size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {step === 'connect' ? 'Sincronizar por WhatsApp' : step === 'deck' ? 'Revisar Contactos' : 'Sincronización Completada'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {step === 'connect' 
                    ? 'Importa rápidamente tus contactos de chats y grupos' 
                    : step === 'deck' 
                    ? `Contacto ${currentIndex + 1} de ${cards.length}`
                    : 'Contactos añadidos a tu agenda'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {step === 'deck' && (
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
                  title="Pausar y guardar el progreso actual"
                >
                  Guardar y seguir luego
                </button>
              )}

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sticky Progress Bar & Badges */}
          {step === 'deck' && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-900 font-black">Contacto {currentIndex + 1} de {cards.length}</span>
                  {isBackgroundSyncing ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                      <span>Detectando más ({cards.length})...</span>
                    </span>
                  ) : cards.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full">
                      <span>✓ {cards.length} contactos recientes</span>
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                    {savedCount} guardados
                  </span>
                  {skippedCount > 0 && (
                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      {skippedCount} omitidos
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
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-center mx-auto">
                <WhatsAppIcon className="w-10 h-10" size={40} />
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-xl font-black text-slate-900">
                  Importar Contactos de WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Recorreremos tus contactos y chats de WhatsApp para que puedas indicar su fecha de cumpleaños y programar sus felicitaciones.
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
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: REVISIÓN LIMPIA Y DETALLADA 1 A 1                  */}
          {/* ========================================================= */}
          {step === 'deck' && currentCard && (
            <div className="space-y-5">

              {/* MAIN CONTACT CARD */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 text-center">
                
                {/* 1. BIG CENTERED AVATAR / PROFILE PHOTO */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    {activeAvatar ? (
                      <button
                        type="button"
                        onClick={() => setEnlargedPhoto({ url: activeAvatar, name: currentCard.name || 'Foto de WhatsApp' })}
                        className="relative block rounded-full focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-transform active:scale-95 cursor-zoom-in"
                        title="Toca para ampliar foto"
                      >
                        <img 
                          src={activeAvatar} 
                          alt={currentCard.name || 'Contacto de WhatsApp'} 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-emerald-100 group-hover:ring-emerald-400 group-hover:brightness-95 transition-all" 
                        />
                        <div className="absolute inset-0 rounded-full bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <ZoomIn className="w-6 h-6 drop-shadow-md" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-3xl shadow-md border-4 border-white ring-2 ring-emerald-100">
                        {currentCard.name ? currentCard.name.slice(0, 2).toUpperCase() : (currentCard.phone.slice(-2) || 'WA')}
                      </div>
                    )}
                    <div 
                      className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 pointer-events-none" 
                      title="Contacto de WhatsApp"
                    >
                      <WhatsAppIcon className="w-4 h-4" size={16} />
                    </div>
                  </div>

                  {/* Editable Contact Name Input */}
                  <div className="mt-3.5 relative w-full max-w-sm mx-auto space-y-1">
                    <div className="relative group">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={currentCard.name}
                        onChange={e => {
                          setNameError(false);
                          updateCurrentCard({ name: e.target.value });
                        }}
                        placeholder="Escribe su nombre (ej. Enrique Tatay)"
                        className={`w-full text-center text-lg sm:text-xl font-black text-slate-900 tracking-tight transition-all rounded-2xl py-2 px-4 focus:outline-none ${
                          !currentCard.name?.trim()
                            ? 'bg-amber-50/90 border-2 border-dashed border-amber-400 focus:border-emerald-500 focus:bg-white placeholder:text-amber-700/60 shadow-2xs'
                            : 'bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        } ${nameError ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300' : ''}`}
                        title="Nombre del contacto"
                      />
                      <Edit3 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors pointer-events-none" />
                    </div>
                    {!currentCard.name?.trim() && (
                      <p className="text-[11px] font-bold text-amber-700 animate-pulse">
                        ✍️ Escribe el nombre de este contacto para guardarlo
                      </p>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 block font-mono">
                      {currentCard.phone.startsWith('34') ? `+34 ${currentCard.phone.slice(2)}` : `+${currentCard.phone}`}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* 2. REQUIRED BIRTHDAY FIELD WITH OPTIONAL YEAR */}
                <div 
                  ref={birthdayRef}
                  className={`p-4 sm:p-5 rounded-2xl text-left space-y-3 transition-all ${
                    birthdayError 
                      ? 'bg-rose-50 border-2 border-rose-400 ring-4 ring-rose-100'
                      : currentCard.birthDay && currentCard.birthMonth
                      ? 'bg-emerald-50/80 border border-emerald-300 shadow-2xs'
                      : 'bg-amber-50/70 border border-amber-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-emerald-700" />
                      <span>Fecha de Cumpleaños</span>
                    </label>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      currentCard.birthDay && currentCard.birthMonth
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {currentCard.birthDay && currentCard.birthMonth ? 'Completado' : 'Requerido'}
                    </span>
                  </div>

                  {/* Day, Month, and Year Selectors (Perfect 1-line alignment) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    
                    {/* Day Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 h-4 leading-4 truncate">
                        Día
                      </label>
                      <select
                        value={currentCard.birthDay || ''}
                        onChange={e => updateCurrentCard({ birthDay: Number(e.target.value) })}
                        className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 h-4 leading-4 truncate">
                        Mes
                      </label>
                      <select
                        value={currentCard.birthMonth || ''}
                        onChange={e => updateCurrentCard({ birthMonth: Number(e.target.value) })}
                        className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs capitalize"
                      >
                        <option value="">Mes</option>
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={m} value={idx + 1} className="capitalize">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Selector (Optional) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 h-4 leading-4 truncate">
                        Año <span className="text-[10px] font-normal text-slate-400">(opc.)</span>
                      </label>
                      <select
                        value={currentCard.birthYear || ''}
                        onChange={e => updateCurrentCard({ birthYear: e.target.value ? Number(e.target.value) : null })}
                        className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      >
                        <option value="">Opc.</option>
                        {yearOptions.map(y => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Days Info Badge */}
                  {daysInfo ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <span>
                        {currentCard.birthDay} de {MONTH_NAMES[currentCard.birthMonth - 1]}
                        {currentCard.birthYear ? ` de ${currentCard.birthYear}` : ''} — <strong>{daysInfo.text}</strong>
                        {daysInfo.age ? ` (${daysInfo.age} años)` : ''}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Selecciona el día y mes en el que cumple años para programar su mensaje automático.
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

                  {/* MODE A: MANUAL FIXED MESSAGE (NO VARIABLES BUTTON) */}
                  {currentCard.mode === 'manual' && (
                    <div className="space-y-2 bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl">
                      <label className="text-xs font-bold text-slate-700 uppercase block">
                        Texto del mensaje:
                      </label>
                      <textarea
                        rows={3}
                        placeholder={DEFAULT_FIXED_MESSAGE}
                        value={currentCard.customMessage ?? DEFAULT_FIXED_MESSAGE}
                        onChange={e => updateCurrentCard({ customMessage: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-inner"
                      />
                    </div>
                  )}

                  {/* MODE B: TEMPLATE SELECTION WITH INLINE CREATOR */}
                  {currentCard.mode === 'template' && (
                    <div className="space-y-2.5 bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase">
                          Elige una de tus plantillas:
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsTemplateModalOpen(true)}
                          className="text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nueva Plantilla</span>
                        </button>
                      </div>

                      {currentTemplates.length === 0 ? (
                        <p className="text-xs text-slate-500">No tienes plantillas creadas todavía. Crea una con el botón superior.</p>
                      ) : (
                        <select
                          value={currentCard.templateId || currentTemplates[0]?.id || ''}
                          onChange={e => updateCurrentCard({ templateId: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {currentTemplates.map(tpl => (
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
                                <span>{tone.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Notas opcionales para la IA (ej: Le gusta el fútbol, cumple 25...)"
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
                        <WhatsAppIcon className="w-3.5 h-3.5" size={16} />
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
                            Grupo: {currentGroupName}
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
                          Pedir Aprobación
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Te avisa por WhatsApp el día del cumpleaños para dar el OK.</p>
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
                          Envío Automático
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
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
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

        {/* STICKY FOOTER ACTION BUTTONS */}
        {step === 'deck' && currentCard && (
          <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 flex items-center gap-2 sm:gap-3 shadow-xs">
            {/* Previous Button */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSavingCurrent}
              className="flex-1 min-h-[48px] py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed active:scale-[0.98]"
              title="Volver al contacto anterior"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Anterior</span>
            </button>

            {/* Skip Button (Soft light-red background) */}
            <button
              type="button"
              onClick={handleSkipCurrent}
              disabled={isSavingCurrent}
              className="flex-1 min-h-[48px] py-2.5 px-3 bg-red-50 hover:bg-red-100/90 text-rose-700 hover:text-rose-800 font-bold text-xs sm:text-sm border border-red-200/90 shadow-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
              title="Omitir este contacto y pasar al siguiente"
            >
              <X className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Omitir</span>
            </button>

            {/* Save & Next Button */}
            <button
              type="button"
              onClick={handleSaveAndNext}
              disabled={isSavingCurrent}
              className="flex-[1.3] min-h-[48px] py-2.5 px-3 sm:px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSavingCurrent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* INLINE TEMPLATE CREATION MODAL */}
      <InlineTemplateCreator
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreated={newTpl => {
          setCurrentTemplates(prev => [newTpl, ...prev]);
          updateCurrentCard({ templateId: newTpl.id });
        }}
      />

      {/* ENLARGED PHOTO LIGHTBOX / MODAL */}
      {enlargedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div 
            className="relative max-w-sm sm:max-w-md w-full bg-slate-900/95 border border-slate-700/60 rounded-3xl p-5 sm:p-7 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-sm"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <img 
                src={enlargedPhoto.url} 
                alt={enlargedPhoto.name}
                className="w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-3xl object-cover shadow-2xl border-2 border-slate-700/80 ring-4 ring-emerald-500/20" 
              />
            </div>

            <div className="space-y-1 pt-1">
              <h4 className="text-xl font-black text-white tracking-tight">
                {enlargedPhoto.name}
              </h4>
              <p className="text-xs text-slate-400">
                Foto de perfil de WhatsApp en alta resolución
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
