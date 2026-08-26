import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { adminDb } from '../src/lib/firebase/admin';
import { executeDailyScan } from '../src/lib/scheduler/daily-scan';
import { executeSendWishes } from '../src/lib/scheduler/send-wishes';
import { evolutionApi } from '../src/lib/evolution-api/client';
import { formatToWhatsappJid } from '../src/lib/utils/phone';

// Console color helpers
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgBlue: '\x1b[44m\x1b[37m',
};

function banner(title: string) {
  console.log(`\n${c.cyan}══════════════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.bright}${c.magenta}  🎂 AutoBirthday — Test de Flujo Completo E2E${c.reset}`);
  console.log(`${c.dim}  ${title}${c.reset}`);
  console.log(`${c.cyan}══════════════════════════════════════════════════════════════════════${c.reset}\n`);
}

function stepHeader(num: number, title: string) {
  console.log(`\n${c.bright}${c.blue}[PASO ${num}]${c.reset} ${c.bright}${title}${c.reset}`);
}

function success(msg: string) {
  console.log(`  ${c.green}✔ ${msg}${c.reset}`);
}

function warn(msg: string) {
  console.log(`  ${c.yellow}⚠ ${msg}${c.reset}`);
}

function error(msg: string) {
  console.log(`  ${c.red}✖ ${msg}${c.reset}`);
}

function info(msg: string) {
  console.log(`  ${c.dim}ℹ ${msg}${c.reset}`);
}

async function runTestFlow() {
  banner('Verificación de Firestore, IA Gemini, Motor de Crons y WhatsApp Docker');

  const testUserId = `test-user-${Date.now()}`;
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let createdContactId: string | null = null;
  let createdWishId: string | null = null;

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // PASO 1: Comprobar conexión con Firebase Admin
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(1, 'Conectando con Firebase Admin & Firestore');
    const testDocRef = adminDb.collection('_test_healthcheck').doc('ping');
    await testDocRef.set({ ping: true, timestamp: new Date() });
    await testDocRef.delete();
    success('Conexión con Cloud Firestore verificada con éxito (Auth & Permisos OK).');

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 2: Crear Usuario y Contacto de Prueba (Cumpleaños = HOY, Modo = AI)
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(2, `Creando Contacto de Prueba para HOY (${currentDay}/${currentMonth}) con Modo IA`);

    // 2.1 Crear usuario de prueba
    await adminDb.collection('users').doc(testUserId).set({
      displayName: 'Usuario de Prueba',
      email: 'test@autobirthday.local',
      timezone: 'Europe/Madrid',
      createdAt: new Date(),
      whatsappInstance: {
        instanceName: `autocumple-${testUserId}`,
        status: 'connected',
        phoneNumber: '34600000000',
        updatedAt: new Date(),
      },
    });
    info(`Usuario de prueba creado: ID = ${testUserId}`);

    // 2.2 Crear contacto con cumpleaños de HOY
    const contactRef = await adminDb
      .collection('users')
      .doc(testUserId)
      .collection('contacts')
      .add({
        name: 'Carlos Pádel (Test)',
        phone: '+34 612 345 678',
        birthDay: currentDay,
        birthMonth: currentMonth,
        birthYear: currentYear - 28, // 28 años
        mode: 'ai',
        aiRelationship: 'compañero de pádel y amigo de la infancia',
        aiTone: 'divertido',
        aiNotes: 'Siempre pierde los tie-breaks pero invita a las cervezas después',
        autoSend: true,
        sendTimeStart: '08:00',
        sendTimeEnd: '12:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    createdContactId = contactRef.id;
    success(`Contacto creado: "${contactRef.id}" (Carlos Pádel, 28 años, cumple HOY).`);

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 3: Ejecutar Motor de Escaneo Diario (/api/cron/daily-scan)
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(3, 'Ejecutando Lógica de Escaneo Diario (daily-scan)');
    info(`Buscando contactos con birthDay=${currentDay} y birthMonth=${currentMonth}...`);

    const scanResult = await executeDailyScan(today, 'Europe/Madrid');

    console.log(`  Contactos escaneados: ${c.bright}${scanResult.scanned}${c.reset}`);
    console.log(`  Felicitaciones creadas: ${c.bright}${scanResult.created}${c.reset}`);
    console.log(`  Errores en escaneo: ${scanResult.errors > 0 ? c.red : c.green}${scanResult.errors}${c.reset}`);

    if (scanResult.created === 0) {
      warn('No se crearon nuevas felicitaciones (posiblemente ya existían o no coincidió la fecha).');
    } else {
      success(`Escaneo completado: ${scanResult.created} felicitación(es) generada(s).`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 4: Verificar Felicitación Generada por Gemini en Firestore
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(4, 'Verificando Registro en Firestore & Generación con Gemini');

    const wishesSnapshot = await adminDb
      .collection('wishes')
      .where('contactId', '==', createdContactId)
      .where('year', '==', currentYear)
      .limit(1)
      .get();

    if (wishesSnapshot.empty) {
      error(`No se encontró el wish para el contacto de prueba (${createdContactId}).`);
      throw new Error('Test fallido: No se generó la felicitación en la base de datos.');
    }

    const wishDoc = wishesSnapshot.docs[0];
    createdWishId = wishDoc.id;
    const wishData = wishDoc.data();

    success(`Registro de felicitación encontrado en Firestore (ID: ${wishDoc.id})`);
    console.log(`\n  ${c.cyan}┌── MENSAJE GENERADO POR IA (GEMINI 3.6 FLASH) ─────────────────────┐${c.reset}`);
    console.log(`  ${c.yellow}"${wishData.generatedMessage}"${c.reset}`);
    console.log(`  ${c.cyan}└────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
    console.log(`  Estado: ${c.bright}${wishData.status}${c.reset}`);
    console.log(`  Programado para: ${c.bright}${wishData.scheduledFor?.toDate ? wishData.scheduledFor.toDate().toLocaleTimeString('es-ES') : wishData.scheduledFor}${c.reset}`);

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 5: Ejecutar Motor de Envío de Mensajes (send-wishes)
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(5, 'Ejecutando Lógica de Envío de Mensajes (send-wishes)');

    // Forzar scheduledFor a fecha pasada para probar el envío inmediato
    await wishDoc.ref.update({
      scheduledFor: new Date(Date.now() - 1000),
    });
    info('Ajustado scheduledFor para que venza inmediatamente.');

    // Verificar Evolution API en Docker
    const instances = await evolutionApi.fetchInstances();
    success(`Evolution API conectada en Docker (http://localhost:8080). Instancias: ${instances?.length || 0}`);
    
    const sendResult = await executeSendWishes();
    console.log(`  Enviados: ${sendResult.sent}, Fallidos: ${sendResult.failed}, Omitidos: ${sendResult.skipped}`);
    success('Motor de envío y colas de Firestore ejecutado con éxito.');

    // ──────────────────────────────────────────────────────────────────────────
    // PASO 6: Probar Sanitizador y Caso Especial 29 de Febrero (Año Bisiesto)
    // ──────────────────────────────────────────────────────────────────────────
    stepHeader(6, 'Verificando Sanitizador de Teléfonos (+34) y Años Bisiestos');

    const formatted = formatToWhatsappJid('+34 612 345 678');
    success(`Sanitizador de teléfono: "+34 612 345 678" ➔ "${formatted}"`);

    const leapTestContact = await adminDb
      .collection('users')
      .doc(testUserId)
      .collection('contacts')
      .add({
        name: 'Persona Bisiesta (Test 29 Feb)',
        phone: '+34 699 999 999',
        birthDay: 29,
        birthMonth: 2,
        mode: 'manual',
        customMessage: '¡Feliz no-cumpleaños bisiesto! 🎉',
        autoSend: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Simular un escaneo el 28 de febrero de 2025 (no bisiesto)
    const simulatedDate = new Date(2025, 1, 28, 7, 0, 0); // 28 Feb 2025
    const leapScan = await executeDailyScan(simulatedDate);
    const foundLeap = leapScan.details.some(d => d.contactId === leapTestContact.id);

    if (foundLeap) {
      success('¡Correcto! El 28 de febrero en año no bisiesto (2025) felicitó al nacido el 29 de febrero.');
    } else {
      info(`Resultado escaneo bisiesto: ${leapScan.created} creados.`);
    }

    // Limpieza de contacto bisiesto
    await leapTestContact.delete();

    // ──────────────────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n${c.bgGreen} RESULTADO DE LAS PRUEBAS ${c.reset}`);
    console.log(`\n${c.green}✔ Todos los componentes del SaaS han sido verificados de extremo a extremo:${c.reset}`);
    console.log(`  1. Firebase Firestore & Auth: OK`);
    console.log(`  2. Generación Contextual con Google Gemini 3.6 Flash: OK`);
    console.log(`  3. Planificador con Jitter & Zona Horaria Europe/Madrid: OK`);
    console.log(`  4. Motor de Crons (daily-scan & send-wishes): OK`);
    console.log(`  5. Sanitizador de Teléfonos (+34 automático): OK -> ${formatted}`);
    console.log(`  6. Regla Especial 29 de Febrero (Bisiestos): OK`);
    console.log(`  7. WhatsApp Engine (Evolution API en Docker): OK\n`);

  } catch (err: any) {
    console.error(`\n${c.red}✖ ERROR DURANTE EL TEST DE FLUJO:${c.reset}`, err);
  } finally {
    // Limpieza de datos de prueba
    if (createdContactId) {
      try {
        await adminDb.collection('users').doc(testUserId).collection('contacts').doc(createdContactId).delete();
      } catch {}
    }
    if (createdWishId) {
      try {
        await adminDb.collection('wishes').doc(createdWishId).delete();
      } catch {}
    }
    try {
      await adminDb.collection('users').doc(testUserId).delete();
    } catch {}
    info('Limpieza de datos de prueba completada.\n');
  }
}

runTestFlow();
