'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { parseAndMatchImportFile, batchImportContacts } from '@/app/(dashboard)/contacts/actions';
import { ParsedContactPreview } from '@/types';
import { 
  X, 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Sparkles,
  Phone
} from 'lucide-react';

interface ImportWizardDialogProps {
  onClose: () => void;
}

export function ImportWizardDialog({ onClose }: ImportWizardDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedContacts, setParsedContacts] = useState<ParsedContactPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!['ics', 'vcf', 'csv'].includes(extension || '')) {
      toast.error('Formato no compatible. Sube un archivo .ics, .vcf o .csv');
      return;
    }

    setLoading(true);
    try {
      const textContent = await file.text();
      const res = await parseAndMatchImportFile(textContent, extension as 'ics' | 'vcf' | 'csv');

      if (res.success && res.data && res.data.length > 0) {
        setParsedContacts(res.data);
        setStep('preview');
        toast.success(`Se encontraron ${res.data.length} contactos en el archivo 🎉`);
      } else {
        toast.error(res.error || 'No se encontraron contactos o cumpleaños válidos en el archivo.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setParsedContacts(prev => prev.map(c => ({ ...c, selected: checked })));
  };

  const handleToggleSelect = (id: string) => {
    setParsedContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleUpdateContactField = (id: string, field: keyof ParsedContactPreview, value: any) => {
    setParsedContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleImportSubmit = async () => {
    const selected = parsedContacts.filter(c => c.selected);
    if (selected.length === 0) {
      toast.error('Selecciona al menos un contacto para importar');
      return;
    }

    setStep('importing');
    try {
      const res = await batchImportContacts(selected);
      if (res.success) {
        toast.success(`¡${res.count} contactos importados con éxito! 🎉`);
        onClose();
      } else {
        toast.error(res.error || 'Error durante la importación');
        setStep('preview');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
      setStep('preview');
    }
  };

  const selectedCount = parsedContacts.filter(c => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'upload' ? 'Asistente de Importación Inteligente' : 'Revisar y Confirmar Contactos'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'upload' 
                  ? 'Importa tus cumpleaños desde Google Calendar, Apple Calendar (.ics), Contactos (.vcf) o CSV' 
                  : `${fileName} • ${parsedContacts.length} contactos detectados`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-violet-500 bg-violet-50/80 scale-[0.99]' 
                    : 'border-slate-200 hover:border-violet-400 hover:bg-slate-50/60'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])} 
                  accept=".ics,.vcf,.csv" 
                  className="hidden" 
                />
                
                <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {loading ? 'Analizando y cruzando con WhatsApp...' : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Soporta calendarios de Google / Apple (<strong>.ics</strong>), contactos vCard (<strong>.vcf</strong>) y tablas (<strong>.csv</strong>).
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cruce automático con tus chats de WhatsApp mediante IA</span>
                </div>
              </div>

              {/* Supported formats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 mt-0.5 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Google / Apple Calendar (.ics)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Exporta tu calendario de cumpleaños y detectaremos nombres y fechas automáticamente.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Contactos vCard (.vcf)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Exporta los contactos de tu iPhone o Android con fecha de nacimiento y teléfono.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700 mt-0.5 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Hoja de Cálculo (.csv)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Formato: Nombre, Teléfono, Día, Mes, Año.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Match Verification */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-violet-50/70 p-3.5 rounded-2xl border border-violet-100">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="selectAll"
                    checked={selectedCount === parsedContacts.length && parsedContacts.length > 0} 
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" 
                  />
                  <label htmlFor="selectAll" className="text-xs font-bold text-violet-900 cursor-pointer">
                    Seleccionar todos ({selectedCount}/{parsedContacts.length})
                  </label>
                </div>
                <p className="text-xs text-violet-700">
                  Revisa los números vinculados o edítalos directamente en la tabla antes de importar.
                </p>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">Sel.</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Cumpleaños</th>
                        <th className="p-3">Teléfono WhatsApp</th>
                        <th className="p-3">Coincidencia IA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedContacts.map((c) => (
                        <tr key={c.id} className={c.selected ? 'bg-white' : 'bg-slate-50/50 opacity-60'}>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={c.selected} 
                              onChange={() => handleToggleSelect(c.id)}
                              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            <input 
                              type="text" 
                              value={c.name} 
                              onChange={(e) => handleUpdateContactField(c.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-transparent hover:border-slate-200 focus:border-violet-500 rounded bg-transparent text-xs font-medium"
                            />
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <span className="font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full text-xs">
                              {c.birthDay} / {c.birthMonth} {c.birthYear ? `(${c.birthYear})` : ''}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <input 
                                type="text" 
                                value={c.phone} 
                                placeholder="+34 600..." 
                                onChange={(e) => handleUpdateContactField(c.id, 'phone', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-violet-500 text-xs font-mono"
                              />
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {c.matchConfidence && c.matchConfidence > 0 ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                c.matchConfidence >= 75 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {c.matchConfidence}% {c.matchedWhatsAppName ? `(${c.matchedWhatsAppName})` : 'coincidencia'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <AlertCircle className="w-3 h-3" />
                                Sin vincular
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Guardando contactos en tu cuenta...</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Estamos configurando las fechas y la IA para automatizar las felicitaciones de tus contactos.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          {step === 'upload' ? (
            <div className="text-xs text-slate-400">
              Formatos soportados: .ics, .vcf, .csv
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setStep('upload')} 
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Subir otro archivo
            </button>
          )}

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            {step === 'preview' && (
              <button 
                type="button" 
                onClick={handleImportSubmit} 
                disabled={selectedCount === 0}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                <span>Importar {selectedCount} Contactos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
