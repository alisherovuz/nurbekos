import {defaultContent, type Award, type Experience, type Profile, type Project, type SiteContent} from '@/app/data';
import {readJson, writeJson} from './store';
import {projectSlug, slugify} from '@/app/desktop/routes';

const FILE = 'content.json';

export {slugify, projectSlug};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const strList = (value: unknown) => (Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : []);
const metrics = (value: unknown) => (Array.isArray(value)
  ? value.filter(isObject).map(m => ({value: str(m.value), label: str(m.label)})).filter(m => m.value || m.label)
  : undefined);

/** Validates and normalises content coming from disk or from the admin editor. */
export function normalizeContent(input: unknown): SiteContent {
  const src = isObject(input) ? input : {};
  const d = defaultContent;

  const p = isObject(src.profile) ? src.profile : {};
  const links = isObject(p.links) ? p.links : {};
  const profile: Profile = {
    name: str(p.name, d.profile.name),
    handle: str(p.handle, d.profile.handle),
    location: str(p.location, d.profile.location),
    headline: str(p.headline, d.profile.headline),
    pitch: str(p.pitch, d.profile.pitch),
    focus: str(p.focus, d.profile.focus),
    education: str(p.education, d.profile.education),
    photo: str(p.photo, d.profile.photo),
    bio: str(p.bio, d.profile.bio),
    computerName: str(p.computerName, d.profile.computerName),
    workgroup: str(p.workgroup, d.profile.workgroup),
    now: Array.isArray(p.now) ? strList(p.now) : d.profile.now,
    stats: metrics(p.stats) ?? d.profile.stats,
    links: {
      website: str(links.website, d.profile.links.website),
      github: str(links.github, d.profile.links.github),
      telegram: str(links.telegram, d.profile.links.telegram),
      linkedin: str(links.linkedin, d.profile.links.linkedin),
    },
  };

  const tones = ['blue', 'green', 'orange', 'purple', 'red', 'teal'] as const;
  const statuses = ['active', 'archived', 'experiment'] as const;

  const projects: Project[] = Array.isArray(src.projects)
    ? src.projects.filter(isObject).map(x => ({
      name: str(x.name, 'Untitled project'),
      slug: str(x.slug) || undefined,
      kind: str(x.kind),
      url: str(x.url),
      year: str(x.year),
      status: (statuses as readonly string[]).includes(str(x.status)) ? x.status as Project['status'] : 'active',
      description: str(x.description),
      detail: str(x.detail),
      tech: str(x.tech),
      role: str(x.role) || undefined,
      featured: x.featured === true,
      coverTone: (tones as readonly string[]).includes(str(x.coverTone)) ? x.coverTone as Project['coverTone'] : 'blue',
      logo: str(x.logo) || undefined,
      metrics: metrics(x.metrics),
    }))
    : d.projects;

  const experiences: Experience[] = Array.isArray(src.experiences)
    ? src.experiences.filter(isObject).map((x, i) => ({
      id: slugify(str(x.id) || str(x.organization) || `experience-${i + 1}`),
      organization: str(x.organization, 'Organization'),
      role: str(x.role),
      period: str(x.period),
      location: str(x.location),
      website: str(x.website) || undefined,
      logo: str(x.logo) || undefined,
      description: str(x.description),
      highlights: strList(x.highlights),
      relatedProject: str(x.relatedProject) || undefined,
    }))
    : d.experiences;

  const awards: Award[] = Array.isArray(src.awards)
    ? src.awards.filter(isObject).map(x => ({
      year: str(x.year),
      name: str(x.name, 'Award'),
      issuer: str(x.issuer) || undefined,
      description: str(x.description),
    }))
    : d.awards;

  return {profile, projects, experiences, awards};
}

export async function getContent(): Promise<SiteContent> {
  const saved = await readJson<unknown>(FILE, null);
  return saved ? normalizeContent(saved) : defaultContent;
}

export async function saveContent(input: unknown): Promise<SiteContent> {
  const content = normalizeContent(input);
  await writeJson(FILE, {...content, savedAt: new Date().toISOString()});
  return content;
}

export async function resetContent() {
  await writeJson(FILE, {...defaultContent, savedAt: new Date().toISOString()});
  return defaultContent;
}
