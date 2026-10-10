import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_LANG, LANGS, isLang, type Lang } from '../i18n';

/** Same key the header writes when the visitor picks a language. */
const LANG_KEY = 'lang-pref';

/** A language the visitor picked earlier on this site, if it is one of ours. */
function storedLang(): Lang | undefined {
  try {
    const value = localStorage.getItem(LANG_KEY) ?? undefined;
    return isLang(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** The first browser language we support. */
function browserLang(): Lang | undefined {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    return list.map((l) => (l ?? '').slice(0, 2).toLowerCase()).find(isLang);
  } catch {
    return undefined;
  }
}

/** `/` → the saved choice, else the visitor's preferred language, English if none of ours matches. */
@Component({
  selector: 'app-root-redirect',
  template: `
    <p style="padding: 1.5rem">
      @for (l of langs; track l) {
        <a [href]="l + '/'" style="margin-right: 1rem">{{ l.toUpperCase() }}</a>
      }
    </p>
  `,
})
export class RootRedirect {
  protected readonly langs = LANGS;

  constructor() {
    const lang = storedLang() ?? browserLang() ?? DEFAULT_LANG;
    void inject(Router).navigate(['/', lang], { replaceUrl: true });
  }
}
