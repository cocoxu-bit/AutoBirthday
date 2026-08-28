import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { evolutionApi } from '../src/lib/evolution-api/client';

async function test() {
  const testInstance = 'test-pairing-debug';
  try {
    await evolutionApi.createInstance(testInstance, 'https://autobirthday.vercel.app/api/webhooks/evolution').catch(() => {});
    console.log('Testing pairing code for instance:', testInstance);

    const res1 = await evolutionApi.getPairingCode(testInstance, '34600123456');
    console.log('Response from getPairingCode:', JSON.stringify(res1, null, 2));

    // Also test without ?number vs with ?number
    const resRaw = await (evolutionApi as any).request(`/instance/connect/${testInstance}?number=34600123456`, { method: 'GET' });
    console.log('Raw response:', JSON.stringify(resRaw, null, 2));

    await evolutionApi.deleteInstance(testInstance).catch(() => {});
  } catch (e: any) {
    console.error('Error:', e);
  }
}

test();
