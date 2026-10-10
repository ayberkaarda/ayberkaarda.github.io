import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MotionPrefService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly preference = signal(false);
  readonly reduce = this.preference.asReadonly();

  constructor() {
    if (!this.browser) return;
    let reduce = false;
    try { reduce = this.document.defaultView?.localStorage.getItem('motion-pref') === 'reduce'; } catch {}
    this.apply(reduce);
  }

  set(reduce: boolean): void {
    this.apply(reduce);
    if (!this.browser) return;
    try { this.document.defaultView?.localStorage.setItem('motion-pref', reduce ? 'reduce' : ''); } catch {}
  }

  private apply(reduce: boolean): void {
    this.preference.set(reduce);
    if (this.browser) this.document.documentElement.dataset['motion'] = reduce ? 'reduce' : '';
  }
}
