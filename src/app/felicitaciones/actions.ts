'use server';

import { headers } from 'next/headers';
import { generateBirthdayWish } from '@/lib/ai/generate-wish';

export interface GeneratePublicWishPayload {
  name: string;
  relationship: string;
  tone: 'divertido' | 'casual' | 'emotivo' | 'formal';
  notes?: string;
  honeypot?: string;
}

export interface GeneratePublicWishResult {
  success: boolean;
  wish?: string;
  error?: string;
  isContingency?: boolean;
}

// In-Memory Rate Limiting: Max 6 requests per 60 seconds per IP
interface RateLimitBucket {
  tokens: number;
  lastReset: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS = 6;

  const current = rateLimitMap.get(ip);
  if (!current || now - current.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { tokens: 1, lastReset: now });
    return true;
  }

  if (current.tokens >= MAX_REQUESTS) {
    return false;
  }

  current.tokens += 1;
  return true;
}

// Rich Human-Curated Contingencies (Fallback library if Gemini is slow or offline)
const CONTINGENCIES: Record<string, Record<string, string[]>> = {
  'amigo/a': {
    divertido: [
      '¡Feliz cumpleaños, fiera! 🎂🎉 Te haces más viejo, pero tranquilo: la resaca dura más, aunque la fiesta sigue mereciendo la pena. ¡Invítate a algo hoy!',
      '¡Muchas felicidades! 🥳 Menos mal que los años te sientan mejor que a la mayoría, porque si no ya estaríamos buscando residencia. ¡A celebrarlo!',
      '¡Feliz cumple, crack! 🍻 Un año más sabio y cinco minutos más cerca de necesitar siesta obligatoria. ¡Un abrazo gigante!',
    ],
    casual: [
      '¡Muchas felicidades, {nombre}! 🎂 Que tengas un día genial rodeado de los tuyos y que este nuevo año venga cargado de cosas buenas. ¡Un abrazo!',
      '¡Feliz cumpleaños, {nombre}! 🎉 Pásalo en grande hoy y disfrútalo al máximo. ¡Nos vemos pronto para brindar!',
    ],
    emotivo: [
      '¡Feliz cumpleaños, amigo del alma! ❤️✨ Qué suerte tenerte en mi vida y compartir tantas risas y momentos juntos. ¡Te deseo lo mejor hoy y siempre!',
      '¡Muchísimas felicidades, {nombre}! 🎂 Gracias por estar siempre ahí pase lo que pase. Que cumplas muchísimos más y sigamos celebrándolos juntos.',
    ],
    formal: [
      'Estimado/a {nombre}, le deseo un muy feliz cumpleaños. 🎂 Que pase un excelente día de celebración en compañía de sus seres queridos. Un cordial saludo.',
    ],
  },
  'pareja': {
    emotivo: [
      '¡Feliz cumpleaños, amor de mi vida! ❤️✨ Gracias por llenar cada día de alegría y complicidad. Celebrar tu vida es mi mayor regalo. ¡Te quiero infinito!',
      '¡Muchas felicidades a la persona que alegra todos mis días! 🎂🌹 Que este nuevo año te devuelva todo lo bonito que le das al mundo. ¡Hoy lo celebramos juntos!',
    ],
    divertido: [
      '¡Feliz cumpleaños, mi amor! 🥂🎂 Qué suerte tienes de tenerme a tu lado para disimular lo viejo/a que te estás haciendo. ¡Te amo con locura!',
    ],
    casual: [
      '¡Feliz cumple, cariño! 💖 Que tengas un día tan especial como tú. ¡A disfrutarlo al máximo juntos hoy!',
    ],
    formal: [
      '¡Muchas felicidades, cariño! 🌹 Deseo de corazón que pases un día maravilloso y que este año alcances todos tus propósitos.',
    ],
  },
  'familiar': {
    divertido: [
      '¡Feliz cumpleaños al miembro más loco y divertido de la familia! 😂🎂 Menos mal que estás tú para darle emoción a las comidas de los domingos. ¡Un abrazo grande!',
      '¡Muchas felicidades! 🥳 Recuerda que cumplir años es obligatorio, pero madurar es totalmente opcional. ¡A celebrarlo por todo lo alto!',
    ],
    emotivo: [
      '¡Feliz cumpleaños con todo mi cariño! ❤️🎂 Gracias por ser siempre un pilar indispensable y por todo tu amor. ¡Que pases un día inolvidable!',
      '¡Muchísimas felicidades! 🌸 Que este nuevo año de vida venga repleto de salud, paz y momentos felices juntos en familia.',
    ],
    casual: [
      '¡Feliz cumpleaños! 🎉 Que disfrutes muchísimo de tu día en familia y te mimen un montón. ¡Un beso enorme!',
    ],
    formal: [
      'Mis mejores deseos en el día de tu cumpleaños. 🎂 Que pases un día muy especial y lleno de bendiciones junto a la familia.',
    ],
  },
  'compañero/a': {
    casual: [
      '¡Feliz cumpleaños! ☕🎂 Que pases un día genial y que hoy la jornada laboral se pase volando. ¡A celebrarlo como se merece!',
      '¡Muchas felicidades, {nombre}! 🎉 Gracias por hacer el trabajo diario mucho más llevadero y divertido. ¡Que disfrutes de tu día!',
    ],
    divertido: [
      '¡Feliz cumple! 🍻 Oficialmente hoy tienes permiso para no mirar el correo y desconectar. ¡Invítate a unos cafés en la oficina!',
    ],
    formal: [
      'Le deseo un muy feliz cumpleaños, {nombre}. 🎂 Que pase una excelente jornada y que el próximo año esté colmado de éxitos y satisfacciones.',
    ],
    emotivo: [
      '¡Muchas felicidades, {nombre}! 🌟 Da gusto compartir equipo con personas tan comprometidas y de tan buen corazón. ¡Disfruta al máximo!',
    ],
  },
  'jefe/a': {
    formal: [
      'Estimado/a {nombre}, le deseo un muy feliz cumpleaños. 🎂 Que este nuevo año venga colmado de éxitos personales y profesionales. Un cordial saludo.',
      'Muchas felicidades en su día. Es un honor formar parte de su equipo y contar con su liderazgo. Que disfrute de una excelente jornada. 🥂',
    ],
    casual: [
      '¡Muchas felicidades, {nombre}! 🎉 Le deseo un gran día de celebración junto a su familia y un año cargado de proyectos prósperos.',
    ],
    divertido: [
      '¡Feliz cumpleaños, jefe/a! 🎂 Prometemos portarnos bien hoy y no dar demasiada guerra. ¡Que disfrute de su día!',
    ],
    emotivo: [
      'Le deseo un muy feliz cumpleaños, {nombre}. Gracias por su guía constante y su calidad humana al frente del equipo. ¡Un afectuoso saludo!',
    ],
  },
};

function getContingencyWish(name: string, relationship: string, tone: string): string {
  const relKey = CONTINGENCIES[relationship] ? relationship : 'amigo/a';
  const toneMap = CONTINGENCIES[relKey] || CONTINGENCIES['amigo/a'];
  const list = toneMap[tone] || toneMap.casual || CONTINGENCIES['amigo/a'].casual;
  const picked = list[Math.floor(Math.random() * list.length)];
  return picked.replace(/\{nombre\}/g, name);
}

export async function generatePublicWishAction(
  payload: GeneratePublicWishPayload
): Promise<GeneratePublicWishResult> {
  try {
    // 1. Silent Honeypot anti-spam check
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      console.warn('[PublicWish] Bot trap caught via honeypot');
      return {
        success: true,
        wish: `¡Feliz cumpleaños, ${payload.name || 'amigo'}! 🎂🎉 ¡Que pases un día genial!`,
      };
    }

    // 2. Client IP Rate Limiting
    let clientIp = '127.0.0.1';
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get('x-forwarded-for');
      const realIp = headerList.get('x-real-ip');
      const cfIp = headerList.get('cf-connecting-ip');
      clientIp = (forwardedFor?.split(',')[0] || realIp || cfIp || '127.0.0.1').trim();
    } catch {
      // Standalone script, test runner, or static pre-render context
      clientIp = '127.0.0.1';
    }

    if (!checkRateLimit(clientIp)) {
      return {
        success: false,
        error: 'Has alcanzado el límite de felicitaciones por minuto. Por favor, espera 30 segundos.',
      };
    }

    // 3. Input Sanitization
    const cleanName = (payload.name || '').trim().slice(0, 50);
    if (!cleanName || cleanName.length < 2) {
      return {
        success: false,
        error: 'Por favor, introduce el nombre del cumpleañero/a.',
      };
    }

    const cleanRelationship = (payload.relationship || 'amigo/a').trim().slice(0, 40);
    const validTone = ['divertido', 'casual', 'emotivo', 'formal'].includes(payload.tone)
      ? payload.tone
      : 'casual';
    const cleanNotes = (payload.notes || '').trim().slice(0, 150);

    // 4. Generate with Gemini (Strict 4.5s Timeout with AbortController)
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 4500)
    );

    const aiPromise = generateBirthdayWish({
      name: cleanName,
      relationship: cleanRelationship,
      tone: validTone,
      notes: cleanNotes || undefined,
      locale: 'es',
    });

    try {
      const generated = await Promise.race([aiPromise, timeoutPromise]);
      if (generated && generated.length > 5) {
        return {
          success: true,
          wish: generated,
          isContingency: false,
        };
      }
    } catch (aiErr: any) {
      console.warn('[PublicWish] AI generation timed out or failed, using human contingency:', aiErr?.message);
    }

    // 5. Fallback Contingency Guarantee
    const contingency = getContingencyWish(cleanName, cleanRelationship, validTone);
    return {
      success: true,
      wish: contingency,
      isContingency: true,
    };
  } catch (error: any) {
    console.error('generatePublicWishAction error:', error);
    return {
      success: false,
      error: error?.message || 'Error al generar la felicitación. Por favor, inténtalo de nuevo.',
    };
  }
}
