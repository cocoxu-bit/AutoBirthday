import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { 
  recordGlobalBirthday, 
  lookupSingleGlobalBirthday, 
  lookupGlobalBirthdays, 
  normalizeGlobalPhone,
  getGlobalBirthdaysStats
} from '../src/lib/directory/global-birthdays';
import { adminDb } from '../src/lib/firebase/admin';

async function testGlobalBirthdays() {
  console.log('🧪 Testing Global Birthdays Directory...');

  // 1. Test normalization
  console.log('\n--- 1. Testing phone normalization ---');
  const n1 = normalizeGlobalPhone('+34 606 51 36 72');
  const n2 = normalizeGlobalPhone('34606513672@s.whatsapp.net');
  const n3 = normalizeGlobalPhone('12036304@g.us'); // Group, must be null
  const n4 = normalizeGlobalPhone('12345@newsletter'); // Newsletter, must be null
  const n5 = normalizeGlobalPhone('12345@lid'); // LID, must be null
  const n6 = normalizeGlobalPhone('123'); // Too short, must be null

  console.log('Normalized +34 606 51 36 72:', n1, n1 === '34606513672' ? '✅' : '❌');
  console.log('Normalized JID:', n2, n2 === '34606513672' ? '✅' : '❌');
  console.log('Group rejected:', n3 === null ? '✅' : '❌');
  console.log('Newsletter rejected:', n4 === null ? '✅' : '❌');
  console.log('LID rejected:', n5 === null ? '✅' : '❌');
  console.log('Short phone rejected:', n6 === null ? '✅' : '❌');

  if (n1 !== '34606513672' || n3 !== null || n4 !== null || n5 !== null || n6 !== null) {
    throw new Error('Normalization tests failed');
  }

  // 2. Test record and lookup
  console.log('\n--- 2. Testing record and lookup ---');
  const testPhone = '99999999999';
  
  // Clean up any previous test doc
  await adminDb.collection('global_birthdays').doc(testPhone).delete().catch(() => {});

  // Record a self-verified birthday
  await recordGlobalBirthday(testPhone, 15, 8, 1990, true);
  let entry = await lookupSingleGlobalBirthday(testPhone);
  console.log('Lookup testPhone:', entry);
  if (!entry || entry.birthDay !== 15 || entry.birthMonth !== 8 || entry.birthYear !== 1990 || !entry.verifiedBySelf) {
    throw new Error('Record self-verified failed');
  }
  console.log('✅ Self-verified record and lookup passed');

  // 3. Test verification precedence
  console.log('\n--- 3. Testing verification precedence ---');
  // Attempt to overwrite with conflicting date as non-self (e.g. friend mistake)
  await recordGlobalBirthday(testPhone, 20, 12, 1995, false);
  entry = await lookupSingleGlobalBirthday(testPhone);
  if (!entry || entry.birthDay !== 15 || entry.birthMonth !== 8) {
    throw new Error('Precedence defense failed: non-self input overwrote self-verified birthday');
  }
  console.log('✅ Precedence defense passed: self-verified date preserved against non-self update');
  console.log('Sources count incremented to:', entry.sourcesCount);

  // 4. Test batch lookup
  console.log('\n--- 4. Testing batch lookup ---');
  const batchMap = await lookupGlobalBirthdays([testPhone, '34606513672', 'nonexistentphone123']);
  console.log('Batch found keys:', Array.from(batchMap.keys()));
  if (!batchMap.has(testPhone)) {
    throw new Error('Batch lookup failed to find test phone');
  }
  console.log('✅ Batch lookup passed');

  // 5. Test stats
  console.log('\n--- 5. Testing directory stats ---');
  const stats = await getGlobalBirthdaysStats();
  console.log('Directory stats:', stats);
  if (stats.totalCount < 1) {
    throw new Error('Stats failed');
  }
  console.log('✅ Directory stats passed');

  // Clean up test doc
  await adminDb.collection('global_birthdays').doc(testPhone).delete().catch(() => {});
  console.log('\n🧹 Test document cleaned up.');
  console.log('🎉 ALL TESTS PASSED!');
}

testGlobalBirthdays()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
