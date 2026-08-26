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
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
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
    const body: any = {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    };

    if (webhookUrl) {
      body.webhook_by_events = true;
      body.webhook = {
        url: webhookUrl,
        webhook_by_events: true,
        events: ["connection.update", "messages.upsert"],
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
    return this.request<{ pairingCode?: string; code?: string }>(`/instance/connect/${instanceName}?number=${cleanPhone}`, {
      method: 'GET',
    });
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
      const chats = await this.request<any[]>(`/chat/findChats/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {} }),
      });
      
      const contacts: Array<WhatsAppChatContact & { lastActivity: number }> = [];
      const seen = new Set<string>();

      for (const chat of (chats || [])) {
        const jid = chat.remoteJid || chat.id;
        // Keep only user contacts (@s.whatsapp.net)
        if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
        
        const phone = jid.replace(/@.*$/, '');
        if (seen.has(phone)) continue;
        seen.add(phone);

        const rawName = chat.lastMessage?.pushName || chat.pushName || chat.name;
        const name = (!rawName || rawName === 'Você' || rawName === 'You') ? phone : rawName;
        
        const time = chat.lastMessage?.messageTimestamp 
          ? chat.lastMessage.messageTimestamp * 1000 
          : chat.updatedAt ? new Date(chat.updatedAt).getTime() : 0;

        contacts.push({
          jid,
          phone: `+${phone}`,
          name,
          pushName: chat.lastMessage?.pushName || chat.pushName,
          lastActivity: time,
        });
      }

      // Sort by most recent activity
      contacts.sort((a, b) => b.lastActivity - a.lastActivity);

      const result: WhatsAppChatContact[] = contacts.map(({ lastActivity, ...c }) => c);
      this.contactsCache.set(instanceName, {
        data: result,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });

      return result;
    } catch (err) {
      console.warn('Error fetching WhatsApp chats:', err);
      return [];
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
