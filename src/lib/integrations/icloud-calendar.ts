import { parseICalendar } from '../parsers/calendar-ics';
import { ParsedContactPreview } from '@/types';
import { RawCalendarBirthday } from './google-calendar';

export async function fetchICloudCalendarBirthdays(calendarUrl: string): Promise<RawCalendarBirthday[]> {
  let cleanUrl = calendarUrl.trim();

  // Convert webcal:// or webcals:// to https://
  if (cleanUrl.startsWith('webcal://')) {
    cleanUrl = cleanUrl.replace('webcal://', 'http://');
  } else if (cleanUrl.startsWith('webcals://')) {
    cleanUrl = cleanUrl.replace('webcals://', 'https://');
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoBirthday/1.0; +https://autobirthday.vercel.app)',
        Accept: 'text/calendar, text/plain, */*',
      },
    });

    if (!res.ok) {
      throw new Error(`No se pudo acceder al calendario de iCloud (HTTP ${res.status}). Revisa que el enlace sea público.`);
    }

    const icsContent = await res.text();
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      throw new Error('El enlace proporcionado no es un calendario iCalendar válido de Apple.');
    }

    const parsedPreviews = parseICalendar(icsContent, []);

    return parsedPreviews.map((p: ParsedContactPreview) => ({
      id: p.id,
      name: p.name,
      birthDay: p.birthDay,
      birthMonth: p.birthMonth,
      birthYear: p.birthYear || null,
      rawSummary: p.name,
      source: 'apple' as const,
    }));
  } catch (error: any) {
    console.error('fetchICloudCalendarBirthdays error:', error);
    throw new Error(error.message || 'Error al sincronizar con Apple iCloud Calendar');
  }
}
