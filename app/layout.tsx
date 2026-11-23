import type {Metadata, Viewport} from 'next';
import {Libre_Franklin} from 'next/font/google';
import './globals.css';

// Franklin Gothic was the typeface of the original Windows XP logo; Libre Franklin is its modern revival.
const franklin = Libre_Franklin({subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--font-display', display: 'swap'});

const SITE_URL = process.env.SITE_URL || 'https://alisherov.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {default: 'Nurbek Alisherov — Founder & AI builder · nurbekOS', template: '%s'},
  description: 'Nurbek Alisherov builds AI and education products for young people in Uzbekistan. Explore his projects, experience and achievements in nurbekOS, a Windows XP-inspired portfolio.',
  applicationName: 'nurbekOS',
  authors: [{name: 'Nurbek Alisherov', url: SITE_URL}],
  creator: 'Nurbek Alisherov',
  keywords: ['Nurbek Alisherov', 'EduGrants', 'Empira', 'Uzbekistan', 'AI', 'EdTech', 'founder', 'portfolio'],
  robots: {index: true, follow: true},
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#245ec5',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="en" className={franklin.variable}><body>{children}</body></html>;
}
