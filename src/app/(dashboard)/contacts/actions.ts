'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  createContact as dbCreateContact,
  updateContact as dbUpdateContact,
  deleteContact as dbDeleteContact,
} from '@/lib/firebase/firestore';
import { contactFormSchema } from '@/lib/validations/contact';
import type { ContactFormData } from '@/lib/validations/contact';
import { evolutionApi } from '@/lib/evolution-api/client';
import { parseICalendar } from '@/lib/parsers/calendar-ics';
import { parseVCard } from '@/lib/parsers/vcard-vcf';
import { WhatsAppGroup, WhatsAppChatContact, ParsedContactPreview } from '@/types';
import { formatToWhatsappJid } from '@/lib/utils/phone';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');
  const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decodedClaims.uid;
}

export async function createContact(formData: ContactFormData) {
  try {
    const userId = await getAuthenticatedUserId();
    const validatedData = contactFormSchema.parse(formData);

    // Try to fetch WhatsApp profile picture
    let profilePictureUrl: string | null = null;
    try {
      const instanceName = `autocumple-${userId}`;
      if (validatedData.targetType === 'group' && validatedData.groupId) {
        profilePictureUrl = await evolutionApi.fetchProfilePictureUrl(instanceName, validatedData.groupId);
      } else if (validatedData.phone) {
        profilePictureUrl = await evolutionApi.fetchProfilePictureUrl(instanceName, validatedData.phone);
      }
    } catch {}

    await dbCreateContact(userId, {
      name: validatedData.name,
      phone: validatedData.phone || '',
      birthDay: validatedData.birthDay,
      birthMonth: validatedData.birthMonth,
      birthYear: validatedData.birthYear ?? null,
      targetType: validatedData.targetType || 'individual',
      groupId: validatedData.groupId || undefined,
      groupName: validatedData.groupName || undefined,
      mentionInGroup: validatedData.mentionInGroup ?? false,
      profilePictureUrl: profilePictureUrl || undefined,
      mode: validatedData.mode,
      customMessage: validatedData.customMessage || undefined,
      templateId: validatedData.templateId || undefined,
      aiRelationship: validatedData.aiRelationship || undefined,
      aiTone: validatedData.aiTone ?? 'casual',
      aiNotes: validatedData.aiNotes || undefined,
      autoSend: validatedData.autoSend ?? false,
      sendTimeStart: validatedData.sendTimeStart ?? '09:30',
      sendTimeEnd: validatedData.sendTimeEnd ?? '11:45',
      isActive: validatedData.isActive ?? true,
      source: validatedData.source || 'manual',
    });

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

export async function updateContact(contactId: string, formData: ContactFormData) {
  try {
    const userId = await getAuthenticatedUserId();
    const validatedData = contactFormSchema.parse(formData);

    // Try to fetch WhatsApp profile picture
    let profilePictureUrl: string | null = null;
    try {
      const instanceName = `autocumple-${userId}`;
      if (validatedData.targetType === 'group' && validatedData.groupId) {
        profilePictureUrl = await evolutionApi.fetchProfilePictureUrl(instanceName, validatedData.groupId);
      } else if (validatedData.phone) {
        profilePictureUrl = await evolutionApi.fetchProfilePictureUrl(instanceName, validatedData.phone);
      }
    } catch {}

    await dbUpdateContact(userId, contactId, {
      name: validatedData.name,
      phone: validatedData.phone || '',
      birthDay: validatedData.birthDay,
      birthMonth: validatedData.birthMonth,
      birthYear: validatedData.birthYear ?? null,
      targetType: validatedData.targetType || 'individual',
      groupId: validatedData.groupId || null,
      groupName: validatedData.groupName || null,
      mentionInGroup: validatedData.mentionInGroup ?? false,
      ...(profilePictureUrl ? { profilePictureUrl } : {}),
      mode: validatedData.mode,
      customMessage: validatedData.customMessage || null,
      templateId: validatedData.templateId || null,
      aiRelationship: validatedData.aiRelationship || null,
      aiTone: validatedData.aiTone ?? 'casual',
      aiNotes: validatedData.aiNotes || null,
      autoSend: validatedData.autoSend ?? false,
      sendTimeStart: validatedData.sendTimeStart ?? '09:30',
      sendTimeEnd: validatedData.sendTimeEnd ?? '11:45',
      isActive: validatedData.isActive ?? true,
    });

    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

export async function deleteContact(contactId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await dbDeleteContact(userId, contactId);
    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

export async function toggleContactActive(contactId: string, isActive: boolean) {
  try {
    const userId = await getAuthenticatedUserId();
    await dbUpdateContact(userId, contactId, { isActive });
    revalidatePath('/contacts');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

export async function fetchWhatsAppGroupsAction(): Promise<WhatsAppGroup[]> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    return await evolutionApi.fetchGroups(instanceName);
  } catch (error) {
    console.warn('Error fetching WhatsApp groups in action:', error);
    return [];
  }
}

export async function fetchWhatsAppContactsAction(): Promise<WhatsAppChatContact[]> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;
    return await evolutionApi.fetchChats(instanceName);
  } catch (error) {
    console.warn('Error fetching WhatsApp contacts in action:', error);
    return [];
  }
}

export async function parseAndMatchImportFile(
  fileContent: string,
  fileType: 'ics' | 'vcf' | 'csv'
): Promise<{ success: boolean; data?: ParsedContactPreview[]; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId();
    const instanceName = `autocumple-${userId}`;

    // 1. Fetch real WhatsApp chat contacts for fuzzy matching
    let whatsappContacts: WhatsAppChatContact[] = [];
    try {
      whatsappContacts = await evolutionApi.fetchChats(instanceName);
    } catch {}

    let parsedResults: ParsedContactPreview[] = [];

    if (fileType === 'ics') {
      parsedResults = parseICalendar(fileContent, whatsappContacts);
    } else if (fileType === 'vcf') {
      parsedResults = parseVCard(fileContent, whatsappContacts);
    } else if (fileType === 'csv') {
      // CSV format
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      let startIndex = 0;
      if (lines[0] && lines[0].toLowerCase().includes('nombre')) startIndex = 1;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 3) {
          const name = parts[0];
          const phone = parts[1] ? formatToWhatsappJid(parts[1]) : '';
          const birthDay = parseInt(parts[2], 10);
          const birthMonth = parseInt(parts[3], 10);
          const birthYear = parts[4] ? parseInt(parts[4], 10) : null;

          if (name && birthDay && birthMonth) {
            parsedResults.push({
              id: `csv-${i}-${Date.now()}`,
              name,
              phone,
              birthDay,
              birthMonth,
              birthYear,
              source: 'csv',
              matchConfidence: phone ? 100 : 0,
              selected: true,
            });
          }
        }
      }
    }

    return { success: true, data: parsedResults };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al procesar archivo' };
  }
}

export async function batchImportContacts(contactsToImport: ParsedContactPreview[]) {
  try {
    const userId = await getAuthenticatedUserId();
    let importedCount = 0;

    for (const c of contactsToImport) {
      if (!c.name || !c.birthDay || !c.birthMonth) continue;

      await dbCreateContact(userId, {
        name: c.name.trim(),
        phone: c.phone ? formatToWhatsappJid(c.phone) : '34600000000',
        birthDay: c.birthDay,
        birthMonth: c.birthMonth,
        birthYear: c.birthYear || null,
        targetType: 'individual',
        mode: 'ai',
        aiRelationship: 'amigo/a',
        aiTone: 'casual',
        autoSend: false,
        sendTimeStart: '09:30',
        sendTimeEnd: '11:45',
        isActive: true,
        source: c.source || 'manual',
      });
      importedCount++;
    }

    revalidatePath('/contacts');
    revalidatePath('/dashboard');
    return { success: true, count: importedCount };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error en importación masiva' };
  }
}

export async function importContacts(
  csvData: {
    name: string;
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear?: number;
  }[],
) {
  try {
    const userId = await getAuthenticatedUserId();

    for (const contact of csvData) {
      await dbCreateContact(userId, {
        name: contact.name,
        phone: contact.phone,
        birthDay: contact.birthDay,
        birthMonth: contact.birthMonth,
        birthYear: contact.birthYear ?? null,
        targetType: 'individual',
        mode: 'manual',
        autoSend: false,
        sendTimeStart: '09:00',
        sendTimeEnd: '14:00',
        isActive: true,
        aiTone: 'casual',
      });
    }

    revalidatePath('/contacts');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: message };
  }
}

