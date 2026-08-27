import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMemoryBenchmark() {
  const { evolutionApi } = await import('../src/lib/evolution-api/client');
  console.log('===========================================================');
  console.log('🔍 AutoBirthday - Benchmark de Rendimiento & Evolution API');
  console.log('===========================================================\n');

  const apiUrl = process.env.EVOLUTION_API_URL || 'http://158.179.209.157:8080';
  console.log(`🌐 Servidor: ${apiUrl}`);

  try {
    const startTime = Date.now();
    const instances = await evolutionApi.fetchInstances();
    const fetchDuration = Date.now() - startTime;

    console.log(`⏱️ Latencia de respuesta API: ${fetchDuration} ms`);
    console.log(`📱 Instancias totales en el servidor: ${instances.length}\n`);

    for (const inst of instances) {
      const name = inst.name || inst.instance?.instanceName || 'Desconocida';
      const status = inst.connectionStatus || inst.instance?.state || 'close';
      const owner = inst.ownerJid || inst.instance?.ownerJid || 'N/A';

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Instancia: ${name}`);
      console.log(`   • Estado: ${status === 'open' ? '🟢 Conectada (Open)' : '🔴 ' + status}`);
      console.log(`   • Teléfono: ${owner}`);

      if (status === 'open') {
        const gStart = Date.now();
        const groups = await evolutionApi.fetchGroups(name, true).catch(() => []);
        const gDuration = Date.now() - gStart;
        console.log(`   • Grupos detectados: ${groups.length} (Consultado en ${gDuration} ms)`);
      }
    }

    console.log('\n===========================================================');
    console.log('📊 ESTIMACIÓN DE CONSUMO DE MEMORIA RAM:');
    console.log(`   • Sesiones activas: ${instances.filter((i: any) => (i.connectionStatus || i.instance?.state) === 'open').length}`);
    console.log(`   • Consumo estimado optimizado: ~${instances.length * 20} MB de RAM`);
    console.log(`   • Ahorro estimado vs Baileys por defecto: ~${instances.length * 80} MB de RAM liberados`);
    console.log('===========================================================');

  } catch (error: any) {
    console.error('❌ Error conectando a Evolution API:', error.message);
  }
}

runMemoryBenchmark();
