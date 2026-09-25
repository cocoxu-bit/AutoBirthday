export type AvatarCategory =
  | "sin_foto"
  | "arquetipos"
  | "anime"
  | "tipicas"
  | "chica"
  | "chico";

export interface AvatarItem {
  id: string;
  name: string;
  category: AvatarCategory;
  url: string;
}

// --- SVG Data URLs for "Sin Foto" / Default Avatars ---
export const AVATAR_NO_PHOTO_WA_LIGHT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23DFE5E7"/><circle cx="50" cy="38" r="18" fill="%23FFFFFF"/><path d="M 20 84 C 20 66, 32 58, 50 58 C 68 58, 80 66, 80 84 Z" fill="%23FFFFFF"/></svg>`;
export const AVATAR_NO_PHOTO_WA_DARK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23202C33"/><circle cx="50" cy="38" r="18" fill="%236B7780"/><path d="M 20 84 C 20 66, 32 58, 50 58 C 68 58, 80 66, 80 84 Z" fill="%236B7780"/></svg>`;
export const AVATAR_NO_PHOTO_IOS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238E8E93"/><circle cx="50" cy="38" r="17" fill="%23E5E5EA"/><path d="M 22 84 C 22 66, 34 59, 50 59 C 66 59, 78 66, 78 84 Z" fill="%23E5E5EA"/></svg>`;
export const AVATAR_QUESTION_MARK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234A5568"/><text x="50" y="68" font-family="system-ui,sans-serif" font-size="52" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">?</text></svg>`;
export const AVATAR_SOLID_EMERALD = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2300A884"/><text x="50" y="64" font-family="system-ui,sans-serif" font-size="40" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">WA</text></svg>`;

export const CURATED_AVATARS: AvatarItem[] = [
  // 1. Sin Foto / Por Defecto
  {
    id: "sin-foto-wa-light",
    name: "Silueta WhatsApp (Clásica)",
    category: "sin_foto",
    url: AVATAR_NO_PHOTO_WA_LIGHT,
  },
  {
    id: "sin-foto-wa-dark",
    name: "Silueta WhatsApp (Modo Oscuro)",
    category: "sin_foto",
    url: AVATAR_NO_PHOTO_WA_DARK,
  },
  {
    id: "sin-foto-ios",
    name: "Silueta iOS (Gris neutro)",
    category: "sin_foto",
    url: AVATAR_NO_PHOTO_IOS,
  },
  {
    id: "sin-foto-interrogacion",
    name: "Desconocido (?)",
    category: "sin_foto",
    url: AVATAR_QUESTION_MARK,
  },
  {
    id: "sin-foto-iniciales",
    name: "Iniciales WhatsApp",
    category: "sin_foto",
    url: AVATAR_SOLID_EMERALD,
  },

  // 2. Arquetipos Relatables & Familiares (No profesionales)
  {
    id: "arquetipo-padre-coche",
    name: "Padre en el coche con gafas",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-madre-sonriente",
    name: "Madre / Tía sonriente",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-abuelo",
    name: "Abuelo entrañable",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-gym-espejo",
    name: "Selfie gym espejo",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-amigos-fiesta",
    name: "Fiesta / Festival amigos",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-selfie-risas",
    name: "Selfie casual riendo",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-estudiante",
    name: "Estudiante con sudadera",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-cafe-charla",
    name: "Charla con café en terraza",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "arquetipo-tio-informal",
    name: "Tío informal de risas",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
  },

  // 3. Anime, Dibujos & Gaming
  {
    id: "anime-girl-aesthetic",
    name: "Anime Chica Retro 90s",
    category: "anime",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "anime-boy-cyberpunk",
    name: "Anime Chico Cyberpunk",
    category: "anime",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "anime-lofi-art",
    name: "Ilustración Lo-Fi Chill",
    category: "anime",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "anime-neon-glow",
    name: "Neon Glow Art",
    category: "anime",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "anime-pixel-gaming",
    name: "Pixel Art / Retro Gaming",
    category: "anime",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80",
  },

  // 4. Cosas Típicas que se Pone la Gente
  {
    id: "tipica-coche-tuning",
    name: "Coche Tuning / Deportivo",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-moto",
    name: "Moto de carretera",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-atardecer-playa",
    name: "Atardecer en la playa",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-futbol",
    name: "Balón en campo de fútbol",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-paella",
    name: "Paella de domingo",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-gato-gafas",
    name: "Gato con gafas (Meme)",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-gato-serio",
    name: "Gato serio (Meme)",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-perro-simpatico",
    name: "Perro simpático",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-corgi",
    name: "Corgi adorable",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "tipica-cafe-libro",
    name: "Café aesthetic con libro",
    category: "tipicas",
    url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=150&auto=format&fit=crop&q=80",
  },

  // 5. Chicas (Casual & Selfies)
  {
    id: "chica-laura",
    name: "Laura (Casual)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-sofia",
    name: "Sofía (Aesthetic)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-elena",
    name: "Elena (Sonriente)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-marta",
    name: "Marta (Exterior)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-andrea",
    name: "Andrea (Gafas)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-lucia",
    name: "Lucía (Rubia)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chica-paula",
    name: "Paula (Rizos)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
  },

  // 6. Chicos (Casual & Selfies)
  {
    id: "chico-carlos",
    name: "Carlos (Pádel)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-david",
    name: "David (Barba)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-alex",
    name: "Álex (Sonriente)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-pablo",
    name: "Pablo (Gorra)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-mateo",
    name: "Mateo (Surfer)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-jorge",
    name: "Jorge (Camisa casual)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-sergio",
    name: "Sergio (Casual)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&auto=format&fit=crop&q=80",
  },
];

/**
 * Returns a random avatar from the curated list, avoiding the current URL if possible.
 */
export function getRandomAvatar(currentUrl?: string): AvatarItem {
  const pool = currentUrl
    ? CURATED_AVATARS.filter((a) => a.url !== currentUrl)
    : CURATED_AVATARS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || CURATED_AVATARS[0];
}
