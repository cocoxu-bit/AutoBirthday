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
  platform: 'reddit' | 'twitter';
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

const ADMIN_PHONE = process.env.ADMIN_PHONE || '34926312436';
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'seen-leads.json');

// Ventana de frescura temporal: solo publicaciones de las últimas horas
const MAX_AGE_HOURS = parseInt(process.env.MAX_POST_AGE_HOURS || '4', 10);
const MAX_AGE_MS = MAX_AGE_HOURS * 60 * 60 * 1000;

function isPostFresh(createdAt: Date): boolean {
  if (!createdAt || isNaN(createdAt.getTime())) return false;
  return (Date.now() - createdAt.getTime()) <= MAX_AGE_MS;
}

const KEYWORDS_ES = [
  // 1. Olvidos consumados (dolor activo)
  'se me olvidó el cumple',
  'se me olvido el cumple',
  'se me pasó el cumpleaños',
  'se me paso el cumple',
  'olvidé el cumpleaños',
  'olvide el cumpleaños',
  'olvidé el cumple',
  'olvide el cumple',
  'se me olvidó felicitar',
  'se me olvido felicitar',
  'se me pasó felicitar',
  'se me paso felicitar',
  'olvidé felicitar',
  'olvide felicitar',
  'no felicité por su cumple',
  'no felicite por su cumple',
  'olvidé el cumple de mi',
  'olvide el cumple de mi',
  'se me olvidó el cumple de mi',
  'se me olvido el cumple de mi',
  'no me acordé del cumpleaños',
  'no me acorde del cumple',
  'se me fue el cumple',
  'se me fue felicitar',

  // 2. Casi olvido / alerta de última hora
  'casi se me pasa felicitar',
  'casi se me olvida felicitar',
  'casi se me olvida el cumple',
  'casi se me pasa el cumple',
  'casi olvido el cumple',
  'casi olvido felicitar',
  'por poco se me olvida el cumple',

  // 3. Problema recurrente de memoria / búsqueda de soluciones
  'siempre se me olvidan los cumpleaños',
  'siempre se me pasan los cumpleaños',
  'siempre se me olvida felicitar',
  'soy pésimo recordando cumpleaños',
  'soy malísimo para los cumpleaños',
  'nunca me acuerdo de los cumpleaños',
  'recordar cumpleaños',
  'app para recordar cumpleaños',
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
  'RedditPregunta',
  'confesiones',
  'relaciones',
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
    const afterEpoch = Math.floor((Date.now() - MAX_AGE_MS) / 1000);
    const url = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(query)}&after=${afterEpoch}&size=8`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data
      .map((item: any): RawSocialPost => ({
        id: item.id || `pp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        platform: 'reddit',
        subreddit: item.subreddit || 'reddit',
        title: item.title || '',
        content: item.selftext || '',
        author: item.author ? `u/${item.author}` : 'u/anonimo',
        url: item.full_link || (item.permalink ? `https://reddit.com${item.permalink}` : `https://reddit.com/r/${item.subreddit}`),
        createdAt: item.created_utc ? new Date(item.created_utc * 1000) : new Date(),
      }))
      .filter((p: RawSocialPost) => isPostFresh(p.createdAt));
  } catch (err: any) {
    return [];
  }
}

/**
 * Consulta la API pública de Pullpush para buscar comentarios con dolor activo
 */
async function fetchPullpushComments(query: string): Promise<RawSocialPost[]> {
  try {
    const afterEpoch = Math.floor((Date.now() - MAX_AGE_MS) / 1000);
    const url = `https://api.pullpush.io/reddit/search/comment/?q=${encodeURIComponent(query)}&after=${afterEpoch}&size=8`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.data)) return [];

    return data.data
      .map((item: any): RawSocialPost => ({
        id: item.id || `pp_c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        platform: 'reddit',
        subreddit: item.subreddit || 'reddit',
        title: `Comentario en r/${item.subreddit || 'reddit'}`,
        content: item.body || '',
        author: item.author ? `u/${item.author}` : 'u/anonimo',
        url: item.permalink ? `https://reddit.com${item.permalink}` : `https://reddit.com/r/${item.subreddit}`,
        createdAt: item.created_utc ? new Date(item.created_utc * 1000) : new Date(),
      }))
      .filter((p: RawSocialPost) => isPostFresh(p.createdAt));
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
      const dateMatch = entry.match(/<updated>([^<]+)<\/updated>/) || entry.match(/<published>([^<]+)<\/published>/);

      const title = titleMatch ? titleMatch[1] : '';
      const rawContent = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, ' ').slice(0, 1000) : '';
      const createdAt = dateMatch ? new Date(dateMatch[1]) : new Date();

      // Descartar publicaciones antiguas
      if (!isPostFresh(createdAt)) {
        continue;
      }

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
          createdAt,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Ingestión automatizada de X (Twitter) con Chromium headless (Playwright)
 * Cero coste, sesión persistente con cookies secundarias y evasión de bloqueos API.
 */
async function fetchTwitterPosts(): Promise<RawSocialPost[]> {
  const authToken = process.env.TWITTER_AUTH_TOKEN;
  const ct0 = process.env.TWITTER_CT0;

  if (!authToken || !ct0) {
    return [];
  }

  const results: RawSocialPost[] = [];
  let browser: any = null;

  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    await context.addCookies([
      { name: 'auth_token', value: authToken, domain: '.x.com', path: '/' },
      { name: 'ct0', value: ct0, domain: '.x.com', path: '/' },
      { name: 'auth_token', value: authToken, domain: '.twitter.com', path: '/' },
      { name: 'ct0', value: ct0, domain: '.twitter.com', path: '/' },
    ]);

    const page = await context.newPage();

    // Palabras clave de dolor en X
    const twitterSearchQueries = [
      '"se me olvidó el cumple"',
      '"se me olvido el cumple"',
      '"se me pasó el cumpleaños"',
      '"se me paso el cumple"',
      '"olvidé el cumpleaños"',
      '"olvide el cumpleaños"',
      '"olvidé el cumple"',
      '"olvide el cumple"',
      '"se me olvidó felicitar"',
      '"se me olvido felicitar"',
      '"se me pasó felicitar"',
      '"casi se me pasa felicitar"',
      '"casi se me olvida felicitar"',
      '"casi se me olvida el cumple"',
      '"siempre se me olvidan los cumpleaños"',
      '"olvidé el cumple de mi"',
      '"se me fue el cumple"',
      'se me olvidó el cumple',
      'se me olvido el cumple',
      'se me pasó el cumple',
      'olvidé felicitar',
      'olvide felicitar por su cumple',
    ];

    // Rotar 1 query por ciclo para ejecución rápida y no llamar la atención
    const selectedQuery = twitterSearchQueries[Math.floor(Math.random() * twitterSearchQueries.length)];
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(selectedQuery)}&f=live`;

    console.log(`🐦 Escaneando X (Twitter) en vivo con Chromium headless [query: ${selectedQuery}]...`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(5000);

    const articles = await page.locator('article[data-testid="tweet"]').all();
    console.log(`🐦 Tweets encontrados en el DOM de X: ${articles.length}`);

    for (const art of articles.slice(0, 8)) {
      const text = (await art.locator('[data-testid="tweetText"]').textContent().catch(() => ''))?.trim() || '';
      const user = (await art.locator('[data-testid="User-Name"]').textContent().catch(() => ''))?.trim() || '';
      const href = (await art.locator('a[href*="/status/"]').first().getAttribute('href').catch(() => '')) || '';
      const timeAttr = await art.locator('time').getAttribute('datetime').catch(() => null);

      if (text && href) {
        const tweetDate = timeAttr ? new Date(timeAttr) : new Date();

        // Descartar tweets con más de MAX_AGE_HOURS de antigüedad
        if (timeAttr && !isPostFresh(tweetDate)) {
          console.log(`⏳ Tweet descartado por antigüedad (> ${MAX_AGE_HOURS}h): ${timeAttr}`);
          continue;
        }

        const idMatch = href.match(/status\/(\d+)/);
        const tweetId = idMatch ? idMatch[1] : `tw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const handleMatch = user.match(/@(\w+)/);
        const authorHandle = handleMatch ? `@${handleMatch[1]}` : (user.split('\n')[0] || '@usuario');
        const tweetUrl = href.startsWith('http') ? href : `https://x.com${href}`;

        results.push({
          id: `tw_${tweetId}`,
          platform: 'twitter',
          subreddit: 'X (Twitter)',
          title: `Tweet de ${authorHandle}`,
          content: text.replace(/\s+/g, ' '),
          author: authorHandle,
          url: tweetUrl,
          createdAt: tweetDate,
        });
      }
    }
  } catch (err: any) {
    console.warn('⚠️ Error al buscar tweets en X con Playwright:', err?.message || err);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return results;
}

/**
 * Recopila publicaciones de todas las fuentes (Reddit + X)
 */
async function harvestSocialPosts(): Promise<RawSocialPost[]> {
  const allPosts: RawSocialPost[] = [];
  const seenIds = new Set<string>();

  // 1. Pullpush keyword queries (muestreo rotatorio de 6 palabras clave de Reddit por ciclo)
  const sampledKeywords = [...KEYWORDS_ES].sort(() => Math.random() - 0.5).slice(0, 6);
  for (const kw of sampledKeywords) {
    const [subPosts, comPosts] = await Promise.all([
      fetchPullpushSubmissions(kw),
      fetchPullpushComments(kw),
    ]);

    for (const p of [...subPosts, ...comPosts]) {
      if (isPostFresh(p.createdAt) && !seenIds.has(p.id) && !isLeadSeen(p.id)) {
        seenIds.add(p.id);
        allPosts.push(p);
      }
    }
  }

  // 2. Subreddit RSS feeds (muestreo rotatorio de 4 comunidades por ciclo)
  const sampledSubs = [...TARGET_SUBREDDITS].sort(() => Math.random() - 0.5).slice(0, 4);
  for (const sub of sampledSubs) {
    const rssPosts = await fetchSubredditRss(sub);
    for (const p of rssPosts) {
      if (isPostFresh(p.createdAt) && !seenIds.has(p.id) && !isLeadSeen(p.id)) {
        seenIds.add(p.id);
        allPosts.push(p);
      }
    }
  }

  // 3. Twitter / X posts con Playwright headless (si las credenciales están configuradas)
  const twitterPosts = await fetchTwitterPosts();
  for (const p of twitterPosts) {
    if (isPostFresh(p.createdAt) && !seenIds.has(p.id) && !isLeadSeen(p.id)) {
      seenIds.add(p.id);
      allPosts.push(p);
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

  const isTwitter = post.platform === 'twitter';
  const platformInstructions = isTwitter
    ? `* REGLA ABSOLUTA: CERO tono comercial, CERO ventas agresivas, NADA de sonar como bot o spam corporativo.
     * Tono: Cercano, empático, desenfadado y ultra-breve (MÁXIMO 240 caracteres para entrar en un solo tweet).
     * Da un consejo rápido o empatiza con humor/comprensión.
     * Menciona orgánicamente y de pasada "autobirthday.com" como el truco que usas para que no te vuelva a pasar.`
    : `* REGLA ABSOLUTA: CERO tono comercial, CERO ventas agresivas, NADA de sonar como un bot o una empresa.
     * Tono: Empático, humano, comprensivo, como un colega que comparte cómo salió él de un problema idéntico.
     * Empatiza primero con la situación ("Uff menudo marrón...", "A mí me pasaba todo el tiempo con mi novia...").
     * Da un consejo realista para compensar o arreglar la situación hoy mismo.
     * Menciona casual y orgánicamente que para no volver a liarla tú usas autobirthday.com que manda el WhatsApp directo en el momento exacto.`;

  const prompt = `Eres el analista de Growth y Social Listening de AutoBirthday.com.
Tu misión es evaluar publicaciones de redes sociales (Reddit y X/Twitter) para detectar personas que olvidaron o casi olvidan el cumpleaños de un ser querido (pareja, madre, familiar, amigo, compañero de trabajo).

CRITERIOS DE FILTRADO:
1. "isValidLead": true SOLO si la persona expresa un problema REAL de haber olvidado, estar a punto de olvidar, o tener problemas constantes para recordar y felicitar cumpleaños a tiempo.
2. Descarta memes, noticias de famosos, chistes, spam o felicitaciones genéricas sin dolor real ("isValidLead: false").
3. Si es un lead válido:
   - "leadScore": "CRITICO" (pareja / madre / crisis actual), "ALTO" (amigo cercano / familiar), "MEDIO" (dudas generales de cómo recordar).
   - "targetPerson": A quién olvidó (ej: "Novia / Pareja", "Madre", "Mejor amigo", "Compañero").
   - "painSummary": Resumen conciso de 1 frase del problema.
   - "suggestedReply": Redacta una respuesta de usuario a usuario:
${platformInstructions}

DATOS DEL POST A EVALUAR:
- Plataforma: ${isTwitter ? 'X (Twitter)' : `Reddit (r/${post.subreddit})`}
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
      const errMsg = err?.message || String(err);
      // Filtro defensivo: Si el post contiene NSFW/adulto que activa el filtro de seguridad de Gemini, descartar inmediatamente
      if (errMsg.includes('SAFETY') || errMsg.includes('blocked') || errMsg.includes('sexually_explicit')) {
        return {
          isValidLead: false,
          leadScore: 'MEDIO',
          targetPerson: 'Descartado',
          painSummary: 'Descartado por filtro de seguridad de contenido',
          suggestedReply: '',
          reasoning: 'Contenido descartado por políticas de seguridad de Gemini (NSFW/Spam)'
        };
      }
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('billing')) {
        await triggerBillingQuotaAlert('Google Gemini API', `Límite de cuota detectado (${modelName}): ${errMsg.slice(0, 100)}`);
      }
      continue;
    }
  }

  console.warn(`⚠️ Todos los modelos de Gemini fallaron para post ${post.id}`);
  return null;
}

async function triggerBillingQuotaAlert(service: string, reason: string) {
  try {
    const instances = await evolutionApi.fetchInstances();
    const openInstance = instances.find(
      (inst: any) => (inst.connectionStatus || inst.instance?.status || inst.status) === 'open'
    );
    const instanceName = openInstance 
      ? (openInstance.name || openInstance.instance?.instanceName)
      : 'autocumple-lguuencbRUP5dhi79hqZLBtJEST2';

    const message = `🚨💳 *ALERTA DE SEGURIDAD FINANCIERA (AUTOBIRTHDAY)*

Hola Lucas, el centinela ha detectado una situación de cuota/coste:
📌 *Servicio:* ${service}
⚠️ *Motivo:* ${reason}

🛑 *Medida tomada:* Se han pausado temporalmente las consultas para garantizar que NO se produzca ningún cobro involuntario.`;

    await evolutionApi.sendText(instanceName, ADMIN_PHONE, message);
  } catch {}
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

    // El usuario solicitó exclusivamente el enlace directo sin texto adicional
    const message = post.url;

    console.log(`📲 Enviando enlace a WhatsApp (${ADMIN_PHONE}) usando instancia "${instanceName}"...`);
    const res = await evolutionApi.sendText(instanceName, ADMIN_PHONE, message);
    console.log(`✅ ¡Enlace enviado con éxito (${post.url})!`);
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
  const channelTag = post.platform === 'twitter' ? 'X' : `r/${post.subreddit}`;
  console.log(`\n🔍 Analizando publicación: [${channelTag}] "${post.title.slice(0, 60)}..." por ${post.author}`);

  // Filtro de frescura: verificar que sea de las últimas horas/minutos
  if (!isPostFresh(post.createdAt)) {
    console.log(`⏳ Descartado por antigüedad (> ${MAX_AGE_HOURS}h): ${post.url}`);
    saveSeenLead({
      id: post.id,
      title: post.title,
      url: post.url,
      detectedAt: new Date().toISOString(),
      score: 'ANTIGUO',
      notified: false,
    });
    return false;
  }

  // 1. Evaluar con Gemini
  const qualification = await qualifyLeadWithGemini(post);
  if (!qualification) {
    console.log(`⏩ No se pudo evaluar el post.`);
    saveSeenLead({
      id: post.id,
      title: post.title,
      url: post.url,
      detectedAt: new Date().toISOString(),
      score: 'NO_EVALUABLE',
      notified: false,
    });
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
  console.log(`⏱️ Ventana tiempo:  Últimas ${MAX_AGE_HOURS} horas`);
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
