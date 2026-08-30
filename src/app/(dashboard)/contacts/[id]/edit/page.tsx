import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { getContact, getTemplates } from '@/lib/firebase/firestore';
import { ContactForm } from '@/components/contacts/contact-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Editar Contacto | AutoBirthday',
};

async function getUserId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return null;
  
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    return decoded.uid;
  } catch (error) {
    return null;
  }
}

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  if (!userId) return null;

  const { id } = await params;
  const contact = await getContact(userId, id);
  
  if (!contact) {
    redirect('/contacts');
  }

  const templates = await getTemplates(userId);

  return (
    <div className="max-w-xl mx-auto">
      <ContactForm 
        initialData={contact} 
        templates={templates} 
        title="Editar Contacto"
        subtitle={`Modificando los datos de ${contact.name}.`}
      />
    </div>
  );
}
