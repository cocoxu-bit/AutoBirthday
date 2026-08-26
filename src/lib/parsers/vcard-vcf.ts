import { ParsedContactPreview, WhatsAppChatContact } from '@/types';
import { findBestWhatsAppMatch } from './fuzzy-match';
import { parseDateString } from './calendar-ics';
import { formatToWhatsappJid } from '@/lib/utils/phone';

/**
 * Parses vCard (.vcf) contacts containing FN, BDAY, and TEL fields.
 */
export function parseVCard(
  vcfContent: string,
  whatsappContacts: WhatsAppChatContact[] = []
): ParsedContactPreview[] {
  const contacts: ParsedContactPreview[] = [];
  const lines = vcfContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Handle line unfolding
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.trimStart();
    } else {
      unfoldedLines.push(line);
    }
  }

  let inVCard = false;
  let fullName = '';
  let birthday = '';
  let phones: string[] = [];

  for (const line of unfoldedLines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VCARD') {
      inVCard = true;
      fullName = '';
      birthday = '';
      phones = [];
      continue;
    }

    if (trimmed === 'END:VCARD') {
      if (inVCard && (fullName || phones.length > 0)) {
        const parsedDate = parseDateString(birthday);

        // Even if BDAY is missing, if there is a name & phone, user can edit the birthday
        const day = parsedDate?.day || 1;
        const month = parsedDate?.month || 1;
        const year = parsedDate?.year || null;

        const rawPhone = phones[0] || '';
        let cleanPhone = rawPhone ? formatToWhatsappJid(rawPhone) : '';

        // If phone is missing or incomplete, fuzzy match against WhatsApp contacts
        let matchConfidence = cleanPhone ? 100 : 0;
        let matchedWhatsAppName: string | undefined;
        let matchedJid: string | undefined;

        if (!cleanPhone && fullName) {
          const match = findBestWhatsAppMatch(fullName, whatsappContacts);
          if (match.suggestedPhone) cleanPhone = match.suggestedPhone;
          matchConfidence = match.confidence;
          matchedWhatsAppName = match.matchedContact?.name;
          matchedJid = match.matchedContact?.jid;
        }

        contacts.push({
          id: `vcf-${contacts.length + 1}-${Date.now()}`,
          name: fullName || 'Sin nombre',
          phone: cleanPhone,
          birthDay: day,
          birthMonth: month,
          birthYear: year,
          source: 'vcard_vcf',
          matchConfidence,
          matchedWhatsAppName,
          matchedJid,
          selected: Boolean(birthday), // Default selected if it had a birthday tag
        });
      }
      inVCard = false;
      continue;
    }

    if (inVCard) {
      if (trimmed.startsWith('FN:') || trimmed.startsWith('FN;')) {
        fullName = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      } else if (!fullName && (trimmed.startsWith('N:') || trimmed.startsWith('N;'))) {
        const parts = trimmed.substring(trimmed.indexOf(':') + 1).split(';');
        const last = parts[0]?.trim() || '';
        const first = parts[1]?.trim() || '';
        fullName = `${first} ${last}`.trim();
      } else if (trimmed.startsWith('BDAY:') || trimmed.startsWith('BDAY;')) {
        birthday = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      } else if (trimmed.startsWith('TEL:') || trimmed.startsWith('TEL;')) {
        const phoneVal = trimmed.substring(trimmed.indexOf(':') + 1).trim();
        if (phoneVal) phones.push(phoneVal);
      }
    }
  }

  return contacts;
}
