import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MotionPrefService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly preference = signal(false);
  private explicit = false;
  readonly reduce = this.preference.asReadonly();

  constructor() {
    if (!this.browser) return;
    const media = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
    let saved: string | null = null;
    try { saved = this.document.defaultView?.localStorage.getItem('motion-pref') ?? null; } catch {}
    this.explicit = saved === 'reduce' || saved === 'full' || saved === '';
    this.apply(this.explicit ? saved === 'reduce' : !!media?.matches);
    const onChange = () => { if (!this.explicit) this.apply(!!media?.matches); };
    media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => media?.removeEventListener('change', onChange));
  }

  set(reduce: boolean): void {
    this.explicit = true;
    this.apply(reduce);
    if (!this.browser) return;
    try { this.document.defaultView?.localStorage.setItem('motion-pref', reduce ? 'reduce' : 'full'); } catch {}
  }

  private apply(reduce: boolean): void {
    this.preference.set(reduce);
    if (this.browser) this.document.documentElement.dataset['motion'] = reduce ? 'reduce' : 'full';
  }
}
