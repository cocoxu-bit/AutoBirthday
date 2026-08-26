import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { evolutionApi } from '../src/lib/evolution-api/client';
import { formatToWhatsappJid } from '../src/lib/utils/phone';

async function main() {
  const targetPhoneArg = process.argv[2];

  console.log('\n📱 AutoBirthday — Enviar WhatsApp de Prueba Directo');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    const instances = await evolutionApi.fetchInstances();
    console.log(`Instancias activas en Evolution API: ${instances.length}`);

    if (instances.length === 0) {
      console.log('❌ No hay ninguna instancia de WhatsApp creada todavía.');
      console.log('👉 Entra a http://localhost:3000/whatsapp y pulsa "Conectar WhatsApp" para escanear el QR.\n');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.name || instance.instance?.instanceName;
    console.log(`Usando instancia: ${instanceName} (Estado: ${instance.connectionStatus || instance.instance?.state || 'desconocido'})`);

    const evoState = await evolutionApi.getConnectionState(instanceName);
    console.log(`Estado de conexión WhatsApp: ${evoState.instance.state}`);

    if (evoState.instance.state !== 'open') {
      console.log('\n⚠️ Tu WhatsApp aún no está vinculado en esta instancia.');
      console.log('👉 Ve a http://localhost:3000/whatsapp y escanea el código QR con tu móvil.\n');
      return;
    }

    if (!targetPhoneArg) {
      console.log('\nℹ Para enviar un mensaje, pasa el número de teléfono como argumento:');
      console.log('   npx tsx scripts/send-direct-test.ts 34612345678\n');
      return;
    }

    const cleanPhone = formatToWhatsappJid(targetPhoneArg);
    console.log(`\nEnviando mensaje de prueba a: ${cleanPhone}...`);

    const result = await evolutionApi.sendText(
      instanceName,
      cleanPhone,
      '🎉 ¡Hola! Este es un mensaje de prueba desde AutoBirthday. ¡Tu bot de WhatsApp está 100% operativo y listo para felicitar cumpleaños automáticamente!'
    );

    console.log('✅ ¡Mensaje enviado con éxito por WhatsApp!');
    console.log('Respuesta:', JSON.stringify(result, null, 2));
    console.log('\n');

  } catch (error: any) {
    console.error('❌ Error al enviar mensaje:', error.message || error);
  }
}

main();
