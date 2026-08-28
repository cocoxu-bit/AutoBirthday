import { Timestamp } from "firebase/firestore";

export type WishMode = 'manual' | 'template' | 'ai';
export type AiTone = 'casual' | 'divertido' | 'formal' | 'emotivo';
export type WishStatus = 'draft' | 'waiting_approval' | 'approved' | 'queued' | 'sent' | 'failed' | 'cancelled' | 'expired';
export type WhatsAppInstanceStatus = 'disconnected' | 'connecting' | 'connected';
export type TargetType = 'individual' | 'group';
export type ContactSource = 'manual' | 'csv' | 'calendar_ics' | 'vcard_vcf' | 'google_calendar' | 'apple_calendar';

export interface WhatsAppGroup {
  id: string;          // Group JID (e.g. 12036302482394@g.us)
  subject: string;     // Group Title/Name
  pictureUrl?: string | null;
  size?: number;
}

export interface WhatsAppChatContact {
  jid: string;
  phone: string;
  name: string;
  pushName?: string;
  profilePictureUrl?: string | null;
}

export interface Contact<T = Timestamp> {
  id?: string;
  userId?: string;
  name: string;
  phone: string; // Formato internacional limpio E.164 (ej: 34600000000)
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  
  // Soporte de Destino (Individual vs Grupo)
  targetType?: TargetType;    // 'individual' por defecto
  groupId?: string;          // JID del grupo de WhatsApp (ej: 12036302482394@g.us)
  groupName?: string;        // Nombre del grupo para mostrar en la interfaz
  mentionInGroup?: boolean;  // Si es true, añade mención @tag en el grupo
  profilePictureUrl?: string | null; // URL de la foto de perfil en WhatsApp CDN

  // Modo y Personalización
  mode: WishMode;
  customMessage?: string;
  templateId?: string;
  aiRelationship?: string;
  aiTone?: AiTone;
  aiNotes?: string;
  autoSend: boolean;
  sendTimeStart?: string;
  sendTimeEnd?: string;
  sendWindow?: { start: string; end: string };
  isActive: boolean;
  source?: ContactSource;
  createdAt: T;
  updatedAt: T;
}

export type ClientContact = Contact<Date | string>;

export interface Template<T = Timestamp> {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: T;
}

export type ClientTemplate = Template<Date | string>;

export interface WhatsAppInstance {
  instanceName: string;
  status: WhatsAppInstanceStatus;
  phoneNumber?: string;
  updatedAt: Timestamp;
}

export interface UserProfile<T = Timestamp> {
  displayName?: string;
  email: string;
  timezone: string;
  createdAt: T;
  whatsappInstance?: WhatsAppInstance;
}

export type ClientUserProfile = UserProfile<Date | string>;

export interface ScheduledWish<T = Timestamp> {
  id: string;
  contactId: string;
  userId: string;
  year: number;
  generatedMessage: string;
  status: WishStatus;
  approvalToken?: string;
  scheduledFor: T;
  sentAt?: T;
  errorLog?: string;
  
  // Group details snapshot
  targetType?: TargetType;
  groupId?: string;
  groupName?: string;
  mentionInGroup?: boolean;
  targetPhone?: string;

  createdAt: T;
}

export type ClientScheduledWish = ScheduledWish<Date | string>;

export interface ParsedContactPreview {
  id: string;
  name: string;
  phone: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  source: ContactSource;
  matchConfidence?: number; // 0 - 100%
  matchedWhatsAppName?: string;
  matchedJid?: string;
  selected: boolean;
}
