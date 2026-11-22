import type {Metadata} from 'next';
import {adminConfigured, isAdmin} from '@/lib/auth';
import {getContent} from '@/lib/content';
import AdminApp from './AdminApp';
import './admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {absolute: 'Control Panel · nurbekOS'},
  robots: {index: false, follow: false},
};

export default async function AdminPage() {
  const [signedIn, content] = await Promise.all([isAdmin(), getContent()]);
  return (
    <AdminApp
      signedIn={signedIn}
      configured={adminConfigured()}
      owner={{name: content.profile.name, photo: content.profile.photo}}
      telegramConnected={Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)}
    />
  );
}
