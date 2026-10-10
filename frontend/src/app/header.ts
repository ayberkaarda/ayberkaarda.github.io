import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LANGS, LANG_NAMES, ui, type Lang } from './i18n';
import { person } from './profile';
import { MobileMenu } from './mobile-menu';
import { ThemeService } from './theme';

const SECTIONS = ['projects', 'experience', 'skills', 'contact'] as const;

/** Scroll distance after which the desktop bar condenses into the pill. */
const PILL_AT = 80;
/** The pill never grows past this; wider content falls back to the compact layout. */
const PILL_MAX = 720;
const COMPACT_QUERY = '(max-width: 959.98px)';
const LANG_KEY = 'lang-pref';

/**
 * Sticky site header. Desktop: a full-width 64 px bar whose background layer
 * condenses into a centred floating pill after a little scrolling (the text does
 * not move or scale). Compact (< 960 px, or whenever the row does not fit):
 * 56 px bar with a language list and a menu button opening a bottom sheet.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, MobileMenu],
  template: `
    <header
      #bar
      class="site-header"
      [class.scrolled]="scrolled()"
      [class.moved]="moved()"
    >
      <div class="site-header__row">
        <a #name class="site-header__name" [routerLink]="['/', lang()]">{{ person.name }}</a>

        <div #cluster class="site-header__cluster d-only">
          <nav class="site-nav" [attr.aria-label]="t().menuLabel">
            <ul role="list">
              @for (s of sections(); track s.id) {
                <li>
                  <a
                    [routerLink]="target()"
                    [fragment]="s.id"
                    [class.active]="active() === s.id"
                    [attr.aria-current]="active() === s.id ? 'location' : null"
                    >{{ s.label }}</a
                  >
                </li>
              }
            </ul>
          </nav>

          <div
            class="lang-switch"
            role="group"
            [attr.aria-label]="t().lang.label"
            [style.--i]="index()"
          >
            <span class="lang-thumb" aria-hidden="true"></span>
            @for (l of langs; track l) {
              <a
                [routerLink]="link(l)"
                [fragment]="keepAt()"
                [class.current]="l === lang()"
                [attr.lang]="l"
                [attr.hreflang]="l"
                [attr.title]="names[l]"
                [attr.aria-label]="names[l]"
                [attr.aria-current]="l === lang() ? 'true' : null"
                (click)="remember(l)"
                >{{ l.toUpperCase() }}</a
              >
            }
          </div>
        </div>

        <div #end class="site-header__end d-only">
          <button
            type="button"
            class="theme-btn"
            [attr.aria-label]="theme.label(lang())"
            [attr.title]="theme.label(lang())"
            (click)="theme.toggle()"
          >
            @if (theme.next() === 'light') {
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="4.25" />
                <path
                  d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.46 5.46l1.77 1.77M16.77 16.77l1.77 1.77M5.46 18.54l1.77-1.77M16.77 7.23l1.77-1.77"
                />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M20.25 14.6A8.25 8.25 0 0 1 9.4 3.75a8.25 8.25 0 1 0 10.85 10.85Z" />
              </svg>
            }
          </button>
        </div>

        <div class="site-header__m m-only">
          <details #langMenu class="m-lang" (keydown.escape)="closeLang(true)">
            <summary [attr.aria-label]="t().lang.label + ': ' + names[lang()]">
              {{ lang().toUpperCase() }} <span aria-hidden="true">▾</span>
            </summary>
            <ul class="m-lang__list" role="list">
              @for (l of langs; track l) {
                <li>
                  <a
                    [routerLink]="link(l)"
                    [fragment]="keepAt()"
                    [attr.lang]="l"
                    [attr.hreflang]="l"
                    [attr.aria-current]="l === lang() ? 'true' : null"
                    (click)="remember(l); closeLang(false)"
                    >{{ names[l] }}</a
                  >
                </li>
              }
            </ul>
          </details>
          <button
            #menuBtn
            type="button"
            class="m-menu-btn"
            aria-haspopup="dialog"
            [attr.aria-expanded]="menu.isOpen()"
            (click)="menu.open(menuBtn)"
          >
            {{ t().menu.open }}
          </button>
        </div>
      </div>

      <app-mobile-menu
        #menu
        [lang]="lang()"
        [items]="sections()"
        [target]="target()"
        [active]="active()"
      />
    </header>
  `,
})
export class SiteHeader {
  readonly lang = input.required<Lang>();
  /** Path after the language prefix, so the switcher stays on the same page. */
  readonly rest = input<string[]>([]);
  /** On the home page section links scroll; elsewhere they go back to it. */
  readonly inHome = input(false);
  /** Id of the section currently in view (home page only). */
  readonly active = input('');

  protected readonly person = person;
  protected readonly theme = inject(ThemeService);
  protected readonly langs = LANGS;
  protected readonly names = LANG_NAMES;
  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly index = computed(() => LANGS.indexOf(this.lang()));
  protected readonly scrolled = signal(false);
  protected readonly moved = signal(false);

  protected readonly target = computed(() => (this.inHome() ? [] : ['/', this.lang()]));
  protected readonly sections = computed(() =>
    SECTIONS.map((id) => ({ id, label: this.t().nav[id] })),
  );
  /** On the home page, a language switch lands on the section being read. */
  protected readonly keepAt = computed(() =>
    this.inHome() && this.scrolled() && this.active() ? this.active() : undefined,
  );

  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  private readonly nameEl = viewChild.required<ElementRef<HTMLElement>>('name');
  private readonly clusterEl = viewChild.required<ElementRef<HTMLElement>>('cluster');
  private readonly endEl = viewChild.required<ElementRef<HTMLElement>>('end');
  private readonly langMenu = viewChild.required<ElementRef<HTMLDetailsElement>>('langMenu');
  private readonly menu = viewChild.required(MobileMenu);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Labels change width per language: re-check the fit after each render with a new language.
    afterRenderEffect({
      read: () => {
        this.lang();
        this.fit();
      },
    });

    afterNextRender(() => {
      const onScroll = () => {
        const y = window.scrollY;
        this.scrolled.set(y > PILL_AT);
        this.moved.set(y > 4);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      let frame = 0;
      const onResize = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => this.fit());
      };
      window.addEventListener('resize', onResize, { passive: true });
      void document.fonts?.ready.then(() => this.fit());

      const onDocClick = (e: Event) => {
        const d = this.langMenu().nativeElement;
        if (d.open && !d.contains(e.target as Node)) d.open = false;
      };
      document.addEventListener('click', onDocClick, { passive: true });

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('click', onDocClick);
        cancelAnimationFrame(frame);
      });
    });
  }

  protected link(l: Lang): string[] {
    return ['/', l, ...this.rest()];
  }

  protected remember(l: Lang): void {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage unavailable: the URL still carries the language */
    }
  }

  protected closeLang(refocus: boolean): void {
    const d = this.langMenu().nativeElement;
    if (!d.open) return;
    d.open = false;
    if (refocus) d.querySelector('summary')?.focus();
  }

  /**
   * Chooses between the desktop row and the compact layout, and sizes the pill
   * to the centred nav + language group. Works on the DOM directly so measuring
   * never triggers another render.
   */
  private fit(): void {
    const header = this.bar().nativeElement;
    if (window.matchMedia(COMPACT_QUERY).matches) {
      header.classList.add('is-compact');
      return;
    }

    header.classList.remove('is-compact');
    const row = header.firstElementChild as HTMLElement;
    const cs = getComputedStyle(row);
    const avail = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const gap = parseFloat(cs.columnGap) || 0;
    const cluster = this.clusterEl().nativeElement.offsetWidth;
    const side = Math.max(this.nameEl().nativeElement.offsetWidth, this.endEl().nativeElement.offsetWidth);
    const fits = cluster <= PILL_MAX && cluster + 2 * (side + gap) <= avail;

    header.style.setProperty('--pill-w', `${cluster}px`);
    header.classList.toggle('is-compact', !fits);
    if (fits) this.menu().close();
  }
}
