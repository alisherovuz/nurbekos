import type {Metadata, Viewport} from 'next';
import './globals.css';

const SITE_URL = process.env.SITE_URL || 'https://alisherov.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {default: 'Nurbek Alisherov — Founder & AI builder · nurbekOS', template: '%s'},
  description: 'Nurbek Alisherov builds AI and education products for young people in Uzbekistan. Explore his projects, experience and achievements in nurbekOS, a Windows XP-inspired portfolio.',
  applicationName: 'nurbekOS',
  authors: [{name: 'Nurbek Alisherov', url: SITE_URL}],
  creator: 'Nurbek Alisherov',
  keywords: ['Nurbek Alisherov', 'EduGrands', 'Empira', 'Uzbekistan', 'AI', 'EdTech', 'founder', 'portfolio'],
  robots: {index: true, follow: true},
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#245ec5',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
