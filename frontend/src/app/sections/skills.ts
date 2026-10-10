import { Component, computed, input } from '@angular/core';
import { ui, type Lang } from '../i18n';
import { profile } from '../profile';
import { Reveal } from '../reveal';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [Reveal],
  template: `
    <section id="skills" class="section" aria-labelledby="h-skills">
      <div class="container">
        <h2 id="h-skills" class="section-num" reveal revealKind="heading">03 — {{ t().nav.skills }}</h2>
        <div class="skills-columns">
          @for (group of groups(); track group.group) {
            <div class="skills-group" reveal>
              <h3 class="mono">{{ group.group }}</h3>
              <ul role="list">
                @for (skill of group.items; track skill) {
                  <li><span>{{ skill }}</span></li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class SkillsSection {
  readonly lang = input.required<Lang>();
  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly groups = computed(() => profile[this.lang()].skills);
}
