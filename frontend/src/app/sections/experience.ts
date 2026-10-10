import { Component, computed, input } from '@angular/core';
import { formatMonth, ui, type Lang } from '../i18n';
import { profile } from '../profile';
import { Reveal } from '../reveal';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [Reveal],
  template: `
    <section id="experience" class="section band" aria-labelledby="h-experience">
      <div class="container">
        <h2 id="h-experience" class="section-num" reveal revealKind="heading">02 — {{ t().nav.experience }}</h2>
        @for (job of p().jobs; track job.org) {
          <article class="experience-entry" reveal>
            <p class="experience-date mono">{{ range(job) }}</p>
            <div class="experience-body">
              <h3>{{ job.org }}</h3>
              <p class="experience-role">{{ job.role }} · {{ job.place }}</p>
              <ul class="experience-points">
                @for (point of job.points; track point) { <li>{{ point }}</li> }
              </ul>
            </div>
          </article>
        }
        <div class="education-block" reveal>
          <h3 class="mono">{{ t().nav.education }}</h3>
          @for (school of p().schools; track school.org) {
            <article class="education-entry">
              <p class="experience-date mono">{{ range(school) }}</p>
              <div>
                <h3>{{ school.org }}</h3>
                <p>{{ school.degree }} · {{ school.place }}</p>
                <ul class="education-points" role="list">
                  @for (point of school.points; track point) { <li>{{ point }}</li> }
                </ul>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class ExperienceSection {
  readonly lang = input.required<Lang>();
  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly p = computed(() => profile[this.lang()]);
  protected range(span: { from: [number, number]; to: [number, number] }): string {
    return `${formatMonth(...span.from, this.lang())} – ${formatMonth(...span.to, this.lang())}`;
  }
}
