'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  Loader2, 
  Phone, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Users, 
  ArrowRight,
  ExternalLink,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  KeyRound
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
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { toast } from 'sonner';
import { WhatsAppInstanceStatus } from '@/types';
import { useTranslation } from '@/lib/i18n/context';

export default function WhatsAppPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [status, setStatus] = useState<WhatsAppInstanceStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState<string>('');
  
  // Connection method tab: 'code' (mobile) | 'qr' (desktop)
  const [connectMethod, setConnectMethod] = useState<'code' | 'qr'>('code');
  const [inputPhone, setInputPhone] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getConnectionStatus();
      if (res.status === 'connected' && status !== 'connected') {
        router.refresh();
      }
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

  const handleOpenWhatsAppAndCopy = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      toast.success('¡Código copiado! Pégalo en WhatsApp > Dispositivos vinculados');
      setTimeout(() => setCopied(false), 3000);
    }
    // Open WhatsApp native application
    window.location.href = 'whatsapp://';
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
    <div className="w-full max-w-xl mx-auto space-y-5">
      
      {/* 1. TUTORIAL ARRIBA (COMPRIMIDO POR DEFECTO) */}
      {status !== 'connected' && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    ¿Cómo se vincula? Guía en vídeo
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    15s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isGuideCollapsed ? 'Haz clic para ver el tutorial en vídeo' : 'Mira el vídeo y sigue los pasos en tu WhatsApp'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all border border-white/10 shrink-0"
              title={isGuideCollapsed ? "Mostrar vídeo y pasos" : "Comprimir guía"}
            >
              <span>{isGuideCollapsed ? 'Ver tutorial' : 'Comprimir'}</span>
              {isGuideCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isGuideCollapsed && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
              <div className="w-full max-w-[420px] sm:max-w-[460px] mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                  <video
                    src="/videos/WA.mp4"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-auto block object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-transform active:scale-95 shadow-md"
                    title={isMuted ? "Activar audio" : "Silenciar"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[420px] sm:max-w-[460px] mx-auto pt-1">
                <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-3 sm:p-3.5 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">1</span>
                    <span><strong>Genera y copia</strong> tu código abajo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">2</span>
                    <span>En WhatsApp, abre <strong>Ajustes</strong> (iPhone) o <strong>⋮</strong> (Android)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">3</span>
                    <span>Toca <strong>Dispositivos vinculados</strong> → <strong>Vincular un dispositivo</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">4</span>
                    <span>Toca abajo en <strong className="text-amber-300 font-bold">"Vincular con el número de teléfono"</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm">5</span>
                    <span><strong>Pega tu código</strong> y se vinculará al instante</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CARD PRINCIPAL */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-5 sm:p-7 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {status === 'connected' ? t('whatsapp.statusConnected') : t('whatsapp.title')}
          </h1>
        </div>

        {showConnectionForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConnectMethod('code')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                  connectMethod === 'code'
                    ? 'bg-white text-violet-700 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>{t('whatsapp.pairingCodeTab')}</span>
              </button>
              <button
                type="button"
                onClick={() => setConnectMethod('qr')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all ${
                  connectMethod === 'qr'
                    ? 'bg-white text-violet-700 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{t('whatsapp.qrCodeTab')}</span>
              </button>
            </div>

            {connectMethod === 'code' ? (
              <form onSubmit={handleConnectPairingCode} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{t('whatsapp.phoneLabel')}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{t('whatsapp.phoneHint')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="34612345678"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      className="w-full pl-3 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-600 focus:bg-white transition-all shadow-inner"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t('whatsapp.phoneHelper')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('whatsapp.generatingCode')}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{t('whatsapp.getCodeButton')}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-slate-500">
                  {t('whatsapp.qrDescription')}
                </p>
                <button
                  type="button"
                  onClick={handleConnectQR}
                  disabled={actionLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('whatsapp.generatingQr')}</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>{t('whatsapp.showQrButton')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {status === 'connecting' && pairingCode && (
          <div className="space-y-5 text-center">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('whatsapp.yourPairingCode')}
              </span>
              <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-3xl flex items-center justify-center">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-violet-700">
                  {pairingCode.slice(0, 4)} - {pairingCode.slice(4)}
                </span>
              </div>
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-violet-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:shadow transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-black">{t('whatsapp.codeCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{t('whatsapp.copyCode')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-rose-600 underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {status === 'connecting' && qrCode && (
          <div className="space-y-4 text-center">
            <div className="w-full flex items-center justify-center py-1">
              <QRScanner qrCode={qrCode} />
            </div>
            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-rose-600 underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {t('whatsapp.connectedSuccess')}
            </h3>
            {phoneNumber && (
              <p className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 inline-block px-3 py-0.5 rounded-full border border-emerald-200/80">
                +{phoneNumber}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/contacts?sync=whatsapp" className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700">
                {t('contacts.syncWhatsApp')}
              </Link>
              <button onClick={handleDisconnect} className="py-3 px-4 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200">
                {t('whatsapp.disconnectButton')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. GUÍA EN FORMATO TEXTO (BLOQUE INFERIOR) */}
      {status !== 'connected' && (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-md p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Pasos para vincular con tu teléfono:
            </p>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
              15 segundos
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-700 font-medium pt-1">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
              <span><strong>Genera y copia</strong> tu código arriba</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
              <span>En WhatsApp, abre <strong>Ajustes</strong> (iPhone) o el menú <strong>⋮</strong> (Android)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
              <span>Toca en <strong>Dispositivos vinculados</strong> → <strong>Vincular un dispositivo</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
              <span>Toca abajo en <strong className="text-amber-700 font-bold">"Vincular con el número de teléfono"</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
              <span><strong>Pega tu código</strong> de 8 dígitos y se vinculará al instante</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

