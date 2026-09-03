import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getOnboardingInitialStatus } from './actions';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, false);
  } catch {
    redirect('/login');
  }

  const initialData = await getOnboardingInitialStatus();

  // If user already completed onboarding and has WhatsApp connected, redirect to dashboard
  if (initialData.success && initialData.hasCompletedOnboarding && initialData.isWhatsAppConnected) {
    redirect('/dashboard');
  }

  return (
    <OnboardingWizard
      initialIsConnected={initialData.isWhatsAppConnected || false}
      initialContactsCount={initialData.contactsCount || 0}
      displayName={initialData.displayName || ''}
    />
  );
}
