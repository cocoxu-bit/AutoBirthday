import { adminDb } from '@/lib/firebase/admin';
import { evolutionApi } from '@/lib/evolution-api/client';
import { logSystemEvent } from '@/lib/logger/system-logger';

const ADMIN_PHONE = process.env.ADMIN_PHONE || '34606513672';

export interface BillingAlertParams {
  service: 'Gemini AI' | 'Oracle Cloud' | 'Firebase' | 'Evolution API' | 'General';
  reason: string;
  severity?: 'warning' | 'critical';
  details?: string;
}

/**
 * Centinela de Seguridad Financiera:
 * Envía una alerta inmediata a tu WhatsApp si alguna herramienta alcanza límites
 * de cuota gratuitos o si se detecta cualquier riesgo de cobro.
 * Incorpora un throttle de 2 horas por servicio para no saturar.
 */
export async function sendBillingAlertToAdmin(params: BillingAlertParams): Promise<boolean> {
  const { service, reason, severity = 'warning', details } = params;
  const throttleKey = `billing_alert_${service.toLowerCase().replace(/\s+/g, '_')}`;

  try {
    // 1. Throttle check (máximo 1 alerta por servicio cada 2 horas)
    const alertDocRef = adminDb.collection('system').doc(throttleKey);
    const alertSnap = await alertDocRef.get().catch(() => null);

    if (alertSnap && alertSnap.exists) {
      const lastSent = alertSnap.data()?.lastSentAt?.toDate?.() || new Date(0);
      const diffMinutes = (Date.now() - lastSent.getTime()) / (1000 * 60);
      if (diffMinutes < 120 && severity !== 'critical') {
        console.log(`[BillingAlert] Throttled alert for ${service} (last sent ${Math.round(diffMinutes)}m ago)`);
        return false;
      }
    }

    // 2. Localizar instancia activa de Evolution API
    const instances = await evolutionApi.fetchInstances();
    const openInstance = instances.find(
      (inst: any) => (inst.connectionStatus || inst.instance?.status || inst.status) === 'open'
    );
    const instanceName = openInstance 
      ? (openInstance.name || openInstance.instance?.instanceName)
      : 'autocumple-lguuencbRUP5dhi79hqZLBtJEST2';

    // 3. Redactar mensaje de alerta claro y directo
    const icon = severity === 'critical' ? '🚨💳 *ALERTA URGENTE DE FACTURACIÓN*' : '⚠️💳 *AVISO DE CUOTA / FACTURACIÓN*';
    const message = `${icon}

Hola Lucas, el centinela de AutoBirthday ha detectado una situación relevante sobre costes:

📌 *Herramienta:* ${service}
⚠️ *Motivo:* ${reason}
${details ? `📝 *Detalles:* ${details}\n` : ''}
🛑 *Acción de protección:* Revisa la cuenta para evitar cobros no deseados o consumos fuera de la capa gratuita (Free Tier).

📅 *Fecha:* ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`;

    console.log(`[BillingAlert] Enviando aviso financiero a ${ADMIN_PHONE}...`);
    await evolutionApi.sendText(instanceName, ADMIN_PHONE, message);

    // 4. Guardar timestamp en Firestore
    await alertDocRef.set({
      service,
      reason,
      severity,
      details: details || null,
      lastSentAt: new Date(),
    }, { merge: true });

    // 5. Registrar en el log de auditoría
    await logSystemEvent({
      severity: severity === 'critical' ? 'error' : 'warning',
      source: 'system',
      message: `Alerta de coste enviada a WhatsApp para ${service}: ${reason}`,
      details: details || reason,
      metadata: { service, severity },
    }).catch(() => {});

    return true;
  } catch (error: any) {
    console.error('[BillingAlert] Error enviando alerta de facturación:', error?.message || error);
    return false;
  }
}
