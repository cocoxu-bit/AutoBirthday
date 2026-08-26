import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import { getUserProfile } from '@/lib/firebase/firestore';
import { SettingsClient } from '@/components/settings/settings-client';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Ajustes | AutoBirthday',
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

export default async function SettingsPage() {
  const userId = await getUserId();
  if (!userId) return null;

  const userProfile = await getUserProfile(userId);

  if (!userProfile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Error cargando el perfil de usuario.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 text-white rounded-lg shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>
          <p className="text-slate-500 text-sm">Gestiona tu cuenta y preferencias</p>
        </div>
      </div>

      <SettingsClient userProfile={userProfile} />
    </div>
  );
}
