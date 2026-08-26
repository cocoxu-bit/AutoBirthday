'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase/admin';
import { createTemplate as dbCreateTemplate, updateTemplate as dbUpdateTemplate, deleteTemplate as dbDeleteTemplate } from '@/lib/firebase/firestore';
import { templateFormSchema, TemplateFormData } from '@/lib/validations/template';

async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) throw new Error('No autenticado');
  const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
  return decodedClaims.uid;
}

export async function createTemplate(data: TemplateFormData) {
  try {
    const userId = await getAuthenticatedUserId();
    const validatedData = templateFormSchema.parse(data);
    
    await dbCreateTemplate(userId, validatedData);
    revalidatePath('/dashboard/templates');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplate(templateId: string, data: TemplateFormData) {
  try {
    const userId = await getAuthenticatedUserId();
    const validatedData = templateFormSchema.parse(data);
    
    await dbUpdateTemplate(userId, templateId, validatedData);
    revalidatePath('/dashboard/templates');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    await dbDeleteTemplate(userId, templateId);
    revalidatePath('/dashboard/templates');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
