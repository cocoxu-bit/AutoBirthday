/**
 * Generador de historias verticales 9:16 (1080x1920) para Instagram Stories.
 * Diseñado para ejecutarse en background sin necesidad de modales ni previews.
 */

export interface StoryGeneratorOptions {
  username: string;
  displayName?: string;
  collectorUrl: string;
}

export async function generateStoryBlob(options: StoryGeneratorOptions): Promise<Blob | null> {
  if (typeof window === 'undefined') return null;

  const { username, displayName = 'Lucas', collectorUrl } = options;
  const shortUrl = collectorUrl.replace(/^https?:\/\//, '');

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Fondo con degradado moderno violeta a índigo oscuro
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
  bgGradient.addColorStop(0, '#1e1b4b');
  bgGradient.addColorStop(0.45, '#581c87');
  bgGradient.addColorStop(1, '#030712');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Luces ambientales radiales
  const radialGlow = ctx.createRadialGradient(540, 700, 50, 540, 700, 600);
  radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, 1080, 1920);

  // 3. Confeti y destellos festivos
  const confettiColors = ['#f472b6', '#fbbf24', '#60a5fa', '#34d399', '#c084fc', '#ffffff'];
  let seed = 42;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 45; i++) {
    const x = pseudoRandom() * 1080;
    const y = pseudoRandom() * 1920;
    const radius = 4 + pseudoRandom() * 12;
    const color = confettiColors[Math.floor(pseudoRandom() * confettiColors.length)];

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35 + pseudoRandom() * 0.45;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 4. Pastilla superior (Header)
  const pillText = '🎉 CALENDARIO DE CUMPLEAÑOS';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const pillMetrics = ctx.measureText(pillText);
  const pillWidth = pillMetrics.width + 80;
  const pillHeight = 70;
  const pillX = (1080 - pillWidth) / 2;
  const pillY = 140;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 35);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(pillText, 540, pillY + 47);

  // 5. Saludo personal
  const firstName = displayName.split(' ')[0] || displayName;
  ctx.font = '800 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`¡Amigos de ${firstName}! 🎂`, 540, 290);

  // 6. Titular de impacto
  ctx.font = '900 76px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#fef08a'; // Amarillo pastel festivo
  ctx.fillText('¡No me dejes sin tu cumple!', 540, 390);

  ctx.font = '600 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Estoy creando mi calendario', 540, 465);
  ctx.fillText('para acordarme de todos 🥳', 540, 520);

  // 7. Tarjeta blanca central con llamada a la acción
  const cardW = 880;
  const cardH = 760;
  const cardX = (1080 - cardW) / 2;
  const cardY = 590;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 25;

  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 50);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Icono festivo central
  ctx.font = '110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🎂', 540, cardY + 140);

  // Pregunta principal
  ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('¿Cuándo es tu cumpleaños?', 540, cardY + 230);

  ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Solo tardas 5 segundos en poner tu fecha', 540, cardY + 290);

  // Sticker de enlace simulado estilo Instagram Stories
  const stickerW = 760;
  const stickerH = 130;
  const stickerX = (1080 - stickerW) / 2;
  const stickerY = cardY + 360;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(stickerX, stickerY, stickerW, stickerH, 35);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();
  ctx.restore();

  ctx.font = '800 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`🔗 ${shortUrl}`, 540, stickerY + 80);

  // Instrucción bajo el sticker
  ctx.font = '800 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText('Toca el sticker o entra al enlace 👆', 540, cardY + 575);

  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('¡Prometo felicitarte por WhatsApp este año! 📲', 540, cardY + 645);

  // 8. Footer discreto
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('AutoBirthday · Sincronización inteligente de cumpleaños', 540, 1660);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}
