import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getContacts, getTemplates } from '@/lib/firebase/firestore';
import { ContactsTable } from '@/components/contacts/contacts-table';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Cumpleaños | AutoBirthday',
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

export default async function ContactsPage() {
  const userId = await getUserId();
  if (!userId) return null; // Handled by middleware

  const [contacts, templates] = await Promise.all([
    getContacts(userId),
    getTemplates(userId),
  ]);
  const activeContactsCount = contacts.filter(c => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Cumpleaños</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-violet-500" />
            {contacts.length} {contacts.length === 1 ? 'cumpleaños registrado' : 'cumpleaños registrados'} ({activeContactsCount} activos)
          </p>
        </div>
      </div>

      <ContactsTable contacts={contacts} templates={templates} />
    </div>
  );
}
