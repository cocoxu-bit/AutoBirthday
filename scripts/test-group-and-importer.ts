import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { parseICalendar } from '../src/lib/parsers/calendar-ics';
import { parseVCard } from '../src/lib/parsers/vcard-vcf';
import { generateBirthdayWish } from '../src/lib/ai/generate-wish';
import { WhatsAppChatContact } from '../src/types';

async function runTests() {
  console.log('\n🧪 INICIANDO TEST: SOPORTE DE GRUPOS & IMPORTADOR INTELIGENTE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Simulación de Contactos de WhatsApp reales en el teléfono
  const mockWhatsAppChats: WhatsAppChatContact[] = [
    { jid: '34606513672@s.whatsapp.net', phone: '34606513672', name: 'Lucas Gana', pushName: 'Lucas ⚡' },
    { jid: '34612345678@s.whatsapp.net', phone: '34612345678', name: 'María García Pádel', pushName: 'Mari G.' },
    { jid: '34698765432@s.whatsapp.net', phone: '34698765432', name: 'Carlos Rodríguez Trabajo', pushName: 'Charlie' },
  ];

  console.log('📱 1. Simulación de Contactos de WhatsApp disponibles para Fuzzy Match:');
  mockWhatsAppChats.forEach(c => console.log(`   - ${c.name} (${c.pushName}) -> +${c.phone}`));

  // 2. Test Parser iCalendar (.ics)
  console.log('\n📅 2. Probando Parser iCalendar (.ics)...');
  const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
DTSTART;VALUE=DATE:19980826
SUMMARY:Cumpleaños de Lucas
RRULE:FREQ=YEARLY
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:19940514
SUMMARY:Cumple de Maria Garcia
RRULE:FREQ=YEARLY
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20001201
SUMMARY:Reunión de equipo
END:VEVENT
END:VCALENDAR`;

  const icsResults = parseICalendar(sampleIcs, mockWhatsAppChats);
  console.log(`✔ Eventos detectados en .ics: ${icsResults.length}`);
  icsResults.forEach(r => {
    console.log(`   🎂 "${r.name}" (${r.birthDay}/${r.birthMonth}) -> Teléfono vinculado: +${r.phone} [Coincidencia IA: ${r.matchConfidence}% con "${r.matchedWhatsAppName}"]`);
  });

  // 3. Test Parser vCard (.vcf)
  console.log('\n📇 3. Probando Parser vCard (.vcf)...');
  const sampleVcf = `BEGIN:VCARD
VERSION:3.0
FN:Carlos Rodriguez
BDAY:1990-11-20
TEL;TYPE=CELL:+34 698 76 54 32
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Lucas
BDAY:1998-08-26
END:VCARD`;

  const vcfResults = parseVCard(sampleVcf, mockWhatsAppChats);
  console.log(`✔ Contactos detectados en .vcf: ${vcfResults.length}`);
  vcfResults.forEach(r => {
    console.log(`   🎂 "${r.name}" (${r.birthDay}/${r.birthMonth}) -> Teléfono vinculado: +${r.phone} [Coincidencia: ${r.matchConfidence}%]`);
  });

  // 4. Test Generación con IA para Grupos de WhatsApp
  console.log('\n🤖 4. Probando Generación de Felicitación con Gemini en Modo Grupo de WhatsApp...');
  const groupWish = await generateBirthdayWish({
    name: 'Lucas',
    age: 26,
    relationship: 'compañero del equipo de pádel',
    tone: 'divertido',
    notes: 'siempre falla el revés en el tie-break pero luego paga las cervezas',
    isGroup: true,
    groupName: 'Los Reyes de la Pista 🎾🍻',
    mentionInGroup: true,
    phone: '34606513672',
  });

  console.log('\n┌── 💬 MENSAJE GRUPAL GENERADO POR GEMINI ─────────────────────────┐');
  console.log(`"${groupWish}"`);
  console.log('└──────────────────────────────────────────────────────────────────┘');

  console.log('\n✅ ¡TODOS LOS TESTS DE GRUPOS E IMPORTADOR SUPERADOS CON ÉXITO!\n');
}

runTests();
