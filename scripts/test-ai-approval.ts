import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { adminDb } from '../src/lib/firebase/admin';
import { executeDailyScan } from '../src/lib/scheduler/daily-scan';
import { evolutionApi } from '../src/lib/evolution-api/client';

async function testAiApprovalFlow() {
  console.log('\n🎂 AutoBirthday — Simulación de Modo IA con Aprobación');
  console.log('═════════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar usuario registrado
    const usersSnap = await adminDb.collection('users').get();
    if (usersSnap.empty) {
      console.log('❌ No hay usuarios en la base de datos. Regístrate en http://localhost:3000/register primero.');
      return;
    }

    // Usar el usuario real conectado
    let targetUserDoc = usersSnap.docs.find(d => d.data()?.whatsappInstance?.status === 'connected') || usersSnap.docs[0];
    const userId = targetUserDoc.id;
    const userData = targetUserDoc.data();
    const phone = userData?.whatsappInstance?.phoneNumber || '34606513672';

    console.log(`👤 Usuario detectado: ${userData?.displayName || 'Usuario'} (ID: ${userId})`);
    console.log(`📱 WhatsApp vinculado: +${phone}`);

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // 2. Limpiar deseos previos de prueba para este año para permitir un nuevo escaneo
    const existingWishes = await adminDb.collection('wishes')
      .where('userId', '==', userId)
      .where('year', '==', year)
      .get();
    
    for (const doc of existingWishes.docs) {
      await doc.ref.delete();
    }

    // 3. Crear contacto de prueba con cumpleaños de HOY y autoSend = false (Requiere Aprobación)
    console.log('\n📝 Creando contacto de prueba con Modo IA y APROBACIÓN REQUERIDA (autoSend = false)...');
    
    // Eliminar contactos de prueba previos si existen
    const prevContacts = await adminDb.collection('users').doc(userId).collection('contacts')
      .where('phone', '==', phone)
      .get();
    for (const c of prevContacts.docs) {
      await c.ref.delete();
    }

    const contactRef = await adminDb.collection('users').doc(userId).collection('contacts').add({
      name: 'Lucas (Prueba IA)',
      phone: `+${phone}`,
      birthDay: day,
      birthMonth: month,
      birthYear: year - 25, // 25 años
      mode: 'ai',
      aiRelationship: 'amigo cercano y colega de proyectos',
      aiTone: 'divertido',
      aiNotes: 'Le encanta la tecnología, el café y siempre tiene buenas ideas',
      autoSend: false, // ⚠️ IMPORTANTE: false = Requiere aprobación previa
      sendTimeStart: '09:00',
      sendTimeEnd: '12:00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✔ Contacto creado con éxito (ID: ${contactRef.id})`);

    // 4. Ejecutar el Escaneo Diario (daily-scan)
    console.log('\n🔍 Ejecutando Escaneo Diario y Generación con Google Gemini...');
    const scanResult = await executeDailyScan(today);

    console.log(`✔ Escaneo completado: ${scanResult.created} felicitación(es) generada(s).`);

    // 5. Consultar el deseo generado en Firestore
    const wishSnap = await adminDb.collection('wishes')
      .where('contactId', '==', contactRef.id)
      .where('year', '==', year)
      .limit(1)
      .get();

    if (!wishSnap.empty) {
      const wish = wishSnap.docs[0].data();
      console.log('\n┌── 🤖 MENSAJE GENERADO POR GEMINI ────────────────────────────────┐');
      console.log(`"${wish.generatedMessage}"`);
      console.log('└──────────────────────────────────────────────────────────────────┘');
      console.log(`Estado: ${wish.status} (Esperando tu aprobación)`);
      console.log('\n📲 ¡Se ha enviado la notificación de revisión a tu WhatsApp!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👉 Ahora puedes:');
      console.log('  1. Responder "SI" o "OK" en tu chat de WhatsApp.');
      console.log('  2. O responder "EDITAR: tu nuevo texto" en WhatsApp.');
      console.log('  3. O entrar en la web: http://localhost:3000/wishes y pulsar "Aprobar y Enviar".');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error: any) {
    console.error('❌ Error en el test de aprobación:', error);
  }
}

testAiApprovalFlow();
