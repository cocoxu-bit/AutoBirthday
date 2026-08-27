'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Loader2, 
  Send, 
  Phone, 
  Copy, 
  Check, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  getConnectionStatus, 
  connectInstance, 
  connectWithPairingCode, 
  disconnectInstance, 
  refreshQRCode, 
  sendTestMessage 
} from './actions';
import { QRScanner } from '@/components/whatsapp/qr-scanner';
import { toast } from 'sonner';
import { WhatsAppInstanceStatus } from '@/types';

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppInstanceStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState<string>('');
  
  // Connection method tab: 'code' (mobile) | 'qr' (desktop)
  const [connectMethod, setConnectMethod] = useState<'code' | 'qr'>('code');
  const [inputPhone, setInputPhone] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getConnectionStatus();
      setStatus(res.status);
      if (res.phoneNumber) {
        setPhoneNumber(res.phoneNumber);
        setTestPhone((prev) => prev || res.phoneNumber || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let qrInterval: NodeJS.Timeout;
    if (status === 'connecting' && qrCode && connectMethod === 'qr') {
      qrInterval = setInterval(async () => {
        const res = await refreshQRCode();
        if (res.success && res.qr) {
          setQrCode(res.qr);
        }
      }, 30000);
    }
    return () => clearInterval(qrInterval);
  }, [status, qrCode, connectMethod]);

  const handleConnectQR = async () => {
    setActionLoading(true);
    try {
      const res = await connectInstance();
      if (res.success && res.qr) {
        setQrCode(res.qr);
        setStatus('connecting');
        setPairingCode(null);
      } else {
        toast.error('No se pudo generar el código QR. Inténtalo de nuevo.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnectPairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = inputPhone.replace(/[\s\-\(\)\+]/g, '');
    if (!cleanNumber || cleanNumber.length < 8) {
      toast.error('Introduce tu número con prefijo de país (ej: 34612345678)');
      return;
    }

    setActionLoading(true);
    try {
      const res = await connectWithPairingCode(cleanNumber);
      if (res.success && res.pairingCode) {
        setPairingCode(res.pairingCode);
        setStatus('connecting');
        setQrCode(null);
        toast.success('¡Código generado! Introduce el código en WhatsApp');
      } else {
        toast.error(res.error || 'Error al generar el código');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    toast.success('¡Código copiado!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Seguro que deseas desconectar WhatsApp?')) return;
    setLoading(true);
    await disconnectInstance();
    setStatus('disconnected');
    setQrCode(null);
    setPairingCode(null);
    setPhoneNumber(null);
    setLoading(false);
    toast.info('WhatsApp desconectado');
  };

  const handleResetConnection = () => {
    setPairingCode(null);
    setQrCode(null);
    setStatus('disconnected');
  };

  const handleSendTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTestSending(true);
    try {
      const res = await sendTestMessage(testPhone || phoneNumber || undefined);
      if (res.success) {
        toast.success(`¡Mensaje de prueba enviado con éxito! 🎉`);
      } else {
        toast.error(res.error || 'Error al enviar el mensaje');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error inesperado');
    } finally {
      setTestSending(false);
    }
  };

  if (loading && !pairingCode && !qrCode && status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-xs text-slate-500 font-medium">Comprobando estado de WhatsApp...</p>
      </div>
    );
  }

  const showConnectionForm = status === 'disconnected' || (status === 'connecting' && !pairingCode && !qrCode);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6">
      
      {/* CARD PRINCIPAL */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
        
        {/* CABECERA */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Vinculación de WhatsApp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {status === 'connected' ? 'WhatsApp Vinculado' : 'Conecta tu WhatsApp'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {status === 'connected'
              ? 'Tu cuenta está activa para enviar felicitaciones automáticas.'
              : 'Elige cómo quieres vincular tu número:'}
          </p>
        </div>

        {/* 1. MODO DESCONECTADO: SELECTOR Y FORMULARIO */}
        {showConnectionForm && (
          <div className="space-y-5">
            
            {/* Pestañas / Selector de Modo */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConnectMethod('code')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 rounded-xl transition-all ${
                  connectMethod === 'code'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Smartphone className="w-4 h-4" />
                  <span>En este móvil</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Recomendado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConnectMethod('qr')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-2 rounded-xl transition-all ${
                  connectMethod === 'qr'
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <QrCode className="w-4 h-4" />
                  <span>Escanear QR</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Para PC)
                </span>
              </button>
            </div>

            {/* FORMULARIO MÉTODO 1: CÓDIGO DE 8 DÍGITOS */}
            {connectMethod === 'code' && (
              <form onSubmit={handleConnectPairingCode} className="space-y-4">
                <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tu número de WhatsApp
                  </label>
                  
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      placeholder="34612345678"
                      className="w-full pl-10 pr-4 py-3 text-base bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono font-medium placeholder:font-normal placeholder:text-slate-400"
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    💡 <strong>Importante:</strong> Incluye el prefijo de tu país (ej: <strong>34</strong> para España, <strong>52</strong> México, <strong>54</strong> Argentina, <strong>57</strong> Colombia).
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[52px] bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 text-base flex items-center justify-center gap-2"
                  isLoading={actionLoading}
                >
                  <span>Generar Código de Vinculación</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {/* FORMULARIO MÉTODO 2: QR PARA PC */}
            {connectMethod === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-slate-600 text-xs leading-relaxed">
                  Genera un código QR en pantalla para escanearlo con la cámara de tu móvil desde <strong>WhatsApp &gt; Dispositivos vinculados</strong>.
                </div>
                <Button
                  type="button"
                  onClick={handleConnectQR}
                  size="lg"
                  className="w-full min-h-[52px] bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-base shadow-md"
                  isLoading={actionLoading}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  <span>Mostrar Código QR</span>
                </Button>
              </div>
            )}

          </div>
        )}

        {/* 2. MODO ESPERA: CÓDIGO DE 8 DÍGITOS GENERADO */}
        {status === 'connecting' && pairingCode && (
          <div className="space-y-5 text-center">
            
            {/* Tarjeta del Código Destacado */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-violet-500/20 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-200">
                Tu Código de 8 Dígitos
              </p>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl py-3 px-4 border border-white/20 inline-block">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-white select-all">
                  {pairingCode}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>¡Código Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pasos en WhatsApp (Ultra Claros) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Cómo introducir el código en WhatsApp:
              </p>

              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] flex items-center justify-center mt-0.5">1</span>
                  <span>Abre <strong>WhatsApp</strong> en este móvil.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] flex items-center justify-center mt-0.5">2</span>
                  <span>Ve a <strong>Ajustes</strong> ⚙️ (o menú ⋮ en Android) &gt; <strong>Dispositivos vinculados</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] flex items-center justify-center mt-0.5">3</span>
                  <span>Pulsa en el botón verde <strong>Vincular un dispositivo</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] flex items-center justify-center mt-0.5">4</span>
                  <span>Cuando se abra la cámara, toca abajo en: <strong>&ldquo;Vincular con el número de teléfono&rdquo;</strong> (en letras pequeñas al pie).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px] flex items-center justify-center mt-0.5">5</span>
                  <span>Pega tu código: <strong className="font-mono text-violet-700">{pairingCode}</strong>.</span>
                </li>
              </ol>
            </div>

            {/* Radar en tiempo real */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span>Detectando vinculación en tiempo real...</span>
            </div>

            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
            >
              ¿Número incorrecto? Probar con otro número
            </button>

          </div>
        )}

        {/* 3. MODO ESPERA: QR SCANNER ACTIVO */}
        {status === 'connecting' && qrCode && (
          <div className="space-y-4 text-center">
            <div className="max-w-[260px] mx-auto">
              <QRScanner qrCode={qrCode} />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900">Instrucciones:</p>
              <p>1. Abre WhatsApp en tu teléfono &gt; Ajustes &gt; Dispositivos vinculados.</p>
              <p>2. Pulsa en <strong>Vincular un dispositivo</strong> y apunta la cámara a este código QR.</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span>Esperando escaneo con tu cámara...</span>
            </div>

            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              Cancelar o usar código de teléfono
            </button>
          </div>
        )}

        {/* 4. MODO CONECTADO: TODO OK */}
        {status === 'connected' && (
          <div className="space-y-5 text-center">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Conexión Activa</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">¡WhatsApp Vinculado con Éxito!</h3>
              {phoneNumber && (
                <p className="text-sm font-semibold text-emerald-700 font-mono">
                  +{phoneNumber}
                </p>
              )}
            </div>

            {/* Test de envío desde el Asistente */}
            <form onSubmit={handleSendTest} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recibir mensaje de prueba desde el Asistente (+34 926 31 24 36)
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="34612345678"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <Button
                  type="submit"
                  isLoading={testSending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 py-2.5 shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Probar Chat</span>
                </Button>
              </div>

              <p className="text-[11px] text-slate-400">
                El Asistente te enviará un WhatsApp de confirmación a este número para que verifiques la recepción.
              </p>
            </form>

            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-slate-400 hover:text-red-600 transition-colors"
            >
              Desconectar esta cuenta de WhatsApp
            </button>

          </div>
        )}

      </div>

      {/* TARJETA DE PRIVACIDAD, AISLAMIENTO Y CIFRADO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-100">Privacidad y Seguridad Garantizada</h4>
            <p className="text-[11px] text-slate-400">Arquitectura de máxima confidencialidad y permisos mínimos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-sm">
            <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Contenedor Aislado</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tu sesión se ejecuta en un contenedor aislado y exclusivo para tu cuenta, sin interferencia de otros usuarios.
            </p>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-sm">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🔒</span>
              <span>Cero Espionaje</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              No almacenamos el historial de tus conversaciones ni leemos tus mensajes privados o chats personales.
            </p>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-sm">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Permisos Acotados</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Solo se utilizan permisos para emitir las felicitaciones que programes y recibir las respuestas del bot de aprobación.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

