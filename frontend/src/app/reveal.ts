import { Directive, DestroyRef, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

/**
 * Fades an element in the first time it scrolls into view.
 * `[reveal]="80"` adds an 80 ms delay (for staggering). The CSS only hides the
 * element when the visitor has not asked for reduced motion.
 */
@Directive({
  selector: '[reveal]',
  host: {
    class: 'reveal',
    '[class.is-in]': 'shown()',
    '[class.reveal--heading]': "revealKind() === 'heading'",
    '[style.transition-delay.ms]': 'delayMs()',
  },
})
export class Reveal {
  /** Delay in ms; an empty attribute (`reveal`) means none. */
  readonly reveal = input<number | ''>('');
  readonly revealKind = input<'default' | 'heading'>('default');

  protected readonly shown = signal(false);
  protected delayMs = () => Number(this.reveal()) || 0;

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      let observer: IntersectionObserver | undefined;
      const show = () => {
        this.shown.set(true);
        observer?.disconnect();
      };
      const checkMotion = () => {
        if (document.documentElement.dataset['motion'] === 'reduce') show();
      };
      const preferenceObserver = new MutationObserver(checkMotion);
      preferenceObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
      destroyRef.onDestroy(() => {
        observer?.disconnect();
        preferenceObserver.disconnect();
      });
      checkMotion();
      if (this.shown()) return;
      if (typeof IntersectionObserver === 'undefined') {
        this.shown.set(true);
        return;
      }
      // A heading is fully clipped until it is shown, and a fully clipped box
      // never reports an intersection; watch its (unclipped) parent instead.
      const heading = this.revealKind() === 'heading';
      const target = (heading && el.parentElement) || el;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            show();
          }
        },
        { threshold: heading ? 0 : 0.08, rootMargin: '0px 0px -6% 0px' },
      );
      observer.observe(target);
    });
  }
}
