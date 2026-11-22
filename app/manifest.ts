import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'nurbekOS — Nurbek Alisherov',
    short_name: 'nurbekOS',
    description: 'Nurbek Alisherov’s portfolio, built like a Windows XP desktop.',
    start_url: '/',
    display: 'standalone',
    background_color: '#245ec5',
    theme_color: '#245ec5',
    icons: [{src: '/icon.svg', sizes: 'any', type: 'image/svg+xml'}],
  };
}
