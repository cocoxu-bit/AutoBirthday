'use client';

import { toast } from 'sonner';
import Link from 'next/link';
import { deleteTemplate } from '@/app/(dashboard)/templates/actions';
import { Template } from '@/types';
import { Edit, Trash2, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function TemplateCard({ template }: { template: Template }) {
  
  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    const res = await deleteTemplate(template.id);
    if (res.success) toast.success('Plantilla eliminada');
    else toast.error('Error al eliminar plantilla');
  }

  // Highlight variables like {nombre} and {edad}
  const formatContent = (text: string) => {
    return text.split(/(\{.*?\})/).map((part, i) => {
      if (part === '{nombre}') return <span key={i} className="text-violet-600 font-semibold bg-violet-100 px-1 rounded">{part}</span>;
      if (part === '{edad}') return <span key={i} className="text-pink-600 font-semibold bg-pink-100 px-1 rounded">{part}</span>;
      return part;
    });
  };

  return (
    <div className="bg-white/60 backdrop-blur rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-slate-900 truncate pr-2">{template.title}</h3>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 bg-white shadow-sm rounded-lg border border-slate-100 p-1">
            <Link href={`/templates/${template.id}/edit`} className="p-1.5 text-slate-400 hover:text-violet-600 transition-colors rounded-md hover:bg-slate-50">
              <Edit className="w-4 h-4" />
            </Link>
            <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-slate-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-[#E8F5E9] rounded-tr-xl rounded-bl-xl rounded-br-xl p-4 relative shadow-sm inline-block w-full max-w-[90%]">
          <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#E8F5E9] border-l-[10px] border-l-transparent"></div>
          <p className="text-slate-800 text-sm whitespace-pre-wrap font-medium">
            {formatContent(template.content)}
          </p>
        </div>
      </div>
      
      <div className="px-5 py-3 border-t border-slate-100/50 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Plantilla guardada</span>
        <span>{template.createdAt ? (typeof template.createdAt === 'string' ? new Date(template.createdAt).toLocaleDateString() : (template.createdAt as any).toDate ? formatDate((template.createdAt as any).toDate()) : '') : ''}</span>
      </div>
    </div>
  );
}
