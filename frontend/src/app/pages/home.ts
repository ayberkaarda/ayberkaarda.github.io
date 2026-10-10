import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeader } from '../header';
import { ui, type Lang } from '../i18n';
import { person, profile } from '../profile';
import { ProjectsService } from '../projects.service';
import { RETURN_SLUG_KEY } from '../project-text';
import { SeoService } from '../seo.service';
import { HeroSection } from '../sections/hero';
import { ProjectsSection } from '../sections/projects';
import { ExperienceSection } from '../sections/experience';
import { SkillsSection } from '../sections/skills';
import { ContactSection } from '../sections/contact';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    SiteHeader,
    HeroSection,
    ProjectsSection,
    ExperienceSection,
    SkillsSection,
    ContactSection,
  ],
  template: `
    <a class="skip-link" [routerLink]="[]" fragment="main" (click)="focusMain()">{{ t().skip }}</a>
    <app-header [lang]="lang()" [inHome]="true" [active]="active()" />

    <main id="main" tabindex="-1" #main>
      <app-hero [lang]="lang()" />
      <app-projects [lang]="lang()" />
      <app-experience [lang]="lang()" />
      <app-skills [lang]="lang()" />
      <app-contact [lang]="lang()" />
    </main>
  `,
})
export class HomePage {
  /** Bound from the route's `data: { lang }`. */
  readonly lang = input.required<Lang>();

  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly active = signal('');

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly projects = inject(ProjectsService).projects;
  private syncScene: (() => void) | null = null;

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const lang = this.lang();
      seo.update({
        lang,
        title: `${person.name} — ${profile[lang].title}`,
        description: ui[lang].metaDescription,
        rest: '',
      });
    });

    const destroyRef = inject(DestroyRef);
    let destroyed = false;

    afterNextRender(() => {
      const main = this.main().nativeElement;

      // Highlight the header entry for the section crossing the upper part of the viewport.
      const observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.find((e) => e.isIntersecting);
          if (hit) this.active.set(hit.target.id);
        },
        { rootMargin: '-20% 0px -70% 0px' },
      );
      main.querySelectorAll('[data-hero], section[id]').forEach((el) => observer.observe(el));

      // The fan scene: wide screens only, never with reduced motion (media query or footer switch).
      const html = document.documentElement;
      const wide = matchMedia('(min-width: 960px)');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let stop: (() => void) | null = null;
      let loading = false;
      const allowed = () =>
        wide.matches &&
        !reduce.matches &&
        html.dataset['motion'] !== 'reduce' &&
        main.querySelectorAll('[data-fan-card]').length === 5;

      // The cards stay in their natural grid place until the module is loaded;
      // `startScene` applies the scene classes together with its first measurement.
      const sync = () => {
        if (destroyed) return;
        if (!allowed()) {
          stop?.();
          stop = null;
          return;
        }
        if (stop || loading) return;
        loading = true;
        import('../scene-progress')
          .then((m) => {
            loading = false;
            if (!destroyed && allowed() && !stop) stop = m.startScene(main);
          })
          .catch((err: unknown) => {
            loading = false;
            console.error('Scroll scene could not be loaded; showing the plain grid.', err);
          });
      };

      const motionAttr = new MutationObserver(sync);
      motionAttr.observe(html, { attributes: true, attributeFilter: ['data-motion'] });
      wide.addEventListener('change', sync);
      reduce.addEventListener('change', sync);
      this.syncScene = sync;
      sync();

      destroyRef.onDestroy(() => {
        destroyed = true;
        observer.disconnect();
        motionAttr.disconnect();
        wide.removeEventListener('change', sync);
        reduce.removeEventListener('change', sync);
        stop?.();
        this.syncScene = null;
      });
    });

    // Project data arrives after the first render; start the scene once the cards exist.
    afterRenderEffect(() => {
      const list = this.projects();
      this.syncScene?.();
      if (list !== undefined) this.restoreCardFocus();
    });
  }

  /** Back from a project page: focus the card it was opened from (once). */
  private restoreCardFocus(): void {
    let slug: string | null = null;
    try {
      slug = sessionStorage.getItem(RETURN_SLUG_KEY);
      sessionStorage.removeItem(RETURN_SLUG_KEY);
    } catch {
      return;
    }
    if (!slug) return;
    const card = Array.from(
      this.main().nativeElement.querySelectorAll<HTMLElement>('a[data-slug]'),
    ).find((el) => el.dataset['slug'] === slug);
    card?.focus({ preventScroll: true });
  }

  /** Skip link: move keyboard focus into the content, not only the scroll position. */
  protected focusMain(): void {
    this.main().nativeElement.focus();
  }
}
