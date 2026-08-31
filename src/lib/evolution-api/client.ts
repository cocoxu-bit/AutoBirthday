import { formatToWhatsappJid } from '@/lib/utils/phone';
import { WhatsAppGroup, WhatsAppChatContact } from '@/types';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'autobirthday-dev-key-2024';

function extractBestContactName(obj: any): string | undefined {
  if (!obj) return undefined;
  const candidates = [
    obj.name,
    obj.pushName,
    obj.notify,
    obj.shortName,
    obj.formattedName,
    obj.verifiedName,
    obj.vname,
    obj.lastMessage?.pushName,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    const clean = raw.trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (lower === 'você' || lower === 'voce' || lower === 'you' || lower === 'whatsapp' || lower === 'desconocido' || lower === 'unknown') {
      continue;
    }
    // If it's purely digits or phone format (+34 600...), it's not a real name
    if (/^[\d+\s\-()]+$/.test(clean)) {
      continue;
    }
    return clean;
  }
  return undefined;
}

class EvolutionAPIClient {
  private baseUrl: string;
  private apiKey: string;
  private groupsCache = new Map<string, { data: WhatsAppGroup[]; expiresAt: number }>();
  private contactsCache = new Map<string, { data: WhatsAppChatContact[]; expiresAt: number }>();

  constructor() {
    this.baseUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = process.env.EVOLUTION_API_URL || this.baseUrl || 'http://localhost:8080';
    const key = process.env.EVOLUTION_API_KEY || this.apiKey || 'autobirthday-dev-key-2024';

    const res = await fetch(`${url}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Evolution API error: ${res.status} - ${error}`);
    }
    return res.json();
  }

  async createInstance(instanceName: string, webhookUrl?: string) {
    const key = process.env.EVOLUTION_API_KEY || this.apiKey || 'autobirthday-dev-key-2024';
    const body: any = {
      instanceName,
      token: key,
      integration: "WHATSAPP-BAILEYS",
    };

    if (webhookUrl) {
      body.webhook_by_events = true;
      body.webhook = {
        url: webhookUrl,
        webhook_by_events: true,
        events: ["CONNECTION_UPDATE", "MESSAGES_UPSERT"],
      };
    }

    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  async getQRCode(instanceName: string): Promise<{ base64: string; code: string }> {
    return this.request<{ base64: string; code: string }>(`/instance/connect/${instanceName}`, {
      method: 'GET',
    });
  }

  async getPairingCode(instanceName: string, phoneNumber: string): Promise<{ pairingCode?: string; code?: string }> {
    const cleanPhone = formatToWhatsappJid(phoneNumber);
    
    // 1. Initial request to instruct Evolution API / Baileys to request a pairing code
    const initialRes = await this.request<{ pairingCode?: string; code?: string; count?: number }>(
      `/instance/connect/${instanceName}?number=${cleanPhone}`,
      { method: 'GET' }
    ).catch(() => ({} as { pairingCode?: string; code?: string; count?: number }));

    // Check if code was returned immediately
    if (initialRes.pairingCode && initialRes.pairingCode.length <= 12 && !initialRes.pairingCode.includes('@')) {
      return { pairingCode: initialRes.pairingCode };
    }

    // 2. Poll up to 6 times (1.2s interval) until WhatsApp servers return the 8-character pairing code
    for (let attempt = 1; attempt <= 6; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const pollRes = await this.request<{ pairingCode?: string; code?: string }>(
        `/instance/connect/${instanceName}?number=${cleanPhone}`,
        { method: 'GET' }
      ).catch(() => ({} as { pairingCode?: string; code?: string }));

      if (pollRes.pairingCode && pollRes.pairingCode.length <= 12 && !pollRes.pairingCode.includes('@')) {
        return { pairingCode: pollRes.pairingCode };
      }
      if (pollRes.code && pollRes.code.length <= 12 && !pollRes.code.includes('@')) {
        return { pairingCode: pollRes.code };
      }
    }

    return { pairingCode: undefined };
  }
  
  async getConnectionState(instanceName: string): Promise<{ instance: { state: string } }> {
    try {
      return await this.request<{ instance: { state: string } }>(`/instance/connectionState/${instanceName}`, {
        method: 'GET',
      });
    } catch (error) {
      return { instance: { state: 'close' } };
    }
  }

  async fetchConnectionState(instanceName: string): Promise<{ state: string; open: boolean }> {
    const res = await this.getConnectionState(instanceName);
    const state = res?.instance?.state || 'close';
    return {
      state,
      open: state === 'open'
    };
  }
  
  async sendText(
    instanceName: string, 
    target: string, 
    text: string, 
    options?: { mentioned?: string[] }
  ) {
    const isGroup = target.includes('@g.us');
    const number = isGroup ? target : formatToWhatsappJid(target);
    
    const body: any = {
      number,
      text,
    };

    if (options?.mentioned && options.mentioned.length > 0) {
      body.mentioned = options.mentioned.map(m => m.includes('@') ? m : `${formatToWhatsappJid(m)}@s.whatsapp.net`);
    }

    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  async fetchGroups(instanceName: string, forceRefresh = false): Promise<WhatsAppGroup[]> {
    const cached = this.groupsCache.get(instanceName);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const [groups, chats] = await Promise.all([
        this.request<any[]>(`/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
          method: 'GET',
        }).catch(() => []),
        this.request<any[]>(`/chat/findChats/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {} }),
        }).catch(() => []),
      ]);

      const groupMap = new Map<string, { id: string; subject: string; pictureUrl: string | null; size: number; lastActivity: number }>();

      // 1. Add groups from fetchAllGroups
      for (const g of (groups || [])) {
        const id = g.id || g.jid;
        const time = (g.subjectTime || g.creation || 0) * 1000;
        groupMap.set(id, {
          id,
          subject: g.subject || g.name || 'Grupo sin nombre',
          pictureUrl: g.pictureUrl || null,
          size: g.size || 0,
          lastActivity: time,
        });
      }

      // 2. Merge chats from findChats
      for (const c of (chats || [])) {
        const jid = c.remoteJid || c.id;
        if (jid && jid.includes('@g.us')) {
          const time = c.lastMessage?.messageTimestamp 
            ? c.lastMessage.messageTimestamp * 1000 
            : c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
          
          const existing = groupMap.get(jid);
          if (existing) {
            if (time > existing.lastActivity) {
              existing.lastActivity = time;
            }
            if (!existing.subject || existing.subject === 'Grupo sin nombre') {
              existing.subject = c.pushName || c.name || existing.subject;
            }
          } else {
            groupMap.set(jid, {
              id: jid,
              subject: c.pushName || c.name || 'Grupo de WhatsApp',
              pictureUrl: c.profilePicUrl || null,
              size: 1,
              lastActivity: time,
            });
          }
        }
      }

      const allMerged = Array.from(groupMap.values());
      allMerged.sort((a, b) => b.lastActivity - a.lastActivity);

      const result: WhatsAppGroup[] = allMerged.map(({ lastActivity, ...group }) => group);
      
      this.groupsCache.set(instanceName, {
        data: result,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });

      return result;
    } catch (err) {
      console.warn('Error fetching WhatsApp groups:', err);
      return [];
    }
  }

  async fetchFastChatSlice(instanceName: string, limit = 5): Promise<WhatsAppChatContact[]> {
    try {
      const chats = await this.request<any[]>(`/chat/findChats/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {} }),
      }).catch(() => []);

      const contacts: WhatsAppChatContact[] = [];
      const seen = new Set<string>();

      for (const chat of (chats || [])) {
        const jid = chat.remoteJid || chat.id;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
        const phone = jid.replace(/@.*$/, '').replace(/\D/g, '');
        if (!phone || phone.length < 6 || seen.has(phone)) continue;

        const bestName = extractBestContactName(chat);
        if (!bestName) continue;

        seen.add(phone);
        contacts.push({
          jid,
          phone: `+${phone}`,
          name: bestName,
          pushName: chat.pushName || bestName,
          profilePictureUrl: chat.profilePictureUrl || chat.profilePicUrl || null,
        });

        if (contacts.length >= limit) break;
      }
      return contacts;
    } catch {
      return [];
    }
  }

  async fetchChats(instanceName: string, forceRefresh = false): Promise<WhatsAppChatContact[]> {
    const cached = this.contactsCache.get(instanceName);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const [chats, contactsPost, messagesRes, groupsRes] = await Promise.all([
        this.request<any[]>(`/chat/findChats/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {} }),
        }).catch(() => []),
        this.request<any[]>(`/chat/findContacts/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {} }),
        }).catch(() => []),
        this.request<any>(`/chat/findMessages/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {}, limit: 1000 }),
        }).catch(() => ({})),
        this.fetchAllGroupsWithParticipants(instanceName).catch(() => []),
      ]);

      const masterNameMap = new Map<string, string>();

      for (const c of (contactsPost || [])) {
        const jid = c.id || c.remoteJid || c.jid;
        if (!jid) continue;
        const phone = jid.replace(/@.*$/, '').replace(/\D/g, '');
        const bestName = extractBestContactName(c);
        if (phone && bestName) {
          masterNameMap.set(phone, bestName);
        }
      }

      for (const g of (groupsRes || [])) {
        for (const p of (g.participants || [])) {
          const rawPhone = p.phoneNumber || p.id || '';
          const phone = rawPhone.replace(/@.*$/, '').replace(/\D/g, '');
          const bestName = extractBestContactName(p);
          if (phone && bestName && !masterNameMap.has(phone)) {
            masterNameMap.set(phone, bestName);
          }
        }
      }

      const msgRecords = messagesRes?.messages?.records || (Array.isArray(messagesRes) ? messagesRes : []);
      for (const m of msgRecords) {
        const jid = m.key?.remoteJid || m.key?.participant;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
        const phone = jid.replace(/@.*$/, '').replace(/\D/g, '');
        const bestName = extractBestContactName(m);
        if (phone && bestName && !masterNameMap.has(phone)) {
          masterNameMap.set(phone, bestName);
        }
      }

      const rawContactsList = [...(contactsPost || [])];
      const contacts: Array<WhatsAppChatContact & { lastActivity: number }> = [];
      const seen = new Set<string>();

      for (const chat of (chats || [])) {
        const jid = chat.remoteJid || chat.id;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
        
        const phone = jid.replace(/@.*$/, '').replace(/\D/g, '');
        if (!phone || phone.length < 6 || seen.has(phone)) continue;
        seen.add(phone);

        const chatName = extractBestContactName(chat);
        const resolvedName = chatName || masterNameMap.get(phone);
        const name = resolvedName || phone;

        let time = 0;
        // ONLY trust real Baileys message timestamps, NOT VPS database fields
        const trustedTimestamps = [
          chat.lastMessage?.messageTimestamp,
          chat.conversationTimestamp,
        ];
        for (const raw of trustedTimestamps) {
          if (!raw) continue;
          let num = typeof raw === 'number' ? raw : Number(raw);
          if (!isNaN(num) && num > 0) {
            // Baileys sends Unix SECONDS — convert to ms
            if (num > 1e8 && num < 1e12) num = num * 1000;
            const YEAR_2015 = 1420070400000;
            if (num >= YEAR_2015 && num <= Date.now() + 86400000 && num > time) time = num;
          }
        }

        const pic = chat.profilePictureUrl || chat.profilePicUrl || chat.avatar || null;

        contacts.push({
          jid,
          phone: `+${phone}`,
          name,
          pushName: chat.lastMessage?.pushName || chat.pushName || masterNameMap.get(phone),
          profilePictureUrl: pic,
          lastActivity: time,
        });
      }

      for (const c of (rawContactsList || [])) {
        const jid = c.id || c.remoteJid || c.jid;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;

        const phone = jid.replace(/@.*$/, '').replace(/\D/g, '');
        if (!phone || phone.length < 6) continue;

        const resolvedName = extractBestContactName(c) || masterNameMap.get(phone);
        const name = resolvedName || phone;
        const pic = c.profilePictureUrl || c.profilePicUrl || c.avatar || null;

        if (seen.has(phone)) {
          const existing = contacts.find(item => item.phone === `+${phone}`);
          if (existing) {
            if ((!existing.name || existing.name === phone) && name !== phone) {
              existing.name = name;
            }
            if (!existing.profilePictureUrl && pic) {
              existing.profilePictureUrl = pic;
            }
          }
          continue;
        }
        seen.add(phone);

        contacts.push({
          jid,
          phone: `+${phone}`,
          name,
          pushName: c.pushName || masterNameMap.get(phone),
          profilePictureUrl: pic,
          lastActivity: 0,
        });
      }

      // Sort purely by most recent conversation timestamp
      contacts.sort((a, b) => b.lastActivity - a.lastActivity);

      // Filter out invalid/system entries (e.g. status broadcast)
      const validContacts = contacts.filter(c => {
        if (!c.jid || c.jid.includes('status@broadcast') || c.jid.includes('newsletter')) return false;
        if (!c.phone || c.phone.length < 6) return false;
        return true;
      });

      const result: WhatsAppChatContact[] = validContacts;
      this.contactsCache.set(instanceName, {
        data: result,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return result;
    } catch (err) {
      console.warn('Error fetching WhatsApp chats:', err);
      return [];
    }
  }

  async fetchAllGroupsWithParticipants(instanceName: string): Promise<any[]> {
    try {
      const groups = await this.request<any[]>(`/group/fetchAllGroups/${instanceName}?getParticipants=true`, {
        method: 'GET',
      }).catch(() => []);
      return groups || [];
    } catch {
      return [];
    }
  }

  async fetchMessagesBatch(instanceName: string, maxPages = 3): Promise<any[]> {
    try {
      const promises = Array.from({ length: maxPages }, (_, i) => i + 1).map(page =>
        this.request<any>(`/chat/findMessages/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {}, page, offset: 1000 }),
        }).catch(() => ({}))
      );
      const results = await Promise.all(promises);
      const allRecords: any[] = [];
      for (const res of results) {
        const records = res?.messages?.records || (Array.isArray(res) ? res : []);
        allRecords.push(...records);
      }
      return allRecords;
    } catch {
      return [];
    }
  }

  async fetchProfilePictureUrl(instanceName: string, numberOrJid: string): Promise<string | null> {
    try {
      const cleanNumber = numberOrJid.replace(/[@+]/g, '').trim();
      const res = await this.request<any>(`/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: cleanNumber }),
      });
      return res?.profilePictureUrl || res?.pictureUrl || null;
    } catch {
      return null;
    }
  }

  async logout(instanceName: string) {
    return this.request(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }
  
  async deleteInstance(instanceName: string) {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async restartInstance(instanceName: string) {
    return this.request(`/instance/restart/${instanceName}`, {
      method: 'POST',
    });
  }
  
  async fetchInstances() {
    return this.request<any[]>('/instance/fetchInstances', {
      method: 'GET',
    });
  }
}

export const evolutionApi = new EvolutionAPIClient();
