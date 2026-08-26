import { GoogleGenAI } from "@google/genai";

interface GenerateWishParams {
  name: string;
  age?: number;
  relationship: string;
  tone: 'casual' | 'divertido' | 'formal' | 'emotivo';
  notes?: string;
  isGroup?: boolean;
  groupName?: string;
  mentionInGroup?: boolean;
  phone?: string;
}

export async function generateBirthdayWish(params: GenerateWishParams): Promise<string> {
  const { name, age, relationship, tone, notes, isGroup, groupName, mentionInGroup, phone } = params;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY no configurada. Usando felicitación por defecto.');
    const tag = isGroup && mentionInGroup ? `@${phone || name} ` : '';
    return `¡Feliz cumpleaños, ${tag}${name}! 🎂🎉 ¡Que pases un día genial!`;
  }
  
  const toneDescriptions = {
    casual: 'cercano y amigable, como un amigo de toda la vida',
    divertido: 'gracioso y con humor, con bromas ingeniosas y desenfadadas',
    formal: 'respetuoso, cordial y profesional',
    emotivo: 'sincero, entrañable y muy cariñoso',
  };

  const groupContext = isGroup
    ? `\nCONTEXTO ESPECIAL DE GRUPO DE WHATSAPP:
- Este mensaje se enviará en el grupo de WhatsApp "${groupName || 'del grupo'}".
- Debe redactarse en tono público y festivo para que todos los miembros del grupo se sumen a la celebración.
- REGLA DE SEGURIDAD ESTRICTA: No inventes bromas internas o apodos que no hayan sido proporcionados explícitamente en las notas. Mantén un tono festivo, cercano y adecuado para ser leído por todos los miembros del grupo.
${mentionInGroup ? `- IMPORTANTE: Menciona al cumpleañero como @${phone || name} al inicio o durante el mensaje.` : `- Menciona a ${name} con naturalidad.`}`
    : '';

  const prompt = `Genera una felicitación de cumpleaños auténtica y perfecta para WhatsApp.
  
Destinatario: ${name}
${age ? `Edad: ${age} años` : 'Edad desconocida'}
Relación con el cumpleañero: ${relationship}
Tono deseado: ${toneDescriptions[tone] || 'casual'}
${notes ? `Notas, anécdotas o detalles personales: ${notes}` : ''}${groupContext}

Requisitos estrictos:
- Escribe en español de España natural y espontáneo.
- Usa emojis con estilo (2-4 emojis máximo).
- Longitud: 1-3 frases (máximo 220 caracteres).
- Debe sentirse 100% humano y espontáneo, NO robótico ni genérico.
- Evita clichés como "En este día tan especial" o "Querido/a".
- Devuelve ÚNICAMENTE el texto final de la felicitación sin comillas ni encabezados.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    
    return response.text?.trim() || `¡Feliz cumpleaños, ${name}! 🎂🎉`;
  } catch (error) {
    console.error('Error generating AI wish with Gemini:', error);
    return `¡Feliz cumpleaños, ${name}! 🎂🎉`;
  }
}
