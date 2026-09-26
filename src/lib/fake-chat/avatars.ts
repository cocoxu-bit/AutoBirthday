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

  // 2. Arquetipos Relatables & Familiares (No profesionales / calle / selfies)
  {
    id: "arquetipo-padre-coche",
    name: "Padre en el coche con gafas",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-madre-sonriente",
    name: "Madre / Tía sonriente",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-abuelo-campo",
    name: "Abuelo entrañable en el campo",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-abuela-risas",
    name: "Abuela de risas en el jardín",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-gym-espejo",
    name: "Selfie gym espejo",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-amigas-fiesta",
    name: "Fiesta / Festival dos amigas",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-amigos-canas",
    name: "Amigos de cañas en terraza",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-padre-hija",
    name: "Padre e hija sonriendo",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-pareja-viaje",
    name: "Pareja selfie en viaje",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1651546904620-9a9bc628a1e4?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-chico-montana",
    name: "Chico senderista montaña",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-estudiante-campus",
    name: "Estudiante en campus universitario",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "arquetipo-tio-hawaiana",
    name: "Tío informal camisa de flores",
    category: "arquetipos",
    url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&crop=faces&q=80",
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

  // 5. Chicas (Selfies cotidianos, exteriores, terrazas, sol, cero estudio)
  {
    id: "chica-selfie-gafas-sol",
    name: "Selfie gafas de sol en terraza",
    category: "chica",
    url: "https://images.unsplash.com/photo-1582152629442-4a864303fb96?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-risa-espontanea",
    name: "Risa espontánea al aire libre",
    category: "chica",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-cazadora-calle",
    name: "Selfie calle cazadora vaquera",
    category: "chica",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-pecas-gafas",
    name: "Foto natural con pecas y gafas",
    category: "chica",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-cafeteria-movil",
    name: "En cafetería mirando móvil",
    category: "chica",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-rizos-sol",
    name: "Pelo rizado al atardecer",
    category: "chica",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-gorra-playa",
    name: "Gorra en la playa relajada",
    category: "chica",
    url: "https://images.unsplash.com/photo-1616428362406-4ffd9fcbf023?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-gorro-invierno",
    name: "Gorro de lana de viaje",
    category: "chica",
    url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-golden-hour",
    name: "Golden hour verano natural",
    category: "chica",
    url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-bronceada-mar",
    name: "Bronceada en el mar de vacaciones",
    category: "chica",
    url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-sonrisa-amplia",
    name: "Sonrisa amplia con tirantes",
    category: "chica",
    url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-trenzas-sonrisa",
    name: "Trenzas sonriendo al sol",
    category: "chica",
    url: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-gafas-redondas",
    name: "Gafas redondas e informal",
    category: "chica",
    url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-pelo-corto-casual",
    name: "Pelo corto risueña",
    category: "chica",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chica-morena-casual",
    name: "Chica morena con cazadora",
    category: "chica",
    url: "https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=150&auto=format&fit=crop&crop=faces&q=80",
  },

  // 6. Chicos (Selfies coche, terrazas, deporte, playa, informales, cero estudio)
  {
    id: "chico-selfie-barba-sol",
    name: "Selfie barba y sol de tarde",
    category: "chico",
    url: "https://images.unsplash.com/photo-1695927621677-ec96e048dce2?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-selfie-sonrisa",
    name: "Selfie sonriendo espontáneo",
    category: "chico",
    url: "https://images.unsplash.com/photo-1551847812-f815b31ae67c?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-gafas-sudadera",
    name: "Con gafas y sudadera en la calle",
    category: "chico",
    url: "https://images.unsplash.com/photo-1603112579965-e24332cc453a?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-balcon-mar",
    name: "En balcón con vistas al mar",
    category: "chico",
    url: "https://images.unsplash.com/photo-1560768999-913eb6b14955?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-gorro-lana",
    name: "Gorro de lana de risas",
    category: "chico",
    url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-playa-relax",
    name: "En la playa bañador y relax",
    category: "chico",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-camiseta-padel",
    name: "Camiseta de pádel sudada",
    category: "chico",
    url: "https://images.unsplash.com/photo-1558374805-cc55cedfb7f5?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-padre-gafas-sol",
    name: "Padre 40s gafas de sol",
    category: "chico",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-rizos-calle",
    name: "Joven con rizos despeinados",
    category: "chico",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-barba-gafas-bar",
    name: "Barba y gafas tomando algo",
    category: "chico",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-polo-verano",
    name: "Polo de verano en terraza",
    category: "chico",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-universitario",
    name: "Estudiante de relax con amigos",
    category: "chico",
    url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-selfie-coche",
    name: "Chico selfie en el coche",
    category: "chico",
    url: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&crop=faces&q=80",
  },
  {
    id: "chico-camisa-flores",
    name: "Chico camisa hawaiana informal",
    category: "chico",
    url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&crop=faces&q=80",
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
