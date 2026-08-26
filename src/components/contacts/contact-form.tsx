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
import { Template, WhatsAppGroup, WhatsAppChatContact } from '@/types';
import { 
  MessageSquare, 
  Users, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Search, 
  Phone, 
  UserCheck, 
  Check 
} from 'lucide-react';

interface ContactFormProps {
  initialData?: Partial<ContactFormData> & { id?: string };
  templates: Template[];
}

export function ContactForm({ initialData, templates }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // WhatsApp Groups
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');

  // WhatsApp Contacts for Quick Search
  const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppChatContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  const filteredGroups = groups.filter(g => 
    g.subject.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredWhatsAppContacts = whatsAppContacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  ).slice(0, 10);

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
      mentionInGroup: initialData?.mentionInGroup ?? false,
      mode: initialData?.mode || 'ai',
      customMessage: initialData?.customMessage || '',
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
  const birthYear = form.watch('birthYear');
  
  const currentYear = new Date().getFullYear();
  const calculatedAge = birthYear ? currentYear - birthYear : undefined;
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    async function loadData() {
      setLoadingGroups(true);
      setLoadingContacts(true);
      try {
        const [loadedGroups, loadedContacts] = await Promise.all([
          fetchWhatsAppGroupsAction(),
          fetchWhatsAppContactsAction(),
        ]);
        setGroups(loadedGroups);
        setWhatsAppContacts(loadedContacts);
      } catch (err) {
        console.warn('Could not load WhatsApp data:', err);
      } finally {
        setLoadingGroups(false);
        setLoadingContacts(false);
      }
    }
    loadData();

    // Close contact dropdown on click outside
    function handleClickOutside(e: MouseEvent) {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target as Node)) {
        setIsContactDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedJid = e.target.value;
    form.setValue('groupId', selectedJid);
    const selectedGroup = groups.find(g => g.id === selectedJid);
    if (selectedGroup) {
      form.setValue('groupName', selectedGroup.subject);
    } else {
      form.setValue('groupName', '');
    }
  };

  const handleSelectWhatsAppContact = (contact: WhatsAppChatContact) => {
    // If the name is just the phone number, keep whatever the user typed or empty
    const isPhoneName = contact.name.replace(/[^0-9]/g, '') === contact.phone.replace(/[^0-9]/g, '');
    if (!isPhoneName) {
      form.setValue('name', contact.name);
    } else if (!form.getValues('name')) {
      form.setValue('name', contact.name);
    }
    form.setValue('phone', contact.phone);
    setContactSearch('');
    setIsContactDropdownOpen(false);
    toast.success(`Contacto "${contact.name}" vinculado (+${contact.phone.replace('+', '')}) 🎉`);
  };

  async function onSubmit(data: ContactFormData) {
    setIsSubmitting(true);
    try {
      let result;
      if (initialData?.id) {
        result = await updateContact(initialData.id, data);
      } else {
        result = await createContact(data);
      }

      if (result.success) {
        toast.success(initialData?.id ? 'Contacto actualizado' : 'Contacto creado con éxito 🎉');
        router.push('/contacts');
      } else {
        toast.error(result.error || 'Error al guardar el contacto');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* 1. Destino del Mensaje (Individual vs Grupo) */}
      <div className="p-6 bg-white/60 backdrop-blur rounded-3xl border border-white/40 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            Destino de la Felicitación
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Elige si el mensaje se enviará al chat privado del contacto o a un grupo de WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
            targetType === 'individual' 
              ? 'border-violet-500 bg-violet-50/70 shadow-sm' 
              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
          }`}>
            <input type="radio" value="individual" {...form.register('targetType')} className="hidden" />
            <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Chat Privado</div>
              <div className="text-xs text-slate-500 mt-0.5">Mensaje directo individual al WhatsApp del cumpleañero.</div>
            </div>
          </label>

          <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
            targetType === 'group' 
              ? 'border-violet-500 bg-violet-50/70 shadow-sm' 
              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
          }`}>
            <input type="radio" value="group" {...form.register('targetType')} className="hidden" />
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Grupo de WhatsApp 👥</div>
              <div className="text-xs text-slate-500 mt-0.5">Felicitarlo en un grupo compartido con amigos, familia o trabajo.</div>
            </div>
          </label>
        </div>

        {/* Group Selector if targetType === 'group' */}
        {targetType === 'group' && (
          <div className="mt-4 p-4.5 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Selecciona el Grupo de WhatsApp
              </label>
              {loadingGroups ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando tus grupos de WhatsApp vinculados...
                </div>
              ) : (
                <div className="space-y-2">
                  <input 
                    type="text"
                    placeholder="🔍 Buscar grupo (ej. notas, familia, pádel)..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />

                  <select 
                    value={form.watch('groupId') || ''} 
                    onChange={handleGroupChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Selecciona un grupo ({filteredGroups.length} encontrados) --</option>
                    {filteredGroups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.subject} {g.size ? `(${g.size} miembros)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.formState.errors.groupId && (
                <p className="text-red-500 text-xs">{form.formState.errors.groupId.message}</p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  {...form.register('mentionInGroup')} 
                  className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" 
                />
                <span className="text-xs font-semibold text-emerald-950">
                  Etiquetar con @mención al cumpleañero en el grupo (Opcional)
                </span>
              </label>

              {form.watch('mentionInGroup') && (
                <div className="mt-2.5 space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Teléfono del Cumpleañero (para el @tag)
                  </label>
                  <input 
                    {...form.register('phone')} 
                    className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono" 
                    placeholder="Ej. +34 600123456 (Opcional)"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Datos del Cumpleañero */}
      <div className="p-6 bg-white/60 backdrop-blur rounded-3xl border border-white/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Datos del Cumpleañero</h3>
        
        {/* WhatsApp Contact Autocomplete Picker - Visible in BOTH Individual & Group modes */}
        <div ref={contactDropdownRef} className="p-4 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 rounded-2xl border border-violet-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-violet-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Buscador de Contactos de WhatsApp
            </label>
            <span className="text-[11px] text-violet-600 font-semibold">
              {loadingContacts ? 'Cargando...' : `${whatsAppContacts.length} chats vinculados`}
            </span>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="🔍 Escribe para buscar (ej. Papa, Lucas, María, Azahara)..."
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                setIsContactDropdownOpen(true);
              }}
              onFocus={() => setIsContactDropdownOpen(true)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-violet-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none font-medium shadow-sm"
            />

            {isContactDropdownOpen && contactSearch.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredWhatsAppContacts.length > 0 ? (
                  filteredWhatsAppContacts.map(c => (
                    <button
                      key={c.jid}
                      type="button"
                      onClick={() => handleSelectWhatsAppContact(c)}
                      className="w-full p-2.5 text-left hover:bg-violet-50 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full group-hover:bg-violet-600 group-hover:text-white transition-colors flex items-center gap-1">
                        <Check className="w-3 h-3" /> Seleccionar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No se encontraron contactos que coincidan con &ldquo;{contactSearch}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {targetType === 'individual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre Completo</label>
              <input 
                {...form.register('name')} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium text-slate-900" 
                placeholder="Ej. Lucas García"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Teléfono de WhatsApp</label>
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
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre del Cumpleañero</label>
            <input 
              {...form.register('name')} 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium text-slate-900" 
              placeholder="Ej. Mamá, Lucas, Carlos..."
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Día</label>
            <input 
              type="number" 
              {...form.register('birthDay', { valueAsNumber: true })} 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium" 
              min="1" max="31"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Mes</label>
            <select 
              {...form.register('birthMonth', { valueAsNumber: true })} 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
            >
              {[
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Año (Opcional)</label>
            <input 
              type="number" 
              {...form.register('birthYear', { valueAsNumber: true })} 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium" 
              placeholder="Ej. 1998"
            />
          </div>
        </div>
      </div>

      {/* 3. Modo de Felicitación */}
      <div className="p-6 bg-white/60 backdrop-blur rounded-3xl border border-white/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Modo de Redacción</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
            mode === 'manual' 
              ? 'border-violet-500 bg-violet-50/80 shadow-sm' 
              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
          }`}>
            <input type="radio" value="manual" {...form.register('mode')} className="hidden" />
            <div className="font-bold text-slate-900 text-sm">Mensaje Fijo</div>
            <p className="text-xs text-slate-500 mt-1">Escribe exactamente lo que se enviará.</p>
          </label>

          <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
            mode === 'template' 
              ? 'border-violet-500 bg-violet-50/80 shadow-sm' 
              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
          }`}>
            <input type="radio" value="template" {...form.register('mode')} className="hidden" />
            <div className="font-bold text-slate-900 text-sm">Usar Plantilla</div>
            <p className="text-xs text-slate-500 mt-1">Usa un mensaje predefinido con variables como {'{nombre}'}.</p>
          </label>

          <label className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
            mode === 'ai' 
              ? 'border-violet-500 bg-violet-50/80 shadow-sm' 
              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
          }`}>
            <input type="radio" value="ai" {...form.register('mode')} className="hidden" />
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Generado por IA ✨
            </div>
            <p className="text-xs text-slate-500 mt-1">Google Gemini redactará un mensaje único y natural cada año.</p>
          </label>
        </div>

        {mode === 'manual' && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Mensaje Personalizado</label>
              <textarea 
                {...form.register('customMessage')} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[100px]"
                placeholder="Escribe el mensaje exacto de felicitación..."
              />
              {form.formState.errors.customMessage && (
                <p className="text-red-500 text-xs">{form.formState.errors.customMessage.message}</p>
              )}
            </div>

            {form.watch('customMessage') && (
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                  Vista previa en WhatsApp
                </span>
                <div className="relative p-3.5 bg-white rounded-2xl rounded-tl-sm border border-slate-200/90 shadow-sm max-w-lg">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {form.watch('customMessage')}
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-400">
                    <span>09:30</span>
                    <span className="text-emerald-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'template' && (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Seleccionar Plantilla</label>
              <select 
                {...form.register('templateId')} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
              >
                <option value="">-- Elige una plantilla guardada --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              {form.formState.errors.templateId && (
                <p className="text-red-500 text-xs">{form.formState.errors.templateId.message}</p>
              )}
            </div>

            {/* Live WhatsApp Preview */}
            {selectedTemplate ? (
              <div className="mt-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                    Vista previa de felicitación
                  </span>
                  <span className="text-[11px] font-semibold text-violet-700 bg-violet-100/90 px-2.5 py-0.5 rounded-full">
                    {selectedTemplate.title}
                  </span>
                </div>
                
                <div className="relative p-4 bg-white rounded-2xl rounded-tl-sm border border-slate-200/90 shadow-sm max-w-lg">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTemplate.content
                      .replace(/{nombre}/gi, contactName ? contactName.split(' ')[0] : 'Lucas')
                      .replace(/{edad}/gi, calculatedAge ? String(calculatedAge) : '28')}
                  </p>
                  <div className="flex justify-end items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                    <span>09:30</span>
                    <span className="text-emerald-500 font-bold">✓✓</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  💡 <span className="font-semibold">Sustitución en vivo:</span> Las variables <code className="text-violet-600 font-bold font-mono">{"{nombre}"}</code> y <code className="text-violet-600 font-bold font-mono">{"{edad}"}</code> se rellenarán automáticamente con los datos de este contacto al felicitar.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Selecciona una plantilla en el desplegable para ver cómo se verá la felicitación en WhatsApp.
              </div>
            )}
          </div>
        )}

        {mode === 'ai' && (
          <div className="mt-4 space-y-4 p-4.5 bg-violet-50/40 rounded-2xl border border-violet-100">
            {targetType === 'group' && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-100/80 p-2.5 rounded-xl font-medium">
                <Users className="w-4 h-4 shrink-0" />
                <span>La IA adaptará automáticamente el mensaje en tono grupal festivo para el grupo de WhatsApp.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Relación / Vínculo (Opcional)</label>
                <input 
                  {...form.register('aiRelationship')} 
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" 
                  placeholder="Ej. amigo de la infancia, prima, compañero de pádel..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tono del Mensaje</label>
                <select 
                  {...form.register('aiTone')} 
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                >
                  <option value="casual">Casual (cercano y natural)</option>
                  <option value="divertido">Divertido (gracioso y con bromas)</option>
                  <option value="emotivo">Emotivo (cariñoso y sentimental)</option>
                  <option value="formal">Formal (respetuoso y profesional)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Notas o Anécdotas para la IA (Opcional)</label>
              <textarea 
                {...form.register('aiNotes')} 
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[70px]" 
                placeholder="Ej. Siempre pierde al FIFA, le gusta el café de especialidad, mote 'El Máquina'..."
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Aprobación y Horarios */}
      <div className="p-6 bg-white/60 backdrop-blur rounded-3xl border border-white/40 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Aprobación y Horarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <input 
                type="checkbox" 
                {...form.register('autoSend')} 
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" 
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">Enviar automáticamente sin preguntar</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Si está desactivado, el bot te enviará un WhatsApp por la mañana pidiéndote confirmación antes de lanzar el mensaje.
                </div>
              </div>
            </label>
            
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <input 
                type="checkbox" 
                {...form.register('isActive')} 
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" 
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">Contacto activo</div>
                <div className="text-xs text-slate-500 mt-0.5">Desactívalo para pausar sus felicitaciones temporalmente.</div>
              </div>
            </label>
          </div>
          
          <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Ventana de Envío (con retardo aleatorio)</label>
            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="time" 
                {...form.register('sendTimeStart')} 
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium" 
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="time" 
                {...form.register('sendTimeEnd')} 
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium" 
              />
            </div>
            <p className="text-[11px] text-slate-400">
              El mensaje se programará en un minuto aleatorio dentro de este rango para máxima naturalidad humana.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-sm font-semibold"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all shadow-md shadow-violet-500/25 disabled:opacity-50 text-sm font-bold flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Contacto 🎉'
          )}
        </button>
      </div>
    </form>
  );
}
