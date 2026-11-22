import type {Experience, Project} from '../data';

export type RouteApp =
  | 'welcome' | 'about' | 'projects' | 'projectDetail' | 'experience' | 'experienceProperties'
  | 'achievements' | 'gallery' | 'contact' | 'games' | 'documents' | 'recycle';

export type Route = {app: RouteApp; project?: string; experience?: string};

export function slugify(value: string) {
  return value.toLowerCase().replace(/[’'‘`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

export function projectSlug(project: Pick<Project, 'name' | 'slug'>) {
  return project.slug?.trim() ? slugify(project.slug) : slugify(project.name);
}

const SIMPLE: Record<string, RouteApp> = {
  about: 'about',
  projects: 'projects',
  experience: 'experience',
  achievements: 'achievements',
  pictures: 'gallery',
  contact: 'contact',
  games: 'games',
  documents: 'documents',
  archive: 'recycle',
};

/** Maps a URL path (split into segments) to the window it should open. Returns null for unknown paths. */
export function parseSegments(segments: string[], projects: Project[], experiences: Experience[]): Route | null {
  const [first, second, ...rest] = segments.map(s => decodeURIComponent(s).toLowerCase());
  if (!first) return {app: 'welcome'};
  if (rest.length) return null;
  if (first === 'projects' && second) {
    const project = projects.find(p => projectSlug(p) === second);
    return project ? {app: 'projectDetail', project: project.name} : null;
  }
  if (first === 'experience' && second) {
    const experience = experiences.find(e => e.id === second);
    return experience ? {app: 'experienceProperties', experience: experience.id} : null;
  }
  if (second) return null;
  const app = SIMPLE[first];
  return app ? {app} : null;
}

/** The shareable URL for a window, or null when the window has no page of its own. */
export function pathFor(win: {app: string; project?: string; experience?: string}, projects: Project[]): string | null {
  switch (win.app) {
    case 'welcome': return '/';
    case 'about': return '/about';
    case 'projects': return '/projects';
    case 'projectDetail':
    case 'projectFolder':
    case 'properties': {
      const project = projects.find(p => p.name === win.project);
      return project ? `/projects/${projectSlug(project)}` : '/projects';
    }
    case 'experience': return '/experience';
    case 'experienceProperties': return win.experience ? `/experience/${win.experience}` : '/experience';
    case 'achievements':
    case 'achievementDetail': return '/achievements';
    case 'gallery':
    case 'photoViewer': return '/pictures';
    case 'contact': return '/contact';
    case 'games':
    case 'snake':
    case 'minesweeper': return '/games';
    case 'documents': return '/documents';
    case 'recycle': return '/archive';
    default: return null;
  }
}
