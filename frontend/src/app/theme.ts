import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { Lang } from './i18n';

export type Theme = 'light' | 'dark' | 'punk';
export type ThemePref = Theme | 'system';

/** Menu order. */
export const THEMES: readonly Theme[] = ['dark', 'light', 'punk'];

const KEY = 'theme-pref';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
/** Browser chrome colour per theme; mirrors --bg in tokens.css and the boot script in index.html. */
const CHROME: Record<Theme, string> = { dark: '#0E0F13', light: '#F4F1EA', punk: '#0D0C0C' };
/** Length of the colour ease on a switch; matches --t-theme plus a little slack. */
const ANIM_MS = 240;

/** Menu name and the name of each theme. */
export const THEME_TEXT: Record<Lang, { label: string } & Record<Theme, string>> = {
  tr: { label: 'Tema', dark: 'Koyu', light: 'Açık', punk: 'Punk' },
  en: { label: 'Theme', dark: 'Dark', light: 'Light', punk: 'Punk' },
  fr: { label: 'Thème', dark: 'Sombre', light: 'Clair', punk: 'Punk' },
  de: { label: 'Design', dark: 'Dunkel', light: 'Hell', punk: 'Punk' },
};

function isTheme(value: string | null | undefined): value is Theme {
  return !!value && (THEMES as readonly string[]).includes(value);
}

/**
 * Colour theme. Follows the system setting (dark when there is none) until the
 * visitor picks one; the pick is kept in localStorage. The system only ever maps
 * to light or dark, punk is always an explicit pick. The inline script in
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

  constructor() {
    if (!this.browser) return;
    const win = this.document.defaultView;
    try {
      const saved = win?.localStorage.getItem(KEY);
      if (isTheme(saved)) this.pref.set(saved);
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

  set(theme: Theme): void {
    this.pref.set(theme);
    try {
      this.document.defaultView?.localStorage.setItem(KEY, theme);
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
    this.document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', t === 'light' ? 'light' : 'dark');
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME[t]);
  }

  /** Colours ease for one short moment; never with reduced motion. */
  private ease(root: HTMLElement): void {
    const win = this.document.defaultView;
    const reduce = root.dataset['motion'] === 'reduce';
    if (reduce || !win) return;
    root.classList.add('theme-anim');
    win.clearTimeout(this.timer);
    this.timer = win.setTimeout(() => root.classList.remove('theme-anim'), ANIM_MS);
  }
}
