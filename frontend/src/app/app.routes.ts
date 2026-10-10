import { Routes } from '@angular/router';
import { LANGS } from './i18n';
import { HomePage } from './pages/home';
import { ProjectPage } from './pages/project';
import { RootRedirect } from './pages/root-redirect';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: RootRedirect },
  ...LANGS.map((lang) => ({
    path: lang,
    data: { lang },
    children: [
      { path: '', component: HomePage },
      { path: 'projects/:slug', component: ProjectPage },
    ],
  })),
  { path: '**', redirectTo: '' },
];
