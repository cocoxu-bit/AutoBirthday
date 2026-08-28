import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { evolutionApi } from '../src/lib/evolution-api/client';

async function testPartner() {
  const partnerInst = 'autocumple-ZogZrWkHAmOKV6Nr4XAPh4CGjpO2';
  console.log('1. Cleaning up stuck instance:', partnerInst);
  await evolutionApi.deleteInstance(partnerInst).catch(() => {});

  console.log('2. Creating fresh authenticated instance...');
  await evolutionApi.createInstance(partnerInst, 'https://autobirthday.vercel.app/api/webhooks/evolution');

  console.log('3. Requesting pairing code for 34603494678...');
  const res = await evolutionApi.getPairingCode(partnerInst, '34603494678');
  console.log('Pairing Code Result:', res);
}

testPartner();
