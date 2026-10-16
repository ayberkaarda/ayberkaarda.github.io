import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Cross-fade between routes; the project screenshot morphs from card to detail
      // (shared `view-transition-name: project-<slug>`). Skipped on first load, in
      // background tabs (a pending transition would leave the page blank) and when
      // the resolved motion preference is reduced.
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          const reduce = document.documentElement.dataset['motion'] === 'reduce';
          if (document.hidden || reduce) transition.skipTransition();
        },
      }),
      // Route `data` ({ lang }) is inherited by the child pages.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
