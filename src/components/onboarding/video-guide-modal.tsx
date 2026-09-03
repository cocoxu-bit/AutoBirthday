'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Smartphone, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Play, 
  QrCode, 
  MessageSquare, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';

interface VideoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'whatsapp' | 'contacts' | 'assistant';
}

export function VideoGuideModal({ isOpen, onClose, defaultTab = 'whatsapp' }: VideoGuideModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'contacts' | 'assistant'>(defaultTab);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl">
        
        {/* MODAL HEADER WITH TABS */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Guías Visuales de AutoBirthday
                </DialogTitle>
                <p className="text-xs text-slate-400">Aprende a usar el servicio en menos de 1 minuto</p>
              </div>
            </div>
          </div>

          {/* TAB SELECTOR (REVOLUT / AIRBNB STYLE) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1. Vincular WA</span>
              <span className="sm:hidden">1. WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                activeTab === 'contacts'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2. Crear Contactos</span>
              <span className="sm:hidden">2. Contactos</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                activeTab === 'assistant'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3. Asistente Bot</span>
              <span className="sm:hidden">3. Asistente</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: CÓMO VINCULAR WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Visual iPhone Mockup with Real Video */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[220px] sm:max-w-[240px] aspect-[9/16] bg-slate-950 rounded-[2.5rem] p-2.5 shadow-2xl border-4 border-slate-800 ring-1 ring-violet-500/20 overflow-hidden">
                    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-950 rounded-full z-20" />
                    <video
                      src="/videos/whatsapp-connection-guide.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-cover rounded-[2rem]"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-medium">
                    {t('onboarding.videoHelpBadge')}
                  </span>
                </div>

                {/* Text explanation and action */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-extrabold text-white">{t('onboarding.welcomeStep1Title')}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      AutoBirthday se conecta de forma segura a tu WhatsApp igual que cuando abres WhatsApp Web en tu ordenador.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-[11px]">1</div>
                      <span className="text-slate-300">Abre <strong>WhatsApp</strong> &gt; <strong>Ajustes</strong> o los 3 puntos (⋮)</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-[11px]">2</div>
                      <span className="text-slate-300">Toca en <strong>Dispositivos vinculados</strong></span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-[11px]">3</div>
                      <span className="text-slate-300">Toca <strong>Vincular con número de teléfono</strong> y escribe el código</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{t('onboarding.welcomeStep1Desc')}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cero almacenamiento de mensajes privados.</span>
                    </li>
                  </ul>

                  <Link
                    href="/whatsapp"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{t('onboarding.step1Cta')}</span>
                  </Link>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CÓMO CREAR CONTACTOS */}
          {activeTab === 'contacts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Visual Preview */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-800 flex justify-between">
                    <span>Generación Inteligente con Gemini</span>
                    <span className="text-violet-400">✨ IA Activa</span>
                  </div>

                  {/* Simulated WhatsApp Bubble */}
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/20 rounded-2xl rounded-tr-none text-xs text-emerald-100 space-y-1 shadow-sm">
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between">
                      <span>Tono: Divertido & Cercano</span>
                      <span>09:42</span>
                    </div>
                    <p className="leading-relaxed">
                      "¡Felices 30 añazos, Carlos! 🎂🎉 Oficialmente dejas los veinte atrás, pero los dolores de espalda apenas empiezan. ¡Pásalo genial!"
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-xl text-[11px] text-slate-400">
                    💡 <em>La IA adapta el mensaje según sea tu madre, un cliente o el grupo del trabajo.</em>
                  </div>
                </div>

                {/* Text explanation */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-extrabold text-white">3 Modos de Redacción</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tú eliges cómo felicitar a cada persona:
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <strong className="text-white">1. Mensaje Fijo:</strong> Redactas tu texto exacto.
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <strong className="text-white">2. Plantilla:</strong> Elige entre Amigos, Familia, Trabajo o Rápida.
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <strong className="text-white">3. Generado por IA ✨:</strong> Gemini inventa una felicitación única cada año según vuestra relación.
                    </div>
                  </div>

                  <Link
                    href="/contacts/new"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Añadir mi Primer Contacto</span>
                  </Link>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: CÓMO FUNCIONA EL ASISTENTE */}
          {activeTab === 'assistant' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Visual Chat Simulation */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-slate-300 pb-2 border-b border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Chat con AutoBirthday Asistente</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Bot Message */}
                    <div className="p-3 bg-slate-900 rounded-2xl rounded-tl-none border border-slate-800 text-slate-200 space-y-1">
                      <span className="text-[10px] text-violet-400 font-bold block">AutoBirthday (+34 926 31 24 36)</span>
                      <p>🎂 Hoy es el cumple de Josefina. ¿Te parece bien este mensaje?: "¡Feliz día mamá! ❤️"</p>
                    </div>

                    {/* User Reply */}
                    <div className="p-2.5 bg-emerald-700 rounded-2xl rounded-tr-none text-white max-w-[80%] ml-auto text-right font-bold">
                      SÍ
                    </div>

                    {/* Bot Confirmation */}
                    <div className="p-2.5 bg-slate-900 rounded-2xl rounded-tl-none border border-slate-800 text-emerald-400 font-medium">
                      ✅ ¡Aprobado! Enviando a las 10:15 desde tu WhatsApp.
                    </div>
                  </div>
                </div>

                {/* Text explanation */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-extrabold text-white">Control Total sin Entrar a la Web</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      El Asistente te escribe por la mañana para que no tengas que preocuparte por nada:
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="p-2 bg-slate-800/80 rounded-xl">
                      👉 Responde <strong>SÍ</strong>: Aprueba el envío automático.
                    </li>
                    <li className="p-2 bg-slate-800/80 rounded-xl">
                      👉 Responde <strong>EDITAR: nuevo texto</strong>: Cambia la felicitación sobre la marcha.
                    </li>
                    <li className="p-2 bg-slate-800/80 rounded-xl">
                      👉 Responde <strong>NO</strong>: Cancela el mensaje.
                    </li>
                  </ul>

                  <a
                    href="https://wa.me/34926312436?text=Hola%20AutoBirthday"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Guardar Asistente (+34 926 31 24 36)</span>
                  </a>
                </div>

              </div>
            </div>
          )}

        </div>

      </DialogContent>
    </Dialog>
  );
}
