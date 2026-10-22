import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ui, type Lang } from '../i18n';
import { person, profile } from '../profile';
import { ProjectsService } from '../projects.service';

/**
 * Opening screen: name, role, one-line pitch and the two calls to action.
 * The right column holds five empty slots; on wide screens the featured
 * project cards are lent to these slots by the scroll scene (see scene-progress.ts).
 */
@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  template: `
    <section class="hero waves" data-hero aria-labelledby="hero-name">
      <div class="container hero-inner">
        <div class="hero-text">
          <p class="label hero-label">{{ p().title }} · {{ city() }}</p>
          <h1 id="hero-name" class="display hero-name">
            <span class="hero-name__text"><span>{{ first }}</span> <span>{{ last }}</span></span>
            <span class="ransom" aria-hidden="true">
              @for (word of words; track $index) {
                <span class="ransom__word">
                  @for (c of word; track $index) {
                    <span class="ransom__ch" [attr.data-cut]="c.cut">{{ c.ch }}</span>
                  }
                </span>
              }
            </span>
          </h1>
          <p class="hero-tagline">{{ p().tagline }}</p>
          <div class="hero-cta">
            <a class="btn btn--primary" [routerLink]="[]" fragment="projects">{{
              t().hero.cta.projects
            }}</a>
            <a class="btn btn--ghost" [href]="'mailto:' + person.email">{{ t().hero.cta.email }}</a>
          </div>
        </div>

        <div class="hero-fan" aria-hidden="true">
          @for (slot of slots; track slot) {
            <span class="fan-slot" [attr.data-fan-slot]="slot"></span>
          }
          <div class="hero-still">
            @for (src of still(); track src) {
              <img class="hero-still-img" [src]="src" alt="" width="720" height="450" loading="lazy" decoding="async" />
            }
          </div>
        </div>
      </div>

      <div class="tech" tabindex="0" role="region" [attr.aria-label]="t().sections.stack">
        <div class="tech-track">
          <ul class="tech-list" role="list">
            @for (item of stack(); track item) {
              <li>{{ item }}</li>
            }
          </ul>
          <ul class="tech-list tech-list--copy" role="list" aria-hidden="true">
            @for (item of stack(); track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class HeroSection {
  readonly lang = input.required<Lang>();

  private readonly projects = inject(ProjectsService).projects;
  protected readonly person = person;

  /** First three thumbnails: a still, decorative stack shown instead of the scene under reduced motion. */
  protected readonly still = computed(() =>
    (this.projects() ?? [])
      .slice(0, 3)
      .flatMap((pr) => (pr.image ? [pr.image.replace(/\.[a-z]+$/i, '-thumb.webp')] : [])),
  );
  protected readonly first = person.name.split(' ')[0];
  protected readonly last = person.name.split(' ').slice(1).join(' ');
  /**
   * Letter by letter for the punk theme's cut-out name; hidden from assistive tech, the plain
   * name is read. `cut` (0-4) picks the scrap style and runs on across words, so no two words start alike.
   */
  protected readonly words = (() => {
    let n = 0;
    return [this.first, this.last].map((w) => [...w].map((ch) => ({ ch, cut: n++ % 5 })));
  })();
  protected readonly slots = [0, 1, 2, 3, 4];

  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly p = computed(() => profile[this.lang()]);
  protected readonly city = computed(() => this.p().location.split(',')[0]);
  protected readonly stack = computed(() => [
    ...new Set(this.p().skills.flatMap((g) => g.items)),
  ]);
}
