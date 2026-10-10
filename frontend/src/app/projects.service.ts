import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import type { Lang } from './i18n';

/** One block of a details section, parsed by the admin export from its markdown-lite source. */
export type DetailBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

export interface DetailSection {
  /** '' for introductory text before the first heading. */
  heading: string;
  blocks: DetailBlock[];
}

export interface ProjectText {
  name: string;
  summary: string;
  description: string;
  highlights: string[];
  /** Optional; older exports have none, which behaves as []. */
  sections?: DetailSection[];
}

export interface Project {
  slug: string;
  featured: boolean;
  year: number | null;
  wip: boolean;
  image: string | null;
  stack: string[];
  repoUrl: string;
  extraRepoUrls: string[];
  texts: Record<Lang, ProjectText>;
}

/**
 * Reads data/projects.json, which the Laravel admin panel generates.
 * Only projects marked visible there are ever in that file.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);

  /** undefined while loading, [] if the file could not be read. */
  readonly projects = toSignal(
    this.http.get<{ projects: Project[] }>('data/projects.json').pipe(
      map((res): Project[] =>
        res.projects.map((p) => ({ ...p, image: p.image?.replace(/^\//, '') ?? null })),
      ),
      catchError(() => of([] as Project[])),
    ),
  );
}
