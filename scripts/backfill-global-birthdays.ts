import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { adminDb } from '../src/lib/firebase/admin';
import { recordGlobalBirthdaysBatch, getGlobalBirthdaysStats } from '../src/lib/directory/global-birthdays';

async function runBackfill() {
  console.log('🚀 Starting Global Birthdays Directory backfill...');

  const contactsGroupSnap = await adminDb.collectionGroup('contacts').get();
  console.log(`📊 Found ${contactsGroupSnap.size} total contact documents across all users.`);

  const candidateEntries: Array<{
    phone: string;
    birthDay: number;
    birthMonth: number;
    birthYear?: number | null;
    verifiedBySelf: boolean;
  }> = [];

  for (const doc of contactsGroupSnap.docs) {
    const data = doc.data();
    const phone = data.phone;
    const day = Number(data.birthDay);
    const month = Number(data.birthMonth);
    const year = data.birthYear ? Number(data.birthYear) : null;
    const isCollector = data.source === 'public_collector';

    if (phone && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      candidateEntries.push({
        phone,
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        verifiedBySelf: isCollector,
      });
    }
  }

  console.log(`🎯 Valid candidate contacts with birthdays: ${candidateEntries.length}`);

  const inserted = await recordGlobalBirthdaysBatch(candidateEntries);
  console.log(`✅ Successfully batch processed ${inserted} entries into global_birthdays collection.`);

  const stats = await getGlobalBirthdaysStats();
  console.log(`🎉 Global Directory Stats: ${stats.totalCount} unique birthdays stored, ${stats.verifiedCount} self-verified.`);
}

runBackfill()
  .then(() => {
    console.log('✨ Backfill complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });
