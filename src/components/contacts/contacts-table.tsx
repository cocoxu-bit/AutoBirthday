'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { toggleContactActive, deleteContact } from '@/app/(dashboard)/contacts/actions';
import { Contact } from '@/types';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Power, 
  Users, 
  Sparkles, 
  FileText, 
  Cake, 
  ChevronRight, 
  Phone,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'ai' | 'groups'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter contacts
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.groupName && c.groupName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.aiRelationship && c.aiRelationship.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'active') return c.isActive;
    if (filterType === 'ai') return c.mode === 'ai';
    if (filterType === 'groups') return c.targetType === 'group';
    return true;
  });

  async function handleToggleActive(e: React.MouseEvent, id: string, current: boolean) {
    e.stopPropagation();
    const res = await toggleContactActive(id, !current);
    if (res.success) toast.success(`Contacto ${!current ? 'activado' : 'desactivado'}`);
    else toast.error('Error al cambiar el estado');
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar a "${name}"?`)) return;
    setDeletingId(id);
    const res = await deleteContact(id);
    setDeletingId(null);
    if (res.success) toast.success('Contacto eliminado correctamente');
    else toast.error('Error al eliminar contacto');
  }

  // Compute days until next birthday
  const getBirthdayBadge = (day?: number, month?: number) => {
    if (!day || !month) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nextBday = new Date(currentYear, month - 1, day);
    if (nextBday < todayZero) {
      nextBday = new Date(currentYear + 1, month - 1, day);
    }
    const diffDays = Math.ceil((nextBday.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24));
    
    let daysLabel = '';
    let isSoon = false;
    if (diffDays === 0) {
      daysLabel = '¡Hoy! 🎉';
      isSoon = true;
    } else if (diffDays === 1) {
      daysLabel = '¡Mañana!';
      isSoon = true;
    } else if (diffDays <= 7) {
      daysLabel = `En ${diffDays} días`;
      isSoon = true;
    }

    return {
      formattedDate: `${day} ${MONTH_NAMES[month - 1]}`,
      daysLabel,
      isSoon,
    };
  };

  return (
    <div className="space-y-4">
      
      {/* SEARCH AND FILTERS BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search input (WhatsApp style) */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono, grupo o relación..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200/80 rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-xs sm:text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            Todos ({contacts.length})
          </button>

          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-2 rounded-xl transition-all ${
              filterType === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            Activos ({contacts.filter(c => c.isActive).length})
          </button>

          <button
            onClick={() => setFilterType('ai')}
            className={`px-3 py-2 rounded-xl transition-all ${
              filterType === 'ai'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            Con IA ✨ ({contacts.filter(c => c.mode === 'ai').length})
          </button>

          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-2 rounded-xl transition-all ${
              filterType === 'groups'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            Grupos ({contacts.filter(c => c.targetType === 'group').length})
          </button>
        </div>

        {/* New Contact CTA */}
        <Link 
          href="/contacts/new" 
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl transition-all shadow-sm text-xs font-bold shadow-violet-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Añadir Contacto</span>
        </Link>
      </div>

      {/* WHATSAPP-STYLE CONTACT LIST */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 shadow-inner">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {searchTerm ? 'No se encontraron contactos' : 'No tienes contactos añadidos todavía'}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">
              {searchTerm 
                ? 'Prueba con otro término de búsqueda o limpia los filtros.'
                : 'Añade a tu primer contacto para programar sus felicitaciones automáticas.'}
            </p>
          </div>
          {!searchTerm && (
            <div className="pt-2">
              <Link 
                href="/contacts/new" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-xs font-bold"
              >
                <UserPlus className="w-4 h-4" />
                <span>Añadir Primer Contacto</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredContacts.map(contact => {
            const bdayInfo = getBirthdayBadge(contact.birthDay, contact.birthMonth);
            const isGroup = contact.targetType === 'group';

            return (
              <div
                key={contact.id}
                onClick={() => router.push(`/contacts/${contact.id}/edit`)}
                className="group relative flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/80 transition-all cursor-pointer gap-3 sm:gap-4"
              >
                {/* LEFT: AVATAR WITH STATUS INDICATOR */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${
                    isGroup
                      ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700'
                      : 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600'
                  }`}>
                    {isGroup ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      contact.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  {/* Status dot */}
                  <span 
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      contact.isActive ? 'bg-emerald-500 ring-1 ring-emerald-400/50' : 'bg-slate-300'
                    }`}
                    title={contact.isActive ? 'Activo' : 'Pausado'}
                  />
                </div>

                {/* MIDDLE: MAIN INFO (WHATSAPP ROW STYLE) */}
                <div className="flex-1 min-w-0 space-y-1">
                  
                  {/* Top Line: Name + Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-violet-900 transition-colors">
                      {contact.name}
                    </h4>

                    {/* Birthday Badge */}
                    {bdayInfo && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        bdayInfo.isSoon
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <span>🎂 {bdayInfo.formattedDate}</span>
                        {bdayInfo.daysLabel && (
                          <span className="font-black text-amber-900">({bdayInfo.daysLabel})</span>
                        )}
                      </span>
                    )}

                    {/* Mode Tag */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      contact.mode === 'ai'
                        ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                        : contact.mode === 'template'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {contact.mode === 'ai' ? 'IA ✨' : contact.mode === 'template' ? 'Plantilla' : 'Manual'}
                    </span>

                    {/* Target type if group */}
                    {isGroup && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[180px]">
                        <Users className="w-3 h-3 text-emerald-600" />
                        <span className="truncate">{contact.groupName || 'Grupo WhatsApp'}</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Line: Phone / Relationship / Notes Subtitle */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                    <span className="font-mono text-[11px] text-slate-600 font-medium shrink-0">
                      +{contact.phone}
                    </span>

                    {contact.aiRelationship && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 truncate font-medium">
                          {contact.aiRelationship}
                        </span>
                      </>
                    )}

                    {contact.aiNotes && (
                      <>
                        <span className="text-slate-300 hidden md:inline">•</span>
                        <span className="text-slate-400 italic truncate hidden md:inline">
                          "{contact.aiNotes}"
                        </span>
                      </>
                    )}

                    {isGroup && (
                      <span className="sm:hidden text-emerald-700 font-medium truncate">
                        • {contact.groupName}
                      </span>
                    )}
                  </div>

                </div>

                {/* RIGHT: CLEAR EDIT BUTTON & ACTIONS */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  
                  {/* EDIT BUTTON (PRIMARY) */}
                  <Link
                    href={`/contacts/${contact.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-600 text-slate-700 hover:text-white text-xs font-bold transition-all shadow-sm group-hover:bg-violet-600 group-hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </Link>

                  {/* POWER TOGGLE */}
                  <button
                    onClick={(e) => contact.id && handleToggleActive(e, contact.id, contact.isActive)}
                    className={`p-2 rounded-xl transition-colors ${
                      contact.isActive 
                        ? 'text-emerald-600 hover:bg-emerald-50' 
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title={contact.isActive ? 'Desactivar felicitaciones' : 'Activar felicitaciones'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={(e) => contact.id && handleDelete(e, contact.id, contact.name)}
                    disabled={deletingId === contact.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* CHEVRON ARROW */}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
