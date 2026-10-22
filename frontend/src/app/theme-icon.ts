import { Component, input } from '@angular/core';
import type { Theme } from './theme';

/** Theme glyph: sun, moon or a punk burst. Decorative; the control around it carries the name. */
@Component({
  selector: 'app-theme-icon',
  template: `
    @switch (theme()) {
      @case ('light') {
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.25" />
          <path
            d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.46 5.46l1.77 1.77M16.77 16.77l1.77 1.77M5.46 18.54l1.77-1.77M16.77 7.23l1.77-1.77"
          />
        </svg>
      }
      @case ('dark') {
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path d="M20.25 14.6A8.25 8.25 0 0 1 9.4 3.75a8.25 8.25 0 1 0 10.85 10.85Z" />
        </svg>
      }
      @case ('punk') {
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path
            d="M12 2.5 13.5 8.3 18.1 5.9 15.7 10.5 21.5 12 15.7 13.5 17.8 17.8 13.5 15.7 12 21.2 10.5 15.7 5.8 18.2 8.3 13.5 2.7 12 8.3 10.5 6.1 6.1 10.5 8.3Z"
          />
        </svg>
      }
    }
  `,
})
export class ThemeIcon {
  readonly theme = input.required<Theme>();
}
