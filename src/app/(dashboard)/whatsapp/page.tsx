'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  Loader2, 
  Send, 
  PhoneCall, 
  Copy, 
  Check, 
  Sparkles
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
  
  // Connection methods: 'code' (mobile recommended) vs 'qr' (desktop)
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
    const res = await connectInstance();
    if (res.success && res.qr) {
      setQrCode(res.qr);
      setStatus('connecting');
      setPairingCode(null);
    } else {
      toast.error('Error al generar el código QR');
    }
    setActionLoading(false);
  };

  const handleConnectPairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPhone.trim()) {
      toast.error('Introduce tu número de WhatsApp con prefijo de país');
      return;
    }

    setActionLoading(true);
    try {
      const res = await connectWithPairingCode(inputPhone);
      if (res.success && res.pairingCode) {
        setPairingCode(res.pairingCode);
        setStatus('connecting');
        setQrCode(null);
        toast.success('¡Código generado! Introdúcelo en tu WhatsApp');
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
    toast.success('¡Código copiado al portapapeles!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDisconnect = async () => {
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
        toast.success(`¡Mensaje de prueba enviado a +${res.phone || testPhone}! 🎉`);
      } else {
        toast.error(res.error || 'Error al enviar el mensaje de prueba');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error inesperado');
    } finally {
      setTestSending(false);
    }
  };

  if (loading && !pairingCode && !qrCode && status !== 'connected') {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-xs text-slate-400 font-medium">Cargando estado de WhatsApp...</p>
      </div>
    );
  }

  const showConnectionForm = status === 'disconnected' || (status === 'connecting' && !pairingCode && !qrCode);

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-4 pb-12">
      <Card className="text-center p-6 md:p-8 border-none shadow-xl bg-white/80 backdrop-blur-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-slate-900">Conexión de WhatsApp</CardTitle>
          <CardDescription className="text-slate-500 text-sm max-w-md mx-auto">
            Vincula tu WhatsApp para automatizar el envío de felicitaciones personalizadas con Inteligencia Artificial.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2">
          
          {/* DISCONNECTED / READY TO CONNECT STATE */}
          {showConnectionForm && (
            <div className="flex flex-col items-center space-y-6 w-full max-w-lg">
              
              {/* Method Switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl w-full text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setConnectMethod('code')}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${
                    connectMethod === 'code'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>En este móvil (Código)</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-violet-100 text-violet-700 rounded-md">
                    Top
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectMethod('qr')}
                  className={`flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all ${
                    connectMethod === 'qr'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Escanear QR (PC)</span>
                </button>
              </div>

              {/* METHOD 1: PAIRING CODE (MOBILE FRIENDLY) */}
              {connectMethod === 'code' && (
                <form onSubmit={handleConnectPairingCode} className="w-full space-y-4 text-left">
                  <div className="bg-violet-50/70 border border-violet-100/80 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-violet-800 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      Vinculación rápida sin escanear pantalla
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Escribe tu número de WhatsApp (incluyendo prefijo de país, ej: <strong>34</strong> para España). Te daremos un código de 8 dígitos para pegarlo en tu WhatsApp.
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Tu Número de WhatsApp
                      </label>
                      <div className="relative">
                        <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={inputPhone}
                          onChange={(e) => setInputPhone(e.target.value)}
                          placeholder="Ej: 34612345678"
                          className="w-full pl-10 pr-4 py-3 text-base bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono"
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        🇪🇸 España: 34... | 🇲🇽 México: 52... | 🇦🇷 Argentina: 54... | 🇨🇴 Colombia: 57...
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-6 rounded-2xl shadow-lg shadow-violet-500/20 text-base" 
                    isLoading={actionLoading}
                  >
                    Obtener código de 8 dígitos 📲
                  </Button>
                </form>
              )}

              {/* METHOD 2: QR CODE SCANNER */}
              {connectMethod === 'qr' && (
                <div className="w-full space-y-4">
                  <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-left space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Modo Ordenador</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Si estás navegando desde un ordenador o tablet, puedes generar un código QR clásico y escanearlo con la cámara de tu teléfono móvil.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-6 rounded-2xl shadow-lg shadow-slate-900/10 text-base" 
                    onClick={handleConnectQR} 
                    isLoading={actionLoading}
                  >
                    Generar Código QR 📷
                  </Button>
                </div>
              )}

            </div>
          )}

          {/* CONNECTING STATE WITH PAIRING CODE */}
          {status === 'connecting' && pairingCode && (
            <div className="flex flex-col items-center space-y-6 w-full max-w-md">
              
              {/* Big Pairing Code Card */}
              <div className="w-full bg-gradient-to-b from-violet-500 to-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/20 text-center space-y-4">
                <p className="text-xs uppercase tracking-widest text-violet-200 font-bold">
                  Tu Código de Vinculación
                </p>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl py-4 px-6 border border-white/20 inline-block">
                  <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white">
                    {pairingCode}
                  </span>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyCode}
                    className="bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-xl shadow-md gap-2 text-xs py-2 px-4"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-left space-y-3 bg-violet-50/80 p-5 rounded-2xl border border-violet-100 w-full text-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Pasos en tu WhatsApp:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm font-medium text-slate-800">
                  <li>Abre <strong>WhatsApp</strong> en tu teléfono.</li>
                  <li>Ve a <strong>Ajustes (o Configuración) &gt; Dispositivos vinculados</strong>.</li>
                  <li>Pulsa <strong>Vincular un dispositivo</strong>.</li>
                  <li>Toca abajo en <strong>&ldquo;Vincular con el número de teléfono&rdquo;</strong>.</li>
                  <li>Introduce o pega el código: <strong className="font-mono text-violet-700">{pairingCode}</strong></li>
                </ol>
              </div>

              <div className="flex items-center text-slate-500 text-xs sm:text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-violet-600" />
                Esperando confirmación en tu WhatsApp...
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetConnection}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                Cambiar número o cancelar
              </Button>
            </div>
          )}

          {/* CONNECTING STATE WITH QR CODE */}
          {status === 'connecting' && qrCode && (
            <div className="flex flex-col items-center space-y-6 w-full max-w-md">
              <QRScanner qrCode={qrCode} />
              <div className="text-left space-y-3 bg-violet-50/80 p-5 rounded-2xl border border-violet-100 w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Instrucciones</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700 font-medium">
                  <li>Abre <strong>WhatsApp</strong> en tu teléfono.</li>
                  <li>Ve a <strong>Ajustes &gt; Dispositivos vinculados</strong>.</li>
                  <li>Pulsa <strong>Vincular un dispositivo</strong>.</li>
                  <li>Escanea este código QR con la cámara.</li>
                </ol>
              </div>
              <div className="flex items-center text-slate-500 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-violet-600" />
                Esperando escaneo desde tu móvil...
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetConnection}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                Usar código en lugar de QR
              </Button>
            </div>
          )}

          {/* CONNECTED STATE */}
          {status === 'connected' && (
            <div className="flex flex-col items-center space-y-6 w-full max-w-lg">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center shadow-inner">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conexión Activa
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">¡WhatsApp Vinculado con Éxito!</h3>
                {phoneNumber && (
                  <p className="text-emerald-700 font-semibold text-base">
                    Número vinculado: +{phoneNumber}
                  </p>
                )}
                <p className="text-slate-500 text-xs mt-1">
                  Tu SaaS está listo para enviar felicitaciones 24/7.
                </p>
              </div>

              {/* Test Message Box */}
              <form onSubmit={handleSendTest} className="w-full bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl space-y-3 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Lanzar Mensaje de Prueba
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="Ej: 34600000000"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    isLoading={testSending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm px-4 shrink-0 shadow-sm shadow-emerald-500/20"
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    Enviar Prueba
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Introduce tu número (con prefijo de país, ej. 34 para España) o pulsa Enviar para usar tu propio número.
                </p>
              </form>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect} 
                isLoading={loading}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-xs transition-colors rounded-xl"
              >
                Desconectar WhatsApp
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
