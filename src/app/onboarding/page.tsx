import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getOnboardingInitialStatus } from './actions';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const dynamic = 'force-dynamic';

interface OnboardingPageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function OnboardingPage(props: OnboardingPageProps) {
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

  const searchParams = await props.searchParams;
  const initialData = await getOnboardingInitialStatus();

  const parsedStep = searchParams?.step ? parseInt(searchParams.step, 10) : undefined;
  const forcedStep = parsedStep === 1 || parsedStep === 2 || parsedStep === 3 ? (parsedStep as 1 | 2 | 3) : undefined;

  return (
    <OnboardingWizard
      initialIsConnected={initialData.isWhatsAppConnected || false}
      initialContactsCount={initialData.contactsCount || 0}
      displayName={initialData.displayName || ''}
      forcedStep={forcedStep}
    />
  );
}
