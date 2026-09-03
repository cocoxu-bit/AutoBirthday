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
  Users, 
  ArrowRight,
  ExternalLink,
  Play
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
import { WhatsAppVideoDrawer } from '@/components/whatsapp/whatsapp-video-drawer';
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
  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false);
  
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
    <div className="w-full max-w-lg mx-auto space-y-5">
      
      {/* CARD PRINCIPAL */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-5 sm:p-7 space-y-6">
        
        {/* CABECERA */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {status === 'connected' ? t('whatsapp.statusConnected') : t('whatsapp.title')}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
            {status === 'connected'
              ? t('whatsapp.connectedSuccess')
              : t('whatsapp.subtitle')}
          </p>
        </div>

        {/* 1. MODO DESCONECTADO: SELECTOR Y FORMULARIO */}
        {showConnectionForm && (
          <div className="space-y-4">
            
            {/* Botón Ver Vídeo Tutorial (Bottom Sheet Drawer) */}
            <button
              type="button"
              onClick={() => setIsVideoDrawerOpen(true)}
              className="w-full p-3 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-2xl transition-all flex items-center justify-between group shadow-sm text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    ¿Cómo se vincula? Ver vídeo de 15 segundos
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Paso a paso en tu teléfono móvil
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                <span>Ver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Selector de Método */}
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
                <span>{t('whatsapp.tabCode')}</span>
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
                <span>{t('whatsapp.tabQr')}</span>
              </button>
            </div>

            {/* MÉTODO 1: CÓDIGO */}
            {connectMethod === 'code' && (
              <form onSubmit={handleConnectPairingCode} className="space-y-3 pt-1">
                <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-3.5 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('whatsapp.phoneInputLabel')}
                  </label>
                  
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      placeholder={t('whatsapp.phoneInputPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono font-bold placeholder:font-normal placeholder:text-slate-400"
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {t('contactForm.phoneHint')}
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[48px] bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-md shadow-violet-500/20 text-sm flex items-center justify-center gap-2"
                  isLoading={actionLoading}
                >
                  <span>{t('whatsapp.getCodeButton')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {/* MÉTODO 2: QR */}
            {connectMethod === 'qr' && (
              <div className="space-y-3 pt-1 text-center">
                <p className="text-xs text-slate-500 font-medium px-2">
                  {t('whatsapp.step4Qr')}
                </p>
                <Button
                  type="button"
                  onClick={handleConnectQR}
                  size="lg"
                  className="w-full min-h-[48px] bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2"
                  isLoading={actionLoading}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('whatsapp.tabQr')}</span>
                </Button>
              </div>
            )}

          </div>
        )}

        {/* 2. MODO ESPERA: CÓDIGO GENERADO */}
        {status === 'connecting' && pairingCode && (
          <div className="space-y-4 text-center">
            
            {/* Código y Botón Directo */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-3xl text-white shadow-xl shadow-violet-500/20 space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-200">
                Tu Código de Vinculación
              </p>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl py-2.5 px-4 border border-white/20 inline-block">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white select-all">
                  {pairingCode}
                </span>
              </div>

              {/* Botón Principal: Copiar Código */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full py-3 px-4 bg-white text-indigo-900 hover:bg-slate-50 font-black text-sm rounded-2xl shadow-lg shadow-indigo-950/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700">{t('whatsapp.copied')}</span>
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

            {/* Radar en vivo */}
            <div className="flex items-center justify-center gap-2.5 py-2 px-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
              <span>{t('settings.whatsappConnecting')}</span>
            </div>

            {/* 3 Pasos rápidos para llegar a Dispositivos Vinculados */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  WhatsApp:
                </p>
              </div>

              <ol className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>{t('whatsapp.step1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>{t('whatsapp.step2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>{t('whatsapp.step3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>{t('whatsapp.step4Code')} <strong className="font-mono text-violet-700 font-bold">{pairingCode}</strong></span>
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-slate-700 underline transition-colors"
            >
              {t('common.cancel')}
            </button>

          </div>
        )}

        {/* 3. MODO ESPERA: QR */}
        {status === 'connecting' && qrCode && (
          <div className="space-y-4 text-center">
            <div className="w-full flex items-center justify-center py-1">
              <QRScanner qrCode={qrCode} />
            </div>

            <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-800 text-xs font-bold max-w-sm mx-auto">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              <span>{t('whatsapp.step4Qr')}</span>
            </div>

            <button
              type="button"
              onClick={handleResetConnection}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {/* 4. MODO CONECTADO */}
        {status === 'connected' && (
          <div className="space-y-5 text-center">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                {t('whatsapp.connectedSuccess')}
              </h3>
              {phoneNumber && (
                <p className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 inline-block px-3 py-0.5 rounded-full border border-emerald-200/80">
                  +{phoneNumber}
                </p>
              )}
            </div>

            {/* Siguiente paso */}
            <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 text-left space-y-3 relative overflow-hidden shadow-lg">
              <div className="space-y-0.5">
                <h4 className="text-base font-black text-white">
                  {t('contacts.title')}
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  {t('dashboard.subtitle')}
                </p>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Link
                  href="/contacts?sync=whatsapp"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/30 transition-all whitespace-nowrap"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{t('contacts.syncWhatsApp')}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                >
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors underline"
              >
                {t('whatsapp.disconnectButton')}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* VIDEO BOTTOM SHEET DRAWER */}
      <WhatsAppVideoDrawer
        isOpen={isVideoDrawerOpen}
        onClose={() => setIsVideoDrawerOpen(false)}
      />

    </div>
  );
}

