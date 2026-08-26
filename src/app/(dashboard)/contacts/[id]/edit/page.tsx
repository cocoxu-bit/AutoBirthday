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
    const decoded = await adminAuth.verifySessionCookie(sessionCookie);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/contacts" 
          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Contacto</h1>
          <p className="text-slate-500 mt-1">Modificando los datos de {contact.name}.</p>
        </div>
      </div>

      <ContactForm initialData={contact} templates={templates} />
    </div>
  );
}
