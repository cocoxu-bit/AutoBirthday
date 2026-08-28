import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional().default(''),
  birthDay: z.number().min(1).max(31, "Día inválido"),
  birthMonth: z.number().min(1).max(12, "Mes inválido"),
  birthYear: z.number().nullable().optional(),
  
  // Destino (Individual vs Grupo)
  targetType: z.enum(['individual', 'group']).default('individual'),
  groupId: z.string().optional().nullable(),
  groupName: z.string().optional().nullable(),
  mentionInGroup: z.boolean().default(false).optional(),

  // Modo y Personalización
  mode: z.enum(['manual', 'template', 'ai']).default('ai'),
  customMessage: z.string().optional().nullable(),
  templateId: z.string().optional().nullable(),
  aiRelationship: z.string().optional().nullable(),
  aiTone: z.enum(['casual', 'divertido', 'formal', 'emotivo']).default('casual').optional(),
  aiNotes: z.string().optional().nullable(),
  autoSend: z.boolean().default(false),
  sendTimeStart: z.string().default('09:30'),
  sendTimeEnd: z.string().default('11:45'),
  isActive: z.boolean().default(true),
  source: z.enum(['manual', 'csv', 'calendar_ics', 'vcard_vcf', 'google_calendar', 'apple_calendar']).default('manual').optional(),
}).superRefine((data, ctx) => {
  // Individual chats require a valid phone number
  if (data.targetType === 'individual' && (!data.phone || data.phone.trim().length < 6)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El teléfono es requerido para chats privados",
      path: ['phone'],
    });
  }

  // Groups require a selected groupId
  if (data.targetType === 'group' && !data.groupId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes seleccionar un grupo de WhatsApp de destino",
      path: ['groupId'],
    });
  }

  if (data.mode === 'manual' && !data.customMessage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El mensaje personalizado es requerido para el modo manual",
      path: ['customMessage'],
    });
  }
  if (data.mode === 'template' && !data.templateId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe seleccionar una plantilla para el modo plantilla",
      path: ['templateId'],
    });
  }
});

export type ContactFormData = {
  name: string;
  phone?: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number | null;
  targetType: 'individual' | 'group';
  groupId?: string | null;
  groupName?: string | null;
  mentionInGroup?: boolean;
  mode: 'manual' | 'template' | 'ai';
  customMessage?: string | null;
  templateId?: string | null;
  aiRelationship?: string | null;
  aiTone?: 'casual' | 'divertido' | 'formal' | 'emotivo';
  aiNotes?: string | null;
  autoSend: boolean;
  sendTimeStart: string;
  sendTimeEnd: string;
  isActive: boolean;
  source?: 'manual' | 'csv' | 'calendar_ics' | 'vcard_vcf' | 'google_calendar' | 'apple_calendar';
};
