import { NextResponse } from 'next/server';
import { evolutionApi } from '@/lib/evolution-api/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const instanceName = 'autobirthday-system';
    const stateRes = await evolutionApi.getConnectionState(instanceName).catch(() => ({ instance: { state: 'close' } }));
    const isConnected = stateRes?.instance?.state === 'open';

    if (isConnected) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AutoBirthday Bot - Conectado</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
          <div class="bg-slate-800 border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✅
            </div>
            <h1 class="text-2xl font-black text-emerald-400">¡Bot Central Conectado!</h1>
            <p class="text-sm text-slate-300">
              La instancia <span class="font-mono font-bold text-white bg-slate-700 px-2 py-0.5 rounded">autobirthday-system</span> está activa y lista para enviar aprobaciones y alertas.
            </p>
            <div class="pt-4">
              <a href="/dashboard" class="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition">
                Ir al Dashboard
              </a>
            </div>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const qrRes = await evolutionApi.getQRCode(instanceName);
    const pairingRes = await evolutionApi.getPairingCode(instanceName, '34926312436').catch(() => null);
    const pairingCode = pairingRes?.pairingCode || pairingRes?.code || '';

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vincular Bot Central - AutoBirthday</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="25">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-violet-500/30 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl">
          
          <div class="space-y-1">
            <span class="text-xs font-extrabold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
              Bot Central (+34 926 31 24 36)
            </span>
            <h1 class="text-2xl font-black text-white pt-2">Vincular AutoBirthday Asistente</h1>
            <p class="text-xs text-slate-400">
              Abre WhatsApp Business en tu móvil ➔ Dispositivos vinculados ➔ Vincular dispositivo.
            </p>
          </div>

          <!-- QR CODE IMAGE -->
          ${qrRes?.base64 ? `
            <div class="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              <img src="${qrRes.base64}" alt="WhatsApp QR Code" class="w-64 h-64 object-contain" />
            </div>
          ` : `
            <div class="p-8 bg-slate-800 rounded-2xl text-xs text-slate-400">
              Generando nuevo código QR...
            </div>
          `}

          ${pairingCode ? `
            <div class="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
              <span class="text-[11px] font-bold text-slate-400">O introduce este código de 8 dígitos:</span>
              <div class="font-mono text-xl font-black tracking-widest text-violet-300 select-all">
                ${pairingCode}
              </div>
            </div>
          ` : ''}

          <p class="text-[11px] text-slate-500 animate-pulse">
            Esta página se actualiza automáticamente cada 25 segundos.
          </p>

        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
