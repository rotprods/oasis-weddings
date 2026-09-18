export type EditorialSection = {
  eyebrow?: string;
  title: string;
  body: string;
};

export type PageDefinition = {
  slug: string;
  navLabel?: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: EditorialSection[];
  ctaLabel: string;
  ctaHref: string;
  evidenceGated?: boolean;
};

export const pageRegistry = {
  "fotografia-de-boda": {
    slug: "fotografia-de-boda",
    navLabel: "Fotografía",
    eyebrow: "Fotografía de boda",
    title: "Fotografías con memoria, ritmo y verdad.",
    description: "Fotografía de boda de OASIS WEDDINGS: una aproximación editorial, humana y narrativa.",
    intro:
      "La fotografía no debería convertir una boda en una sesión interminable. La estructura de esta página está preparada para enseñar historias completas, criterio visual y entregables reales sin inventar pruebas que todavía no estén documentadas.",
    sections: [
      {
        eyebrow: "Enfoque",
        title: "La historia antes que la pose.",
        body: "El sistema visual prioriza momentos, contexto, detalles y retratos con intención. Cuando el portfolio real entre en AssetsGraph, cada imagen podrá relacionarse con su boda, lugar, capítulo narrativo y derechos de publicación.",
      },
      {
        eyebrow: "Portfolio",
        title: "Una selección que se entiende como secuencia.",
        body: "Las galerías no serán volcados masivos. Se construirán como capítulos editoriales con jerarquía, ritmo y enlaces hacia bodas reales verificadas.",
      },
    ],
    ctaLabel: "Consultar disponibilidad",
    ctaHref: "/disponibilidad/",
  },
  "video-de-boda": {
    slug: "video-de-boda",
    navLabel: "Cine",
    eyebrow: "Cine de boda",
    title: "Una película que conserve cómo se sintió.",
    description: "Cine y vídeo de boda de OASIS WEDDINGS con una arquitectura preparada para films reales y descubrimiento en vídeo.",
    intro:
      "El film se trata como una pieza principal, no como un accesorio de la fotografía. El template reserva espacio para posters, reproducción controlada, capítulos, contexto y metadatos válidos para vídeo cuando exista material publicable.",
    sections: [
      {
        eyebrow: "Narrativa",
        title: "Imagen, sonido y montaje con una sola intención.",
        body: "La experiencia final deberá demostrar el lenguaje cinematográfico con films reales, sin autoplay agresivo ni dependencias que bloqueen la carga inicial.",
      },
      {
        eyebrow: "Tecnología",
        title: "El vídeo pesa; la experiencia no tiene por qué hacerlo.",
        body: "Poster-first, carga diferida, captions cuando correspondan y métricas de reproducción forman parte del contrato técnico desde el principio.",
      },
    ],
    ctaLabel: "Consultar disponibilidad",
    ctaHref: "/disponibilidad/",
  },
  "foto-y-video-de-boda": {
    slug: "foto-y-video-de-boda",
    eyebrow: "Fotografía + cine",
    title: "Una historia, dos lenguajes, una dirección creativa.",
    description: "Servicio combinado de fotografía y cine de boda de OASIS WEDDINGS.",
    intro:
      "La página combinada está diseñada para explicar cómo fotografía y film conviven dentro de una misma cobertura sin duplicar mensajes ni crear dos experiencias desconectadas.",
    sections: [
      {
        eyebrow: "Coherencia",
        title: "Un mismo criterio desde la captura hasta la entrega.",
        body: "El contenido futuro relacionará cada boda con sus fotografías, vídeos y servicios mediante IDs estables, manteniendo una única fuente de verdad para portfolio, SEO y publicación.",
      },
    ],
    ctaLabel: "Ver disponibilidad",
    ctaHref: "/disponibilidad/",
  },
  films: {
    slug: "films",
    navLabel: "Films",
    eyebrow: "Films",
    title: "Películas para volver a entrar en el día.",
    description: "Colección de films de boda publicables de OASIS WEDDINGS.",
    intro:
      "Este índice solo mostrará películas con derechos de publicación validados. Cada film podrá enlazar con su boda, lugar, poster y metadatos de vídeo correspondientes.",
    sections: [
      {
        eyebrow: "AssetsGraph",
        title: "Cada película tendrá identidad y procedencia.",
        body: "video_id, asset_id, wedding_id, poster, duración, estado de publicación y relaciones editoriales evitan que el portfolio dependa de carpetas o enlaces sueltos.",
      },
    ],
    ctaLabel: "Explorar bodas",
    ctaHref: "/bodas/",
  },
  portfolio: {
    slug: "portfolio",
    navLabel: "Portfolio",
    eyebrow: "Portfolio",
    title: "Trabajo seleccionado. Nada de ruido.",
    description: "Portfolio editorial de fotografía y cine de OASIS WEDDINGS.",
    intro:
      "El portfolio será una vista curada sobre AssetsGraph: bodas, fotografías y films aprobados, conectados por contexto y no por una galería infinita sin jerarquía.",
    sections: [
      {
        eyebrow: "Selección",
        title: "Menos piezas, más intención.",
        body: "La arquitectura prioriza secuencias fuertes, diversidad visual real y navegación hacia casos completos. No se publicarán assets solo para rellenar espacio.",
      },
    ],
    ctaLabel: "Ver bodas reales",
    ctaHref: "/bodas/",
  },
  bodas: {
    slug: "bodas",
    navLabel: "Bodas",
    eyebrow: "Bodas reales",
    title: "Cada boda como una historia completa.",
    description: "Índice de bodas reales publicables de OASIS WEDDINGS.",
    intro:
      "El índice de bodas será la principal superficie de prueba. Una boda solo podrá aparecer cuando su registro, derechos y assets públicos pasen los gates definidos en AGENTS-DESIGN.md.",
    sections: [
      {
        eyebrow: "Modelo",
        title: "Una boda no es una carpeta.",
        body: "Cada caso vive como entidad: wedding_id, venue, localización, servicios, fotografías, films, derechos, contexto editorial y relaciones internas.",
      },
    ],
    ctaLabel: "Consultar nuestra fecha",
    ctaHref: "/disponibilidad/",
    evidenceGated: true,
  },
  "lugares-de-boda": {
    slug: "lugares-de-boda",
    navLabel: "Lugares",
    eyebrow: "Lugares de boda",
    title: "Espacios entendidos desde la imagen.",
    description: "Lugares de boda documentados por OASIS WEDDINGS a partir de experiencia y evidencia reales.",
    intro:
      "No habrá un directorio generado por palabras clave. Los lugares entrarán cuando exista experiencia, material o conocimiento verificable suficiente para aportar valor real a una pareja.",
    sections: [
      {
        eyebrow: "Evidencia local",
        title: "Luz, tiempos, recorridos y posibilidades visuales.",
        body: "Las páginas de venue podrán conectar notas verificadas, bodas realizadas allí y ejemplos reales, sin fingir conocimiento de espacios que OASIS no haya documentado.",
      },
    ],
    ctaLabel: "Consultar cobertura",
    ctaHref: "/disponibilidad/",
    evidenceGated: true,
  },
  murcia: {
    slug: "murcia",
    eyebrow: "Murcia",
    title: "Fotografía y cine de bodas en Murcia.",
    description: "Superficie local de OASIS WEDDINGS para bodas en la Región de Murcia.",
    intro:
      "Murcia es la primera superficie local del sistema. Esta página crecerá con bodas, lugares, guías y prueba original vinculada a la región, no con bloques de texto duplicados para capturar keywords.",
    sections: [
      {
        eyebrow: "Autoridad local",
        title: "La relevancia se demuestra con trabajo conectado.",
        body: "Bodas reales, lugares documentados, preguntas de planificación y relaciones editoriales construirán la señal local de forma acumulativa.",
      },
    ],
    ctaLabel: "Consultar fecha en Murcia",
    ctaHref: "/disponibilidad/",
  },
  "destination-weddings": {
    slug: "destination-weddings",
    eyebrow: "Destination weddings",
    title: "Historias que empiezan mucho antes de llegar.",
    description: "Arquitectura preparada para bodas de destino de OASIS WEDDINGS cuando exista oferta y evidencia aprobadas.",
    intro:
      "La expansión a destination weddings está contemplada en el North Star, pero esta superficie permanecerá evidence-gated hasta que la cobertura, condiciones y portfolio puedan probarse sin claims inventados.",
    sections: [
      {
        eyebrow: "Expansión",
        title: "Primero capacidad real; después posicionamiento.",
        body: "El template existe para evitar improvisación futura, no para publicar autoridad de destino antes de tenerla.",
      },
    ],
    ctaLabel: "Plantear una boda de destino",
    ctaHref: "/disponibilidad/",
    evidenceGated: true,
  },
  colecciones: {
    slug: "colecciones",
    navLabel: "Colecciones",
    eyebrow: "Colecciones",
    title: "Cobertura diseñada alrededor de la historia.",
    description: "Arquitectura comercial de colecciones de OASIS WEDDINGS, pendiente de pricing y entregables aprobados.",
    intro:
      "Esta página está preparada para explicar opciones, entregables y señales de precio únicamente cuando exista una fuente comercial aprobada. La base no inventa paquetes ni cifras.",
    sections: [
      {
        eyebrow: "Transparencia",
        title: "Sin precios ni promesas fabricadas.",
        body: "El diseño soporta anchors de precio, comparativas y FAQs, pero los datos comerciales se conectarán a una fuente durable antes de hacerse públicos.",
      },
    ],
    ctaLabel: "Pedir propuesta",
    ctaHref: "/disponibilidad/",
    evidenceGated: true,
  },
  "sobre-oasis": {
    slug: "sobre-oasis",
    navLabel: "OASIS",
    eyebrow: "Sobre OASIS",
    title: "Dirección creativa al servicio de una memoria real.",
    description: "Filosofía y enfoque creativo de OASIS WEDDINGS.",
    intro:
      "La página de marca debe explicar criterio, proceso y forma de trabajar con hechos comprobables. Hasta que el equipo y sus credenciales estén documentados, esta base evita biografías o cifras inventadas.",
    sections: [
      {
        eyebrow: "Principio",
        title: "La técnica desaparece cuando la historia funciona.",
        body: "El sistema visual está construido para que la fotografía, el film y las personas tengan más peso que los efectos o la interfaz.",
      },
    ],
    ctaLabel: "Consultar disponibilidad",
    ctaHref: "/disponibilidad/",
  },
  opiniones: {
    slug: "opiniones",
    eyebrow: "Opiniones",
    title: "Solo palabras que podamos acreditar.",
    description: "Espacio reservado para opiniones verificadas y autorizadas de clientes de OASIS WEDDINGS.",
    intro:
      "El sistema no rellena esta página con testimonios de muestra. Las opiniones aparecerán cuando exista fuente, autorización y contexto suficientes para publicarlas correctamente.",
    sections: [
      {
        eyebrow: "Prueba",
        title: "La confianza también necesita procedencia.",
        body: "Cada review podrá conservar su fuente y estado de publicación, y relacionarse con el servicio o boda correspondiente cuando sea apropiado.",
      },
    ],
    ctaLabel: "Consultar disponibilidad",
    ctaHref: "/disponibilidad/",
    evidenceGated: true,
  },
  guias: {
    slug: "guias",
    navLabel: "Guías",
    eyebrow: "Guías",
    title: "Conocimiento útil antes de la cámara.",
    description: "Guías de planificación, lugares y fotografía/cine de boda de OASIS WEDDINGS.",
    intro:
      "Las guías serán piezas originales que resuelvan preguntas reales y conecten con bodas, lugares y servicios. No se generarán artículos por volumen ni por combinaciones de keywords.",
    sections: [
      {
        eyebrow: "Knowledge moat",
        title: "Publicar solo cuando haya algo que merezca ser citado.",
        body: "Cada guía tendrá intención, entidad primaria, fuentes y enlaces internos deliberados. El objetivo es utilidad acumulativa, no content spam.",
      },
    ],
    ctaLabel: "Ver bodas reales",
    ctaHref: "/bodas/",
    evidenceGated: true,
  },
  disponibilidad: {
    slug: "disponibilidad",
    navLabel: "Disponibilidad",
    eyebrow: "Disponibilidad",
    title: "Cuéntanos qué estáis imaginando.",
    description: "Consulta de disponibilidad para fotografía y cine de boda con OASIS WEDDINGS.",
    intro:
      "La ruta de disponibilidad tiene una implementación dedicada y fail-closed: validación, privacidad, CRM e idempotencia deben estar operativos antes de aceptar un envío.",
    sections: [
      {
        eyebrow: "Conversión",
        title: "Pocas preguntas, las correctas.",
        body: "La futura integración conservará origen, campaña y landing sin introducir PII en analítica y sin duplicar leads ante reintentos.",
      },
    ],
    ctaLabel: "Volver al portfolio",
    ctaHref: "/portfolio/",
    evidenceGated: true,
  },
  gracias: {
    slug: "gracias",
    eyebrow: "Consulta recibida",
    title: "El siguiente paso debe ser igual de claro.",
    description: "Estado de confirmación de una futura consulta de disponibilidad de OASIS WEDDINGS.",
    intro:
      "La ruta de confirmación solo afirma que una consulta fue recibida cuando llega desde un envío completado. Una visita directa no simula una conversión.",
    sections: [],
    ctaLabel: "Volver al inicio",
    ctaHref: "/",
    evidenceGated: true,
  },
} satisfies Record<string, PageDefinition>;

export type TopLevelSlug = keyof typeof pageRegistry;

const dedicatedTopLevelRoutes = new Set<TopLevelSlug>(["disponibilidad", "gracias"]);

export const topLevelSlugs = Object.keys(pageRegistry).filter(
  (slug) => !dedicatedTopLevelRoutes.has(slug as TopLevelSlug),
) as TopLevelSlug[];

export function getPageDefinition(slug: string): PageDefinition | undefined {
  return pageRegistry[slug as TopLevelSlug];
}
