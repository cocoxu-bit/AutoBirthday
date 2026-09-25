export interface WishExample {
  text: string;
  label: string;
}

export interface WishFaq {
  question: string;
  answer: string;
}

export interface WishSeoSlugConfig {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  relationship: 'amigo/a' | 'pareja' | 'familiar' | 'compañero/a' | 'jefe/a';
  tone: 'divertido' | 'casual' | 'emotivo' | 'formal';
  badge: string;
  targetAudience: string;
  keywords: string[];
  examples: WishExample[];
  faqs: WishFaq[];
}

export const WISH_SEO_PAGES: Record<string, WishSeoSlugConfig> = {
  'amigo-divertido': {
    slug: 'amigo-divertido',
    title: 'Felicitaciones de Cumpleaños Divertidas para Amigos | Generador IA',
    metaDescription: 'Genera felicitaciones de cumpleaños con humor, bromas e ingenio para tus amigos en WhatsApp. Gratis, sin registro y en 3 segundos con IA.',
    h1: 'Felicitaciones de Cumpleaños Divertidas para Amigos',
    subtitle: 'Elige el nivel de humor, añade alguna anécdota y deja que la inteligencia artificial redacte la felicitación perfecta para enviar por WhatsApp.',
    relationship: 'amigo/a',
    tone: 'divertido',
    badge: 'Humor & Amistad 🍻',
    targetAudience: 'Amigos cercanos, colegas de fiesta y grupos de WhatsApp',
    keywords: [
      'felicitaciones divertidas amigos',
      'mensajes de cumpleaños graciosos para amigos',
      'frases de cumpleaños con humor whatsapp',
      'felicitar cumpleaños amigo gracioso'
    ],
    examples: [
      {
        label: 'Humor desenfadado',
        text: '¡Feliz cumpleaños, fiera! 🎂🎉 Te haces más viejo, pero tranquilo: la resaca dura más, aunque la fiesta sigue mereciendo la pena. ¡Invítate a algo hoy!'
      },
      {
        label: 'Broma de la edad',
        text: '¡Muchas felicidades! 🥳 Menos mal que los años te sientan mejor que a la mayoría, porque si no ya estaríamos buscando residencia. ¡Disfruta a tope, crack!'
      },
      {
        label: 'Cómplice y alegre',
        text: '¡Feliz cumple, compañero de batallas! 🍻 Que cumplas muchos más y que yo los vea para seguir recordándote lo viejo que eres. ¡Un abrazo enorme!'
      }
    ],
    faqs: [
      {
        question: '¿Cómo puedo felicitar a un amigo de forma graciosa por WhatsApp?',
        answer: 'Lo mejor es combinar un tono de complicidad con alguna referencia desenfadada sobre su edad o una anécdota compartida. Nuestro generador con IA te permite incluir esos detalles para que suene 100% natural.'
      },
      {
        question: '¿Es gratis generar felicitaciones para amigos?',
        answer: 'Sí, puedes generar todas las variaciones que quieras totalmente gratis y copiarlas directamente a WhatsApp con un solo clic.'
      }
    ]
  },

  'novia-romantica': {
    slug: 'novia-romantica',
    title: 'Mensajes Románticos de Cumpleaños para tu Novia | Generador IA',
    metaDescription: 'Crea mensajes de cumpleaños románticos, tiernos y emotivos para tu novia. Personalízalo con IA en segundos para enviarlo por WhatsApp.',
    h1: 'Mensajes Románticos de Cumpleaños para tu Novia',
    subtitle: 'Expresa todo lo que sientes con una felicitación tierna, auténtica y conmovedora diseñada a medida para ella con inteligencia artificial.',
    relationship: 'pareja',
    tone: 'emotivo',
    badge: 'Amor & Romanticismo ❤️',
    targetAudience: 'Novias, parejas y personas especiales',
    keywords: [
      'mensajes de cumpleaños para mi novia',
      'felicitaciones romanticas novia',
      'frases de cumpleaños para mi pareja amor',
      'dedicatorias de cumpleaños para ella'
    ],
    examples: [
      {
        label: 'Romántico y profundo',
        text: '¡Feliz cumpleaños, mi amor! ❤️✨ Gracias por llenar mi vida de tanta luz y risas. Celebrarte hoy es mi mayor alegría. ¡Te quiero con locura!'
      },
      {
        label: 'Tierno y cómplice',
        text: 'Felicidades a la persona que alegra todos mis días. 🎂🌹 Que este nuevo año te traiga todo lo bonito que te mereces. ¡Hoy lo celebramos juntos!'
      },
      {
        label: 'Emotivo y especial',
        text: '¡Muy feliz cumpleaños, princesa! 💖 Cada momento a tu lado es un regalo, pero hoy el regalo eres tú para el mundo. ¡A disfrutar de tu día!'
      }
    ],
    faqs: [
      {
        question: '¿Qué le puedo escribir a mi novia por su cumpleaños?',
        answer: 'Un mensaje memorable combina agradecimiento por los momentos compartidos, admiración hacia ella y un deseo sincero para su futuro año. La IA de AutoBirthday lo redacta evitando tópicos fríos.'
      },
      {
        question: '¿Puedo personalizar el mensaje con nuestro apodo o anécdota?',
        answer: 'Sí, simplemente introduce su apodo o detalle especial en el campo de anécdota y la felicitación se adaptará a vuestro vínculo.'
      }
    ]
  },

  'pareja-emotiva': {
    slug: 'pareja-emotiva',
    title: 'Mensajes de Cumpleaños Emotivos para tu Pareja | AutoBirthday',
    metaDescription: 'Dedicatorias y mensajes de cumpleaños sinceros y emotivos para tu novio, novia o cónyuge. Generador gratuito con IA listo para WhatsApp.',
    h1: 'Mensajes de Cumpleaños Emotivos para tu Pareja',
    subtitle: 'Palabras sinceras y llenas de sentimiento para recordarle a tu pareja lo importante que es en tu vida en su día más especial.',
    relationship: 'pareja',
    tone: 'emotivo',
    badge: 'Amor Sincero 💑',
    targetAudience: 'Parejas, novios, novias, maridos y esposas',
    keywords: [
      'mensajes de cumpleaños para mi pareja',
      'felicitaciones de cumpleaños emotivas novio',
      'dedicatorias cariñosas de cumpleaños pareja',
      'frases de amor para cumpleaños'
    ],
    examples: [
      {
        label: 'Sentimiento puro',
        text: '¡Feliz cumpleaños, amor de mi vida! ❤️ Qué suerte la mía poder celebrar a tu lado una vuelta más al sol. Gracias por ser mi refugio y mi mejor aventura.'
      },
      {
        label: 'Compañerismo y amor',
        text: '¡Muchísimas felicidades, cariño! 🎂🥂 No hay nadie en el mundo con quien prefiera compartir el camino. Hoy te toca pedir todos los deseos.'
      }
    ],
    faqs: [
      {
        question: '¿Cómo escribir un mensaje de cumpleaños sincero para mi pareja?',
        answer: 'Céntrate en el agradecimiento por vuestro día a día juntos y en lo que admiras de su personalidad. La IA de AutoBirthday te ayuda a encontrar las palabras justas.'
      }
    ]
  },

  'jefe-formal': {
    slug: 'jefe-formal',
    title: 'Felicitaciones de Cumpleaños Formales para tu Jefe | Generador IA',
    metaDescription: 'Modelos de mensajes de felicitación de cumpleaños profesionales, cordiales y respetuosos para tu jefe o superior en WhatsApp o correo.',
    h1: 'Felicitaciones Profesionales y Formales para tu Jefe',
    subtitle: 'El tono exacto entre respeto profesional, cordialidad y buenos deseos corporativos sin caer en excesos de confianza ni frialdad.',
    relationship: 'jefe/a',
    tone: 'formal',
    badge: 'Profesional & Corporativo 👔',
    targetAudience: 'Jefes, directores, managers y superiores de empresa',
    keywords: [
      'felicitacion cumpleaños jefe formal',
      'mensajes de cumpleaños profesionales para superiores',
      'como felicitar a tu jefe por whatsapp',
      'frases de cumpleaños corporativas'
    ],
    examples: [
      {
        label: 'Respetuoso y cordial',
        text: 'Estimado/a, le deseo un muy feliz cumpleaños. 🎂 Que este nuevo año venga cargado de éxitos personales y profesionales. Un cordial saludo.'
      },
      {
        label: 'Agradecimiento y liderazgo',
        text: '¡Feliz cumpleaños! Es un placer formar parte de su equipo y contar con su liderazgo diario. Le deseo un magnífico día de celebración.'
      },
      {
        label: 'Breve y distinguido',
        text: 'Muchas felicidades en su día. Que disfrute de una excelente jornada rodeado de los suyos y un año repleto de nuevos logros. 🥂'
      }
    ],
    faqs: [
      {
        question: '¿Cuál es el tono adecuado para felicitar a un jefe por WhatsApp?',
        answer: 'Debe ser cortés, sobrio y respetuoso, utilizando el tratamiento formal si en vuestra empresa es la norma, o un tono profesional cercano si el ambiente es más relajado.'
      }
    ]
  },

  'hermano-gracioso': {
    slug: 'hermano-gracioso',
    title: 'Frases de Cumpleaños con Humor para Hermanos | Generador IA',
    metaDescription: 'Felicitaciones de cumpleaños graciosas, irónicas y cariñosas para hermanos y hermanas. Redáctalas con IA y compártelas en WhatsApp.',
    h1: 'Frases de Cumpleaños con Humor para Hermanos',
    subtitle: 'La dosis perfecta de piques fraternales, bromas familiares y cariño honesto para celebrar el cumpleaños de tu hermano o hermana.',
    relationship: 'familiar',
    tone: 'divertido',
    badge: 'Hermanos & Piques 🤜🤛',
    targetAudience: 'Hermanos, hermanas, mellizos y familiares directos',
    keywords: [
      'felicitaciones graciosas para hermano',
      'frases chistosas cumpleaños hermano',
      'mensajes divertidos para mi hermana cumpleaños',
      'bromas cumpleaños hermanos whatsapp'
    ],
    examples: [
      {
        label: 'Broma fraternal',
        text: '¡Feliz cumpleaños al segundo hijo favorito de nuestros padres! 😂🎂 Sabes que te quiero un montón, pero hoy te toca pagar la ronda.'
      },
      {
        label: 'Pique cariñoso',
        text: '¡Muchas felicidades, hermano! 🥳 Menos mal que tienes a alguien tan guapo y listo en la familia para compensar. ¡Pásalo genial, crack!'
      },
      {
        label: 'Nostálgico y cómico',
        text: '¡Feliz cumple! Otro año más sobreviviendo a nuestras batallas de la infancia. Que sigas cumpliendo años con esa misma cara de pillo. ¡Un abrazo!'
      }
    ],
    faqs: [
      {
        question: '¿Qué poner en una felicitación para un hermano?',
        answer: 'Una combinación de humor con referencias a vuestra infancia o piques divertidos suele ser la fórmula ganadora. La IA puede incluir anécdotas de vuestros recuerdos.'
      }
    ]
  },

  'madre-emotiva': {
    slug: 'madre-emotiva',
    title: 'Mensajes Cariñosos y Emotivos de Cumpleaños para Mamá | IA',
    metaDescription: 'Dedicatorias de cumpleaños profundas, llenas de amor y gratitud para tu madre. Generador de mensajes con IA listos para WhatsApp.',
    h1: 'Mensajes Cariñosos y Emotivos de Cumpleaños para Mamá',
    subtitle: 'Dedicatorias que llegan al corazón para agradecerle todo su cariño, dedicación y amor incondicional en su día más especial.',
    relationship: 'familiar',
    tone: 'emotivo',
    badge: 'Amor de Madre 💐',
    targetAudience: 'Madres, mamás y abuelas',
    keywords: [
      'felicitaciones de cumpleaños para mama emotivas',
      'mensajes bonitos cumpleaños madre',
      'dedicatorias cariñosas para mama whatsapp',
      'frases de amor para el cumpleaños de mi madre'
    ],
    examples: [
      {
        label: 'Agradecimiento puro',
        text: '¡Feliz cumpleaños, mamá! 🌸❤️ No hay palabras en el mundo para agradecerte todo lo que haces por mí cada día. Eres el corazón de nuestra familia. ¡Te quiero infinito!'
      },
      {
        label: 'Tierno y protector',
        text: '¡Muchas felicidades a la mejor madre del universo! 🎂✨ Que hoy te dejes mimar como te mereces. Gracias por tu paciencia, tu luz y tu amor incondicional.'
      }
    ],
    faqs: [
      {
        question: '¿Cómo escribirle una felicitación bonita a mi madre?',
        answer: 'Haz hincapié en el agradecimiento y el impacto positivo que tiene en tu vida. Las palabras honestas y cariñosas son las que más emocionan a una madre.'
      }
    ]
  },

  'cunado-humor': {
    slug: 'cunado-humor',
    title: 'Felicitaciones Graciosas de Cumpleaños para Cuñados | AutoBirthday',
    metaDescription: 'Frases de cumpleaños ingeniosas, divertidas y con chispa para cuñados y cuñadas. Crea la felicitación perfecta para el grupo de WhatsApp.',
    h1: 'Felicitaciones Graciosas de Cumpleaños para Cuñados',
    subtitle: 'El equilibrio maestro entre la broma clásica de cuñado y el buen rollo familiar para triunfar en el grupo de WhatsApp.',
    relationship: 'familiar',
    tone: 'divertido',
    badge: 'Modo Cuñado Activado 🍷',
    targetAudience: 'Cuñados, cuñadas y familiares políticos',
    keywords: [
      'felicitaciones cuñado graciosas',
      'frases de cumpleaños para cuñados con humor',
      'mensajes divertidos para cuñados whatsapp',
      'chistes de cumpleaños para cuñado'
    ],
    examples: [
      {
        label: 'Clásico de cuñados',
        text: '¡Feliz cumpleaños, cuñado! 🍷🎂 Que pases un día de lujo y que hoy te dejen dar todas las lecciones de política y fútbol que quieras. ¡A disfrutar!'
      },
      {
        label: 'Buen rollo familiar',
        text: '¡Muchas felicidades! 🥳 Menos mal que entraste en la familia para darle un poco de emoción a las comidas de los domingos. ¡Un abrazo grande!'
      }
    ],
    faqs: [
      {
        question: '¿Cómo felicitar a un cuñado sin ser aburrido?',
        answer: 'Un toque de ironía cariñosa sobre su rol en las reuniones familiares o sus aficiones siempre rompe el hielo y arranca una sonrisa.'
      }
    ]
  },

  'amiga-especial': {
    slug: 'amiga-especial',
    title: 'Felicitaciones Bonitas y Emotivas para tu Mejor Amiga | IA',
    metaDescription: 'Mensajes de cumpleaños cariñosos, especiales e inolvidables para tu mejor amiga. Generador con inteligencia artificial gratuito para WhatsApp.',
    h1: 'Felicitaciones Bonitas y Especiales para tu Mejor Amiga',
    subtitle: 'Celebra su amistad incondicional con un mensaje único que refleje todas vuestras risas, secretos y momentos inolvidables.',
    relationship: 'amigo/a',
    tone: 'emotivo',
    badge: 'Mejores Amigas 👭',
    targetAudience: 'Mejores amigas, confidentes y compañeras de vida',
    keywords: [
      'felicitaciones bonitas mejor amiga',
      'mensajes emotivos de cumpleaños para una amiga',
      'frases para felicitar a mi mejor amiga por whatsapp',
      'dedicatorias cariñosas amiga cumpleaños'
    ],
    examples: [
      {
        label: 'Amistad verdadera',
        text: '¡Feliz cumpleaños a mi persona favorita! 💖🎂 Gracias por estar siempre, por cada risa hasta llorar y por entenderme sin hablar. ¡Te mereces el mundo entero!'
      },
      {
        label: 'Lleno de energía',
        text: '¡Muchísimas felicidades, amiga del alma! ✨🥂 Que este año brilles todavía más fuerte y alcances todo lo que sueñas. ¡Hoy lo damos todo!'
      }
    ],
    faqs: [
      {
        question: '¿Qué le puedo escribir a mi mejor amiga por su cumpleaños?',
        answer: 'Combina complicidad, recuerdos de vuestras risas y un deseo sincero de seguir compartiendo años juntos. Nuestra IA sabe capturar ese tono íntimo.'
      }
    ]
  },

  'companero-trabajo': {
    slug: 'companero-trabajo',
    title: 'Frases de Cumpleaños para Compañeros de Trabajo | Generador IA',
    metaDescription: 'Mensajes de cumpleaños cercanos y distendidos para compañeros de trabajo. Ideales para WhatsApp o Slack sin caer en formalismos excesivos.',
    h1: 'Frases de Cumpleaños para Compañeros de Trabajo',
    subtitle: 'El tono casual y cordial perfecto para felicitar a quien comparte oficina o turnos contigo todos los días.',
    relationship: 'compañero/a',
    tone: 'casual',
    badge: 'Compañeros de Oficina ☕',
    targetAudience: 'Compañeros de oficina, colegas de proyecto y equipos de trabajo',
    keywords: [
      'felicitaciones cumpleaños compañero de trabajo',
      'mensajes de cumpleaños para colegas de oficina',
      'frases para felicitar a un compañero de trabajo whatsapp',
      'felicitacion cumpleaños trabajo informal'
    ],
    examples: [
      {
        label: 'Casual de oficina',
        text: '¡Feliz cumpleaños! ☕🎂 Que pases un día genial y que hoy la jornada laboral se pase volando. ¡A celebrarlo luego como se merece!'
      },
      {
        label: 'Con humor de café',
        text: '¡Muchas felicidades! 🎉 Gracias por hacer las mañanas de reuniones mucho más llevaderas. ¡Que disfrutes al máximo de tu día!'
      }
    ],
    faqs: [
      {
        question: '¿Cómo felicitar a un compañero de trabajo de manera informal?',
        answer: 'Mantén un tono simpático y relajado, deseándole que disfrute del día y bromeando con que el trabajo puede esperar hoy.'
      }
    ]
  },

  'padre-emotivo': {
    slug: 'padre-emotivo',
    title: 'Mensajes de Cumpleaños de Agradecimiento para Papá | Generador IA',
    metaDescription: 'Felicitaciones de cumpleaños emotivas, llenas de orgullo y gratitud para tu padre. Genera un mensaje inolvidable para WhatsApp.',
    h1: 'Mensajes de Cumpleaños de Agradecimiento para Papá',
    subtitle: 'Palabras sinceras de orgullo y gratitud para el hombre que siempre ha sido tu guía, apoyo y ejemplo a seguir.',
    relationship: 'familiar',
    tone: 'emotivo',
    badge: 'Orgullo de Padre 👔',
    targetAudience: 'Padres, papás y figuras paternas',
    keywords: [
      'mensajes de cumpleaños para papa emotivos',
      'felicitaciones bonitas padre cumpleaños',
      'frases de agradecimiento cumpleaños papa',
      'dedicatorias cariñosas para mi padre whatsapp'
    ],
    examples: [
      {
        label: 'Agradecimiento y orgullo',
        text: '¡Feliz cumpleaños, papá! 🎂💙 Gracias por tu paciencia infinita, tus consejos y por ser siempre mi mayor ejemplo. Qué orgullo tenerte en mi vida.'
      },
      {
        label: 'Cariñoso y cercano',
        text: '¡Muchísimas felicidades, jefe de la casa! 🥂 Que pases un día fantástico y que sigas con esa energía y sabiduría que te hace único. ¡Te quiero un montón!'
      }
    ],
    faqs: [
      {
        question: '¿Qué decirle a un padre en su cumpleaños?',
        answer: 'Un padre valora especialmente el reconocimiento a su esfuerzo y los recuerdos de los momentos vividos juntos. Nuestra IA crea dedicatorias respetuosas y muy emotivas.'
      }
    ]
  }
};

export function getWishSeoConfig(slug: string): WishSeoSlugConfig | undefined {
  return WISH_SEO_PAGES[slug];
}

export function getAllWishSlugs(): string[] {
  return Object.keys(WISH_SEO_PAGES);
}

/**
 * Generates JSON-LD Schema.org structured data for Google Rich Results.
 * Includes SoftwareApplication (free tool) + FAQPage for rich search snippets.
 */
export function generateWishJsonLd(config?: WishSeoSlugConfig, canonicalUrl?: string) {
  const currentUrl = canonicalUrl || 'https://autobirthday.com/felicitaciones';
  const appName = config ? `${config.h1} — AutoBirthday` : 'Generador de Felicitaciones de Cumpleaños con IA';
  const description = config?.metaDescription || 'Crea felicitaciones de cumpleaños originales y personalizadas con inteligencia artificial para enviar por WhatsApp.';

  const schemas: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: appName,
      url: currentUrl,
      description,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      creator: {
        '@type': 'Organization',
        name: 'AutoBirthday',
        url: 'https://autobirthday.com',
      },
    },
  ];

  if (config && config.faqs && config.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: config.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return schemas;
}
