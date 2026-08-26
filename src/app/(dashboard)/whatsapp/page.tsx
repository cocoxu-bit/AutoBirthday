'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Smartphone, CheckCircle, Loader2, Send, PhoneCall } from 'lucide-react';
import { getConnectionStatus, connectInstance, disconnectInstance, refreshQRCode, sendTestMessage } from './actions';
import { QRScanner } from '@/components/whatsapp/qr-scanner';
import { toast } from 'sonner';
import { WhatsAppInstanceStatus } from '@/types';

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppInstanceStatus>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState<string>('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (status === 'connecting') {
      qrInterval = setInterval(async () => {
        const res = await refreshQRCode();
        if (res.success && res.qr) {
          setQrCode(res.qr);
        }
      }, 30000);
    }
    return () => clearInterval(qrInterval);
  }, [status]);

  const handleConnect = async () => {
    setLoading(true);
    const res = await connectInstance();
    if (res.success && res.qr) {
      setQrCode(res.qr);
      setStatus('connecting');
    } else {
      toast.error('Error al conectar WhatsApp');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await disconnectInstance();
    setStatus('disconnected');
    setQrCode(null);
    setPhoneNumber(null);
    setLoading(false);
    toast.info('WhatsApp desconectado');
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

  if (loading && status === 'disconnected' && !qrCode) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-4 pb-12">
      <Card className="text-center p-6 md:p-8 border-none shadow-xl bg-white/70 backdrop-blur-md rounded-3xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-slate-900">Conexión de WhatsApp</CardTitle>
          <CardDescription className="text-slate-500 text-sm max-w-md mx-auto">
            Conecta tu teléfono mediante código QR para enviar felicitaciones automáticas a tus amigos y clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-4">
          
          {status === 'disconnected' && (
            <div className="flex flex-col items-center space-y-6 w-full max-w-md">
              <div className="relative">
                <div className="w-24 h-24 bg-violet-100 rounded-3xl flex items-center justify-center shadow-inner">
                  <Smartphone className="w-12 h-12 text-violet-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-sm"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">WhatsApp Desconectado</h3>
                <p className="text-slate-500 text-sm">
                  Haz clic en el botón de abajo para generar tu código QR y vincular tu cuenta de WhatsApp en 5 segundos.
                </p>
              </div>
              <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-6 rounded-2xl shadow-lg shadow-violet-500/20" onClick={handleConnect} isLoading={loading}>
                Conectar WhatsApp 📲
              </Button>
            </div>
          )}

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
            </div>
          )}

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
