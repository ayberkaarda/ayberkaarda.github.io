import { Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ui, type Lang } from '../i18n';
import { Reveal } from '../reveal';
import { ProjectsService } from '../projects.service';
import { RETURN_SLUG_KEY, textOf } from '../project-text';

/** Number of cards that form the hero fan (first entries of projects.json). */
const FAN = 5;

/**
 * Project grid. The first five cards carry `data-fan-card`; on wide screens the
 * scroll scene lends them to the hero slots, on narrow screens they form a
 * horizontal strip right under the hero.
 */
@Component({
  selector: 'app-projects',
  imports: [RouterLink, Reveal, NgTemplateOutlet],
  template: `
    <section id="projects" class="section projects" aria-labelledby="h-projects">
      <div class="container projects-grid">
        <h2 id="h-projects" class="section-num projects-title" reveal revealKind="heading">
          01 — {{ t().nav.projects }}
        </h2>

        <div class="fan-row">
          @for (pr of fan(); track pr.slug; let i = $index) {
            <ng-container *ngTemplateOutlet="card; context: { $implicit: pr, i: i }" />
          }
        </div>

        <div class="projects-rest">
          @for (pr of rest(); track pr.slug; let i = $index) {
            <ng-container *ngTemplateOutlet="card; context: { $implicit: pr, i: i + fanSize }" />
          }
        </div>
      </div>
    </section>

    <ng-template #card let-pr let-i="i">
      <a
        class="card"
        [class.card--wide]="i === 0"
        [routerLink]="['/', lang(), 'projects', pr.slug]"
        [attr.data-slug]="pr.slug"
        (click)="remember($event, pr.slug)"
        [attr.data-fan-card]="i < fanSize ? '' : null"
        [style.--i]="i < fanSize ? i : null"
        [style.--z]="i < fanSize ? fanSize - i : null"
      >
        @if (pr.image) {
          <img
            class="card-img"
            [src]="thumb(pr.image)"
            [attr.srcset]="srcset(pr.image)"
            [attr.sizes]="sizes(i)"
            [style.view-transition-name]="'project-' + pr.slug"
            alt=""
            width="720"
            height="450"
            [attr.loading]="i < fanSize ? 'eager' : 'lazy'"
            [attr.fetchpriority]="i === 0 ? 'high' : null"
            decoding="async"
          />
        }
        <span class="card-body">
          <span class="mono card-meta"
            >{{ num(i) }}@if (pr.year) {
              · {{ pr.year }}
            }@if (pr.wip) {
              · {{ t().inProgress }}
            }</span
          >
          @let text = textOf(pr, lang());
          <span class="card-name">{{ text.name }}</span>
          <span class="card-summary">{{ text.summary }}</span>
          <span class="card-stack">{{ pr.stack.slice(0, 4).join(' · ') }}</span>
        </span>
      </a>
    </ng-template>
  `,
})
export class ProjectsSection {
  readonly lang = input.required<Lang>();

  protected readonly fanSize = FAN;
  protected readonly t = computed(() => ui[this.lang()]);

  private readonly all = inject(ProjectsService).projects;
  protected readonly fan = computed(() => (this.all() ?? []).slice(0, FAN));
  protected readonly rest = computed(() => (this.all() ?? []).slice(FAN));

  /** Screenshots are published as <name>.webp (1440 px) and <name>-thumb.webp (720 px). */
  protected thumb(image: string): string {
    return image.replace(/\.[a-z]+$/i, '-thumb.webp');
  }

  protected srcset(image: string): string {
    return `${this.thumb(image)} 720w, ${image.replace(/\.[a-z]+$/i, '.webp')} 1440w`;
  }

  protected sizes(i: number): string {
    if (i === 0) return '(min-width: 960px) min(66vw, 860px), min(78vw, 320px)';
    if (i < FAN) return '(min-width: 960px) min(33vw, 420px), min(78vw, 320px)';
    return '(min-width: 960px) min(33vw, 420px), (min-width: 640px) 50vw, 100vw';
  }

  protected readonly textOf = textOf;

  /** Remembers the opened card so the home page can return focus to it. */
  protected remember(e: MouseEvent, slug: string): void {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    try {
      sessionStorage.setItem(RETURN_SLUG_KEY, slug);
    } catch {
      /* Storage unavailable: focus is simply not restored. */
    }
  }

  protected num(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
