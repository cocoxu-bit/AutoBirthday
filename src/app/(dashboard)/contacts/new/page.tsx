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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/contacts" 
          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Contacto</h1>
          <p className="text-slate-500 mt-1">Añade los datos de la persona a felicitar.</p>
        </div>
      </div>

      <ContactForm templates={templates} />
    </div>
  );
}
