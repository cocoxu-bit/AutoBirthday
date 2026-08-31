import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getWishes, getContacts } from '@/lib/firebase/firestore';
import { WishesClient } from '@/components/wishes/wishes-client';
import { Cake } from 'lucide-react';
import { Contact } from '@/types';

export const metadata = {
  title: 'Felicitaciones | AutoBirthday',
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

export default async function WishesPage() {
  const userId = await getUserId();
  if (!userId) return null;

  const [wishes, contacts] = await Promise.all([
    getWishes(userId),
    getContacts(userId)
  ]);

  // Create a map of contacts for easy lookup in the client component
  const contactsMap = contacts.reduce((acc, contact) => {
    if (contact.id) acc[contact.id] = contact;
    return acc;
  }, {} as Record<string, Contact>);

  // Sort wishes: newest first
  wishes.sort((a, b) => {
    const dateA = a.createdAt ? ((a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt as any).getTime()) : 0;
    const dateB = b.createdAt ? ((b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt as any).getTime()) : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Felicitaciones</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm font-medium">
            <Cake className="w-4 h-4 text-rose-500" />
            Gestiona los mensajes generados y los envíos
          </p>
        </div>
      </div>

      <WishesClient wishes={wishes} contactsMap={contactsMap} />
    </div>
  );
}
