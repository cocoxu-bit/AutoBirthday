'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Edit2, X, RotateCcw, Clock, Send, AlertCircle, Save } from 'lucide-react';
import { approveWish, editWishMessage, cancelWish, retryWish } from '@/app/(dashboard)/wishes/actions';
import { ScheduledWish, Contact } from '@/types';
import { formatDate } from '@/lib/utils';

interface WishesClientProps {
  wishes: ScheduledWish[];
  contactsMap: Record<string, Contact>;
}

export function WishesClient({ wishes, contactsMap }: WishesClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'queued' | 'sent' | 'failed'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const pendingWishes = wishes.filter(w => w.status === 'waiting_approval');
  const queuedWishes = wishes.filter(w => w.status === 'queued');
  const sentWishes = wishes.filter(w => w.status === 'sent');
  const failedWishes = wishes.filter(w => w.status === 'failed');

  const startEditing = (wish: ScheduledWish) => {
    setEditingId(wish.id);
    setEditContent(wish.generatedMessage);
  };

  const handleSaveEdit = async (id: string) => {
    const res = await editWishMessage(id, editContent);
    if (res.success) {
      toast.success('Mensaje actualizado');
      setEditingId(null);
    } else {
      toast.error('Error al actualizar mensaje');
    }
  };

  const handleApprove = async (id: string) => {
    const res = await approveWish(id);
    if (res.success) toast.success('Felicitación aprobada y en cola');
    else toast.error('Error al aprobar');
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Seguro que quieres cancelar este envío?')) return;
    const res = await cancelWish(id);
    if (res.success) toast.success('Envío cancelado');
    else toast.error('Error al cancelar');
  };

  const handleRetry = async (id: string) => {
    const res = await retryWish(id);
    if (res.success) toast.success('Reintentando envío');
    else toast.error('Error al reintentar');
  };

  const getContactInfo = (contactId: string) => {
    const contact = contactsMap[contactId];
    return contact ? { name: contact.name, phone: contact.phone } : { name: 'Desconocido', phone: '' };
  };

  const tabs = [
    { id: 'pending', label: 'Pendientes', count: pendingWishes.length },
    { id: 'queued', label: 'Programados', count: queuedWishes.length },
    { id: 'sent', label: 'Enviados', count: sentWishes.length },
    { id: 'failed', label: 'Fallidos', count: failedWishes.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 bg-white/40 p-1.5 rounded-xl border border-white/20 shadow-sm hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-violet-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          pendingWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/20">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900">No hay felicitaciones pendientes ✅</h3>
              <p className="text-slate-500 mt-2">Todo está al día.</p>
            </div>
          ) : (
            pendingWishes.map(wish => {
              const { name, phone } = getContactInfo(wish.contactId);
              const isEditing = editingId === wish.id;
              
              return (
                <div key={wish.id} className="bg-white/60 backdrop-blur rounded-xl border border-white/40 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-lg">{name}</h4>
                      <p className="text-sm text-slate-500">{phone}</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-tl-sm p-4 shadow-sm mb-4">
                    {isEditing ? (
                      <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white/50 border-0 rounded p-2 text-slate-800 min-h-[100px] focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    ) : (
                      <p className="text-slate-800 whitespace-pre-wrap">{wish.generatedMessage}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-end">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                        >
                          Cancelar Edición
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(wish.id)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Guardar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleCancel(wish.id)}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                        >
                          <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button 
                          onClick={() => startEditing(wish)}
                          className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button 
                          onClick={() => handleApprove(wish.id)}
                          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Aprobar y Enviar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'queued' && (
          queuedWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/20">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900">No hay envíos programados</h3>
            </div>
          ) : (
            queuedWishes.map(wish => {
              const { name } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-white/60 backdrop-blur rounded-xl border border-white/40 shadow-sm p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Para: {name}</h4>
                    <p className="text-sm text-slate-500 truncate max-w-md">{wish.generatedMessage}</p>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      Programado para: {wish.scheduledFor ? (wish.scheduledFor as any).toDate ? formatDate((wish.scheduledFor as any).toDate()) : new Date(wish.scheduledFor as any).toLocaleString() : ''}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCancel(wish.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 shrink-0"
                  >
                    Cancelar
                  </button>
                </div>
              );
            })
          )
        )}

        {activeTab === 'sent' && (
          sentWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/20">
              <Send className="w-12 h-12 text-violet-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-900">Aún no has enviado ninguna felicitación</h3>
            </div>
          ) : (
            sentWishes.map(wish => {
              const { name } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-white/60 backdrop-blur rounded-xl border border-white/40 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">Enviado a {name}</h4>
                    <div className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                      <Check className="w-3 h-3" />
                      {wish.sentAt ? (wish.sentAt as any).toDate ? formatDate((wish.sentAt as any).toDate()) : new Date(wish.sentAt as any).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                    {wish.generatedMessage}
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'failed' && (
          failedWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/40 rounded-2xl border border-white/20">
              <span className="text-4xl mb-4 block">🎉</span>
              <h3 className="text-lg font-medium text-slate-900">¡Genial! No hay errores</h3>
            </div>
          ) : (
            failedWishes.map(wish => {
              const { name } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-red-50/50 rounded-xl border border-red-100 shadow-sm p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">Error al enviar a {name}</h4>
                    <button 
                      onClick={() => handleRetry(wish.id)}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Reintentar
                    </button>
                  </div>
                  <div className="text-xs text-red-600 mb-3 flex items-start gap-1.5 bg-white/50 p-2 rounded border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{wish.errorLog || 'Error desconocido'}</span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 text-sm text-slate-700">
                    {wish.generatedMessage}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
