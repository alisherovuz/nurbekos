import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NurbekOS v4 — Nurbek Alisherov',
  description: 'An interactive Windows XP-inspired portfolio for Nurbek Alisherov: projects, experience, achievements, photos and more.',
  applicationName: 'NurbekOS',
  authors: [{name: 'Nurbek Alisherov'}],
  creator: 'Nurbek Alisherov',
  robots: {index: true, follow: true},
  openGraph: {
    title: 'NurbekOS v4 — Nurbek Alisherov',
    description: 'Explore Nurbek Alisherov’s work as a Windows XP-inspired desktop.',
    type: 'website',
  },
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
