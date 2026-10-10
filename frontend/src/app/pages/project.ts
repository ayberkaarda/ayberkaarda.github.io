import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SiteHeader } from '../header';
import { ui, type Lang } from '../i18n';
import { person, profile } from '../profile';
import { ProjectsService, type Project } from '../projects.service';
import { RETURN_SLUG_KEY, textOf } from '../project-text';
import { SeoService } from '../seo.service';

/** Page-local strings that have no shared i18n key. */
const local: Record<Lang, { year: string; loading: string; loadError: string; notFound: string }> = {
  en: {
    year: 'Year',
    loading: 'Loading',
    loadError: 'The project list could not be loaded. Please try again later.',
    notFound: 'This project does not exist or is no longer listed.',
  },
  tr: {
    year: 'Yıl',
    loading: 'Yükleniyor',
    loadError: 'Proje listesi yüklenemedi. Lütfen daha sonra tekrar dene.',
    notFound: 'Bu proje yok ya da artık listelenmiyor.',
  },
  fr: {
    year: 'Année',
    loading: 'Chargement',
    loadError: 'La liste des projets n’a pas pu être chargée. Réessayez plus tard.',
    notFound: 'Ce projet n’existe pas ou n’est plus présenté.',
  },
  de: {
    year: 'Jahr',
    loading: 'Wird geladen',
    loadError: 'Die Projektliste konnte nicht geladen werden. Bitte später erneut versuchen.',
    notFound: 'Dieses Projekt existiert nicht oder wird nicht mehr gezeigt.',
  },
};


@Component({
  selector: 'app-project',
  imports: [RouterLink, SiteHeader],
  template: `
    <app-header [lang]="lang()" [rest]="['projects', slug() ?? '']" [inHome]="false" />

    <main id="main" class="page project-page" [attr.aria-busy]="state() === 'loading' ? 'true' : null">
      <a class="pp-back mono" [routerLink]="['/', lang()]" fragment="projects">
        <span aria-hidden="true">←</span> {{ t().allProjects }}
      </a>

      @if (state() === 'loading') {
        <p class="pp-status mono" role="status">
          <span aria-hidden="true">…</span><span class="sr-only">{{ l().loading }}</span>
        </p>
      } @else if (state() === 'error') {
        <div class="pp-empty">
          <h1 #heading tabindex="-1">{{ t().nav.projects }}</h1>
          <p class="pp-status" role="alert">{{ l().loadError }}</p>
          <a class="btn btn--ghost" [routerLink]="['/', lang()]">{{ t().back }}</a>
        </div>
      } @else if (state() === 'missing') {
        <div class="pp-empty">
          <h1 #heading tabindex="-1">404</h1>
          <p class="pp-status">{{ l().notFound }}</p>
          <a class="btn btn--ghost" [routerLink]="['/', lang()]" fragment="projects">{{ t().allProjects }}</a>
        </div>
      } @else if (project(); as pr) {
        <header class="pp-head">
          <p class="label">
            {{ index() + 1 < 10 ? '0' : '' }}{{ index() + 1 }}
            @if (pr.year) {
              · {{ pr.year }}
            }
            @if (pr.wip) {
              · {{ t().inProgress }}
            }
          </p>
          <h1 #heading tabindex="-1" class="pp-title">{{ text().name }}</h1>
          <p class="pp-lead">{{ text().summary }}</p>
        </header>

        @if (pr.image) {
          <figure class="pp-shot">
            <img
              [src]="full(pr.image)"
              [alt]="text().name"
              width="1600"
              height="1000"
              decoding="async"
              fetchpriority="high"
              [style.view-transition-name]="'project-' + pr.slug"
            />
            <figcaption>
              <a class="pp-original mono" [href]="full(pr.image)" target="_blank" rel="noopener">
                {{ t().project.original }} <span aria-hidden="true">↗</span>
              </a>
            </figcaption>
          </figure>
        }

        <div class="pp-body">
          <aside class="pp-meta">
            <dl>
              @if (pr.year) {
                <div>
                  <dt class="label">{{ l().year }}</dt>
                  <dd class="mono">{{ pr.year }}</dd>
                </div>
              }
              @if (pr.stack.length) {
                <div>
                  <dt class="label">{{ t().sections.stack }}</dt>
                  <dd>
                    <ul role="list" class="pp-stack">
                      @for (s of pr.stack; track s) {
                        <li>{{ s }}</li>
                      }
                    </ul>
                  </dd>
                </div>
              }
              <div>
                <dt class="label">{{ t().sections.links }}</dt>
                <dd>
                  <ul role="list" class="pp-links">
                    @if (pr.repoUrl) {
                      <li>
                        <a [href]="pr.repoUrl" rel="noopener" target="_blank">
                          {{ t().source }} <span aria-hidden="true">↗</span>
                        </a>
                      </li>
                    }
                    @for (u of pr.extraRepoUrls ?? []; track u) {
                      <li>
                        <a [href]="u" rel="noopener" target="_blank">
                          {{ repoName(u) }} <span aria-hidden="true">↗</span>
                        </a>
                      </li>
                    }
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>

          <article class="pp-text">
            <!-- The detail sections open with an overview that retells the description,
                 so the plain description is shown only when a project has no sections. -->
            @if (!sections().length) {
              <h2 class="pp-h2">{{ t().sections.built }}</h2>
              <p>{{ text().description }}</p>
            }

            @if (text().highlights?.length) {
              <h2 class="pp-h2">{{ t().sections.highlights }}</h2>
              <ul class="pp-highlights">
                @for (h of text().highlights; track h) {
                  <li>{{ h }}</li>
                }
              </ul>
            }

            @for (s of sections(); track $index) {
              <section class="pp-section">
                @if (s.heading) {
                  <h2 class="pp-h2">{{ s.heading }}</h2>
                }
                @for (b of s.blocks; track $index) {
                  @if (b.items) {
                    <ul class="pp-highlights">
                      @for (item of b.items; track $index) {
                        <li>{{ item }}</li>
                      }
                    </ul>
                  } @else {
                    <p>{{ b.text }}</p>
                  }
                }
              </section>
            }
          </article>
        </div>

        <nav class="pp-pager" [attr.aria-label]="t().nav.projects">
          @if (prev(); as p) {
            <a class="pp-pager__link pp-pager__link--prev" [routerLink]="['/', lang(), 'projects', p.slug]">
              <span class="label"><span aria-hidden="true">←</span> {{ t().project.prev }}</span>
              <span class="pp-pager__name">{{ nameOf(p) }}</span>
            </a>
          }
          @if (next(); as n) {
            <a class="pp-pager__link pp-pager__link--next" [routerLink]="['/', lang(), 'projects', n.slug]">
              <span class="label">{{ t().project.next }} <span aria-hidden="true">→</span></span>
              <span class="pp-pager__name">{{ nameOf(n) }}</span>
            </a>
          }
        </nav>
      }
    </main>

    <footer class="page pp-footer mono">© {{ year }} {{ person.name }}</footer>
  `,
})
export class ProjectPage {
  readonly lang = input.required<Lang>();
  /** Bound from the `:slug` route parameter. */
  readonly slug = input<string>();

  protected readonly person = person;
  protected readonly year = new Date().getFullYear();
  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly l = computed(() => local[this.lang()]);

  private readonly all = inject(ProjectsService).projects;
  protected readonly index = computed(() => this.all()?.findIndex((p) => p.slug === this.slug()) ?? -1);
  protected readonly project = computed(() => {
    const i = this.index();
    return i >= 0 ? this.all()![i] : undefined;
  });
  protected readonly text = computed(() => {
    const pr = this.project();
    return pr ? textOf(pr, this.lang()) : undefined!;
  });
  /**
   * Detail sections for the current language, shown after the highlights; when present
   * they replace the plain description.
   * Missing data behaves as []; malformed entries are skipped rather than breaking the page.
   * Text is always bound as plain text.
   */
  protected readonly sections = computed(() => {
    const list = this.project() ? this.text().sections : undefined;
    if (!Array.isArray(list)) return [];
    const isStr = (v: unknown): v is string => typeof v === 'string';
    return list.flatMap((s) => {
      if (!s || !isStr(s.heading) || !Array.isArray(s.blocks)) return [];
      const blocks = s.blocks.flatMap((b): { text?: string; items?: string[] }[] => {
        if (b?.type === 'p' && isStr(b.text) && b.text) return [{ text: b.text }];
        if (b?.type === 'ul' && Array.isArray(b.items)) {
          const items = b.items.filter(isStr);
          return items.length ? [{ items }] : [];
        }
        return [];
      });
      return s.heading || blocks.length ? [{ heading: s.heading, blocks }] : [];
    });
  });
  /** The service yields [] when the file could not be read. */
  protected readonly state = computed<'loading' | 'error' | 'missing' | 'ok'>(() => {
    const list = this.all();
    if (list === undefined) return 'loading';
    if (list.length === 0) return 'error';
    return this.project() ? 'ok' : 'missing';
  });
  protected readonly prev = computed(() => {
    const i = this.index();
    return i > 0 ? this.all()![i - 1] : undefined;
  });
  protected readonly next = computed(() => {
    const list = this.all() ?? [];
    const i = this.index();
    return i >= 0 && i < list.length - 1 ? list[i + 1] : undefined;
  });

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  constructor() {
    const seo = inject(SeoService);
    const meta = inject(Meta);

    effect(() => {
      const lang = this.lang();
      const pr = this.project();
      const text = pr ? textOf(pr, lang) : undefined;
      seo.update({
        lang,
        title: text ? `${text.name} — ${person.name}` : `${person.name} — ${profile[lang].title}`,
        description: text ? text.summary : ui[lang].metaDescription,
        rest: pr ? `projects/${pr.slug}` : '',
      });
      if (this.state() === 'missing' || this.state() === 'error') {
        meta.updateTag({ name: 'robots', content: 'noindex' });
      } else {
        meta.removeTag("name='robots'");
      }
    });
    inject(DestroyRef).onDestroy(() => meta.removeTag("name='robots'"));

    // Move focus to the page heading once the content for this slug is shown.
    let focusedFor: string | undefined;
    effect(() => {
      const el = this.heading()?.nativeElement;
      const key = `${this.slug()}|${this.state()}`;
      if (!el || key === focusedFor) return;
      focusedFor = key;
      el.focus({ preventScroll: true });
    });

    // Opened from a home card and then paged on: return focus to the last project shown.
    effect(() => {
      const pr = this.project();
      if (!pr) return;
      try {
        if (sessionStorage.getItem(RETURN_SLUG_KEY)) sessionStorage.setItem(RETURN_SLUG_KEY, pr.slug);
      } catch {
        /* Storage unavailable: focus is simply not restored. */
      }
    });
  }

  protected nameOf(p: Project): string {
    return textOf(p, this.lang()).name;
  }

  /** Screenshots are published as <name>.webp (1600 px) next to <name>-thumb.webp. */
  protected full(image: string): string {
    return image.replace(/\.[a-z]+$/i, '.webp');
  }

  protected repoName(url: string): string {
    return url.replace(/\/+$/, '').split('/').pop() ?? url;
  }
}
