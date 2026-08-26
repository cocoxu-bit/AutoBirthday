import 'dotenv/config';

interface CronJobPayload {
  job: {
    url: string;
    enabled: boolean;
    title: string;
    saveResponses: boolean;
    schedule: {
      timezone: string;
      hours: number[];
      minutes: number[];
      mdays: number[];
      months: number[];
      wdays: number[];
      expiresAt: number;
    };
    requestMethod: number; // 0 = GET
    extendedData?: {
      headers?: Record<string, string>;
    };
  };
}

async function setupCronJobs() {
  console.log('====================================================');
  console.log('🤖 AutoBirthday - Configuración de Cron Jobs v2');
  console.log('====================================================\n');

  const cronApiKey = process.env.CRONJOB_API_KEY || 'EEltqVyMI+8qdEzGqZ0YQlGvH3NsKYtUdxT7wJhySaM=';
  const cronSecret = process.env.CRON_SECRET || 'autobirthday-cron-secret-local-2026';
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://autobirthday.vercel.app').replace(/\/$/, '');

  if (!cronApiKey) {
    console.error('❌ Error: No se ha proporcionado CRONJOB_API_KEY en las variables de entorno.');
    process.exit(1);
  }

  console.log(`📌 App Base URL: ${appUrl}`);
  console.log(`🔑 Secret Configurado: ${cronSecret.substring(0, 8)}...`);
  console.log(`🌐 Cron-Job.org API Key: ${cronApiKey.substring(0, 10)}...\n`);

  const headers = {
    'Authorization': `Bearer ${cronApiKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Check existing jobs to avoid duplicate titles
  let existingJobs: any[] = [];
  try {
    const listRes = await fetch('https://api.cron-job.org/jobs', { headers });
    if (listRes.ok) {
      const data = await listRes.json();
      existingJobs = data.jobs || [];
    }
  } catch (e: any) {
    console.warn('⚠️ No se pudieron listar jobs existentes:', e.message);
  }

  const jobsToCreate: CronJobPayload[] = [
    {
      job: {
        url: `${appUrl}/api/cron/daily-scan`,
        enabled: true,
        title: 'AutoBirthday - Escaneo Diario de Cumpleaños (07:00 Madrid)',
        saveResponses: true,
        schedule: {
          timezone: 'Europe/Madrid',
          hours: [7],
          minutes: [0],
          mdays: [-1],
          months: [-1],
          wdays: [-1],
          expiresAt: 0,
        },
        requestMethod: 0, // GET
        extendedData: {
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'User-Agent': 'AutoBirthday-CronJob/1.0',
          },
        },
      },
    },
    {
      job: {
        url: `${appUrl}/api/cron/send-wishes`,
        enabled: true,
        title: 'AutoBirthday - Despacho de Felicitaciones (Cada 5 min)',
        saveResponses: true,
        schedule: {
          timezone: 'Europe/Madrid',
          hours: [-1],
          minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
          mdays: [-1],
          months: [-1],
          wdays: [-1],
          expiresAt: 0,
        },
        requestMethod: 0, // GET
        extendedData: {
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'User-Agent': 'AutoBirthday-CronJob/1.0',
          },
        },
      },
    },
  ];

  for (const jobPayload of jobsToCreate) {
    const title = jobPayload.job.title;
    console.log(`🚀 Creando Cron: "${title}"...`);
    console.log(`   URL: ${jobPayload.job.url}`);
    console.log(`   Horario: ${jobPayload.job.schedule.hours.join(',')}h | Minutos: ${jobPayload.job.schedule.minutes.join(',')}`);

    // Check if an existing job has the exact same title and delete or update
    const matchingExisting = existingJobs.find((j: any) => j.title === title || j.url === jobPayload.job.url);
    if (matchingExisting) {
      console.log(`   ℹ️ Encontrado job previo con ID ${matchingExisting.jobId}. Actualizando/Recreando...`);
      try {
        await fetch(`https://api.cron-job.org/jobs/${matchingExisting.jobId}`, {
          method: 'DELETE',
          headers,
        });
      } catch (_) {}
    }

    try {
      const res = await fetch('https://api.cron-job.org/jobs', {
        method: 'PUT',
        headers,
        body: JSON.stringify(jobPayload),
      });

      const responseData = await res.json().catch(() => ({}));

      if (res.status === 200 || res.status === 201) {
        const createdJobId = responseData.jobId || responseData.job?.jobId || 'OK';
        console.log(`   ✅ ¡Creado con éxito! ID: ${createdJobId}`);
        console.log(`   🔗 Monitor: https://console.cron-job.org/jobs/${createdJobId}\n`);
      } else {
        console.error(`   ❌ Error ${res.status}:`, JSON.stringify(responseData));
      }
    } catch (err: any) {
      console.error(`   ❌ Error en petición:`, err.message);
    }

    // Rate limit delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }

  console.log('====================================================');
  console.log('🎉 ¡Todos los Cron Jobs han sido configurados con éxito!');
  console.log('Consola de Control: https://console.cron-job.org');
  console.log('====================================================');
}

setupCronJobs();
