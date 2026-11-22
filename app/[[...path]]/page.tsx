import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getContent} from '@/lib/content';
import type {SiteContent} from '../data';
import Desktop from '../desktop/Desktop';
import {parseSegments, projectSlug, type Route} from '../desktop/routes';
import {tashkentHour} from '../desktop/Wallpaper';

export const dynamic = 'force-dynamic';

type Props = {params: Promise<{path?: string[]}>; searchParams: Promise<{sky?: string}>};

// ?sky=dawn|day|golden|dusk|night previews the wallpaper at another time of day.
const SKY_PREVIEW: Record<string, number> = {dawn: 6, day: 12, golden: 18, dusk: 20, night: 2};

function describe(route: Route, content: SiteContent) {
  const {profile} = content;
  const base = `${profile.name} — ${profile.headline}`;
  switch (route.app) {
    case 'projectDetail': {
      const project = content.projects.find(p => p.name === route.project);
      if (!project) break;
      return {
        title: `${project.name} · ${profile.name}`,
        description: `${project.description}${project.role ? ` ${profile.name}: ${project.role}.` : ''}`,
        og: {title: project.name, subtitle: project.description, kicker: project.role || project.kind, path: `/projects/${projectSlug(project)}`},
      };
    }
    case 'experienceProperties': {
      const experience = content.experiences.find(e => e.id === route.experience);
      if (!experience) break;
      return {
        title: `${experience.role} at ${experience.organization} · ${profile.name}`,
        description: experience.description,
        og: {title: experience.organization, subtitle: experience.description, kicker: experience.role, path: `/experience/${experience.id}`},
      };
    }
    case 'projects': return {title: `Projects · ${profile.name}`, description: `Products and experiments by ${profile.name}: ${content.projects.filter(p => p.featured).map(p => p.name).join(', ')} and more.`, og: {title: 'My Projects', subtitle: content.projects.filter(p => p.featured).map(p => p.name).join(' · '), kicker: profile.name, path: '/projects'}};
    case 'experience': return {title: `Experience · ${profile.name}`, description: `Roles and organizations: ${content.experiences.slice(0, 5).map(e => e.organization).join(', ')}.`, og: {title: 'Work Experience', subtitle: content.experiences.slice(0, 4).map(e => e.organization).join(' · '), kicker: profile.name, path: '/experience'}};
    case 'achievements': return {title: `Achievements · ${profile.name}`, description: content.awards.slice(0, 3).map(a => a.name).join(' · '), og: {title: 'Achievements', subtitle: content.awards.slice(0, 3).map(a => a.name).join(' · '), kicker: profile.name, path: '/achievements'}};
    case 'about': return {title: `About · ${profile.name}`, description: profile.bio, og: {title: profile.name, subtitle: profile.bio, kicker: 'About', path: '/about'}};
    case 'contact': return {title: `Contact · ${profile.name}`, description: `Send ${profile.name} a message about collaboration, speaking, mentoring or anything else.`, og: {title: 'Say hello', subtitle: 'Collaboration · Speaking · Mentoring', kicker: profile.name, path: '/contact'}};
    case 'gallery': return {title: `Pictures · ${profile.name}`, description: `Photos from projects, events, hackathons and achievements.`, og: {title: 'My Pictures', subtitle: 'Projects · Events · Achievements', kicker: profile.name, path: '/pictures'}};
    case 'games': return {title: `Games · nurbekOS`, description: 'Play Snake and Minesweeper inside nurbekOS.', og: {title: 'Games', subtitle: 'Snake.exe · Minesweeper.exe', kicker: 'nurbekOS', path: '/games'}};
    default: break;
  }
  return {title: `${base} · nurbekOS`, description: profile.pitch, og: {title: profile.name, subtitle: profile.pitch, kicker: profile.headline, path: '/'}};
}

async function resolve(params: Props['params']) {
  const {path = []} = await params;
  const content = await getContent();
  const route = parseSegments(path, content.projects, content.experiences);
  return {content, route};
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {content, route} = await resolve(params);
  if (!route) return {title: 'Page not found · nurbekOS'};
  const meta = describe(route, content);
  const og = `/og?${new URLSearchParams({t: meta.og.title, s: meta.og.subtitle.slice(0, 160), k: meta.og.kicker})}`;
  return {
    title: {absolute: meta.title},
    description: meta.description.slice(0, 300),
    alternates: {canonical: meta.og.path},
    openGraph: {title: meta.title, description: meta.description.slice(0, 300), url: meta.og.path, type: route.app === 'welcome' ? 'profile' : 'website', siteName: 'nurbekOS — Nurbek Alisherov', images: [{url: og, width: 1200, height: 630, alt: meta.og.title}]},
    twitter: {card: 'summary_large_image', title: meta.title, description: meta.description.slice(0, 200), images: [og]},
  };
}

export default async function Page({params, searchParams}: Props) {
  const {sky} = await searchParams;
  const skyPreview = sky && sky in SKY_PREVIEW ? SKY_PREVIEW[sky] : undefined;
  const {content, route} = await resolve(params);
  if (!route) notFound();
  const {profile, projects, experiences, awards} = content;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: profile.links.website,
    image: `${profile.links.website}${profile.photo}`,
    jobTitle: profile.headline,
    description: profile.pitch,
    address: {'@type': 'PostalAddress', addressLocality: profile.location},
    sameAs: [profile.links.linkedin, profile.links.telegram, profile.links.github],
    alumniOf: profile.education ? {'@type': 'CollegeOrUniversity', name: profile.education.split(',')[0]} : undefined,
    knowsAbout: profile.focus.split('·').map(s => s.trim()),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}}/>
      {/* A plain-text version of the portfolio for search engines and screen readers. */}
      <div className="sr-only">
        <h1>{profile.name} — {profile.headline}</h1>
        <p>{profile.pitch}</p>
        <p>{profile.bio}</p>
        <nav aria-label="Portfolio sections">
          <a href="/projects">Projects</a> <a href="/experience">Experience</a> <a href="/achievements">Achievements</a> <a href="/about">About</a> <a href="/contact">Contact</a> <a href="/cv">CV</a>
        </nav>
        <h2>Projects</h2>
        <ul>{projects.map(p => <li key={p.name}><a href={`/projects/${projectSlug(p)}`}>{p.name}</a> — {p.description}</li>)}</ul>
        <h2>Experience</h2>
        <ul>{experiences.map(e => <li key={e.id}><a href={`/experience/${e.id}`}>{e.role}, {e.organization}</a> ({e.period})</li>)}</ul>
        <h2>Achievements</h2>
        <ul>{awards.map(a => <li key={`${a.year}-${a.name}`}>{a.year}: {a.name}</li>)}</ul>
      </div>
      <Desktop content={content} initialRoute={route} initialHour={skyPreview ?? tashkentHour()} skyLocked={skyPreview !== undefined}/>
    </>
  );
}
