'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Edit2, X, RotateCcw, Clock, Send, AlertCircle, Save, CheckCheck } from 'lucide-react';
import { approveWish, editWishMessage, cancelWish, retryWish } from '@/app/(dashboard)/wishes/actions';
import { ScheduledWish, Contact } from '@/types';

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

  const formatWishTime = (rawDate?: any): string => {
    if (!rawDate) return '';
    try {
      const d = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      return format(d, "d 'de' MMMM, HH:mm", { locale: es });
    } catch {
      return '';
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pendientes', count: pendingWishes.length },
    { id: 'queued', label: 'Programados', count: queuedWishes.length },
    { id: 'sent', label: 'Enviados', count: sentWishes.length },
    { id: 'failed', label: 'Fallidos', count: failedWishes.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs: Responsive 2x2 grid on mobile, 4 columns on desktop - ZERO horizontal scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/70 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-white/60 shadow-xs">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25 scale-[1.01]' 
                  : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/40'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 ${
                isActive 
                  ? 'bg-white/25 text-white' 
                  : tab.count > 0 
                  ? 'bg-violet-100 text-violet-700 font-black' 
                  : 'bg-slate-200/70 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          pendingWishes.length === 0 ? (
            <div className="text-center py-14 sm:py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No hay felicitaciones pendientes</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Todo está al día y bajo control.</p>
            </div>
          ) : (
            pendingWishes.map(wish => {
              const { name, phone } = getContactInfo(wish.contactId);
              const isEditing = editingId === wish.id;
              
              return (
                <div key={wish.id} className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">{name}</h4>
                      {phone && <p className="text-xs text-slate-500 font-medium">{phone}</p>}
                    </div>
                  </div>
                  
                  <div className="bg-[#dcf8c6] border border-emerald-200/60 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-2xs">
                    {isEditing ? (
                      <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-xl p-3 text-slate-800 min-h-[110px] focus:ring-2 focus:ring-emerald-500 text-sm outline-none shadow-inner"
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap flex-1">{wish.generatedMessage}</p>
                        <span className="text-[11px] font-semibold text-emerald-800/80 shrink-0 self-end">
                          {formatWishTime(wish.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-1">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all text-center"
                        >
                          Cancelar Edición
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(wish.id)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Guardar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleCancel(wish.id)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-red-200 bg-red-50/50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100/80 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button 
                          onClick={() => startEditing(wish)}
                          className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                        >
                          <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button 
                          onClick={() => handleApprove(wish.id)}
                          className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/20 transition-all"
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
            <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-base font-bold text-slate-900">No hay envíos programados</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Los cumpleaños próximos aparecerán aquí antes de su envío.</p>
            </div>
          ) : (
            queuedWishes.map(wish => {
              const { name, phone } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">Para: {name}</h4>
                      {phone && <p className="text-xs text-slate-500 font-medium">{phone}</p>}
                    </div>
                    <button 
                      onClick={() => handleCancel(wish.id)}
                      className="px-3.5 py-1.5 border border-red-200 bg-red-50/60 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shrink-0"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="bg-[#dcf8c6] border border-emerald-200/60 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap flex-1">{wish.generatedMessage}</p>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800/80 shrink-0 self-end">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        <span>Programado: {formatWishTime(wish.scheduledFor)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'sent' && (
          sentWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <Send className="w-12 h-12 text-violet-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-base font-bold text-slate-900">Aún no has enviado ninguna felicitación</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Los mensajes automáticos enviados con éxito quedarán registrados aquí.</p>
            </div>
          ) : (
            sentWishes.map(wish => {
              const { name } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-900 text-base sm:text-lg">Enviado a {name}</h4>
                  </div>

                  <div className="bg-[#dcf8c6] border border-emerald-200/60 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap flex-1">{wish.generatedMessage}</p>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800/80 shrink-0 self-end">
                        <span>{formatWishTime(wish.sentAt)}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {activeTab === 'failed' && (
          failedWishes.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <span className="text-4xl mb-4 block">🎉</span>
              <h3 className="text-base font-bold text-slate-900">¡Genial! No hay errores</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Todos los envíos se han realizado correctamente.</p>
            </div>
          ) : (
            failedWishes.map(wish => {
              const { name } = getContactInfo(wish.contactId);
              return (
                <div key={wish.id} className="bg-red-50/60 backdrop-blur-md rounded-3xl border border-red-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-slate-900 text-base sm:text-lg">Error al enviar a {name}</h4>
                    <button 
                      onClick={() => handleRetry(wish.id)}
                      className="px-3.5 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <RotateCcw className="w-3 h-3" /> Reintentar
                    </button>
                  </div>
                  <div className="text-xs text-red-700 flex items-start gap-1.5 bg-white/70 p-2.5 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{wish.errorLog || 'Error desconocido'}</span>
                  </div>
                  <div className="bg-[#dcf8c6] border border-emerald-200/60 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap flex-1">{wish.generatedMessage}</p>
                      <span className="text-[11px] font-semibold text-emerald-800/80 shrink-0 self-end">
                        {formatWishTime(wish.createdAt)}
                      </span>
                    </div>
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
