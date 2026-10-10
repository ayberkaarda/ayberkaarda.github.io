import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ui, type Lang } from './i18n';
import { ThemeService } from './theme';

export interface MenuItem {
  id: string;
  label: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Small-screen section menu: a modal <dialog> that slides up from the bottom.
 * showModal() makes the rest of the page inert; Tab is kept inside the sheet,
 * Esc closes it and focus goes back to the button that opened it.
 */
@Component({
  selector: 'app-mobile-menu',
  imports: [RouterLink],
  template: `
    <dialog
      #dlg
      class="m-menu"
      [attr.aria-label]="t().menuLabel"
      (close)="onClose()"
      (click)="onBackdrop($event)"
      (keydown)="trap($event)"
    >
      <div class="m-menu__head">
        <span class="label">{{ t().menuLabel }}</span>
        <button type="button" class="m-menu__close" (click)="close()">
          {{ t().menu.close }}
        </button>
      </div>
      <nav [attr.aria-label]="t().menuLabel">
        <ul class="m-menu__list" role="list">
          @for (s of items(); track s.id) {
            <li>
              <a
                class="m-menu__link"
                [routerLink]="target()"
                [fragment]="s.id"
                [class.active]="active() === s.id"
                [attr.aria-current]="active() === s.id ? 'location' : null"
                (click)="close()"
                >{{ s.label }}</a
              >
            </li>
          }
        </ul>
      </nav>
      <button type="button" class="btn btn--ghost m-menu__theme" (click)="theme.toggle()">
        @if (theme.next() === 'light') {
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4.25" />
            <path
              d="M12 2.75v2.5M12 18.75v2.5M2.75 12h2.5M18.75 12h2.5M5.46 5.46l1.77 1.77M16.77 16.77l1.77 1.77M5.46 18.54l1.77-1.77M16.77 7.23l1.77-1.77"
            />
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M20.25 14.6A8.25 8.25 0 0 1 9.4 3.75a8.25 8.25 0 1 0 10.85 10.85Z" />
          </svg>
        }
        <span>{{ theme.label(lang()) }}</span>
      </button>
    </dialog>
  `,
})
export class MobileMenu {
  readonly lang = input.required<Lang>();
  readonly items = input<MenuItem[]>([]);
  /** routerLink commands for the section links (fragment is added per item). */
  readonly target = input<string[]>([]);
  readonly active = input('');

  protected readonly t = computed(() => ui[this.lang()]);
  protected readonly theme = inject(ThemeService);

  readonly isOpen = signal(false);

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private opener: HTMLElement | null = null;

  open(opener?: HTMLElement): void {
    const d = this.dlg().nativeElement;
    if (d.open) return;
    this.opener = opener ?? (document.activeElement as HTMLElement | null);
    d.showModal();
    this.isOpen.set(true);
  }

  close(): void {
    const d = this.dlg().nativeElement;
    if (d.open) d.close();
  }

  protected onClose(): void {
    this.isOpen.set(false);
    const el = this.opener;
    this.opener = null;
    if (el?.isConnected) el.focus();
  }

  /** A click on the dialog box itself (not its content) is a click on the backdrop. */
  protected onBackdrop(e: MouseEvent): void {
    const d = this.dlg().nativeElement;
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) this.close();
  }

  protected trap(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const nodes = Array.from(
      this.dlg().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
