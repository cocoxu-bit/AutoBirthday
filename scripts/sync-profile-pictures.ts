import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { adminDb } from '../src/lib/firebase/admin';
import { evolutionApi } from '../src/lib/evolution-api/client';

async function syncProfilePictures() {
  console.log('🔄 Sincronizando fotos de perfil de WhatsApp para todos los contactos...');
  const usersSnap = await adminDb.collection('users').get();

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const instanceName = `autocumple-${userId}`;
    const contactsSnap = await adminDb.collection('users').doc(userId).collection('contacts').get();

    for (const cDoc of contactsSnap.docs) {
      const c = cDoc.data();
      const target = c.targetType === 'group' ? c.groupId : c.phone;
      if (!target) continue;

      try {
        const picUrl = await evolutionApi.fetchProfilePictureUrl(instanceName, target);
        if (picUrl) {
          await cDoc.ref.update({ profilePictureUrl: picUrl });
          console.log(`✅ Foto actualizada para: ${c.name} (${picUrl.substring(0, 45)}...)`);
        } else {
          console.log(`ℹ️ Sin foto pública para: ${c.name}`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Error en ${c.name}:`, err.message);
      }
    }
  }

  console.log('✨ Sincronización de fotos finalizada.');
}

syncProfilePictures();
