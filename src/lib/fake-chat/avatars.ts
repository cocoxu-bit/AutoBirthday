export interface AvatarItem {
  id: string;
  name: string;
  category: 'chica' | 'chico' | 'divertido';
  url: string;
}

export const CURATED_AVATARS: AvatarItem[] = [
  // Chicas
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
  {
    id: "chica-carmen",
    name: "Carmen (Elegante)",
    category: "chica",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  // Chicos
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
    name: "Jorge (Jefe)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-lucas",
    name: "Lucas (Amigo)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "chico-sergio",
    name: "Sergio (Casual)",
    category: "chico",
    url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&auto=format&fit=crop&q=80",
  },
  // Divertidos / Mascotas / Estilo
  {
    id: "divertido-gato",
    name: "Gato Curioso",
    category: "divertido",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "divertido-perro",
    name: "Perro Simpático",
    category: "divertido",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "divertido-corgi",
    name: "Corgi Adorable",
    category: "divertido",
    url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "divertido-cafe",
    name: "Café Aesthetic",
    category: "divertido",
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=80",
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
