import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { evolutionApi } from '../src/lib/evolution-api/client';

async function listAll() {
  try {
    const instances = await evolutionApi.fetchInstances();
    console.log('Total instances on server:', instances.length);
    instances.forEach((inst: any) => {
      console.log('Instance:', {
        name: inst.name || inst.instance?.instanceName,
        status: inst.connectionStatus || inst.instance?.status || inst.status,
      });
    });
  } catch (err: any) {
    console.error('Error fetching instances:', err);
  }
}

listAll();
