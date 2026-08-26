import { ParsedContactPreview, WhatsAppChatContact } from '@/types';
import { findBestWhatsAppMatch } from './fuzzy-match';

/**
 * Cleans birthday event titles to extract clean names.
 * e.g. "Cumpleaños de Lucas", "Cumple de María Pérez", "Juan (Cumpleaños)", "Birthday - Alex"
 */
export function extractNameFromEventSummary(summary: string): string {
  if (!summary) return 'Sin nombre';

  let cleaned = summary
    // Common Spanish prefixes
    .replace(/^cumpleaños\s+de\s+/i, '')
    .replace(/^cumple\s+de\s+/i, '')
    .replace(/^cumpleaños\s*:\s*/i, '')
    .replace(/^cumple\s*:\s*/i, '')
    .replace(/^cumpleaños\s+/i, '')
    .replace(/^cumple\s+/i, '')
    // Common English prefixes
    .replace(/^birthday\s+of\s+/i, '')
    .replace(/^birthday\s*:\s*/i, '')
    .replace(/^bday\s*:\s*/i, '')
    .replace(/^bday\s+of\s+/i, '')
    .replace(/^bday\s+/i, '')
    // Common Suffixes
    .replace(/\s*\(cumpleaños\)/i, '')
    .replace(/\s*\(cumple\)/i, '')
    .replace(/\s*\(birthday\)/i, '')
    .replace(/\s*\(bday\)/i, '')
    .replace(/\s*-\s*cumpleaños/i, '')
    .replace(/\s*-\s*cumple/i, '')
    .replace(/\s*-\s*birthday/i, '')
    .replace(/['"“”]/g, '')
    .trim();

  return cleaned || summary.trim();
}

/**
 * Parses DTSTART or BDAY date strings (e.g. "19980826", "20240826T000000Z", "1998-08-26")
 */
export function parseDateString(dateStr: string): { day: number; month: number; year?: number | null } | null {
  if (!dateStr) return null;

  // Clean parameters (e.g. VALUE=DATE:19980826 -> 19980826)
  const clean = dateStr.replace(/^[A-Z0-9_-]+[:=]/i, '').trim();

  // Pattern YYYY-MM-DD
  const dashMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) {
    const year = parseInt(dashMatch[1], 10);
    const month = parseInt(dashMatch[2], 10);
    const day = parseInt(dashMatch[3], 10);
    return {
      day,
      month,
      year: year < 2020 ? year : null, // If year is recent recurring event, treat as unknown birth year
    };
  }

  // Pattern YYYYMMDD
  const compactMatch = clean.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compactMatch) {
    const year = parseInt(compactMatch[1], 10);
    const month = parseInt(compactMatch[2], 10);
    const day = parseInt(compactMatch[3], 10);
    return {
      day,
      month,
      year: year < 2020 ? year : null,
    };
  }

  // Pattern --MMDD (vCard without year)
  const noYearMatch = clean.match(/^--?(\d{2})-?(\d{2})/);
  if (noYearMatch) {
    return {
      month: parseInt(noYearMatch[1], 10),
      day: parseInt(noYearMatch[2], 10),
      year: null,
    };
  }

  return null;
}

/**
 * Parses an iCalendar (.ics) content and fuzzy-matches against WhatsApp contacts.
 */
export function parseICalendar(
  icsContent: string,
  whatsappContacts: WhatsAppChatContact[] = []
): ParsedContactPreview[] {
  const events: ParsedContactPreview[] = [];
  const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Handle line unfolding (lines starting with space or tab continue the previous line)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.trimStart();
    } else {
      unfoldedLines.push(line);
    }
  }

  let inEvent = false;
  let summary = '';
  let dtstart = '';
  let description = '';

  for (const line of unfoldedLines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      summary = '';
      dtstart = '';
      description = '';
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent && summary) {
        const isBirthday = 
          /cumple|birthday|bday|aniversario|nacimiento/i.test(summary) ||
          /cumple|birthday|bday/i.test(description);

        const parsedDate = parseDateString(dtstart);

        if (parsedDate && parsedDate.day && parsedDate.month) {
          const cleanName = extractNameFromEventSummary(summary);
          
          // Fuzzy match against WhatsApp
          const match = findBestWhatsAppMatch(cleanName, whatsappContacts);

          events.push({
            id: `ics-${events.length + 1}-${Date.now()}`,
            name: cleanName,
            phone: match.suggestedPhone || '',
            birthDay: parsedDate.day,
            birthMonth: parsedDate.month,
            birthYear: parsedDate.year || null,
            source: 'calendar_ics',
            matchConfidence: match.confidence,
            matchedWhatsAppName: match.matchedContact?.name,
            matchedJid: match.matchedContact?.jid,
            selected: true,
          });
        }
      }
      inEvent = false;
      continue;
    }

    if (inEvent) {
      if (trimmed.startsWith('SUMMARY:') || trimmed.startsWith('SUMMARY;')) {
        summary = trimmed.substring(trimmed.indexOf(':') + 1);
      } else if (trimmed.startsWith('DTSTART:') || trimmed.startsWith('DTSTART;')) {
        dtstart = trimmed.substring(trimmed.indexOf(':') + 1);
      } else if (trimmed.startsWith('DESCRIPTION:') || trimmed.startsWith('DESCRIPTION;')) {
        description = trimmed.substring(trimmed.indexOf(':') + 1);
      }
    }
  }

  return events;
}
