import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { FakeChatStudioClient } from '@/components/fake-chat/FakeChatStudioClient';

const ADMIN_EMAILS = ['lucasjimeneznavarro@gmail.com'];

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Fake Chat Studio (GTM) | AutoBirthday',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FakeChatStudioPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/tools/fake-chat');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const email = (decoded.email || '').toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(email)) {
      redirect('/dashboard');
    }
  } catch {
    redirect('/login?redirect=/tools/fake-chat');
  }

  return <FakeChatStudioClient />;
}
