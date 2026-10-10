import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LANGS, LOCALE, type Lang } from './i18n';

const ORIGIN = 'https://ayberkaarda.github.io';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /** `rest` is the path after the language prefix, e.g. '' or 'projects/inertia'. */
  update(opts: { lang: Lang; title: string; description: string; rest: string }): void {
    const { lang, title, description, rest } = opts;
    const suffix = rest ? `${rest}/` : '';

    this.doc.documentElement.lang = lang;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:locale', content: LOCALE[lang].replace('-', '_') });

    this.doc.head.querySelectorAll('link[data-seo]').forEach((el) => el.remove());
    this.addLink('canonical', `${ORIGIN}/${lang}/${suffix}`);
    for (const l of LANGS) {
      this.addLink('alternate', `${ORIGIN}/${l}/${suffix}`, l);
    }
  }

  private addLink(rel: string, href: string, hreflang?: string): void {
    const link = this.doc.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    link.setAttribute('data-seo', '');
    if (hreflang) link.setAttribute('hreflang', hreflang);
    this.doc.head.appendChild(link);
  }
}
