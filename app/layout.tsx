import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'NurbekOS — Nurbek Alisherov',description:'A desktop full of things Nurbek Alisherov has built.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
