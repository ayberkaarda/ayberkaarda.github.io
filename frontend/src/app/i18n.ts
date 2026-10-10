export const LANGS = ['tr', 'en', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_NAMES: Record<Lang, string> = {
  tr: 'Türkçe',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
};

export const LOCALE: Record<Lang, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
};

export interface UiStrings {
  skip: string;
  nav: { experience: string; projects: string; skills: string; education: string; contact: string };
  fact: {
    role: string;
    location: string;
    availability: string;
    contact: string;
  };
  allProjects: string;
  back: string;
  source: string;
  inProgress: string;
  sections: {
    context: string;
    built: string;
    highlights: string;
    stack: string;
    links: string;
  };
  contactIntro: string;
  emailMe: string;
  metaDescription: string;
  switchLang: string;
  menuLabel: string;
  hero: { cta: { email: string; projects: string } };
  menu: { open: string; close: string };
  lang: { label: string };
  contact: { title: string };
  motion: { reduce: string };
  /** Short count label next to a skill, e.g. 3 -> '3 projects'. */
  project: { prev: string; next: string; original: string };
}

export const ui: Record<Lang, UiStrings> = {
  en: {
    skip: 'Skip to content',
    nav: {
      experience: 'Experience',
      projects: 'Projects',
      skills: 'Skills',
      education: 'Education',
      contact: 'Contact',
    },
    fact: {
      role: 'Role',
      location: 'Based in',
      availability: 'Availability',
      contact: 'Contact',
    },
    allProjects: 'All projects',
    back: 'Back',
    source: 'View on GitHub',
    inProgress: 'In progress',
    sections: {
      context: 'Context',
      built: 'What it is',
      highlights: 'Highlights',
      stack: 'Stack',
      links: 'Links',
    },
    contactIntro: 'Open to junior full-stack roles and internships. The quickest way to reach me is email.',
    emailMe: 'Send an email',
    metaDescription:
      'Ayberk Arda, junior full-stack developer in Istanbul. Java Spring Boot, Laravel, React and Angular. Experience and projects.',
    switchLang: 'Language',
    menuLabel: 'Sections',
    hero: { cta: { email: 'Email', projects: 'View projects' } },
    menu: { open: 'Menu', close: 'Close' },
    lang: { label: 'Choose language' },
    contact: { title: 'Let’s talk' },
    motion: { reduce: 'Reduce motion' },
    project: { prev: 'Previous project', next: 'Next project', original: 'Open full-size image' },
  },
  tr: {
    skip: 'İçeriğe geç',
    nav: {
      experience: 'Deneyim',
      projects: 'Projeler',
      skills: 'Yetenekler',
      education: 'Eğitim',
      contact: 'İletişim',
    },
    fact: {
      role: 'Rol',
      location: 'Konum',
      availability: 'Müsaitlik',
      contact: 'İletişim',
    },
    allProjects: 'Tüm projeler',
    back: 'Geri',
    source: 'GitHub’da incele',
    inProgress: 'Geliştiriliyor',
    sections: {
      context: 'Bağlam',
      built: 'Nedir',
      highlights: 'Öne çıkanlar',
      stack: 'Teknolojiler',
      links: 'Bağlantılar',
    },
    contactIntro:
      'Junior full-stack pozisyonları ve staj fırsatları için açığım. Bana en hızlı e-postayla ulaşabilirsin.',
    emailMe: 'E-posta gönder',
    metaDescription:
      'Ayberk Arda, İstanbul’da junior full-stack yazılım geliştirici. Java Spring Boot, Laravel, React ve Angular. Deneyim ve projeler.',
    switchLang: 'Dil',
    menuLabel: 'Bölümler',
    hero: { cta: { email: 'E-posta', projects: 'Projeleri incele' } },
    menu: { open: 'Menü', close: 'Kapat' },
    lang: { label: 'Dil seç' },
    contact: { title: 'Konuşalım' },
    motion: { reduce: 'Hareketi azalt' },
    project: { prev: 'Önceki proje', next: 'Sonraki proje', original: 'Görseli tam boyutta aç' },
  },
  fr: {
    skip: 'Aller au contenu',
    nav: {
      experience: 'Expérience',
      projects: 'Projets',
      skills: 'Compétences',
      education: 'Formation',
      contact: 'Contact',
    },
    fact: {
      role: 'Poste',
      location: 'Lieu',
      availability: 'Disponibilité',
      contact: 'Contact',
    },
    allProjects: 'Tous les projets',
    back: 'Retour',
    source: 'Voir sur GitHub',
    inProgress: 'En cours',
    sections: {
      context: 'Contexte',
      built: 'De quoi il s’agit',
      highlights: 'Points forts',
      stack: 'Technologies',
      links: 'Liens',
    },
    contactIntro:
      'Ouvert aux postes de développeur full-stack junior et aux stages. Le moyen le plus rapide de me joindre est l’e-mail.',
    emailMe: 'Envoyer un e-mail',
    metaDescription:
      'Ayberk Arda, développeur full-stack junior à Istanbul. Java Spring Boot, Laravel, React et Angular. Expérience et projets.',
    switchLang: 'Langue',
    menuLabel: 'Sections',
    hero: { cta: { email: 'E-mail', projects: 'Voir les projets' } },
    menu: { open: 'Menu', close: 'Fermer' },
    lang: { label: 'Choisir la langue' },
    contact: { title: 'Parlons-en' },
    motion: { reduce: 'Réduire les animations' },
    project: { prev: 'Projet précédent', next: 'Projet suivant', original: 'Ouvrir l’image en taille réelle' },
  },
  de: {
    skip: 'Zum Inhalt springen',
    nav: {
      experience: 'Erfahrung',
      projects: 'Projekte',
      skills: 'Kenntnisse',
      education: 'Ausbildung',
      contact: 'Kontakt',
    },
    fact: {
      role: 'Rolle',
      location: 'Standort',
      availability: 'Verfügbarkeit',
      contact: 'Kontakt',
    },
    allProjects: 'Alle Projekte',
    back: 'Zurück',
    source: 'Auf GitHub ansehen',
    inProgress: 'In Arbeit',
    sections: {
      context: 'Kontext',
      built: 'Worum es geht',
      highlights: 'Highlights',
      stack: 'Technologien',
      links: 'Links',
    },
    contactIntro:
      'Offen für Junior-Full-Stack-Stellen und Praktika. Am schnellsten erreichen Sie mich per E-Mail.',
    emailMe: 'E-Mail senden',
    metaDescription:
      'Ayberk Arda, Junior Full-Stack-Entwickler in Istanbul. Java Spring Boot, Laravel, React und Angular. Erfahrung und Projekte.',
    switchLang: 'Sprache',
    menuLabel: 'Abschnitte',
    hero: { cta: { email: 'E-Mail', projects: 'Projekte ansehen' } },
    menu: { open: 'Menü', close: 'Schließen' },
    lang: { label: 'Sprache wählen' },
    contact: { title: 'Sprechen wir' },
    motion: { reduce: 'Bewegung reduzieren' },
    project: { prev: 'Vorheriges Projekt', next: 'Nächstes Projekt', original: 'Bild in Originalgröße öffnen' },
  },
};

export function isLang(value: string | undefined): value is Lang {
  return !!value && (LANGS as readonly string[]).includes(value);
}

export function formatMonth(year: number, month: number, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}
