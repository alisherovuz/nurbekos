'use client';

import {type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import type {Stats} from '@/lib/analytics';
import type {Message} from '@/lib/messages';
import type {Metric, SiteContent} from '../data';

type Section = 'dashboard' | 'messages' | 'content' | 'setup';
type Owner = {name: string; photo: string};
type StatsResponse = Stats & {unread: number};

const I = '/icons/xp';

/* ───────────────────────── Shell ───────────────────────── */

export default function AdminApp({signedIn, configured, owner, telegramConnected}: {signedIn: boolean; configured: boolean; owner: Owner; telegramConnected: boolean}) {
  const [authed, setAuthed] = useState(signedIn);
  if (!authed) return <Login configured={configured} owner={owner} onSuccess={() => setAuthed(true)}/>;
  return <ControlPanel owner={owner} telegramConnected={telegramConnected} onSignOut={() => setAuthed(false)}/>;
}

function Login({configured, owner, onSuccess}: {configured: boolean; owner: Owner; onSuccess: () => void}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password})});
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) throw new Error(data.error || 'Could not sign in.');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="logon">
      <div className="logon-band top"/>
      <div className="logon-center">
        <div className="logon-brand">
          <span className="logon-word">nurbek<em>OS</em></span>
          <p>To begin, sign in to the Control Panel.</p>
        </div>
        <div className="logon-divider"/>
        <form className="logon-user" onSubmit={submit}>
          <img src={owner.photo} alt="" width={64} height={64}/>
          <div>
            <b>{owner.name}</b>
            {configured ? (
              <>
                <label htmlFor="pw" className="logon-label">Type your password</label>
                <div className="logon-row">
                  <input id="pw" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} autoFocus disabled={busy}/>
                  <button type="submit" aria-label="Sign in" disabled={busy || !password}>➜</button>
                </div>
                {error && <p className="logon-error" role="alert">{error}</p>}
              </>
            ) : (
              <p className="logon-setup">The admin password isn’t set yet. In Livops, open this project → Variables and add <code>ADMIN_PASSWORD</code> (at least 8 characters). The service restarts and this screen will ask for it.</p>
            )}
          </div>
        </form>
      </div>
      <div className="logon-band bottom"><a href="/">← Back to alisherov.com</a><span>After you sign in, you can see visitors, read messages and edit the site.</span></div>
    </main>
  );
}

function ControlPanel({owner, telegramConnected, onSignOut}: {owner: Owner; telegramConnected: boolean; onSignOut: () => void}) {
  const [section, setSection] = useState<Section>('dashboard');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '') as Section;
    if (['dashboard', 'messages', 'content', 'setup'].includes(fromHash)) setSection(fromHash);
  }, []);

  function go(next: Section) {
    setSection(next);
    window.history.replaceState(null, '', `#${next}`);
  }

  async function signOut() {
    await fetch('/api/admin/logout', {method: 'POST'});
    onSignOut();
  }

  const nav: {id: Section; label: string; icon: string; badge?: number}[] = [
    {id: 'dashboard', label: 'Dashboard', icon: `${I}/views.svg`},
    {id: 'messages', label: 'Messages', icon: `${I}/mail.svg`, badge: unread},
    {id: 'content', label: 'Edit site content', icon: `${I}/notepad.svg`},
    {id: 'setup', label: 'Setup & help', icon: `${I}/properties.svg`},
  ];
  const titles: Record<Section, string> = {dashboard: 'Dashboard', messages: 'Messages', content: 'Site content', setup: 'Setup & help'};

  return (
    <div className="cp">
      <header className="cp-titlebar">
        <span><img src={`${I}/my-computer.svg`} alt="" width={18} height={18}/>Control Panel — nurbekOS</span>
        <span className="cp-title-actions"><a href="/" target="_blank" rel="noopener noreferrer">View site ↗</a><button type="button" onClick={signOut}>Sign out</button></span>
      </header>
      <div className="cp-body">
        <aside className="cp-side">
          <div className="cp-user"><img src={owner.photo} alt="" width={40} height={40}/><div><b>{owner.name}</b><span>Administrator</span></div></div>
          <div className="task-panel">
            <strong>Control Panel</strong>
            {nav.map(item => (
              <button type="button" key={item.id} className={section === item.id ? 'cp-nav active' : 'cp-nav'} onClick={() => go(item.id)}>
                <img src={item.icon} alt="" width={20} height={20}/>{item.label}{item.badge ? <span className="cp-badge">{item.badge}</span> : null}
              </button>
            ))}
          </div>
          <div className="task-panel">
            <strong>See also</strong>
            <a className="cp-link" href="/" target="_blank" rel="noopener noreferrer">Open alisherov.com</a>
            <a className="cp-link" href="/sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap</a>
            <a className="cp-link" href="/og" target="_blank" rel="noopener noreferrer">Share preview image</a>
          </div>
          <div className="task-panel"><strong>Details</strong><p>Stats are privacy-friendly: no cookies, no IP addresses stored, and your own visits aren’t counted while you’re signed in.</p></div>
        </aside>
        <main className="cp-main">
          <h1 className="cp-h1">{titles[section]}</h1>
          {section === 'dashboard' && <Dashboard onUnread={setUnread} onOpenMessages={() => go('messages')}/>}
          {section === 'messages' && <Messages onUnread={setUnread}/>}
          {section === 'content' && <ContentEditor/>}
          {section === 'setup' && <Setup telegramConnected={telegramConnected}/>}
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────── Dashboard ───────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');

function timeAgo(t: number) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Desktop (home)', '/projects': 'My Projects', '/experience': 'Work Experience', '/achievements': 'Achievements', '/about': 'My Computer (about)',
  '/contact': 'Contact', '/pictures': 'My Pictures', '/games': 'Games', '/documents': 'My Documents', '/archive': 'Archive', '/welcome': 'Start Here',
  '/search': 'Search', '/terminal': 'Terminal', '/run': 'Run…', '/badges': 'NurbekOS Achievements', '/browser': 'In-site browser',
};
function pageLabel(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith('/projects/')) return `Project · ${path.slice(10)}`;
  if (path.startsWith('/experience/')) return `Experience · ${path.slice(12)}`;
  return path;
}

const LANGS: Record<string, string> = {en: 'English', ru: 'Russian', uz: 'Uzbek', tr: 'Turkish', kk: 'Kazakh', de: 'German', ko: 'Korean', zh: 'Chinese', ar: 'Arabic', fr: 'French', es: 'Spanish', tg: 'Tajik', ky: 'Kyrgyz'};

function Dashboard({onUnread, onOpenMessages}: {onUnread: (n: number) => void; onOpenMessages: () => void}) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, {cache: 'no-store'});
      if (!res.ok) throw new Error(res.status === 401 ? 'Your session expired. Reload and sign in again.' : 'Could not load stats.');
      const data = (await res.json()) as StatsResponse;
      setStats(data);
      onUnread(data.unread);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load stats.');
    }
  }, [days, onUnread]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (error) return <div className="cp-empty error">{error}</div>;
  if (!stats) return <div className="cp-empty">Loading stats…</div>;

  const range = days === 7 ? stats.week : stats.month;
  const empty = stats.month.views === 0 && stats.month.opens === 0;

  return (
    <div className="dash">
      <div className="dash-toolbar">
        <span className="live-pill"><i/>{stats.live} {stats.live === 1 ? 'person' : 'people'} on the site now</span>
        <div className="seg" role="group" aria-label="Date range">
          {[7, 30, 90].map(d => <button type="button" key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d} days</button>)}
        </div>
        <button type="button" className="xp-button" onClick={() => void load()}>Refresh</button>
      </div>

      {empty && <div className="cp-note">No visits recorded yet. Stats start counting as soon as the site is live on Livops — share a link and come back.</div>}

      <div className="kpis">
        <Kpi label="Visitors today" value={stats.today.visitors} sub={`${fmt(stats.today.views)} page views`}/>
        <Kpi label="Visitors · 7 days" value={stats.week.visitors} sub={`${fmt(stats.week.views)} page views`}/>
        <Kpi label={`Visitors · ${days} days`} value={stats.month.visitors} sub={`${fmt(stats.month.views)} page views`}/>
        <Kpi label="Windows opened" value={range.opens} sub={days === 7 ? 'last 7 days' : `last ${days} days`}/>
        <Kpi label="CV downloads" value={range.cv} sub={days === 7 ? 'last 7 days' : `last ${days} days`}/>
        <Kpi label="Messages" value={range.messages} sub={stats.unread ? `${stats.unread} unread` : 'all read'} onClick={onOpenMessages}/>
      </div>

      <Panel title={`Visitors per day · last ${days} days`}>
        <TrafficChart series={stats.series}/>
      </Panel>

      <div className="dash-grid">
        <Panel title="Most opened windows"><BarList rows={stats.topWindows.map(r => ({label: pageLabel(r.key), count: r.count}))} empty="No windows opened yet."/></Panel>
        <Panel title="Where visitors come from"><BarList rows={stats.referrers.map(r => ({label: r.key, count: r.count}))} empty="No referrers yet."/></Panel>
        <Panel title="Landing pages"><BarList rows={stats.topPages.map(r => ({label: pageLabel(r.key), count: r.count}))} empty="No page views yet."/></Panel>
        <Panel title="Clicks to your links"><BarList rows={stats.clicks.map(r => ({label: r.key, count: r.count}))} empty="No outbound clicks yet."/></Panel>
        <Panel title="Devices"><BarList rows={stats.devices.map(r => ({label: r.key[0].toUpperCase() + r.key.slice(1), count: r.count}))} empty="—"/></Panel>
        <Panel title="Browsers & systems"><BarList rows={[...stats.browsers, ...stats.systems].map(r => ({label: r.key, count: r.count}))} empty="—"/></Panel>
        <Panel title="Visitor languages"><BarList rows={stats.languages.map(r => ({label: LANGS[r.key] || r.key.toUpperCase(), count: r.count}))} empty="—"/></Panel>
        {stats.countries.length > 0
          ? <Panel title="Countries"><BarList rows={stats.countries.map(r => ({label: r.key, count: r.count}))} empty="—"/></Panel>
          : <Panel title="Busiest hours (Tashkent time)"><Hours hours={stats.hours}/></Panel>}
      </div>

      {stats.countries.length > 0 && <Panel title="Busiest hours (Tashkent time)"><Hours hours={stats.hours}/></Panel>}

      <Panel title="Live activity">
        {stats.recent.length === 0 ? <p className="muted">Nothing yet.</p> : (
          <ul className="feed">
            {stats.recent.map((e, i) => (
              <li key={`${e.t}-${i}`}>
                <span className={`feed-type t-${e.type}`}>{e.type === 'view' ? 'Visit' : e.type === 'open' ? 'Opened' : e.type === 'cv' ? 'CV' : e.type === 'contact' ? 'Message' : e.type === 'click' ? 'Click' : e.type}</span>
                <span className="feed-what">{e.type === 'click' ? e.target : e.type === 'contact' ? `New message · ${e.target || ''}` : pageLabel(e.path || '/')}{e.ref ? <em> from {e.ref}</em> : null}</span>
                <span className="feed-meta">{e.device}{e.country ? ` · ${e.country}` : ''} · {timeAgo(e.t)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Kpi({label, value, sub, onClick}: {label: string; value: number; sub: string; onClick?: () => void}) {
  const body = <><span className="kpi-label">{label}</span><strong>{fmt(value)}</strong><span className="kpi-sub">{sub}</span></>;
  return onClick ? <button type="button" className="kpi clickable" onClick={onClick}>{body}</button> : <div className="kpi">{body}</div>;
}

function Panel({title, children}: {title: string; children: ReactNode}) {
  return <section className="panel"><h2>{title}</h2><div className="panel-body">{children}</div></section>;
}

function BarList({rows, empty}: {rows: {label: string; count: number}[]; empty: string}) {
  if (!rows.length) return <p className="muted">{empty}</p>;
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <ul className="barlist">
      {rows.map(r => (
        <li key={r.label}>
          <span className="bar" style={{width: `${Math.max(4, (r.count / max) * 100)}%`}}/>
          <span className="bar-label">{r.label}</span>
          <span className="bar-count">{fmt(r.count)}</span>
        </li>
      ))}
    </ul>
  );
}

function TrafficChart({series}: {series: StatsResponse['series']}) {
  const W = 760, H = 210, P = {l: 34, r: 10, t: 12, b: 26};
  const max = Math.max(4, ...series.map(s => Math.max(s.visitors, s.views)));
  const step = (W - P.l - P.r) / series.length;
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const ticks = [0, Math.round(max / 2), max];
  const every = Math.ceil(series.length / 8);
  const line = series.map((s, i) => `${P.l + i * step + step / 2},${y(s.views)}`).join(' ');
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitors and page views per day">
        {ticks.map(t => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="grid"/><text x={P.l - 6} y={y(t) + 3} textAnchor="end" className="axis">{t}</text></g>)}
        {series.map((s, i) => (
          <g key={s.date}>
            <rect x={P.l + i * step + step * 0.18} width={step * 0.64} y={y(s.visitors)} height={Math.max(0, H - P.b - y(s.visitors))} rx={2} className="bar-v">
              <title>{`${s.date}: ${s.visitors} visitors, ${s.views} page views, ${s.opens} windows opened`}</title>
            </rect>
            {i % every === 0 && <text x={P.l + i * step + step / 2} y={H - 8} textAnchor="middle" className="axis">{s.date.slice(5).replace('-', '/')}</text>}
          </g>
        ))}
        <polyline points={line} className="line-views"/>
      </svg>
      <div className="legend"><span><i className="sw-v"/>Visitors</span><span><i className="sw-l"/>Page views</span></div>
    </div>
  );
}

function Hours({hours}: {hours: number[]}) {
  const max = Math.max(1, ...hours);
  return (
    <div className="hours">
      {hours.map((h, i) => <div key={i} title={`${String(i).padStart(2, '0')}:00 — ${h} visits`}><span style={{height: `${(h / max) * 100}%`}}/><small>{i % 3 === 0 ? i : ''}</small></div>)}
    </div>
  );
}

/* ───────────────────────── Messages ───────────────────────── */

function replyHref(contact: string) {
  const c = contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`;
  const tg = c.match(/^(?:@|https?:\/\/t\.me\/|t\.me\/)([a-z0-9_]{4,32})$/i);
  if (tg) return `https://t.me/${tg[1]}`;
  return null;
}

function Messages({onUnread}: {onUnread: (n: number) => void}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/messages', {cache: 'no-store'});
    if (!res.ok) return;
    const data = (await res.json()) as {messages: Message[]};
    setMessages(data.messages);
    onUnread(data.messages.filter(m => !m.read).length);
  }, [onUnread]);

  useEffect(() => { void load(); }, [load]);

  async function setRead(id: string, read: boolean) {
    setMessages(list => list?.map(m => (m.id === id ? {...m, read} : m)) ?? null);
    await fetch('/api/admin/messages', {method: 'PATCH', headers: {'content-type': 'application/json'}, body: JSON.stringify({id, read})});
    void load();
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, {method: 'DELETE'});
    setSelected(null);
    void load();
  }

  function open(m: Message) {
    setSelected(m.id);
    if (!m.read) void setRead(m.id, true);
  }

  if (!messages) return <div className="cp-empty">Loading messages…</div>;
  const list = filter === 'unread' ? messages.filter(m => !m.read) : messages;
  const current = messages.find(m => m.id === selected) || null;

  return (
    <div className="inbox">
      <div className="inbox-list">
        <div className="inbox-head">
          <div className="seg"><button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All ({messages.length})</button><button type="button" className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Unread ({messages.filter(m => !m.read).length})</button></div>
          <button type="button" className="xp-button" onClick={() => void load()}>Refresh</button>
        </div>
        {list.length === 0 ? <div className="cp-empty">{messages.length ? 'No unread messages.' : 'No messages yet. They’ll appear here when someone uses Contact Me on your site.'}</div> : (
          <ul>
            {list.map(m => (
              <li key={m.id}>
                <button type="button" className={`inbox-row ${m.read ? '' : 'unread'} ${selected === m.id ? 'sel' : ''}`} onClick={() => open(m)}>
                  <span className="inbox-from">{m.name}</span>
                  <span className="inbox-date">{new Date(m.t).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</span>
                  <span className="inbox-topic">{m.topic}</span>
                  <span className="inbox-snippet">{m.message.slice(0, 90)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="inbox-read">
        {!current ? <div className="cp-empty">Select a message to read it.</div> : (
          <article>
            <header>
              <h2>{current.topic}</h2>
              <dl>
                <dt>From</dt><dd>{current.name}</dd>
                <dt>Reply to</dt><dd>{current.contact}</dd>
                <dt>Received</dt><dd>{new Date(current.t).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'})}</dd>
              </dl>
              <div className="inbox-actions">
                {replyHref(current.contact) && <a className="xp-button primary" href={replyHref(current.contact)!} target="_blank" rel="noopener noreferrer">Reply</a>}
                <button type="button" className="xp-button" onClick={() => void setRead(current.id, !current.read)}>Mark as {current.read ? 'unread' : 'read'}</button>
                <button type="button" className="xp-button danger" onClick={() => void remove(current.id)}>Delete</button>
              </div>
            </header>
            <p className="inbox-body">{current.message}</p>
          </article>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Content editor ───────────────────────── */

type FieldType = 'text' | 'textarea' | 'select' | 'lines' | 'metrics' | 'checkbox';
type Field = {key: string; label: string; type: FieldType; options?: string[]; hint?: string; wide?: boolean};

const PROFILE_FIELDS: Field[] = [
  {key: 'name', label: 'Name', type: 'text'},
  {key: 'headline', label: 'Headline', type: 'text', hint: 'Shown under your name everywhere.'},
  {key: 'pitch', label: 'One-line pitch', type: 'textarea', wide: true, hint: 'The first sentence visitors read in the Welcome window and in link previews.'},
  {key: 'bio', label: 'About me', type: 'textarea', wide: true},
  {key: 'now', label: 'Right now (one per line)', type: 'lines', wide: true, hint: 'Shown in the desktop gadget and the Welcome window.'},
  {key: 'stats', label: 'Headline numbers', type: 'metrics', wide: true, hint: 'Four work best.'},
  {key: 'location', label: 'Location', type: 'text'},
  {key: 'education', label: 'Education', type: 'text'},
  {key: 'focus', label: 'Focus areas', type: 'text'},
  {key: 'photo', label: 'Photo path', type: 'text'},
  {key: 'links.telegram', label: 'Telegram URL', type: 'text'},
  {key: 'links.linkedin', label: 'LinkedIn URL', type: 'text'},
  {key: 'links.github', label: 'GitHub URL', type: 'text'},
  {key: 'links.website', label: 'Website URL', type: 'text'},
];

const PROJECT_FIELDS: Field[] = [
  {key: 'name', label: 'Name', type: 'text'},
  {key: 'kind', label: 'Type', type: 'text', hint: 'e.g. EdTech platform'},
  {key: 'role', label: 'Your role', type: 'text'},
  {key: 'year', label: 'Timeline', type: 'text', hint: 'e.g. Aug 2023 — present'},
  {key: 'status', label: 'Status', type: 'select', options: ['active', 'experiment', 'archived']},
  {key: 'coverTone', label: 'Cover colour', type: 'select', options: ['blue', 'green', 'orange', 'purple', 'red', 'teal']},
  {key: 'featured', label: 'Featured at the top of My Projects', type: 'checkbox', wide: true},
  {key: 'url', label: 'Website', type: 'text'},
  {key: 'logo', label: 'Logo path', type: 'text'},
  {key: 'slug', label: 'Link name (optional)', type: 'text', hint: 'alisherov.com/projects/<this>. Leave empty to use the name.'},
  {key: 'tech', label: 'Tags (separate with ·)', type: 'text'},
  {key: 'description', label: 'Short description', type: 'textarea', wide: true},
  {key: 'detail', label: 'The story', type: 'textarea', wide: true},
  {key: 'metrics', label: 'Impact numbers', type: 'metrics', wide: true},
];

const EXPERIENCE_FIELDS: Field[] = [
  {key: 'organization', label: 'Organization', type: 'text'},
  {key: 'role', label: 'Role', type: 'text'},
  {key: 'period', label: 'Period', type: 'text'},
  {key: 'location', label: 'Location', type: 'text'},
  {key: 'website', label: 'Website', type: 'text'},
  {key: 'logo', label: 'Logo path or URL', type: 'text'},
  {key: 'id', label: 'Link name', type: 'text', hint: 'alisherov.com/experience/<this>'},
  {key: 'relatedProject', label: 'Related project (exact name)', type: 'text'},
  {key: 'description', label: 'Description', type: 'textarea', wide: true},
  {key: 'highlights', label: 'Highlights (one per line)', type: 'lines', wide: true},
];

const AWARD_FIELDS: Field[] = [
  {key: 'name', label: 'Award', type: 'text', wide: true},
  {key: 'year', label: 'Year', type: 'text'},
  {key: 'issuer', label: 'Issued by', type: 'text'},
  {key: 'description', label: 'Description', type: 'textarea', wide: true},
];

type Obj = Record<string, unknown>;

function getPath(obj: Obj, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Obj)[k] : undefined), obj);
}
function setPath(obj: Obj, key: string, value: unknown): Obj {
  const [head, ...rest] = key.split('.');
  if (!rest.length) return {...obj, [head]: value};
  return {...obj, [head]: setPath((obj[head] as Obj) || {}, rest.join('.'), value)};
}

/** Drops blank lines and empty metrics before saving. */
function clean(content: SiteContent): SiteContent {
  const lines = (list: string[]) => list.map(s => s.trim()).filter(Boolean);
  const metrics = (list?: Metric[]) => list?.filter(m => m.value.trim() || m.label.trim());
  return {
    profile: {...content.profile, now: lines(content.profile.now), stats: metrics(content.profile.stats) || []},
    projects: content.projects.map(p => ({...p, metrics: metrics(p.metrics)})),
    experiences: content.experiences.map(e => ({...e, highlights: lines(e.highlights)})),
    awards: content.awards,
  };
}

function ContentEditor() {
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState<'profile' | 'projects' | 'experiences' | 'awards' | 'json'>('profile');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/content', {cache: 'no-store'});
      if (!res.ok) { setStatus('Could not load content.'); return; }
      const data = (await res.json()) as {content: SiteContent};
      setSaved(data.content);
      setDraft(data.content);
    })();
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save(reset = false) {
    if (!draft) return;
    if (reset && !window.confirm('Reset all content to the version in the code? Your edits here will be replaced.')) return;
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/content', {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify(reset ? {reset: true} : {content: clean(draft)})});
      const data = (await res.json()) as {content?: SiteContent; error?: string};
      if (!res.ok || !data.content) throw new Error(data.error || 'Save failed.');
      setSaved(data.content);
      setDraft(data.content);
      setStatus(reset ? 'Content reset. The live site is updated.' : 'Saved. The live site is updated.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!draft) return <div className="cp-empty">{status || 'Loading content…'}</div>;

  return (
    <div className="editor">
      <div className="editor-tabs property-tabs" role="tablist">
        {([['profile', 'Profile & home'], ['projects', `Projects (${draft.projects.length})`], ['experiences', `Experience (${draft.experiences.length})`], ['awards', `Achievements (${draft.awards.length})`], ['json', 'Advanced (JSON)']] as const).map(([id, label]) => (
          <button type="button" role="tab" key={id} aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="editor-body">
        {tab === 'profile' && (
          <FieldGrid fields={PROFILE_FIELDS} value={draft.profile as unknown as Obj} onChange={value => setDraft({...draft, profile: value as unknown as SiteContent['profile']})}/>
        )}
        {tab === 'projects' && (
          <ListEditor
            items={draft.projects as unknown as Obj[]}
            fields={PROJECT_FIELDS}
            title={item => String(item.name || 'Untitled')}
            subtitle={item => `${item.status}${item.featured ? ' · featured' : ''}`}
            blank={{name: 'New project', kind: '', url: '', year: '', status: 'active', description: '', detail: '', tech: '', coverTone: 'blue', featured: false}}
            onChange={items => setDraft({...draft, projects: items as unknown as SiteContent['projects']})}
          />
        )}
        {tab === 'experiences' && (
          <ListEditor
            items={draft.experiences as unknown as Obj[]}
            fields={EXPERIENCE_FIELDS}
            title={item => String(item.organization || 'Untitled')}
            subtitle={item => String(item.role || '')}
            blank={{id: `role-${Date.now().toString(36)}`, organization: 'New organization', role: '', period: '', location: '', description: '', highlights: []}}
            onChange={items => setDraft({...draft, experiences: items as unknown as SiteContent['experiences']})}
          />
        )}
        {tab === 'awards' && (
          <ListEditor
            items={draft.awards as unknown as Obj[]}
            fields={AWARD_FIELDS}
            title={item => String(item.name || 'Untitled')}
            subtitle={item => String(item.year || '')}
            blank={{name: 'New achievement', year: String(new Date().getFullYear()), description: ''}}
            onChange={items => setDraft({...draft, awards: items as unknown as SiteContent['awards']})}
          />
        )}
        {tab === 'json' && <JsonEditor value={draft} onApply={value => setDraft(value)}/>}
      </div>

      <div className={`savebar ${dirty ? 'dirty' : ''}`}>
        <span>{status || (dirty ? 'You have unsaved changes.' : 'Everything is saved.')}</span>
        <button type="button" className="xp-button" onClick={() => void save(true)} disabled={busy}>Reset to code version</button>
        <button type="button" className="xp-button" onClick={() => { setDraft(saved); setStatus(''); }} disabled={!dirty || busy}>Discard</button>
        <button type="button" className="xp-button primary" onClick={() => void save()} disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save & publish'}</button>
      </div>
    </div>
  );
}

function FieldGrid({fields, value, onChange}: {fields: Field[]; value: Obj; onChange: (value: Obj) => void}) {
  return (
    <div className="fields">
      {fields.map(field => {
        const v = getPath(value, field.key);
        const id = `f-${field.key}`;
        const set = (next: unknown) => onChange(setPath(value, field.key, next));
        return (
          <div key={field.key} className={`field ${field.wide ? 'wide' : ''} ${field.type === 'checkbox' ? 'check' : ''}`}>
            {field.type === 'checkbox' ? (
              <label htmlFor={id}><input id={id} type="checkbox" checked={v === true} onChange={e => set(e.target.checked)}/> {field.label}</label>
            ) : <label htmlFor={id}>{field.label}</label>}
            {field.type === 'text' && <input id={id} value={typeof v === 'string' ? v : ''} onChange={e => set(e.target.value)}/>}
            {field.type === 'textarea' && <textarea id={id} rows={field.key === 'bio' || field.key === 'detail' ? 5 : 3} value={typeof v === 'string' ? v : ''} onChange={e => set(e.target.value)}/>}
            {field.type === 'select' && <select id={id} value={typeof v === 'string' ? v : ''} onChange={e => set(e.target.value)}>{field.options?.map(o => <option key={o}>{o}</option>)}</select>}
            {field.type === 'lines' && <textarea id={id} rows={4} value={Array.isArray(v) ? v.join('\n') : ''} onChange={e => set(e.target.value.split('\n'))}/>}
            {field.type === 'metrics' && <MetricsInput value={Array.isArray(v) ? (v as Metric[]) : []} onChange={set}/>}
            {field.hint && <small>{field.hint}</small>}
          </div>
        );
      })}
    </div>
  );
}

function MetricsInput({value, onChange}: {value: Metric[]; onChange: (value: Metric[]) => void}) {
  const update = (i: number, change: Partial<Metric>) => onChange(value.map((m, j) => (j === i ? {...m, ...change} : m)));
  return (
    <div className="metrics">
      {value.map((m, i) => (
        <div key={i} className="metric-row">
          <input aria-label="Number" placeholder="50K+" value={m.value} onChange={e => update(i, {value: e.target.value})}/>
          <input aria-label="Label" placeholder="students reached" value={m.label} onChange={e => update(i, {label: e.target.value})}/>
          <button type="button" className="xp-button" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="xp-button" onClick={() => onChange([...value, {value: '', label: ''}])}>+ Add number</button>
    </div>
  );
}

function ListEditor({items, fields, title, subtitle, blank, onChange}: {items: Obj[]; fields: Field[]; title: (item: Obj) => string; subtitle: (item: Obj) => string; blank: Obj; onChange: (items: Obj[]) => void}) {
  const [index, setIndex] = useState(0);
  const current = items[Math.min(index, items.length - 1)];

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setIndex(to);
  }

  return (
    <div className="list-editor">
      <div className="list-side">
        <ul>
          {items.map((item, i) => (
            <li key={i}>
              <button type="button" className={i === index ? 'sel' : ''} onClick={() => setIndex(i)}>
                <b>{title(item)}</b><small>{subtitle(item)}</small>
              </button>
            </li>
          ))}
        </ul>
        <div className="list-actions">
          <button type="button" className="xp-button" onClick={() => { onChange([...items, {...blank}]); setIndex(items.length); }}>+ Add</button>
          <button type="button" className="xp-button" aria-label="Move up" onClick={() => move(index, index - 1)} disabled={index === 0}>▲</button>
          <button type="button" className="xp-button" aria-label="Move down" onClick={() => move(index, index + 1)} disabled={index >= items.length - 1}>▼</button>
          <button type="button" className="xp-button danger" disabled={!current} onClick={() => { if (window.confirm(`Remove “${title(current)}”?`)) { onChange(items.filter((_, i) => i !== index)); setIndex(Math.max(0, index - 1)); } }}>Remove</button>
        </div>
      </div>
      <div className="list-form">
        {current ? <FieldGrid fields={fields} value={current} onChange={value => onChange(items.map((item, i) => (i === index ? value : item)))}/> : <div className="cp-empty">Nothing here yet. Click Add.</div>}
      </div>
    </div>
  );
}

function JsonEditor({value, onApply}: {value: SiteContent; onApply: (value: SiteContent) => void}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);
  return (
    <div className="json-editor">
      <p className="muted">For bulk edits. Click <b>Apply</b>, then <b>Save &amp; publish</b> below. Fields that don’t match the expected format are ignored when saving.</p>
      <textarea spellCheck={false} value={text} onChange={e => setText(e.target.value)} aria-label="Content JSON"/>
      {error && <p className="logon-error" role="alert">{error}</p>}
      <button type="button" className="xp-button primary" onClick={() => {
        try {
          const parsed = JSON.parse(text) as SiteContent;
          if (!parsed || typeof parsed !== 'object' || !parsed.profile || !Array.isArray(parsed.projects)) throw new Error('The JSON needs profile, projects, experiences and awards.');
          setError('');
          onApply(parsed);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Invalid JSON');
        }
      }}>Apply</button>
    </div>
  );
}

/* ───────────────────────── Setup ───────────────────────── */

function Setup({telegramConnected}: {telegramConnected: boolean}) {
  return (
    <div className="setup">
      <Panel title="Get new messages in Telegram">
        <p>{telegramConnected ? '✅ Connected. Every new message from Contact Me is also sent to your Telegram.' : 'Not connected yet. Messages are saved here either way; this just pings you instantly.'}</p>
        {!telegramConnected && (
          <ol>
            <li>In Telegram, open <b>@BotFather</b>, send <code>/newbot</code> and copy the token it gives you.</li>
            <li>Send any message to your new bot, then open <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> and copy the <code>chat.id</code> number.</li>
            <li>In Livops → this project → Variables, add <code>TELEGRAM_BOT_TOKEN</code> and <code>TELEGRAM_CHAT_ID</code>.</li>
          </ol>
        )}
      </Panel>
      <Panel title="How the stats work">
        <ul>
          <li>Each visit is counted once per day per device using a one-way code. No cookies, no IP addresses stored.</li>
          <li>Bots and link-preview crawlers are filtered out.</li>
          <li>Your own visits aren’t counted while you’re signed in here.</li>
          <li>Raw data lives in your Livops project’s data folder (<code>/app/data/events</code>), one file per day.</li>
        </ul>
      </Panel>
      <Panel title="Editing content">
        <ul>
          <li>Changes you save under <b>Edit site content</b> go live immediately — no redeploy.</li>
          <li><b>Reset to code version</b> brings back what’s in <code>app/data.ts</code>.</li>
          <li>Photos and logos still live in the <code>public/</code> folder of the repo.</li>
        </ul>
      </Panel>
    </div>
  );
}
