'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { toggleContactActive, deleteContact } from '@/app/(dashboard)/contacts/actions';
import { Contact } from '@/types';
import { Search, UserPlus, FileUp, Edit, Trash2, Power, Users, MessageSquare } from 'lucide-react';
import { ImportWizardDialog } from './import-wizard-dialog';

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.groupName && c.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function handleToggleActive(id: string, current: boolean) {
    const res = await toggleContactActive(id, !current);
    if (res.success) toast.success(`Contacto ${!current ? 'activado' : 'desactivado'}`);
    else toast.error('Error al cambiar el estado');
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
    const res = await deleteContact(id);
    if (res.success) toast.success('Contacto eliminado');
    else toast.error('Error al eliminar contacto');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar contactos o grupos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/80 border-slate-200 rounded-xl shadow-sm focus:ring-violet-500 focus:border-violet-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <FileUp className="w-4 h-4 text-violet-600" />
            <span>Importar (.ics, .vcf)</span>
          </button>
          <Link 
            href="/contacts/new" 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-sm font-semibold shadow-violet-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir</span>
          </Link>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur rounded-3xl border border-white/20 shadow-sm space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 shadow-inner">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No hay contactos todavía</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Añade un contacto manualmente o importa tu calendario de cumpleaños (.ics) en 5 segundos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold shadow-sm"
            >
              <FileUp className="w-4 h-4 text-violet-600" />
              <span>Importar Calendario (.ics)</span>
            </button>
            <Link 
              href="/contacts/new" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm text-xs font-bold shadow-violet-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Añadir Contacto</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="relative p-5 bg-white/70 backdrop-blur hover:bg-white/90 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                      contact.targetType === 'group' 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                        : 'bg-gradient-to-br from-violet-500 to-fuchsia-600'
                    }`}>
                      {contact.targetType === 'group' ? <Users className="w-5 h-5" /> : contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                        {contact.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${contact.isActive ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`} title={contact.isActive ? 'Activo' : 'Inactivo'} />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/contacts/${contact.id}/edit`} className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-violet-50">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => contact.id && handleToggleActive(contact.id, contact.isActive)} className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-amber-50" title="Activar/Desactivar">
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => contact.id && handleDelete(contact.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Target badge if Group */}
                {contact.targetType === 'group' && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">Grupo: {contact.groupName || 'WhatsApp Group'}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t border-slate-100/80 mt-2 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100/80 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                    🎂 {contact.birthDay}/{contact.birthMonth} {contact.birthYear ? `(${contact.birthYear})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    contact.mode === 'ai' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' :
                    contact.mode === 'template' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {contact.mode === 'ai' ? 'IA ✨' : contact.mode === 'template' ? 'Plantilla' : 'Manual'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isImportOpen && (
        <ImportWizardDialog onClose={() => setIsImportOpen(false)} />
      )}
    </div>
  );
}
