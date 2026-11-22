import type {MetadataRoute} from 'next';
import {getContent} from '@/lib/content';
import {projectSlug} from './desktop/routes';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.SITE_URL || 'https://alisherov.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({url: `${SITE_URL}${path}`, lastModified: now, changeFrequency: 'weekly', priority});
  return [
    page('/', 1),
    page('/projects', 0.9),
    ...content.projects.map(p => page(`/projects/${projectSlug(p)}`, p.featured ? 0.8 : 0.5)),
    page('/experience', 0.8),
    ...content.experiences.map(e => page(`/experience/${e.id}`, 0.5)),
    page('/achievements', 0.7),
    page('/about', 0.7),
    page('/contact', 0.6),
    page('/pictures', 0.4),
  ];
}
