'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WhatsAppGroup } from '@/types';
import { Users, Search, Check, X } from 'lucide-react';

interface WhatsAppGroupPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groups: WhatsAppGroup[];
  selectedGroupId?: string;
  contactPhone?: string;
  onSelectGroup: (group: WhatsAppGroup) => void;
}

export function WhatsAppGroupPickerDialog({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  contactPhone = '',
  onSelectGroup,
}: WhatsAppGroupPickerDialogProps) {
  const [search, setSearch] = useState('');

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  // Clean phone digits for matching
  const cleanPhone = useMemo(() => contactPhone.replace(/\D/g, ''), [contactPhone]);

  // Separate common groups and other groups
  const { commonGroups, otherGroups } = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    const matchesQuery = (g: WhatsAppGroup) =>
      !query || (g.subject && g.subject.toLowerCase().includes(query));

    const common: WhatsAppGroup[] = [];
    const others: WhatsAppGroup[] = [];

    for (const g of groups) {
      if (!matchesQuery(g)) continue;

      const isCommon = Boolean(
        cleanPhone &&
        g.participantPhones &&
        g.participantPhones.length > 0 &&
        g.participantPhones.includes(cleanPhone)
      );

      if (isCommon) {
        common.push(g);
      } else {
        others.push(g);
      }
    }

    return { commonGroups: common, otherGroups: others };
  }, [groups, search, cleanPhone]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] shadow-2xl flex flex-col border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Grupo de WhatsApp
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Selecciona dónde se enviará la felicitación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BOX */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none font-medium shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* GROUPS LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 divide-y divide-slate-100 divide-opacity-50">
          {groups.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No se detectaron grupos</p>
              <p className="text-[11px] text-slate-500">
                Asegúrate de tener WhatsApp conectado con grupos activos.
              </p>
            </div>
          ) : commonGroups.length === 0 && otherGroups.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">No hay grupos que coincidan</p>
              <p className="text-[11px] text-slate-500">
                Prueba a escribir otro término de búsqueda.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: COMMON GROUPS */}
              {commonGroups.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      ✨ Grupos en común con este contacto
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {commonGroups.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {commonGroups.map((g) => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            onSelectGroup(g);
                            onClose();
                          }}
                          className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm'
                              : 'bg-white hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {g.pictureUrl ? (
                              <img
                                src={g.pictureUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {g.subject}
                              </p>
                              <p className="text-[11px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                                ✨ En común con este contacto
                                {g.size ? ` • ${g.size} miembros` : ''}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: OTHER GROUPS */}
              {otherGroups.length > 0 && (
                <div className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {commonGroups.length > 0 ? 'Otros grupos' : 'Todos tus grupos'}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {otherGroups.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {otherGroups.map((g) => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            onSelectGroup(g);
                            onClose();
                          }}
                          className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {g.pictureUrl ? (
                              <img
                                src={g.pictureUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {g.subject}
                              </p>
                              {g.size ? (
                                <p className="text-[11px] text-slate-500 font-medium truncate">
                                  {g.size} miembros
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
