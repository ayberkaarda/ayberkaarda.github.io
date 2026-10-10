import type { Lang } from './i18n';
import type { Project, ProjectText } from './projects.service';

/** Key under which the home page remembers the card a detail page was opened from. */
export const RETURN_SLUG_KEY = 'project-return';

/** Text for the requested language, falling back to English, then to any language present. */
export function textOf(p: Project, lang: Lang): ProjectText {
  return (
    p.texts?.[lang] ??
    p.texts?.en ??
    Object.values(p.texts ?? {})[0] ?? {
      name: p.slug,
      summary: '',
      description: '',
      highlights: [],
    }
  );
}
