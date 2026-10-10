import { Component, computed, inject, input } from '@angular/core';
import { ui, type Lang } from '../i18n';
import { person } from '../profile';
import { MotionPrefService } from '../motion-pref';
import { Reveal } from '../reveal';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [Reveal],
  template: `
    <section id="contact" class="section" aria-labelledby="h-contact">
      <div class="container">
        <p class="section-num" reveal>04 — {{ t().nav.contact }}</p>
        <h2 id="h-contact" class="display contact-title" reveal revealKind="heading">{{ t().contact.title }}</h2>
        <a class="contact-email" [href]="'mailto:' + person.email">{{ person.email }}</a>
        <div class="contact-links">
          <a class="btn btn--ghost" [href]="person.linkedin" rel="noopener">LinkedIn</a>
          <a class="btn btn--ghost" [href]="person.github" rel="noopener">GitHub</a>        </div>
        <footer class="contact-footer mono">
          <span>{{ year }} · {{ city() }} ·</span>
          <button type="button" class="motion-toggle" [attr.aria-pressed]="motion.reduce()"
            (click)="motion.set(!motion.reduce())">{{ t().motion.reduce }}</button>
        </footer>
      </div>
    </section>
  `,
})
export class ContactSection {
  readonly lang = input.required<Lang>();
  protected readonly person = person;
  protected readonly year = new Date().getFullYear();
  protected readonly motion = inject(MotionPrefService);
  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly city = computed(() => this.lang() === 'tr' ? 'İstanbul' : 'Istanbul');
}
