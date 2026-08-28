import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { evolutionApi } from '../src/lib/evolution-api/client';

async function testSpecific() {
  const numberToTest = '34603494678';
  const instanceName = `autocumple-test-${Date.now()}`;
  console.log('Testing number:', numberToTest, 'on instance:', instanceName);

  try {
    const createRes = await evolutionApi.createInstance(instanceName, 'https://autobirthday.vercel.app/api/webhooks/evolution');
    console.log('Instance created:', createRes);

    const pairResult = await evolutionApi.getPairingCode(instanceName, numberToTest);
    console.log('Pairing result:', pairResult);

    await evolutionApi.deleteInstance(instanceName).catch(() => {});
  } catch (err: any) {
    console.error('Error:', err);
  }
}

testSpecific();
