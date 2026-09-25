/**
 * AutoBirthday - Social Listening & Intent Hijacking Automation
 * 
 * Monitoriza Reddit en tiempo real (Pullpush + RSS sin coste ni APIs de pago),
 * cualifica dolores reales de cumpleaños con Google Gemini y redacta
 * respuestas 100% humanas y empáticas enviando una alerta instantánea
 * por WhatsApp al administrador con el texto listo para copiar y pegar.
 * 
 * Uso:
 *   - Modo One-Shot:   npx tsx scripts/social-listener.ts
 *   - Modo Prueba:     npx tsx scripts/social-listener.ts --test
 *   - Modo Daemon:     npx tsx scripts/social-listener.ts --watch --interval 15
 *   - Modo Dry-Run:    npx tsx scripts/social-listener.ts --test --dry-run
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { evolutionApi } from '../src/lib/evolution-api/client';

// ==========================================
// 1. Tipos e Interfaces
// ==========================================

export interface RawSocialPost {
  id: string;
  platform: 'reddit';
  subreddit: string;
  title: string;
  content: string;
  author: string;
  url: string;
  createdAt: Date;
}

export interface LeadQualification {
  isValidLead: boolean;
  leadScore: 'CRITICO' | 'ALTO' | 'MEDIO';
  targetPerson: string;
  painSummary: string;
  suggestedReply: string;
  reasoning: string;
}

export interface SeenLeadCacheRecord {
  id: string;
  title: string;
  url: string;
  detectedAt: string;
  score: string;
  notified: boolean;
}

// ==========================================
// 2. Configuración y Constantes
// ==========================================

const ADMIN_PHONE = process.env.ADMIN_PHONE || '34606513672';
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'seen-leads.json');

const KEYWORDS_ES = [
  'se me olvidó el cumple',
  'se me olvido el cumple',
  'se me pasó el cumpleaños',
  'se me paso el cumple',
  'casi se me pasa felicitar',
  'olvidé el cumpleaños',
  'olvide el cumpleaños',
  'olvidé el cumple',
  'olvide el cumple',
  'recordar cumpleaños',
  'se me olvida felicitar',
];

const TARGET_SUBREDDITS = [
  'AskSpain',
  'es',
  'esConversacion',
  'preguntaleareddit',
  'Desahogo',
  'argentina',
  'mexico',
  'Colombia',
  'relationships',
];

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 AutoBirthdayListener/1.0';

// ==========================================
// 3. Sistema de Deduplicación Local
// ==========================================

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadSeenLeads(): Record<string, SeenLeadCacheRecord> {
  ensureCacheDir();
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSeenLead(record: SeenLeadCacheRecord) {
  ensureCacheDir();
  const cache = loadSeenLeads();
  cache[record.id] = record;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function isLeadSeen(id: string): boolean {
  const cache = loadSeenLeads();
  return Boolean(cache[id]);
}

// ==========================================
// 4. Ingestión y Scraping de Reddit
// ==========================================

/**
 * Consulta la API pública y gratuita de Pullpush para buscar publicaciones
 */
async function fetchPullpushSubmissions(query: string): Promise<RawSocialPost[]> {
  try {
    const url = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&size=8`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data.map((item: any): RawSocialPost => ({
      id: item.id || `pp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      platform: 'reddit',
      subreddit: item.subreddit || 'reddit',
      title: item.title || '',
      content: item.selftext || '',
      author: item.author ? `u/${item.author}` : 'u/anonimo',
      url: item.full_link || (item.permalink ? `https://reddit.com${item.permalink}` : `https://reddit.com/r/${item.subreddit}`),
      createdAt: item.created_utc ? new Date(item.created_utc * 1000) : new Date(),
    }));
  } catch (err: any) {
    return [];
  }
}

/**
 * Consulta la API pública de Pullpush para buscar comentarios con dolor activo
 */
async function fetchPullpushComments(query: string): Promise<RawSocialPost[]> {
  try {
    const url = `https://api.pullpush.io/reddit/search/comment/?q=${encodeURIComponent(query)}&size=8`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data.map((item: any): RawSocialPost => ({
      id: item.id || `pp_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      platform: 'reddit',
      subreddit: item.subreddit || 'reddit',
      title: `Comentario en r/${item.subreddit || 'reddit'}`,
      content: item.body || '',
      author: item.author ? `u/${item.author}` : 'u/anonimo',
      url: item.permalink ? `https://reddit.com${item.permalink}` : `https://reddit.com/r/${item.subreddit}`,
      createdAt: item.created_utc ? new Date(item.created_utc * 1000) : new Date(),
    }));
  } catch (err: any) {
    return [];
  }
}

/**
 * Lee feeds RSS/Atom de subreddits específicos (sin autenticación)
 */
async function fetchSubredditRss(subreddit: string): Promise<RawSocialPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new/.rss`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);
    const results: RawSocialPost[] = [];

    for (const entry of entries) {
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const linkMatch = entry.match(/<link href="([^"]+)"/);
      const authorMatch = entry.match(/<author><name>([^<]+)<\/name>/);
      const idMatch = entry.match(/<id>([^<]+)<\/id>/);
      const contentMatch = entry.match(/<content type="html">([\s\S]*?)<\/content>/);

      const title = titleMatch ? titleMatch[1] : '';
      const rawContent = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, ' ').slice(0, 1000) : '';

      // Check if entry contains birthday keywords
      const fullText = `${title} ${rawContent}`.toLowerCase();
      const hasKeyword = [
        'cumple', 'cumpleaños', 'cumpleanos', 'felicitar', 'olvid', 'birthday',
      ].some(k => fullText.includes(k));

      if (hasKeyword && linkMatch) {
        results.push({
          id: idMatch ? idMatch[1] : `rss_${subreddit}_${Date.now()}`,
          platform: 'reddit',
          subreddit,
          title,
          content: rawContent.trim(),
          author: authorMatch ? authorMatch[1] : 'u/anonimo',
          url: linkMatch[1],
          createdAt: new Date(),
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Recopila publicaciones de todas las fuentes
 */
async function harvestSocialPosts(): Promise<RawSocialPost[]> {
  const allPosts: RawSocialPost[] = [];
  const seenIds = new Set<string>();

  // 1. Pullpush keyword queries (muestreo de palabras clave)
  const sampledKeywords = KEYWORDS_ES.slice(0, 4);
  for (const kw of sampledKeywords) {
    const [subPosts, comPosts] = await Promise.all([
      fetchPullpushSubmissions(kw),
      fetchPullpushComments(kw),
    ]);

    for (const p of [...subPosts, ...comPosts]) {
      if (!seenIds.has(p.id) && !isLeadSeen(p.id)) {
        seenIds.add(p.id);
        allPosts.push(p);
      }
    }
  }

  // 2. Subreddit RSS feeds
  const sampledSubs = TARGET_SUBREDDITS.slice(0, 3);
  for (const sub of sampledSubs) {
    const rssPosts = await fetchSubredditRss(sub);
    for (const p of rssPosts) {
      if (!seenIds.has(p.id) && !isLeadSeen(p.id)) {
        seenIds.add(p.id);
        allPosts.push(p);
      }
    }
  }

  return allPosts;
}

// ==========================================
// 5. Cualificación Semántica con Gemini
// ==========================================

async function qualifyLeadWithGemini(post: RawSocialPost): Promise<LeadQualification | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY no configurada. Omitiendo cualificación semántica.');
    return null;
  }

  const prompt = `Eres el analista de Growth y Social Listening de AutoBirthday.com.
Tu misión es evaluar publicaciones de Reddit para detectar personas que olvidaron o casi olvidan el cumpleaños de un ser querido (pareja, madre, familiar, amigo, compañero de trabajo).

CRITERIOS DE FILTRADO:
1. "isValidLead": true SOLO si la persona expresa un problema REAL de haber olvidado, estar a punto de olvidar, o tener problemas constantes para recordar y felicitar cumpleaños a tiempo.
2. Descarta memes, noticias de famosos, chistes, spam o felicitaciones genéricas sin dolor real ("isValidLead: false").
3. Si es un lead válido:
   - "leadScore": "CRITICO" (pareja / madre / crisis actual), "ALTO" (amigo cercano / familiar), "MEDIO" (dudas generales de cómo recordar).
   - "targetPerson": A quién olvidó (ej: "Novia / Pareja", "Madre", "Mejor amigo", "Compañero").
   - "painSummary": Resumen conciso de 1 frase del problema.
   - "suggestedReply": Redacta una respuesta de usuario a usuario de Reddit:
     * REGLA ABSOLUTA: CERO tono comercial, CERO ventas agresivas, NADA de sonar como un bot o una empresa.
     * Tono: Empático, humano, comprensivo, como un colega que comparte cómo salió él de un problema idéntico.
     * Empatiza primero con la situación ("Uff menudo marrón...", "A mí me pasaba todo el tiempo con mi novia...").
     * Da un consejo realista para compensar o arreglar la situación hoy mismo.
     * Menciona casual y orgánicamente que para no volver a liarla tú usas autobirthday.com que manda el WhatsApp directo en el momento exacto.

DATOS DEL POST A EVALUAR:
- Plataforma: Reddit (${post.subreddit})
- Título: ${post.title}
- Texto: ${post.content || '(Sin texto adicional)'}
- Autor: ${post.author}
- URL: ${post.url}

Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:
{
  "isValidLead": boolean,
  "leadScore": "CRITICO" | "ALTO" | "MEDIO",
  "targetPerson": string,
  "painSummary": string,
  "suggestedReply": string,
  "reasoning": string
}`;

  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
  ];

  const ai = new GoogleGenAI({ apiKey });

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) continue;

      const parsed: LeadQualification = JSON.parse(rawText);
      return parsed;
    } catch (err: any) {
      // Try next model if rate-limited or unavailable
      continue;
    }
  }

  console.warn(`⚠️ Todos los modelos de Gemini fallaron para post ${post.id}`);
  return null;
}

// ==========================================
// 6. Notificación WhatsApp al Administrador
// ==========================================

async function sendWhatsAppAlert(post: RawSocialPost, qualification: LeadQualification): Promise<boolean> {
  try {
    // 1. Localizar la instancia activa de Evolution API
    const instances = await evolutionApi.fetchInstances();
    const openInstance = instances.find(
      (inst: any) => (inst.connectionStatus || inst.instance?.status || inst.status) === 'open'
    );

    const instanceName = openInstance 
      ? (openInstance.name || openInstance.instance?.instanceName)
      : 'autocumple-lguuencbRUP5dhi79hqZLBtJEST2';

    const urgencyEmoji = 
      qualification.leadScore === 'CRITICO' ? '🚨🔥' :
      qualification.leadScore === 'ALTO' ? '⚡' : '📌';

    const shortContent = post.content 
      ? (post.content.length > 220 ? `${post.content.slice(0, 220)}...` : post.content)
      : post.title;

    const message = `${urgencyEmoji} *¡NUEVO LEAD DETECTADO EN REDES!* 🎯

📌 *Comunidad:* r/${post.subreddit} (Reddit)
👤 *Usuario:* ${post.author}
🔥 *Prioridad:* ${qualification.leadScore} (${qualification.targetPerson})

📝 *Post Original:*
"${post.title}"
_${shortContent}_

🔗 *Enlace directo al hilo:*
${post.url}

───────────────────────
💬 *Sugerencia de Respuesta (100% Humana):*
"${qualification.suggestedReply}"
───────────────────────
💡 *Consejo:* Publica la respuesta desde tu perfil personal de Reddit de forma natural y cercana para máxima conversión.`;

    console.log(`📲 Enviando alerta de WhatsApp a ${ADMIN_PHONE} usando instancia "${instanceName}"...`);
    const res = await evolutionApi.sendText(instanceName, ADMIN_PHONE, message);
    console.log(`✅ ¡Alerta de WhatsApp entregada con éxito!`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error al enviar alerta de WhatsApp:`, error?.message || error);
    return false;
  }
}

// ==========================================
// 7. Pipeline de Procesamiento
// ==========================================

async function processPost(post: RawSocialPost, dryRun = false): Promise<boolean> {
  console.log(`\n🔍 Analizando publicación: [r/${post.subreddit}] "${post.title.slice(0, 60)}..." por ${post.author}`);

  // 1. Evaluar con Gemini
  const qualification = await qualifyLeadWithGemini(post);
  if (!qualification) {
    console.log(`⏩ No se pudo evaluar el post.`);
    return false;
  }

  if (!qualification.isValidLead) {
    console.log(`⚪ Descartado: No representa un dolor real de cumpleaños (${qualification.reasoning || 'Filtro semántico'})`);
    // Guardar como visto para no reprocesar
    saveSeenLead({
      id: post.id,
      title: post.title,
      url: post.url,
      detectedAt: new Date().toISOString(),
      score: 'DESCARTADO',
      notified: false,
    });
    return false;
  }

  console.log(`🎯 ¡LEAD CUALIFICADO! Score: ${qualification.leadScore} | Afectado: ${qualification.targetPerson}`);
  console.log(`💡 Sugerencia humana:\n"${qualification.suggestedReply}"`);

  let notified = false;
  if (!dryRun) {
    notified = await sendWhatsAppAlert(post, qualification);
  } else {
    console.log(`🧪 [DRY-RUN] Notificación WhatsApp simulada.`);
    notified = true;
  }

  // Guardar en caché local
  saveSeenLead({
    id: post.id,
    title: post.title,
    url: post.url,
    detectedAt: new Date().toISOString(),
    score: qualification.leadScore,
    notified,
  });

  return true;
}

// ==========================================
// 8. Modo Prueba / Test Mock
// ==========================================

function getMockTestPost(): RawSocialPost {
  return {
    id: `test_lead_${Date.now()}`,
    platform: 'reddit',
    subreddit: 'AskSpain',
    title: 'Se me olvidó el cumpleaños de mi novia y ahora está enfadadísima conmigo',
    content: 'Llevamos 2 años juntos y ayer fue su cumple. Entre el trabajo y un examen que tenía hoy se me fue completamente la cabeza y no la felicité hasta hoy por la mañana cuando me di cuenta. Me siento fatal y no sé cómo compensarla. ¿Algún consejo para arreglarlo?',
    author: 'u/carlos_98',
    url: 'https://www.reddit.com/r/AskSpain/comments/test_lead_cumpleanos',
    createdAt: new Date(),
  };
}

// ==========================================
// 9. Ejecutor Principal (CLI)
// ==========================================

async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch') || args.includes('-w');
  const isTest = args.includes('--test') || args.includes('-t') || args.includes('--mock');
  const isDryRun = args.includes('--dry-run');

  const intervalArgIdx = args.findIndex(a => a === '--interval' || a === '-i');
  const intervalMinutes = intervalArgIdx !== -1 && args[intervalArgIdx + 1] 
    ? parseInt(args[intervalArgIdx + 1], 10) 
    : 15;

  console.log(`=======================================================`);
  console.log(`🚀 AutoBirthday Social Listening & Intent Hijacking`);
  console.log(`=======================================================`);
  console.log(`📱 Admin Phone:    ${ADMIN_PHONE}`);
  console.log(`⚙️ Modo de ejecución: ${isTest ? 'TEST / SIMULACIÓN' : isWatch ? `DAEMON (Cada ${intervalMinutes} min)` : 'ONE-SHOT'}`);
  if (isDryRun) console.log(`🧪 Dry-run activo (sin envío real de WhatsApp)`);
  console.log(`-------------------------------------------------------`);

  if (isTest) {
    console.log(`🧪 Ejecutando prueba de flujo completo con caso realista...`);
    const mockPost = getMockTestPost();
    await processPost(mockPost, isDryRun);
    console.log(`\n🎉 Prueba finalizada con éxito.`);
    return;
  }

  const runIteration = async () => {
    console.log(`\n⏱️ [${new Date().toLocaleTimeString('es-ES')}] Iniciando escaneo de Reddit...`);
    const posts = await harvestSocialPosts();
    console.log(`📦 Se encontraron ${posts.length} publicaciones no vistas.`);

    let leadsDetected = 0;
    for (const post of posts) {
      const isLead = await processPost(post, isDryRun);
      if (isLead) leadsDetected++;
      // Pequeña pausa defensiva entre llamadas a Gemini
      await new Promise(r => setTimeout(r, 1200));
    }

    console.log(`\n📊 Resumen del escaneo: ${posts.length} evaluados, ${leadsDetected} leads cualificados.`);
  };

  // Primera ejecución
  await runIteration();

  // Si está en modo watch, planificar cron loop
  if (isWatch) {
    console.log(`\n⏳ Esperando ${intervalMinutes} minutos para el próximo escaneo... (Ctrl+C para salir)`);
    setInterval(async () => {
      try {
        await runIteration();
        console.log(`\n⏳ Próximo escaneo en ${intervalMinutes} minutos...`);
      } catch (e: any) {
        console.error('Error en ciclo de monitorización:', e?.message || e);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

main().catch(err => {
  console.error('Error fatal en Social Listener:', err);
  process.exit(1);
});
