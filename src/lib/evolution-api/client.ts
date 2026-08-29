import { formatToWhatsappJid } from '@/lib/utils/phone';
import { WhatsAppGroup, WhatsAppChatContact } from '@/types';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'autobirthday-dev-key-2024';

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

  async fetchChats(instanceName: string, forceRefresh = false): Promise<WhatsAppChatContact[]> {
    const cached = this.contactsCache.get(instanceName);
    if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const [chats, contactsPost, messagesRes] = await Promise.all([
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
      ]);

      // Build pushName resolution map from message history (when lastMessage.pushName is 'Você')
      const msgRecords = messagesRes?.messages?.records || (Array.isArray(messagesRes) ? messagesRes : []);
      const messageNameMap = new Map<string, string>();
      for (const m of msgRecords) {
        const jid = m.key?.remoteJid;
        const name = m.pushName;
        if (jid && jid.endsWith('@s.whatsapp.net') && name && name !== 'Você' && name !== 'You') {
          const phone = jid.replace(/@.*$/, '');
          const cleanName = name.trim();
          if (!/^[\d+\s\-()]+$/.test(cleanName) && !messageNameMap.has(phone)) {
            messageNameMap.set(phone, cleanName);
          }
        }
      }
      
      const rawContactsList = [...(contactsPost || [])];
      const contacts: Array<WhatsAppChatContact & { lastActivity: number }> = [];
      const seen = new Set<string>();

      // Process chats
      for (const chat of (chats || [])) {
        const jid = chat.remoteJid || chat.id;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
        
        const phone = jid.replace(/@.*$/, '');
        if (seen.has(phone)) continue;
        seen.add(phone);

        let rawName = chat.name || chat.pushName;
        if (!rawName || rawName === 'Você' || rawName === 'You' || /^[\d+\s\-()]+$/.test(rawName.trim())) {
          if (chat.lastMessage && !chat.lastMessage.key?.fromMe && chat.lastMessage.pushName && chat.lastMessage.pushName !== 'Você') {
            rawName = chat.lastMessage.pushName;
          }
        }
        if (!rawName || rawName === 'Você' || rawName === 'You' || /^[\d+\s\-()]+$/.test(rawName.trim())) {
          rawName = messageNameMap.get(phone);
        }

        const name = rawName && !/^[\d+\s\-()]+$/.test(rawName.trim()) ? rawName.trim() : phone;
        
        const time = chat.lastMessage?.messageTimestamp 
          ? chat.lastMessage.messageTimestamp * 1000 
          : chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0;

        const pic = chat.profilePictureUrl || chat.profilePicUrl || chat.avatar || null;

        contacts.push({
          jid,
          phone: `+${phone}`,
          name,
          pushName: chat.lastMessage?.pushName || chat.pushName,
          profilePictureUrl: pic,
          lastActivity: time,
        });
      }

      // Process address book contacts
      for (const c of (rawContactsList || [])) {
        const jid = c.id || c.remoteJid || c.jid;
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;

        const phone = jid.replace(/@.*$/, '');
        let name = c.pushName || c.name || c.verifiedName || messageNameMap.get(phone) || phone;
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
          pushName: c.pushName,
          profilePictureUrl: pic,
          lastActivity: 0,
        });
      }

      // Sort by most recent activity
      contacts.sort((a, b) => b.lastActivity - a.lastActivity);

      // Filter out contacts without a real saved name (e.g. raw phone numbers)
      const validContacts = contacts.filter(c => {
        if (!c.name) return false;
        const name = c.name.trim();
        if (!name || name === 'Você' || name === 'You') return false;
        if (/^[\d+\s\-()]+$/.test(name)) return false;
        if (c.phone && name.replace(/\D/g, '') === c.phone.replace(/\D/g, '')) return false;
        return true;
      });

      const result: WhatsAppChatContact[] = validContacts.map(({ lastActivity, ...c }) => c);
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
  
  async fetchInstances() {
    return this.request<any[]>('/instance/fetchInstances', {
      method: 'GET',
    });
  }
}

export const evolutionApi = new EvolutionAPIClient();
