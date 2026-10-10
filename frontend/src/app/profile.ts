import type { Lang } from './i18n';

export const person = {
  name: 'Ayberk Arda',
  email: 'ayberk20arda@gmail.com',
  github: 'https://github.com/ayberkaarda',
  linkedin: 'https://www.linkedin.com/in/ayberk-arda/',
};

interface Job {
  role: string;
  org: string;
  place: string;
  /** [year, month] */
  from: [number, number];
  to: [number, number];
  points: string[];
}

interface School {
  degree: string;
  org: string;
  place: string;
  from: [number, number];
  to: [number, number];
  points: string[];
}

interface Profile {
  title: string;
  tagline: string;
  intro: string;
  location: string;
  availability: string;
  jobs: Job[];
  schools: School[];
  skills: { group: string; items: string[] }[];
}

export const profile: Record<Lang, Profile> = {
  en: {
    title: 'Junior Full-Stack Developer',
    tagline: 'I build full-stack web applications with Java Spring Boot, Laravel, React and Angular.',
    intro:
      'Junior full-stack developer with a background in the Java ecosystem and modern web technologies. I have worked on SEO, REST API development and AI-integrated projects, and I like documenting architectural decisions and covering module boundaries with tests.',
    location: 'Istanbul, Türkiye',
    availability: 'Graduated June 2026; open to junior full-stack roles and internships',
    jobs: [
      {
        role: 'Software Development Intern',
        org: 'Kron',
        place: 'Sarıyer, Istanbul',
        from: [2026, 7],
        to: [2026, 8],
        points: [
          'Developed and integrated REST APIs into project workflows using Java Spring Boot.',
          'Gained experience in backend architectures that follow enterprise software development standards.',
        ],
      },
      {
        role: 'Web Developer & SEO Specialist',
        org: 'Booking For Health',
        place: 'Beylikdüzü, Istanbul',
        from: [2023, 12],
        to: [2024, 6],
        points: [
          'Handled SEO-focused content management, web design and technical support for multiple websites.',
          'Increased website visibility through social media management and digital marketing tools.',
        ],
      },
    ],
    schools: [
      {
        degree: 'Associate Degree in Computer Programming',
        org: 'Istanbul Kültür University',
        place: 'Istanbul',
        from: [2024, 9],
        to: [2026, 6],
        points: ['CGPA: 3.18 / 4.00', 'Ranked 9th in the department'],
      },
    ],
    skills: [
      { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Laravel', 'Redis', 'C#', 'PostgreSQL', 'MySQL'] },
      { group: 'Frontend', items: ['React', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tauri (Rust)'] },
      { group: 'Tools & other', items: ['Docker', 'Git', 'REST API', 'SEO', 'Scikit-Learn'] },
    ],
  },
  tr: {
    title: 'Junior Full-Stack Developer',
    tagline: 'Java Spring Boot, Laravel, React ve Angular ile full-stack web uygulamaları geliştiriyorum.',
    intro:
      'Java ekosistemi ve modern web teknolojilerinde deneyim sahibi junior full-stack geliştirici. SEO, REST API geliştirme ve yapay zekâ entegrasyonlu projelerde çalıştım; mimari kararları belgelemeyi ve modül sınırlarını testlerle korumayı önemsiyorum.',
    location: 'İstanbul, Türkiye',
    availability: 'Haziran 2026 mezunu; junior full-stack pozisyonlara ve stajlara açığım',
    jobs: [
      {
        role: 'Stajyer Yazılım Geliştirici',
        org: 'Kron',
        place: 'Sarıyer, İstanbul',
        from: [2026, 7],
        to: [2026, 8],
        points: [
          'Java Spring Boot kullanarak REST API sistemlerinin geliştirilmesi ve proje süreçlerine entegrasyonu üzerine çalışıldı.',
          'Kurumsal yazılım geliştirme standartlarına uygun backend mimarileri deneyimlendi.',
        ],
      },
      {
        role: 'Web Geliştirici & SEO Uzmanı',
        org: 'Booking For Health',
        place: 'Beylikdüzü, İstanbul',
        from: [2023, 12],
        to: [2024, 6],
        points: [
          'Birden fazla web sitesi için SEO odaklı içerik yönetimi, web tasarım ve teknik destek sağlandı.',
          'Sosyal medya yönetimi ve dijital pazarlama araçlarıyla sitelerin görünürlüğü artırıldı.',
        ],
      },
    ],
    schools: [
      {
        degree: 'Bilgisayar Programcılığı (Önlisans)',
        org: 'İstanbul Kültür Üniversitesi',
        place: 'İstanbul',
        from: [2024, 9],
        to: [2026, 6],
        points: ['Genel Not Ortalaması: 3.18 / 4.00', 'Bölüm dokuzuncusu'],
      },
    ],
    skills: [
      { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Laravel', 'Redis', 'C#', 'PostgreSQL', 'MySQL'] },
      { group: 'Frontend', items: ['React', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tauri (Rust)'] },
      { group: 'Araçlar & diğer', items: ['Docker', 'Git', 'REST API', 'SEO', 'Scikit-Learn'] },
    ],
  },
  fr: {
    title: 'Développeur full-stack junior',
    tagline:
      'Je développe des applications web full-stack avec Java Spring Boot, Laravel, React et Angular.',
    intro:
      'Développeur full-stack junior, à l’aise avec l’écosystème Java et les technologies web modernes. J’ai travaillé sur le SEO, le développement d’API REST et des projets intégrant l’IA, et je tiens à documenter les décisions d’architecture et à sécuriser les interfaces entre modules par des tests.',
    location: 'Istanbul, Turquie',
    availability: 'Diplômé en juin 2026 ; ouvert aux postes full-stack junior et aux stages',
    jobs: [
      {
        role: 'Stagiaire développeur logiciel',
        org: 'Kron',
        place: 'Sarıyer, Istanbul',
        from: [2026, 7],
        to: [2026, 8],
        points: [
          'Développement et intégration d’API REST dans les processus du projet avec Java Spring Boot.',
          'Expérience des architectures backend conformes aux standards de développement logiciel en entreprise.',
        ],
      },
      {
        role: 'Développeur web et spécialiste SEO',
        org: 'Booking For Health',
        place: 'Beylikdüzü, Istanbul',
        from: [2023, 12],
        to: [2024, 6],
        points: [
          'Gestion de contenu orientée SEO, conception web et support technique pour plusieurs sites.',
          'Amélioration de la visibilité des sites grâce à la gestion des réseaux sociaux et aux outils de marketing numérique.',
        ],
      },
    ],
    schools: [
      {
        degree: 'Diplôme bac+2 en programmation informatique (Associate Degree)',
        org: 'İstanbul Kültür University',
        place: 'Istanbul',
        from: [2024, 9],
        to: [2026, 6],
        points: ['Moyenne générale : 3,18 / 4,00', '9e de la filière'],
      },
    ],
    skills: [
      { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Laravel', 'Redis', 'C#', 'PostgreSQL', 'MySQL'] },
      { group: 'Frontend', items: ['React', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tauri (Rust)'] },
      { group: 'Outils et divers', items: ['Docker', 'Git', 'REST API', 'SEO', 'Scikit-Learn'] },
    ],
  },
  de: {
    title: 'Junior Full-Stack-Entwickler',
    tagline:
      'Ich entwickle Full-Stack-Webanwendungen mit Java Spring Boot, Laravel, React und Angular.',
    intro:
      'Junior Full-Stack-Entwickler mit Erfahrung im Java-Ökosystem und in modernen Webtechnologien. Ich habe an SEO, REST-API-Entwicklung und KI-integrierten Projekten gearbeitet und lege Wert darauf, Architekturentscheidungen zu dokumentieren und Modulgrenzen durch Tests abzusichern.',
    location: 'Istanbul, Türkei',
    availability: 'Abschluss Juni 2026; offen für Junior-Full-Stack-Stellen und Praktika',
    jobs: [
      {
        role: 'Praktikant Softwareentwicklung',
        org: 'Kron',
        place: 'Sarıyer, Istanbul',
        from: [2026, 7],
        to: [2026, 8],
        points: [
          'Entwicklung und Integration von REST-APIs in Projektabläufe mit Java Spring Boot.',
          'Erfahrung mit Backend-Architekturen nach Standards der Unternehmenssoftware-Entwicklung.',
        ],
      },
      {
        role: 'Webentwickler und SEO-Spezialist',
        org: 'Booking For Health',
        place: 'Beylikdüzü, Istanbul',
        from: [2023, 12],
        to: [2024, 6],
        points: [
          'SEO-orientierte Content-Verwaltung, Webdesign und technischer Support für mehrere Websites.',
          'Steigerung der Sichtbarkeit der Websites durch Social-Media-Management und digitale Marketing-Tools.',
        ],
      },
    ],
    schools: [
      {
        degree: 'Associate Degree in Computerprogrammierung (zweijährig)',
        org: 'İstanbul Kültür University',
        place: 'Istanbul',
        from: [2024, 9],
        to: [2026, 6],
        points: ['Notendurchschnitt (GPA): 3,18 / 4,00', 'Platz 9 im Studiengang'],
      },
    ],
    skills: [
      { group: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Laravel', 'Redis', 'C#', 'PostgreSQL', 'MySQL'] },
      { group: 'Frontend', items: ['React', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tauri (Rust)'] },
      { group: 'Werkzeuge & Sonstiges', items: ['Docker', 'Git', 'REST API', 'SEO', 'Scikit-Learn'] },
    ],
  },
};
