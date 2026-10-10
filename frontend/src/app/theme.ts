import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { Lang } from './i18n';

export type Theme = 'light' | 'dark';
export type ThemePref = Theme | 'system';

const KEY = 'theme-pref';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
/** Browser chrome colour per theme; mirrors --bg in tokens.css and the boot script in index.html. */
const CHROME: Record<Theme, string> = { dark: '#0E0F13', light: '#F4F1EA' };
/** Length of the colour ease on a switch; matches --t-theme plus a little slack. */
const ANIM_MS = 240;

/** Toggle labels name the action, so the current theme is always implied. */
export const THEME_LABELS: Record<Lang, Record<Theme, string>> = {
  tr: { light: 'Açık temaya geç', dark: 'Koyu temaya geç' },
  en: { light: 'Switch to light theme', dark: 'Switch to dark theme' },
  fr: { light: 'Passer au thème clair', dark: 'Passer au thème sombre' },
  de: { light: 'Zum hellen Design wechseln', dark: 'Zum dunklen Design wechseln' },
};

/**
 * Colour theme. Follows the system setting (dark when there is none) until the
 * visitor picks one; the pick is kept in localStorage. The inline script in
 * index.html applies the same rule before first paint, this service takes over after.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly pref = signal<ThemePref>('system');
  private readonly system = signal<Theme>('dark');
  private timer = 0;

  readonly preference = this.pref.asReadonly();
  readonly theme = computed<Theme>(() => {
    const p = this.pref();
    return p === 'system' ? this.system() : p;
  });
  /** The theme a click switches to. */
  readonly next = computed<Theme>(() => (this.theme() === 'dark' ? 'light' : 'dark'));

  constructor() {
    if (!this.browser) return;
    const win = this.document.defaultView;
    try {
      const saved = win?.localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') this.pref.set(saved);
    } catch {
      /* storage unavailable: follow the system */
    }
    const mq = win?.matchMedia?.(LIGHT_QUERY);
    if (mq) {
      this.system.set(mq.matches ? 'light' : 'dark');
      mq.addEventListener('change', (e) => {
        this.system.set(e.matches ? 'light' : 'dark');
        if (this.pref() === 'system') this.apply(true);
      });
    }
    this.apply(false);
  }

  label(lang: Lang): string {
    return THEME_LABELS[lang][this.next()];
  }

  toggle(): void {
    const next = this.next();
    this.pref.set(next);
    try {
      this.document.defaultView?.localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this page view */
    }
    this.apply(true);
  }

  private apply(animate: boolean): void {
    if (!this.browser) return;
    const t = this.theme();
    const root = this.document.documentElement;
    if (root.dataset['theme'] === t) return;
    if (animate) this.ease(root);
    root.dataset['theme'] = t;
    this.document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t);
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME[t]);
  }

  /** Colours ease for one short moment; never with reduced motion. */
  private ease(root: HTMLElement): void {
    const win = this.document.defaultView;
    const reduce =
      root.dataset['motion'] === 'reduce' ||
      !!win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !win) return;
    root.classList.add('theme-anim');
    win.clearTimeout(this.timer);
    this.timer = win.setTimeout(() => root.classList.remove('theme-anim'), ANIM_MS);
  }
}
