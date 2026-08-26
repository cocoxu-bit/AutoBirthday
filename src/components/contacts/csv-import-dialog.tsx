'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { importContacts } from '@/app/(dashboard)/contacts/actions';
import { X, Upload, CheckCircle2 } from 'lucide-react';

interface CSVImportDialogProps {
  onClose: () => void;
}

export function CSVImportDialog({ onClose }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleImport() {
    if (!file) return;
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0].toLowerCase().split(',');
      
      const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name'));
      const phoneIdx = headers.findIndex(h => h.includes('telefono') || h.includes('tel') || h.includes('phone'));
      const dayIdx = headers.findIndex(h => h.includes('dia') || h.includes('day'));
      const monthIdx = headers.findIndex(h => h.includes('mes') || h.includes('month'));
      const yearIdx = headers.findIndex(h => h.includes('año') || h.includes('year'));

      if (nameIdx === -1 || phoneIdx === -1 || dayIdx === -1 || monthIdx === -1) {
        toast.error('El CSV debe contener las columnas: Nombre, Teléfono, Día y Mes');
        setIsImporting(false);
        return;
      }

      const parsedData = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          name: parts[nameIdx]?.trim() || 'Sin nombre',
          phone: parts[phoneIdx]?.trim() || '',
          birthDay: parseInt(parts[dayIdx]?.trim() || '1', 10),
          birthMonth: parseInt(parts[monthIdx]?.trim() || '1', 10),
          birthYear: yearIdx !== -1 && parts[yearIdx]?.trim() ? parseInt(parts[yearIdx].trim(), 10) : undefined,
        };
      }).filter(d => d.name && d.phone && !isNaN(d.birthDay) && !isNaN(d.birthMonth));

      const res = await importContacts(parsedData);
      
      if (res.success) {
        toast.success(`${parsedData.length} contactos importados`);
        onClose();
      } else {
        toast.error(res.error || 'Error al importar');
      }
    } catch (error) {
      toast.error('Error procesando el archivo');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Importar Contactos</h2>
          <p className="text-sm text-slate-500 mb-6">
            Sube un archivo CSV con las columnas: Nombre, Teléfono, Día, Mes (y opcionalmente Año).
          </p>
          
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative group">
            <input 
              type="file" 
              accept=".csv" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10 mb-2" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-slate-500 mt-1">Listo para importar</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Upload className="w-10 h-10 mb-2 text-slate-400 group-hover:text-violet-500 transition-colors" />
                <span className="font-medium text-slate-700">Selecciona un archivo CSV</span>
                <span className="text-xs mt-1">o arrastra y suelta aquí</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={handleImport}
              disabled={!file || isImporting}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
