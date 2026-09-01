'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ContactFormData, contactFormSchema } from '@/lib/validations/contact';
import { 
  createContact, 
  updateContact, 
  fetchWhatsAppGroupsAction, 
  fetchWhatsAppContactsAction 
} from '@/app/(dashboard)/contacts/actions';
import { getWhatsAppProfilePicAction } from '@/app/(dashboard)/contacts/sync-actions';
import { InlineTemplateCreator } from '@/components/templates/inline-template-creator';
import { Template, WhatsAppGroup, WhatsAppChatContact, AiTone } from '@/types';
import { 
  MessageSquare, 
  Users, 
  User,
  Loader2, 
  Search, 
  Check, 
  PenTool, 
  FileText, 
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Plus,
  X
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

function isValidSavedName(name?: string, phone?: string): boolean {
  if (!name) return false;
  const clean = name.trim();
  if (!clean || clean === 'Você' || clean === 'You') return false;
  if (/^[\d+\s\-()]+$/.test(clean)) return false;
  if (phone && clean.replace(/\D/g, '') === phone.replace(/\D/g, '')) return false;
  return true;
}

interface ContactFormProps {
  initialData?: Partial<ContactFormData> & { id?: string; profilePictureUrl?: string | null };
  templates: Template[];
  title?: string;
  subtitle?: string;
}

export function ContactForm({ initialData, templates, title = 'Añadir Cumpleaños', subtitle = 'Añade los datos de la persona a felicitar.' }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);
  const [currentTemplates, setCurrentTemplates] = useState<Template[]>(templates);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // WhatsApp & Phone Contacts (Merged Pool)
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [allContacts, setAllContacts] = useState<WhatsAppChatContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  // Profile Picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(initialData?.profilePictureUrl || null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      birthDay: initialData?.birthDay || 1,
      birthMonth: initialData?.birthMonth || 1,
      birthYear: initialData?.birthYear || undefined,
      targetType: initialData?.targetType || 'individual',
      groupId: initialData?.groupId || '',
      groupName: initialData?.groupName || '',
      mentionInGroup: initialData?.mentionInGroup ?? true,
      profilePictureUrl: initialData?.profilePictureUrl || undefined,
      mode: initialData?.mode || 'manual',
      customMessage: initialData?.customMessage || DEFAULT_FIXED_MESSAGE,
      templateId: initialData?.templateId || '',
      aiRelationship: initialData?.aiRelationship || '',
      aiTone: initialData?.aiTone || 'casual',
      aiNotes: initialData?.aiNotes || '',
      autoSend: initialData?.autoSend ?? false,
      sendTimeStart: initialData?.sendTimeStart || '09:30',
      sendTimeEnd: initialData?.sendTimeEnd || '11:45',
      isActive: initialData?.isActive ?? true,
    },
  });

  const targetType = form.watch('targetType');
  const mode = form.watch('mode');
  const selectedTemplateId = form.watch('templateId');
  const contactName = form.watch('name');
  const phoneValue = form.watch('phone');
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Check if form is dirty or has filled content
  const isFormDirty = Boolean(contactName?.trim()) || Boolean(phoneValue?.trim()) || form.formState.isDirty;

  // Intercept back navigation / exit attempt
  const handleAttemptExit = () => {
    if (isFormDirty) {
      setShowExitWarningModal(true);
    } else {
      router.push('/contacts');
    }
  };

  // Prevent accidental window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  // Instant Cache Loading via localStorage
  useEffect(() => {
    async function loadData() {
      try {
        const cachedGroups = localStorage.getItem('autobirthday_cached_groups');
        const cachedContacts = localStorage.getItem('autobirthday_cached_contacts');
        const phoneContacts = localStorage.getItem('autobirthday_phone_contacts');
        
        if (cachedGroups) setGroups(JSON.parse(cachedGroups));
        
        const c1: WhatsAppChatContact[] = cachedContacts ? JSON.parse(cachedContacts) : [];
        const c2: WhatsAppChatContact[] = phoneContacts ? JSON.parse(phoneContacts) : [];
        
        const map = new Map<string, WhatsAppChatContact>();
        for (const item of [...c1, ...c2]) {
          if (isValidSavedName(item.name, item.phone)) {
            const clean = (item.phone || item.jid || '').replace(/\D/g, '');
            if (clean) map.set(clean, item);
          }
        }
        const merged = Array.from(map.values());
        if (merged.length > 0) setAllContacts(merged);
      } catch {}

      try {
        const [loadedGroups, loadedContacts] = await Promise.all([
          fetchWhatsAppGroupsAction(),
          fetchWhatsAppContactsAction(),
        ]);
        setGroups(loadedGroups);
        
        const phoneStored = localStorage.getItem('autobirthday_phone_contacts');
        const phoneList: WhatsAppChatContact[] = phoneStored ? JSON.parse(phoneStored) : [];
        
        const map = new Map<string, WhatsAppChatContact>();
        for (const item of [...loadedContacts, ...phoneList]) {
          if (isValidSavedName(item.name, item.phone)) {
            const clean = (item.phone || item.jid || '').replace(/\D/g, '');
            if (clean) map.set(clean, item);
          }
        }
        const updated = Array.from(map.values());
        setAllContacts(updated);

        localStorage.setItem('autobirthday_cached_groups', JSON.stringify(loadedGroups));
        localStorage.setItem('autobirthday_cached_contacts', JSON.stringify(loadedContacts));
      } catch (err) {
        console.warn('Background refresh:', err);
      }
    }
    loadData();

    function handleClickOutside(e: MouseEvent) {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target as Node)) {
        setIsContactDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced auto-fetch WhatsApp profile photo when phone is manually typed
  useEffect(() => {
    if (!phoneValue || phoneValue.length < 9 || profilePictureUrl) return;
    const timer = setTimeout(async () => {
      try {
        const cleanPhone = phoneValue.replace(/\D/g, '');
        const pic = await getWhatsAppProfilePicAction(cleanPhone);
        if (pic) {
          setProfilePictureUrl(pic);
          form.setValue('profilePictureUrl', pic);
        }
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [phoneValue, profilePictureUrl, form]);

  const handleSelectContactItem = async (c: WhatsAppChatContact) => {
    const cleanPhone = (c.phone || c.jid || '').replace(/\D/g, '');
    form.setValue('name', c.name);
    form.setValue('phone', cleanPhone);
    setContactSearch('');
    setIsContactDropdownOpen(false);

    if (c.profilePictureUrl) {
      setProfilePictureUrl(c.profilePictureUrl);
      form.setValue('profilePictureUrl', c.profilePictureUrl);
    } else {
      try {
        const pic = await getWhatsAppProfilePicAction(cleanPhone);
        if (pic) {
          setProfilePictureUrl(pic);
          form.setValue('profilePictureUrl', pic);
        }
      } catch {}
    }

    toast.success(`Contacto "${c.name}" vinculado 🎉`);
  };

  async function onSubmit(data: ContactFormData) {
    setIsSubmitting(true);
    try {
      if (data.mode === 'manual' && !data.customMessage) {
        data.customMessage = DEFAULT_FIXED_MESSAGE;
      }

      const payload = {
        ...data,
        profilePictureUrl: profilePictureUrl || undefined,
      };

      let result;
      if (initialData?.id) {
        result = await updateContact(initialData.id, payload);
      } else {
        result = await createContact(payload);
      }

      if (result.success) {
        toast.success(initialData?.id ? 'Cumpleaños actualizado' : 'Cumpleaños creado con éxito 🎉');
        router.push('/contacts');
      } else {
        toast.error(result.error || 'Error al guardar el cumpleaños');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate live preview
  const contactFirstName = contactName ? contactName.split(' ')[0] : 'Lucas';
  const customMessageValue = form.watch('customMessage');
  const currentGroupName = form.watch('groupName') || (groups.find(g => g.id === form.watch('groupId'))?.subject) || 'Grupo de WhatsApp';

  let livePreviewBody = '';
  if (mode === 'manual') {
    const raw = customMessageValue && customMessageValue.trim().length > 0 ? customMessageValue : DEFAULT_FIXED_MESSAGE;
    livePreviewBody = raw.replace(/\{nombre\}/gi, contactFirstName);
  } else if (mode === 'template') {
    const raw = selectedTemplate ? selectedTemplate.content : DEFAULT_FIXED_MESSAGE;
    livePreviewBody = raw.replace(/\{nombre\}/gi, contactFirstName);
  } else if (mode === 'ai') {
    const example = AI_TONE_EXAMPLES[form.watch('aiTone') || 'casual'];
    livePreviewBody = example.replace(/\{nombre\}/gi, contactFirstName);
    if (form.watch('aiNotes')?.trim()) {
      livePreviewBody += `\n\n*(La IA adaptará el texto según tus notas: "${form.watch('aiNotes')?.trim()}")*`;
    }
  }

  // Filter contacts with actual names only
  const filteredContacts = allContacts
    .filter(c => isValidSavedName(c.name, c.phone))
    .filter(c => 
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
    )
    .slice(0, 30);

  return (
    <div className="space-y-6">
      
      {/* TOP HEADER WITH INTERACTIVE BACK BUTTON */}
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={handleAttemptExit}
          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors shrink-0"
          title="Volver a contactos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20 relative">
        
        {/* MAIN CARD */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/40 space-y-6 text-center">
          
          {/* 1. BIG CENTERED AVATAR / PROFILE PHOTO */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt={contactName || 'Contacto'} 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-4 border-white ring-4 ring-emerald-100" 
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl border-4 border-white ring-4 ring-emerald-100">
                  {contactName ? contactName.slice(0, 2).toUpperCase() : '👤'}
                </div>
              )}
              <span 
                className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white" 
                title="WhatsApp"
              >
                💬
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
              {contactName || 'Nuevo Cumpleañero'}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {form.watch('phone') ? `+${(form.watch('phone') || '').replace('+', '')}` : 'Rellena los datos o búscalo abajo'}
            </p>
          </div>

          {/* UNIFIED SEARCH BOX */}
          <div ref={contactDropdownRef} className="space-y-1.5 text-left relative">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Rellena rápido buscando entre tus contactos de WhatsApp
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text"
                placeholder="Escribe un nombre o teléfono (ej. Alicia, Papá)..."
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setIsContactDropdownOpen(true);
                }}
                onFocus={() => setIsContactDropdownOpen(true)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none font-medium shadow-xs transition-all"
              />
            </div>

            {/* Autocomplete Dropdown List */}
            {isContactDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map(c => (
                    <button
                      key={c.jid || c.phone}
                      type="button"
                      onClick={() => handleSelectContactItem(c)}
                      className="w-full p-2.5 text-left hover:bg-violet-50 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {c.profilePictureUrl ? (
                          <img src={c.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-xs text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Elegir
                      </span>
                    </button>
                  ))
                ) : contactSearch.trim() ? (
                  <div className="p-3.5 text-center text-xs text-slate-500 space-y-2">
                    <p>¿No aparece en tus contactos guardados?</p>
                    <button
                      type="button"
                      onClick={() => {
                        const isDigits = /^[0-9+ ]+$/.test(contactSearch.trim());
                        if (isDigits) {
                          form.setValue('phone', contactSearch.trim().replace(/\D/g, ''));
                        } else {
                          form.setValue('name', contactSearch.trim());
                        }
                        setIsContactDropdownOpen(false);
                        toast.success(`Datos asignados: "${contactSearch.trim()}"`);
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-xs transition-colors"
                    >
                      <span>➕ Usar &ldquo;{contactSearch.trim()}&rdquo; directamente</span>
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* INPUT FIELDS: NAME, PHONE, BIRTHDAY */}
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre Completo</label>
                <input 
                  {...form.register('name')} 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium text-slate-900" 
                  placeholder="Ej. Alicia Pérez"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Teléfono WhatsApp</label>
                <input 
                  {...form.register('phone')} 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono text-slate-900" 
                  placeholder="Ej. +34 600123456"
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* BIRTHDAY PICKER */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate block">Día</label>
                <input 
                  type="number" 
                  {...form.register('birthDay', { valueAsNumber: true })} 
                  className="w-full px-2.5 sm:px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium text-center sm:text-left" 
                  min="1" max="31"
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate block">Mes</label>
                <select 
                  {...form.register('birthMonth', { valueAsNumber: true })} 
                  className="w-full px-2 sm:px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate block">Año</label>
                <input 
                  type="number" 
                  {...form.register('birthYear', { valueAsNumber: true })} 
                  className="w-full px-2.5 sm:px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium text-center sm:text-left" 
                  placeholder="Opc."
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. DESTINO DE LA FELICITACIÓN (CHAT PRIVADO VS GRUPO) */}
          <div className="space-y-2.5 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
              ¿Dónde quieres enviar la felicitación?
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => form.setValue('targetType', 'individual')}
                className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                  targetType !== 'group'
                    ? 'bg-violet-50 border-violet-500 text-violet-900 shadow-sm font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-violet-600 shrink-0" />
                <div>
                  <p className="text-xs font-black">Chat Privado</p>
                  <p className="text-[10px] text-slate-500 font-normal">Directo a su WhatsApp</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  form.setValue('targetType', 'group');
                  const currentPhone = (form.getValues('phone') || '').replace(/\D/g, '');
                  const common = groups.filter(g => g.participantPhones && g.participantPhones.length > 0 && g.participantPhones.includes(currentPhone));
                  const defaultGroup = common[0] || groups[0];
                  if (defaultGroup) {
                    form.setValue('groupId', defaultGroup.id);
                    form.setValue('groupName', defaultGroup.subject);
                  }
                }}
                className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                  targetType === 'group'
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
            {targetType === 'group' && (() => {
              const currentPhone = (form.getValues('phone') || '').replace(/\D/g, '');
              const commonGroups = groups.filter(g => 
                g.participantPhones && g.participantPhones.length > 0 && g.participantPhones.includes(currentPhone)
              );
              const hasCommonGroups = commonGroups.length > 0;

              return (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2.5 mt-2 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-900 uppercase">
                        Selecciona el Grupo de WhatsApp:
                      </label>
                      {hasCommonGroups && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md">
                          ✨ {commonGroups.length} en común
                        </span>
                      )}
                    </div>

                    {groups.length === 0 ? (
                      <p className="text-xs text-emerald-700">No se detectaron grupos en tu cuenta de WhatsApp.</p>
                    ) : hasCommonGroups ? (
                      <select
                        value={form.watch('groupId') || commonGroups[0]?.id || ''}
                        onChange={e => {
                          const selectedId = e.target.value;
                          const g = groups.find(item => item.id === selectedId);
                          form.setValue('groupId', selectedId);
                          form.setValue('groupName', g?.subject || '');
                        }}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {commonGroups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.subject}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                          Sin grupos en común detectados. Mostrando todos tus grupos:
                        </p>
                        <select
                          value={form.watch('groupId') || groups[0]?.id || ''}
                          onChange={e => {
                            const selectedId = e.target.value;
                            const g = groups.find(item => item.id === selectedId);
                            form.setValue('groupId', selectedId);
                            form.setValue('groupName', g?.subject || '');
                          }}
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.subject}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Mention Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      {...form.register('mentionInGroup')}
                      className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-900">
                      Etiquetar con mención @{contactFirstName} en el grupo
                    </span>
                  </label>
                </div>
              );
            })()}
          </div>

          <hr className="border-slate-100" />

          {/* 3. GREETING CONFIGURATION */}
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Configuración del Mensaje:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                
                {/* TAB 1: MENSAJE FIJO */}
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'manual')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'manual'
                      ? 'bg-white text-violet-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mensaje Fijo</span>
                </button>

                {/* TAB 2: PLANTILLA */}
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'template')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'template'
                      ? 'bg-white text-violet-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Plantilla</span>
                </button>

                {/* TAB 3: IA MÁGICA */}
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'ai')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'ai'
                      ? 'bg-white text-violet-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>IA Mágica</span>
                </button>
              </div>
            </div>

            {/* MODE 1: MANUAL FIXED MESSAGE */}
            {mode === 'manual' && (
              <div className="space-y-2 bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl">
                <label className="text-xs font-bold text-slate-700 uppercase block">
                  Texto del mensaje:
                </label>
                <textarea
                  rows={3}
                  placeholder={DEFAULT_FIXED_MESSAGE}
                  value={customMessageValue ?? DEFAULT_FIXED_MESSAGE}
                  onChange={e => form.setValue('customMessage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed shadow-inner"
                />
              </div>
            )}

            {/* MODE 2: TEMPLATE SELECTION */}
            {mode === 'template' && (
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
                    value={form.watch('templateId') || currentTemplates[0]?.id || ''}
                    onChange={e => form.setValue('templateId', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
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

            {/* MODE 3: AI GENERATION */}
            {mode === 'ai' && (
              <div className="space-y-3 bg-violet-50/40 border border-violet-100 p-4 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Tono de la felicitación IA:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TONES.map(tone => {
                      const isSelected = form.watch('aiTone') === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => form.setValue('aiTone', tone.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
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
                    placeholder="💡 Notas opcionales para la IA (ej: Le gusta el tenis, cumple 30...)"
                    {...form.register('aiNotes')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}

            {/* 4. REALISTIC WHATSAPP CHAT PREVIEW (BALLOON / BURBUJA) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Vista previa en WhatsApp
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {targetType === 'group' ? `en el grupo "${currentGroupName}"` : `así lo recibirá ${contactFirstName}`}
                </span>
              </div>

              {/* WhatsApp Chat Simulation */}
              <div className="bg-[#efeae2] p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-inner">
                {targetType === 'group' && (
                  <div className="flex items-center justify-center pb-2">
                    <span className="bg-slate-800/60 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      👥 Grupo: {currentGroupName}
                    </span>
                  </div>
                )}

                <div className="flex justify-end">
                  <div className="bg-[#dcf8c6] text-slate-900 rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[92%] sm:max-w-[88%] shadow-sm text-xs sm:text-sm leading-relaxed space-y-1">
                    {targetType === 'group' && form.watch('mentionInGroup') && (
                      <span className="font-bold text-violet-700 mr-1.5">
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

            {/* 5. MOMENTO DE ENVÍO */}
            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Momento de Envío:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue('autoSend', false)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    !form.watch('autoSend')
                      ? 'bg-violet-50/90 border-violet-500 text-violet-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1">
                    🛡️ Pedir Aprobación
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">Te avisa por WhatsApp el día del cumpleaños para dar el OK.</p>
                </button>

                <button
                  type="button"
                  onClick={() => form.setValue('autoSend', true)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    form.watch('autoSend')
                      ? 'bg-violet-50/90 border-violet-500 text-violet-900 shadow-sm'
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

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 sm:p-4 mt-6 shadow-2xl shadow-slate-900/10 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3">
          <button 
            type="button" 
            onClick={handleAttemptExit} 
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancelar</span>
          </button>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-violet-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Cumpleaños 🎉</span>
            )}
          </button>
        </div>

      </form>

      {/* CONFIRMATION MODAL BEFORE EXITING IF DIRTY */}
      {showExitWarningModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner">
              ⚠️
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                ¿Salir sin guardar?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tienes datos sin guardar en este cumpleaños. Si sales ahora se perderán los cambios introducidos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitWarningModal(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitWarningModal(false);
                  router.push('/contacts');
                }}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-rose-500/20 transition-all active:scale-95"
              >
                Descartar y salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE TEMPLATE CREATION MODAL */}
      <InlineTemplateCreator
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreated={newTpl => {
          setCurrentTemplates(prev => [newTpl, ...prev]);
          form.setValue('templateId', newTpl.id);
        }}
      />

    </div>
  );
}
