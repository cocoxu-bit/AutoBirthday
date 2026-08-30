'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createTemplate } from '@/app/(dashboard)/templates/actions';
import { Template } from '@/types';
import { X, Plus, Loader2, Sparkles, FileText } from 'lucide-react';

interface InlineTemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (template: Template) => void;
}

export function InlineTemplateCreator({ isOpen, onClose, onCreated }: InlineTemplateCreatorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('¡Muchas felicidades {nombre}! 🎂🥳 Que disfrutes muchísimo de tu día.');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Indica un título para la plantilla');
      return;
    }
    if (!content.trim()) {
      toast.error('El mensaje de la plantilla no puede estar vacío');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createTemplate({
        title: title.trim(),
        content: content.trim(),
      });

      if (res.success && res.template) {
        toast.success(`Plantilla "${res.template.title}" creada y seleccionada`);
        onCreated(res.template as Template);
        setTitle('');
        setContent('¡Muchas felicidades {nombre}! 🎂🥳 Que disfrutes muchísimo de tu día.');
        onClose();
      } else {
        toast.error(res.error || 'Error al crear la plantilla');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (tag: string) => {
    setContent(prev => (prev.endsWith(' ') ? `${prev}${tag}` : `${prev} ${tag}`));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">Crear Nueva Plantilla</h4>
              <p className="text-[11px] text-slate-500 font-medium">Se guardará en tus plantillas y se seleccionará ahora</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Nombre de la Plantilla:
            </label>
            <input
              type="text"
              placeholder="Ej: Amigos cercanos, Clientes VIP..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Mensaje:
              </label>
              <button
                type="button"
                onClick={() => addTag('{nombre}')}
                className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors"
              >
                + Añadir &ldquo;{'{nombre}'}&rdquo;
              </button>
            </div>
            <textarea
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escribe el mensaje de felicitación..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim() || !content.trim()}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Plantilla</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
