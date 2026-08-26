'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TemplateFormData, templateFormSchema } from '@/lib/validations/template';
import { createTemplate, updateTemplate } from '@/app/(dashboard)/templates/actions';

interface TemplateEditorProps {
  initialData?: Partial<TemplateFormData> & { id?: string };
}

export function TemplateEditor({ initialData }: TemplateEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
    },
  });

  const content = form.watch('content');

  function insertVariable(variable: string) {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = form.getValues('content');
    
    const newVal = currentVal.substring(0, start) + variable + currentVal.substring(end);
    form.setValue('content', newVal, { shouldValidate: true });
    
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  async function onSubmit(data: TemplateFormData) {
    setIsSubmitting(true);
    try {
      let result;
      if (initialData?.id) {
        result = await updateTemplate(initialData.id, data);
      } else {
        result = await createTemplate(data);
      }

      if (result.success) {
        toast.success(initialData?.id ? 'Plantilla actualizada' : 'Plantilla creada');
        router.push('/templates');
      } else {
        toast.error(result.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewContent = content
    .replace(/\{nombre\}/g, 'Ana')
    .replace(/\{edad\}/g, '30');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white/60 backdrop-blur p-6 rounded-2xl border border-white/40 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nombre de la Plantilla</label>
          <input 
            {...form.register('title')} 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all" 
            placeholder="Ej. Cumpleaños informal amigos"
          />
          {form.formState.errors.title && (
            <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-slate-700">Contenido del Mensaje</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => insertVariable('{nombre}')}
                className="text-xs px-2 py-1 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded font-medium transition-colors"
              >
                + {'{nombre}'}
              </button>
              <button 
                type="button" 
                onClick={() => insertVariable('{edad}')}
                className="text-xs px-2 py-1 bg-pink-100 text-pink-700 hover:bg-pink-200 rounded font-medium transition-colors"
              >
                + {'{edad}'}
              </button>
            </div>
          </div>
          <textarea 
            {...form.register('content')} 
            ref={(e) => {
              form.register('content').ref(e);
              // @ts-ignore
              textareaRef.current = e;
            }}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all min-h-[200px] resize-y" 
            placeholder="¡Feliz cumpleaños {nombre}! Espero que disfrutes mucho tus {edad} años..."
          />
          {form.formState.errors.content && (
            <p className="text-red-500 text-xs">{form.formState.errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
          </button>
        </div>
      </form>

      {/* Preview Section */}
      <div className="bg-slate-100/50 rounded-3xl p-6 lg:p-10 border border-slate-200/50 flex flex-col items-center justify-center min-h-[400px]">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-8">Vista Previa</h3>
        
        <div className="w-full max-w-[320px] bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center rounded-[2rem] p-4 shadow-xl border-8 border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-12 bg-slate-900/10 backdrop-blur-md flex items-center px-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
            <span className="text-white text-xs font-medium">WhatsApp</span>
          </div>
          
          <div className="mt-14 mb-2 flex flex-col gap-2 items-end">
            <div className="bg-[#dcf8c6] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm p-3 max-w-[85%] shadow-sm relative text-[15px] leading-snug">
              <p className="text-slate-800 whitespace-pre-wrap">{previewContent || 'Escribe tu mensaje para ver la previsualización aquí...'}</p>
              <div className="text-[10px] text-slate-500 text-right mt-1.5 opacity-80">
                10:30 ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
