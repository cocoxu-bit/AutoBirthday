import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getTemplates } from '@/lib/firebase/firestore';
import { ContactForm } from '@/components/contacts/contact-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Nuevo Contacto | AutoBirthday',
};

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie);
    return decoded.uid;
  } catch (error) {
    return null;
  }
}

export default async function NewContactPage() {
  const userId = await getUserId();
  if (!userId) return null;

  const templates = await getTemplates(userId);

  return (
    <div className="max-w-xl mx-auto">
      <ContactForm 
        templates={templates} 
        title="Nuevo Contacto"
        subtitle="Añade los datos de la persona a felicitar."
      />
    </div>
  );
}
