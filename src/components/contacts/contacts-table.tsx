'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteContact } from '@/app/(dashboard)/contacts/actions';
import { Contact, Template } from '@/types';
import { CalendarSyncDialog } from '@/components/contacts/calendar-sync-dialog';
import { WhatsAppSyncDialog } from '@/components/contacts/whatsapp-sync-dialog';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Users, 
  ChevronRight,
  Calendar,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

interface ContactsTableProps {
  contacts: Contact[];
  templates?: Template[];
}

export function ContactsTable({ contacts, templates = [] }: ContactsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isWhatsAppSyncOpen, setIsWhatsAppSyncOpen] = useState(false);

  // Filter contacts by name or group name
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.groupName && c.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar a "${name}"?`)) return;
    setDeletingId(id);
    const res = await deleteContact(id);
    setDeletingId(null);
    if (res.success) toast.success('Contacto eliminado');
    else toast.error('Error al eliminar contacto');
  }

  const formatBirthday = (day?: number, month?: number) => {
    if (!day || !month) return null;
    const monthName = MONTH_NAMES[month - 1];
    return `🎂 ${day} de ${monthName}`;
  };

  return (
    <div className="space-y-4">
      
      {/* SEARCH AND ACTIONS */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        
        {/* Minimal Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar contacto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-slate-200/80 rounded-2xl shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons: 2 rows layout */}
        <div className="grid grid-cols-2 gap-2 w-full lg:w-auto shrink-0">
          
          {/* Row 1, Col 1: Sincronizar WhatsApp */}
          <button 
            type="button"
            onClick={() => setIsWhatsAppSyncOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 rounded-2xl transition-all shadow-2xs text-xs sm:text-sm font-bold truncate"
            title="Importar contactos y cumpleaños desde WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0" size={18} />
            <span className="truncate">Sincronizar WhatsApp</span>
          </button>

          {/* Row 1, Col 2: Sincronizar Calendario (Google + Apple Calendar Icons separated) */}
          <button 
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-2xl transition-all shadow-2xs text-xs sm:text-sm font-bold truncate"
            title="Sincronizar cumpleaños desde Google Calendar o Apple Calendar"
          >
            <div className="flex items-center gap-1 shrink-0">
              <Image 
                src="/google-calendar-icon.png" 
                alt="Google Calendar" 
                width={16} 
                height={16} 
                className="w-4 h-4 object-contain" 
              />
              <Image 
                src="/apple-calendar-icon.png" 
                alt="Apple Calendar" 
                width={16} 
                height={16} 
                className="w-4 h-4 object-contain" 
              />
            </div>
            <span className="truncate">Sincronizar Calendario</span>
          </button>

          {/* Row 2, Full Width (col-span-2): Añadir Contacto */}
          <Link 
            href="/contacts/new" 
            className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#285953] to-emerald-600 hover:from-[#1f4742] hover:to-emerald-700 text-white rounded-2xl transition-all shadow-md shadow-emerald-500/20 text-xs sm:text-sm font-bold active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Añadir Contacto</span>
          </Link>
        </div>
      </div>

      {/* MINIMALIST WHATSAPP-STYLE CONTACT LIST */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm space-y-5 px-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 shadow-inner">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {searchTerm ? 'No se encontraron contactos' : 'No tienes contactos añadidos todavía'}
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">
              {searchTerm 
                ? 'Prueba a buscar con otro nombre.'
                : 'Añade o sincroniza contactos para empezar a automatizar tus felicitaciones.'}
            </p>
          </div>
          {!searchTerm && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsWhatsAppSyncOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
              >
                <WhatsAppIcon className="w-4 h-4" size={18} />
                <span>Sincronizar WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-violet-600" />
                <span>Sincronizar Calendario</span>
              </button>

              <Link 
                href="/contacts/new" 
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Añadir Manualmente</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredContacts.map(contact => {
            const isGroup = contact.targetType === 'group';
            const bdayString = formatBirthday(contact.birthDay, contact.birthMonth);

            return (
              <div
                key={contact.id}
                onClick={() => router.push(`/contacts/${contact.id}/edit`)}
                className="group relative flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50/90 transition-all cursor-pointer gap-3 sm:gap-4"
              >
                {/* LEFT: WHATSAPP AVATAR (PHOTO OR INITIALS) */}
                <div className="relative shrink-0">
                  {contact.profilePictureUrl ? (
                    <img
                      src={contact.profilePictureUrl}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200/80"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${
                      isGroup
                        ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700'
                        : 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600'
                    }`}>
                      {isGroup ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        contact.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  )}
                </div>

                {/* MIDDLE: CLEAN NAME & BIRTHDAY */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-violet-900 transition-colors">
                    {contact.name}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    {bdayString && (
                      <span className="text-slate-600 font-semibold">
                        {bdayString}
                      </span>
                    )}

                    {isGroup && (
                      <span className="text-emerald-700 truncate flex items-center gap-1 font-semibold">
                        • 👥 {contact.groupName || 'Grupo WhatsApp'}
                      </span>
                    )}
                  </div>
                </div>

                {/* RIGHT: EDIT & DELETE BUTTONS */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  
                  {/* Direct Edit Button */}
                  <Link
                    href={`/contacts/${contact.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-600 text-slate-700 hover:text-white text-xs font-bold transition-all shadow-sm group-hover:bg-violet-600 group-hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => contact.id && handleDelete(e, contact.id, contact.name)}
                    disabled={deletingId === contact.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />

                </div>

              </div>
            );
          })}
        </div>
      )}

      {isImportOpen && (
        <CalendarSyncDialog onClose={() => setIsImportOpen(false)} templates={templates} />
      )}

      {isWhatsAppSyncOpen && (
        <WhatsAppSyncDialog onClose={() => setIsWhatsAppSyncOpen(false)} templates={templates} />
      )}

    </div>
  );
}
