'use client';

import {type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {photos, type Project, type SiteContent} from '../data';
import {pathFor, type Route} from './routes';
import {play, setSoundEnabled, type SoundName} from './sounds';
import {track} from './track';
import Wallpaper, {skyPhase, tashkentHour} from './Wallpaper';

type AppId =
  | 'welcome'
  | 'contact'
  | 'projects'
  | 'experience'
  | 'experienceProperties'
  | 'projectFolder'
  | 'projectDetail'
  | 'properties'
  | 'achievements'
  | 'achievementDetail'
  | 'gallery'
  | 'photoViewer'
  | 'about'
  | 'documents'
  | 'recycle'
  | 'browser'
  | 'search'
  | 'run'
  | 'games'
  | 'snake'
  | 'minesweeper'
  | 'terminal'
  | 'badges';

type WindowState = {
  id: string;
  app: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  centered?: boolean;
  url?: string;
  project?: string;
  experience?: string;
  photo?: string;
  achievement?: string;
};

type ContextMenuState =
  | {x: number; y: number; type: 'shortcut'; id: AppId; label: string}
  | {x: number; y: number; type: 'project'; project: string}
  | null;

type ViewMode = 'tiles' | 'details';
type AboutTab = 'general' | 'computer' | 'portfolio' | 'links';
type SearchScope = 'all' | 'projects' | 'experience' | 'achievements' | 'pictures';

type Point = {x: number; y: number};
type Direction = 'up' | 'down' | 'left' | 'right';
type MineCell = {mine: boolean; revealed: boolean; flagged: boolean; adjacent: number};
type BadgeId = 'first-steps' | 'explorer' | 'photo-hunter' | 'snake-charmer' | 'mine-master' | 'power-user';
type OsBadge = {id: BadgeId; name: string; description: string};

const OS_BADGES: OsBadge[] = [
  {id: 'first-steps', name: 'First Steps', description: 'Opened My Computer.'},
  {id: 'explorer', name: 'Explorer', description: 'Explored My Projects.'},
  {id: 'photo-hunter', name: 'Photo Hunter', description: 'Opened My Pictures.'},
  {id: 'snake-charmer', name: 'Snake Charmer', description: 'Scored 50 points in Snake.'},
  {id: 'mine-master', name: 'Mine Master', description: 'Cleared a Minesweeper board.'},
  {id: 'power-user', name: 'Power User', description: 'Ran a command in NurbekOS Terminal.'},
];

const MINE_ROWS = 9;
const MINE_COLS = 9;
const MINE_COUNT = 10;

function createMineBoard(): MineCell[] {
  const total = MINE_ROWS * MINE_COLS;
  const mines = new Set<number>();
  while (mines.size < MINE_COUNT) mines.add(Math.floor(Math.random() * total));
  return Array.from({length: total}, (_, index) => {
    const row = Math.floor(index / MINE_COLS);
    const col = index % MINE_COLS;
    let adjacent = 0;
    for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
      const rr = row + dr, cc = col + dc;
      if (rr >= 0 && rr < MINE_ROWS && cc >= 0 && cc < MINE_COLS && mines.has(rr * MINE_COLS + cc)) adjacent += 1;
    }
    return {mine: mines.has(index), revealed: false, flagged: false, adjacent};
  });
}

const SNAKE_COLS = 20;
const SNAKE_ROWS = 15;
const INITIAL_SNAKE: Point[] = [{x: 9, y: 7}, {x: 8, y: 7}, {x: 7, y: 7}];

function pointKey(point: Point) {
  return `${point.x}-${point.y}`;
}

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map(pointKey));
  const free: Point[] = [];
  for (let y = 0; y < SNAKE_ROWS; y += 1) {
    for (let x = 0; x < SNAKE_COLS; x += 1) {
      if (!occupied.has(`${x}-${y}`)) free.push({x, y});
    }
  }
  return free[Math.floor(Math.random() * free.length)] || {x: 14, y: 7};
}

type SearchResult = {
  id: string;
  type: Exclude<SearchScope, 'all'>;
  title: string;
  subtitle: string;
  icon: string;
  project?: string;
  experience?: string;
  photo?: string;
  achievement?: string;
};

const I = '/icons/xp';

const shortcuts: {id: AppId; label: string; icon: string}[] = [
  {id: 'welcome', label: 'Start Here', icon: `${I}/welcome.svg`},
  {id: 'projects', label: 'My Projects', icon: `${I}/my-projects.svg`},
  {id: 'experience', label: 'Work Experience', icon: `${I}/folder.svg`},
  {id: 'achievements', label: 'Achievements', icon: `${I}/achievements.svg`},
  {id: 'contact', label: 'Contact Me', icon: `${I}/mail.svg`},
  {id: 'gallery', label: 'My Pictures', icon: `${I}/my-pictures.svg`},
  {id: 'documents', label: 'My Documents', icon: `${I}/my-documents.svg`},
  {id: 'about', label: 'My Computer', icon: `${I}/my-computer.svg`},
  {id: 'games', label: 'Games', icon: `${I}/games.svg`},
];

const recycleShortcut: {id: AppId; label: string; icon: string} = {id: 'recycle', label: 'Recycle Bin', icon: `${I}/recycle-bin.svg`};

const TONES: Record<Project['coverTone'], string> = {blue: '#2563c9', green: '#2f8a3a', orange: '#d0682a', purple: '#6d48b8', red: '#c23d3d', teal: '#16868c'};

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

const SKY_STATUS = {
  night: 'Night here. I’ll see your message in the morning.',
  dawn: 'Early morning here.',
  day: 'Daytime here, a good time to reach me.',
  golden: 'Evening here.',
  dusk: 'Evening here.',
} as const;

const DEFAULT_TITLES: Partial<Record<AppId, string>> = {
  recycle: 'Recycle Bin',
  welcome: 'Welcome to nurbekOS',
  contact: 'New Message — Contact Nurbek',
  gallery: 'My Pictures',
  search: 'Search Results',
  run: 'Run',
  terminal: 'NurbekOS Terminal',
  badges: 'NurbekOS Achievements',
  snake: 'Snake.exe',
  minesweeper: 'Minesweeper.exe',
};

const WINDOW_SIZES: Partial<Record<AppId, [number, number]>> = {
  welcome: [880, 540],
  contact: [660, 580],
  projects: [980, 640],
  experience: [900, 600],
  achievements: [820, 640],
  documents: [720, 460],
  recycle: [800, 520],
  projectFolder: [760, 500],
  browser: [1000, 680],
  gallery: [960, 660],
  photoViewer: [920, 680],
  about: [660, 560],
  run: [460, 220],
  search: [820, 560],
  projectDetail: [940, 690],
  achievementDetail: [780, 600],
  properties: [570, 520],
  experienceProperties: [620, 580],
  games: [720, 480],
  snake: [680, 620],
  minesweeper: [520, 590],
  terminal: [760, 500],
  badges: [650, 480],
};

/** Size and place a new window for the current screen: bigger on big screens, cascading from the centre. */
function placeWindow(app: AppId, index: number, ssrSafe = false) {
  const [baseW, baseH] = WINDOW_SIZES[app] ?? [760, 540];
  if (ssrSafe || typeof window === 'undefined') return {x: 110 + (index % 6) * 30, y: 36 + (index % 6) * 26, width: baseW, height: baseH};
  const vw = window.innerWidth;
  const vh = window.innerHeight - 34;
  const small = app === 'run' || app === 'properties' || app === 'minesweeper';
  const scale = small ? 1 : vw >= 1680 ? 1.16 : vw >= 1360 ? 1.08 : 1;
  const width = Math.min(Math.round(baseW * scale), vw - 32);
  const height = Math.min(Math.round(baseH * scale), vh - 28);
  const step = (index % 5) * 28;
  // Leave the Tashkent gadget on the right visible on wide screens.
  const shift = vw > 1100 ? 115 : 0;
  return {
    // Never cover the desktop icon column on wide screens.
    x: Math.max(vw > 1100 ? 112 : 8, Math.min(Math.round((vw - width) / 2) - 56 - shift + step, vw - width - 8)),
    y: Math.max(8, Math.round((vh - height) / 2) - 40 + step),
    width,
    height,
  };
}

type LaunchOptions = {title?: string; url?: string; project?: string; experience?: string; photo?: string; achievement?: string};

function makeWindow(id: string, app: AppId, opts: LaunchOptions, index: number, ssrSafe = false): WindowState {
  const geo = placeWindow(app, index, ssrSafe);
  return {
    id,
    app,
    title: opts.title || DEFAULT_TITLES[app] || shortcuts.find(item => item.id === app)?.label || 'NurbekOS',
    ...geo,
    minimized: false,
    maximized: false,
    centered: app === 'welcome' || app === 'contact',
    url: opts.url,
    project: opts.project,
    experience: opts.experience,
    photo: opts.photo,
    achievement: opts.achievement,
  };
}

/** Windows that show the same thing are reused instead of stacking duplicates. */
function windowKey(app: AppId, opts: LaunchOptions) {
  if (app === 'photoViewer' || app === 'search' || app === 'run' || app === 'terminal') return app;
  return [app, opts.project, opts.experience, opts.achievement, opts.url].filter(Boolean).join('|');
}

function initialWindows(route: Route, content: SiteContent): WindowState[] {
  const list: WindowState[] = [];
  const add = (app: AppId, opts: LaunchOptions = {}) => list.push(makeWindow(`init-${list.length}`, app, opts, list.length, true));
  if (route.app === 'projectDetail' && route.project) {
    add('projects');
    add('projectDetail', {title: `${route.project} — Project Center`, project: route.project});
  } else if (route.app === 'experienceProperties' && route.experience) {
    add('experience');
    const experience = content.experiences.find(e => e.id === route.experience);
    add('experienceProperties', {experience: route.experience, title: `${experience?.organization || 'Experience'} Properties`});
  } else {
    add(route.app as AppId);
  }
  return list;
}

let serial = 0;

function Toast({children}: {children: ReactNode}) {
  return <div className="badge-toast info-toast" role="status">{children}</div>;
}

function Icon({src, size = 32, className = '', alt = ''}: {src: string; size?: number; className?: string; alt?: string}) {
  return <img className={`xp-icon ${className}`} src={src} width={size} height={size} alt={alt} draggable={false}/>;
}

function BrandIcon({name, logo, size = 52}: {name: string; logo?: string; size?: number}) {
  const initials = name.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  return (
    <span className="brand-icon" style={{width: size, height: size}} aria-hidden="true">
      <span>{initials}</span>
      {logo && <img src={logo} alt="" draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}/>} 
    </span>
  );
}

function statusText(status: Project['status']) {
  if (status === 'active') return 'Active project';
  if (status === 'experiment') return 'Experiment';
  return 'Archived project';
}

type MenuName = 'File' | 'Edit' | 'View' | 'Favorites' | 'Tools' | 'Help';
const TOPICS = ['Collaboration', 'Speaking or event', 'Mentoring', 'Investment', 'Just saying hi'];

export default function Desktop({content, initialRoute, initialHour, skyLocked = false}: {content: SiteContent; initialRoute: Route; initialHour: number; skyLocked?: boolean}) {
  const {profile, projects, experiences, awards} = content;
  const [windows, setWindows] = useState<WindowState[]>(() => initialWindows(initialRoute, content));
  const [active, setActive] = useState(() => {
    const list = initialWindows(initialRoute, content);
    return list[list.length - 1]?.id || '';
  });
  const [start, setStart] = useState(false);
  const [time, setTime] = useState('');
  const [today, setToday] = useState('');
  const [skyHour, setSkyHour] = useState(initialHour);
  const [tashkentTime, setTashkentTime] = useState('');
  const [sound, setSound] = useState(false);
  const [selected, setSelected] = useState('');
  const [boot, setBoot] = useState(true);
  const [menu, setMenu] = useState<{win: string; name: MenuName} | null>(null);
  const [toast, setToast] = useState('');
  const [showWelcomeAtStartup, setShowWelcomeAtStartup] = useState(true);
  const [contactForm, setContactForm] = useState({name: '', contact: '', topic: TOPICS[0], message: '', website: ''});
  const [contactState, setContactState] = useState<{status: 'idle' | 'sending' | 'sent' | 'error'; error?: string}>({status: 'idle'});
  const [context, setContext] = useState<ContextMenuState>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const [foldersPane, setFoldersPane] = useState(true);
  const [aboutTab, setAboutTab] = useState<AboutTab>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [runCommand, setRunCommand] = useState('');
  const [runError, setRunError] = useState('');
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [snakeFood, setSnakeFood] = useState<Point>({x: 14, y: 7});
  const [snakeDirection, setSnakeDirection] = useState<Direction>('right');
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeGameOver, setSnakeGameOver] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeHighScore, setSnakeHighScore] = useState(0);
  const [mineBoard, setMineBoard] = useState<MineCell[]>(() => createMineBoard());
  const [mineGameOver, setMineGameOver] = useState(false);
  const [mineWon, setMineWon] = useState(false);
  const [mineFlagMode, setMineFlagMode] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<string[]>(['NurbekOS Terminal [Version 4.5]', 'Type help for available commands.', '']);
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeId[]>([]);
  const [badgeToast, setBadgeToast] = useState<OsBadge | null>(null);

  const drag = useRef<{id: string; startX: number; startY: number; x: number; y: number} | null>(null);
  const resize = useRef<{id: string; startX: number; startY: number; width: number; height: number} | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}));
      setToday(now.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'}));
      if (!skyLocked) setSkyHour(tashkentHour(now));
      setTashkentTime(now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Tashkent'}));
    };
    tick();
    const interval = window.setInterval(tick, 30000);
    return () => window.clearInterval(interval);
  }, []);

  // Boot: shorter when someone arrives on a deep link, skipped for reduced motion.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const deepLink = initialRoute.app !== 'welcome';
    const timeout = window.setTimeout(() => {
      setBoot(false);
      play('startup');
    }, reduced ? 120 : deepLink ? 450 : 1150);
    return () => window.clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saved preferences + the first page view.
  useEffect(() => {
    try {
      const soundOn = window.localStorage.getItem('nurbekos-sound') === 'on';
      setSound(soundOn);
      setSoundEnabled(soundOn);
      const hideWelcome = window.localStorage.getItem('nurbekos-hide-welcome') === '1';
      setShowWelcomeAtStartup(!hideWelcome);
      if (hideWelcome && initialRoute.app === 'welcome') {
        setWindows(current => current.filter(win => win.app !== 'welcome'));
        setActive('');
      }
    } catch { /* storage can be unavailable */ }
    // The server can't know the screen size, so size the first windows now.
    setWindows(current => current.map((win, i) => (win.id.startsWith('init-') ? {...win, ...placeWindow(win.app, i)} : win)));
    track('view', {path: window.location.pathname, ref: document.referrer || undefined});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the address bar and tab title in sync with the window in front, so every view can be shared.
  useEffect(() => {
    const current = windows.find(win => win.id === active && !win.minimized);
    const path = current ? pathFor(current, projects) : '/';
    if (!path) return;
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
    const label = current && current.app !== 'welcome' ? current.title.replace(/ - (Microsoft Internet Explorer|Windows Picture and Fax Viewer)$/, '') : '';
    document.title = label ? `${label} · Nurbek Alisherov` : `Nurbek Alisherov — Founder & AI builder · nurbekOS`;
  }, [active, windows, projects]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function sfx(name: SoundName) {
    play(name);
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    try { window.localStorage.setItem('nurbekos-sound', next ? 'on' : 'off'); } catch { /* ignore */ }
    if (next) play('notify', true);
    setToast(next ? 'Sounds on' : 'Sounds off');
  }

  function toggleWelcomeAtStartup(value: boolean) {
    setShowWelcomeAtStartup(value);
    try { window.localStorage.setItem('nurbekos-hide-welcome', value ? '0' : '1'); } catch { /* ignore */ }
  }

  function outbound(url: string, label?: string) {
    track('click', {target: label || url.replace(/^https?:\/\//, '').replace(/\/$/, '')});
  }

  async function copyLink(win?: WindowState) {
    const path = win ? pathFor(win, projects) || '/' : window.location.pathname;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied — paste it anywhere');
    } catch {
      setToast(url);
    }
    sfx('click');
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    setContactState({status: 'sending'});
    try {
      const res = await fetch('/api/contact', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(contactForm)});
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setContactState({status: 'sent'});
      setContactForm({name: '', contact: '', topic: TOPICS[0], message: '', website: ''});
      sfx('send');
    } catch (error) {
      setContactState({status: 'error', error: error instanceof Error ? error.message : 'Something went wrong.'});
      sfx('error');
    }
  }

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (drag.current) {
        const d = drag.current;
        setWindows(current => current.map(win => {
          if (win.id !== d.id) return win;
          const nextX = d.x + event.clientX - d.startX;
          const nextY = d.y + event.clientY - d.startY;
          return {
            ...win,
            x: Math.max(0, Math.min(nextX, window.innerWidth - 170)),
            y: Math.max(0, Math.min(nextY, window.innerHeight - 90)),
          };
        }));
      }
      if (resize.current) {
        const r = resize.current;
        setWindows(current => current.map(win => win.id === r.id ? {
          ...win,
          width: Math.max(360, Math.min(r.width + event.clientX - r.startX, window.innerWidth - 12)),
          height: Math.max(240, Math.min(r.height + event.clientY - r.startY, window.innerHeight - 44)),
        } : win));
      }
    };
    const up = () => {
      drag.current = null;
      resize.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      const currentWindow = windows.find(win => win.id === active);
      if (!typing && currentWindow?.app === 'snake') {
        const key = event.key.toLowerCase();
        const nextDirection: Partial<Record<string, Direction>> = {
          arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
        };
        if (nextDirection[key]) {
          event.preventDefault();
          const next = nextDirection[key]!;
          setSnakeDirection(current => {
            const opposite = (current === 'up' && next === 'down') || (current === 'down' && next === 'up') || (current === 'left' && next === 'right') || (current === 'right' && next === 'left');
            return opposite ? current : next;
          });
          setSnakeRunning(true);
          return;
        }
        if (event.code === 'Space') {
          event.preventDefault();
          setSnakeRunning(value => !value);
          return;
        }
      }
      if (event.key === 'Escape') {
        setStart(false);
        setContext(null);
        setMenu(null);
        return;
      }
      if (!typing && event.key === 'F3') {
        event.preventDefault();
        launch('search', 'Search Results');
      }
      if (!typing && event.key === '/') {
        event.preventDefault();
        launch('search', 'Search Results');
      }
      if (!typing && event.key === 'Enter' && selected) {
        const shortcut = [...shortcuts, recycleShortcut].find(item => item.id === selected);
        if (shortcut) launch(shortcut.id);
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        if (currentWindow?.app === 'photoViewer' && currentWindow.photo) {
          event.preventDefault();
          movePhoto(currentWindow.id, event.key === 'ArrowRight' ? 1 : -1);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, selected, windows]);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('nurbekos-snake-high-score') || 0);
    if (Number.isFinite(saved)) setSnakeHighScore(saved);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('nurbekos-badges') || '[]') as BadgeId[];
      setUnlockedBadges(saved.filter(id => OS_BADGES.some(badge => badge.id === id)));
    } catch { setUnlockedBadges([]); }
  }, []);

  useEffect(() => {
    if (snakeScore >= 50) unlockBadge('snake-charmer');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snakeScore]);

  useEffect(() => {
    if (!snakeRunning || snakeGameOver) return;
    const timer = window.setInterval(() => {
      setSnake(current => {
        const head = current[0];
        const delta: Record<Direction, Point> = {
          up: {x: 0, y: -1},
          down: {x: 0, y: 1},
          left: {x: -1, y: 0},
          right: {x: 1, y: 0},
        };
        const move = delta[snakeDirection];
        const nextHead = {x: head.x + move.x, y: head.y + move.y};
        const hitWall = nextHead.x < 0 || nextHead.x >= SNAKE_COLS || nextHead.y < 0 || nextHead.y >= SNAKE_ROWS;
        const ate = nextHead.x === snakeFood.x && nextHead.y === snakeFood.y;
        const bodyToCheck = ate ? current : current.slice(0, -1);
        const hitSelf = bodyToCheck.some(point => point.x === nextHead.x && point.y === nextHead.y);
        if (hitWall || hitSelf) {
          setSnakeRunning(false);
          setSnakeGameOver(true);
          return current;
        }
        const nextSnake = [nextHead, ...current];
        if (ate) {
          const nextScore = snakeScore + 10;
          setSnakeScore(nextScore);
          if (nextScore > snakeHighScore) {
            setSnakeHighScore(nextScore);
            window.localStorage.setItem('nurbekos-snake-high-score', String(nextScore));
          }
          setSnakeFood(randomFood(nextSnake));
          return nextSnake;
        }
        nextSnake.pop();
        return nextSnake;
      });
    }, Math.max(75, 150 - Math.floor(snakeScore / 50) * 10));
    return () => window.clearInterval(timer);
  }, [snakeDirection, snakeFood, snakeGameOver, snakeHighScore, snakeRunning, snakeScore]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matches = (text: string) => text.toLowerCase().includes(q);
    const results: SearchResult[] = [];

    if (searchScope === 'all' || searchScope === 'projects') {
      for (const project of projects) {
        if ([project.name, project.kind, project.description, project.detail, project.tech, project.role || ''].some(matches)) {
          results.push({id: `project-${project.name}`, type: 'projects', title: project.name, subtitle: `${project.kind} · ${project.year}`, icon: `${I}/my-projects.svg`, project: project.name});
        }
      }
    }
    if (searchScope === 'all' || searchScope === 'experience') {
      for (const experience of experiences) {
        if ([experience.organization, experience.role, experience.location, experience.description, ...experience.highlights].some(matches)) {
          results.push({id: `experience-${experience.id}`, type: 'experience', title: experience.organization, subtitle: `${experience.role} · ${experience.period}`, icon: `${I}/folder.svg`, experience: experience.id});
        }
      }
    }
    if (searchScope === 'all' || searchScope === 'achievements') {
      for (const award of awards) {
        if ([award.name, award.issuer || '', award.description, award.year].some(matches)) {
          results.push({id: `award-${award.year}-${award.name}`, type: 'achievements', title: award.name, subtitle: `${award.year}${award.issuer ? ` · ${award.issuer}` : ''}`, icon: `${I}/certificate.svg`, achievement: award.name});
        }
      }
    }
    if (searchScope === 'all' || searchScope === 'pictures') {
      for (const photo of photos) {
        if ([photo.title, photo.album, photo.caption, photo.date].some(matches)) {
          results.push({id: `photo-${photo.id}`, type: 'pictures', title: photo.title, subtitle: `${photo.album} · ${photo.date}`, icon: `${I}/image-file.svg`, photo: photo.id});
        }
      }
    }
    return results.slice(0, 50);
  }, [searchQuery, searchScope]);

  function launch(app: AppId, title?: string, url?: string, project?: string, experience?: string, photo?: string, achievement?: string) {
    if (app === 'about') unlockBadge('first-steps');
    if (app === 'projects') unlockBadge('explorer');
    if (app === 'gallery') unlockBadge('photo-hunter');
    setStart(false);
    setContext(null);
    setRunError('');
    if (app === 'photoViewer') {
      setPhotoZoom(1);
      setPhotoRotation(0);
    }
    const opts: LaunchOptions = {title, url, project, experience, photo, achievement};
    const key = windowKey(app, opts);
    const existing = windows.find(win => windowKey(win.app, win) === key);
    if (existing) {
      // Reuse the open window instead of stacking a duplicate.
      setWindows(current => {
        const win = current.find(item => item.id === existing.id);
        if (!win) return current;
        const updated = {...win, ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined)), minimized: false};
        return [...current.filter(item => item.id !== existing.id), updated];
      });
      setActive(existing.id);
      return;
    }
    const id = `win-${++serial}`;
    setWindows(current => [...current, makeWindow(id, app, opts, current.length)]);
    setActive(id);
    sfx('open');
    const path = pathFor({app, project, experience}, projects);
    track('open', {path: path && path !== '/' ? path : `/${app}`});
  }

  function focus(id: string) {
    setActive(id);
    setWindows(current => {
      const win = current.find(item => item.id === id);
      return win ? [...current.filter(item => item.id !== id), {...win, minimized: false}] : current;
    });
  }

  function patch(id: string, change: Partial<WindowState>) {
    setWindows(current => current.map(win => win.id === id ? {...win, ...change} : win));
  }

  function close(id: string) {
    sfx('close');
    const remaining = windows.filter(win => win.id !== id);
    setWindows(current => current.filter(win => win.id !== id));
    setMenu(null);
    setActive(current => current === id ? (remaining.filter(win => !win.minimized).at(-1)?.id || '') : current);
  }

  /** Launch from a launcher window (like Start Here) and tidy the launcher away. */
  function openFrom(launcherId: string, app: AppId) {
    close(launcherId);
    launch(app);
  }

  function minimize(id: string) {
    const remaining = windows.filter(win => win.id !== id && !win.minimized);
    patch(id, {minimized: true});
    setActive(current => current === id ? (remaining.at(-1)?.id || '') : current);
  }

  function openProject(name: string) {
    const project = projects.find(item => item.name === name);
    if (!project) return;
    launch('projectDetail', `${project.name} — Project Center`, undefined, project.name);
  }

  function visitProject(name: string) {
    const project = projects.find(item => item.name === name);
    if (!project?.url) return;
    launch('browser', `${project.name} - Microsoft Internet Explorer`, project.url, project.name);
  }

  function exploreProject(name: string) {
    const project = projects.find(item => item.name === name);
    if (!project) return;
    launch('projectFolder', project.name, undefined, project.name);
  }

  function projectProperties(name: string) {
    const project = projects.find(item => item.name === name);
    if (!project) return;
    launch('properties', `${project.name} Properties`, undefined, project.name);
  }

  function experienceProperties(id: string) {
    const experience = experiences.find(item => item.id === id);
    if (!experience) return;
    launch('experienceProperties', `${experience.organization} Properties`, undefined, undefined, experience.id);
  }

  function openAchievement(name: string) {
    const award = awards.find(item => item.name === name);
    if (!award) return;
    launch('achievementDetail', `${award.name} — Achievement`, undefined, undefined, undefined, undefined, award.name);
  }

  function openPhoto(id: string) {
    const photo = photos.find(item => item.id === id);
    if (!photo) return;
    launch('photoViewer', `${photo.title} - Windows Picture and Fax Viewer`, undefined, undefined, undefined, photo.id);
  }

  function movePhoto(windowId: string, delta: number) {
    setPhotoZoom(1);
    setPhotoRotation(0);
    setWindows(current => current.map(win => {
      if (win.id !== windowId || !win.photo) return win;
      const index = photos.findIndex(photo => photo.id === win.photo);
      const next = photos[(index + delta + photos.length) % photos.length];
      return {...win, photo: next.id, title: `${next.title} - Windows Picture and Fax Viewer`};
    }));
  }

  function openSearchResult(result: SearchResult) {
    if (result.type === 'projects' && result.project) openProject(result.project);
    else if (result.type === 'experience' && result.experience) experienceProperties(result.experience);
    else if (result.type === 'pictures' && result.photo) openPhoto(result.photo);
    else if (result.type === 'achievements' && result.achievement) openAchievement(result.achievement);
  }

  function unlockBadge(id: BadgeId) {
    const badge = OS_BADGES.find(item => item.id === id);
    if (!badge) return;
    setUnlockedBadges(current => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      window.localStorage.setItem('nurbekos-badges', JSON.stringify(next));
      setBadgeToast(badge);
      window.setTimeout(() => setBadgeToast(currentToast => currentToast?.id === id ? null : currentToast), 3200);
      return next;
    });
  }

  function resetMinesweeper() {
    setMineBoard(createMineBoard());
    setMineGameOver(false);
    setMineWon(false);
    setMineFlagMode(false);
  }

  function openMinesweeper() {
    const existing = windows.find(win => win.app === 'minesweeper');
    if (existing) { focus(existing.id); return; }
    resetMinesweeper();
    launch('minesweeper', 'Minesweeper.exe');
  }

  function revealMineCell(index: number) {
    if (mineGameOver || mineWon) return;
    setMineBoard(current => {
      const next = current.map(cell => ({...cell}));
      const cell = next[index];
      if (!cell || cell.flagged || cell.revealed) return current;
      if (mineFlagMode) { cell.flagged = !cell.flagged; return next; }
      if (cell.mine) {
        next.forEach(item => { if (item.mine) item.revealed = true; });
        setMineGameOver(true);
        return next;
      }
      const queue = [index];
      const seen = new Set<number>();
      while (queue.length) {
        const currentIndex = queue.shift()!;
        if (seen.has(currentIndex)) continue;
        seen.add(currentIndex);
        const target = next[currentIndex];
        if (!target || target.flagged || target.mine) continue;
        target.revealed = true;
        if (target.adjacent === 0) {
          const row = Math.floor(currentIndex / MINE_COLS), col = currentIndex % MINE_COLS;
          for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
            const rr = row + dr, cc = col + dc;
            if (rr >= 0 && rr < MINE_ROWS && cc >= 0 && cc < MINE_COLS) queue.push(rr * MINE_COLS + cc);
          }
        }
      }
      const safeRevealed = next.filter(item => !item.mine && item.revealed).length;
      if (safeRevealed === MINE_ROWS * MINE_COLS - MINE_COUNT) {
        setMineWon(true);
        next.forEach(item => { if (item.mine) item.flagged = true; });
        unlockBadge('mine-master');
      }
      return next;
    });
  }

  function flagMineCell(index: number) {
    if (mineGameOver || mineWon) return;
    setMineBoard(current => current.map((cell, i) => i === index && !cell.revealed ? {...cell, flagged: !cell.flagged} : cell));
  }

  function runTerminalCommand(event: FormEvent) {
    event.preventDefault();
    const raw = terminalInput.trim();
    if (!raw) return;
    unlockBadge('power-user');
    const command = raw.toLowerCase();
    const output: string[] = [`C:\NurbekOS> ${raw}`];
    if (command === 'clear' || command === 'cls') {
      setTerminalLines([]); setTerminalInput(''); return;
    }
    if (command === 'help') output.push('Commands: whoami, now, welcome, projects, experience, awards, photos, contact, games, snake, minesweeper, badges, telegram, linkedin, github, cv, date, clear');
    else if (command === 'whoami') output.push(`${profile.name} — ${profile.headline}`);
    else if (command === 'date') output.push(new Date().toString());
    else if (command === 'now') output.push(...profile.now.map(item => `  • ${item}`));
    else if (['projects','experience','awards','photos','games','snake','minesweeper','badges','contact','welcome'].includes(command)) {
      const actions: Record<string, () => void> = {
        projects: () => launch('projects'), experience: () => launch('experience'), contact: () => launch('contact'), welcome: () => launch('welcome'), awards: () => launch('achievements'), photos: () => launch('gallery'), games: () => launch('games'), snake: openSnake, minesweeper: openMinesweeper, badges: () => launch('badges', 'NurbekOS Achievements'),
      };
      actions[command](); output.push(`Opening ${raw}...`);
    } else if (command === 'telegram') { launch('browser', 'Telegram - Microsoft Internet Explorer', profile.links.telegram); output.push('Opening Telegram...'); }
    else if (command === 'linkedin') { launch('browser', 'LinkedIn - Microsoft Internet Explorer', profile.links.linkedin); output.push('Opening LinkedIn...'); }
    else if (command === 'github') { launch('browser', 'GitHub - Microsoft Internet Explorer', profile.links.github); output.push('Opening GitHub...'); }
    else if (command === 'cv') { window.open('/cv', '_blank', 'noopener,noreferrer'); output.push('Opening CV...'); }
    else output.push(`'${raw}' is not recognized as a command. Type help.`);
    setTerminalLines(lines => [...lines, ...output, '']);
    setTerminalInput('');
  }

  function resetSnake(startImmediately = true) {
    setSnake(INITIAL_SNAKE);
    setSnakeFood(randomFood(INITIAL_SNAKE));
    setSnakeDirection('right');
    setSnakeScore(0);
    setSnakeGameOver(false);
    setSnakeRunning(startImmediately);
  }

  function openSnake() {
    const existing = windows.find(win => win.app === 'snake');
    if (existing) {
      focus(existing.id);
      return;
    }
    resetSnake(false);
    launch('snake', 'Snake.exe');
  }

  function runProgram(event: FormEvent) {
    event.preventDefault();
    const command = runCommand.trim();
    const normalized = command.toLowerCase();
    setRunError('');
    if (!command) return;

    const aliases: Record<string, AppId> = {
      projects: 'projects',
      'my projects': 'projects',
      experience: 'experience',
      'work experience': 'experience',
      pictures: 'gallery',
      'my pictures': 'gallery',
      achievements: 'achievements',
      awards: 'achievements',
      documents: 'documents',
      'my documents': 'documents',
      about: 'about',
      'my computer': 'about',
      contact: 'contact',
      message: 'contact',
      welcome: 'welcome',
      'start here': 'welcome',
      computer: 'about',
      recycle: 'recycle',
      'recycle bin': 'recycle',
      search: 'search',
      games: 'games',
      terminal: 'terminal',
      cmd: 'terminal',
      badges: 'badges',
    };

    if (aliases[normalized]) {
      launch(aliases[normalized]);
      return;
    }
    if (normalized === 'snake' || normalized === 'snake.exe') { openSnake(); return; }
    if (normalized === 'minesweeper' || normalized === 'minesweeper.exe' || normalized === 'mines') { openMinesweeper(); return; }
    if (normalized === 'cv' || normalized === 'resume' || normalized === 'cv.pdf') {
      const tab = window.open('/cv', '_blank', 'noopener,noreferrer');
      if (tab) tab.opener = null;
      return;
    }
    if (normalized === 'github') {
      launch('browser', 'GitHub - Microsoft Internet Explorer', profile.links.github);
      return;
    }
    if (normalized === 'linkedin') {
      launch('browser', 'LinkedIn - Microsoft Internet Explorer', profile.links.linkedin);
      return;
    }
    if (/^https?:\/\//i.test(command)) {
      launch('browser', `${command} - Microsoft Internet Explorer`, command);
      return;
    }
    const project = projects.find(item => item.name.toLowerCase() === normalized);
    if (project) {
      openProject(project.name);
      return;
    }
    setRunError(`Windows cannot find '${command}'. Check the spelling and try again.`);
  }

  function projectIcon(project: Project) {
    if (project.url) return `${I}/internet-explorer.svg`;
    if (project.kind.toLowerCase().includes('bot') || project.kind.toLowerCase().includes('prototype')) return `${I}/executable.svg`;
    return `${I}/folder.svg`;
  }

  function windowIcon(win: WindowState) {
    if (win.app === 'welcome') return `${I}/welcome.svg`;
    if (win.app === 'contact') return `${I}/mail.svg`;
    if (win.app === 'browser') return `${I}/internet-explorer.svg`;
    if (win.app === 'achievements' || win.app === 'achievementDetail') return `${I}/achievements.svg`;
    if (win.app === 'experience' || win.app === 'experienceProperties') return `${I}/folder.svg`;
    if (win.app === 'gallery') return `${I}/my-pictures.svg`;
    if (win.app === 'photoViewer') return `${I}/image-file.svg`;
    if (win.app === 'about') return `${I}/my-computer.svg`;
    if (win.app === 'recycle') return `${I}/recycle-bin.svg`;
    if (win.app === 'properties') return `${I}/properties.svg`;
    if (win.app === 'documents') return `${I}/my-documents.svg`;
    if (win.app === 'projects' || win.app === 'projectDetail') return `${I}/my-projects.svg`;
    if (win.app === 'search') return `${I}/search.svg`;
    if (win.app === 'run') return `${I}/run.svg`;
    if (win.app === 'games') return `${I}/games.svg`;
    if (win.app === 'snake') return `${I}/snake.svg`;
    if (win.app === 'minesweeper') return `${I}/minesweeper.svg`;
    if (win.app === 'terminal') return `${I}/cmd.svg`;
    if (win.app === 'badges') return `${I}/badge.svg`;
    return `${I}/folder.svg`;
  }

  function addressFor(win: WindowState) {
    if (win.app === 'browser') return win.url || 'about:blank';
    if (win.app === 'projectFolder') return `C:\\Documents and Settings\\Nurbek\\My Projects\\${win.project || ''}`;
    if (win.app === 'projectDetail') return `C:\\Documents and Settings\\Nurbek\\My Projects\\${win.project || ''}\\Project Center`;
    if (win.app === 'properties') return `${win.project || win.title}`;
    if (win.app === 'experienceProperties') return `${win.experience || win.title}`;
    if (win.app === 'achievementDetail') return `C:\\Documents and Settings\\Nurbek\\Achievements\\${win.achievement || ''}`;
    if (win.app === 'search') return 'Search Results';
    if (win.app === 'games') return 'C:\\Documents and Settings\\Nurbek\\Games';
    if (win.app === 'snake') return 'C:\\Documents and Settings\\Nurbek\\Games\\Snake.exe';
    if (win.app === 'minesweeper') return 'C:\\Documents and Settings\\Nurbek\\Games\\Minesweeper.exe';
    if (win.app === 'badges') return 'C:\\Documents and Settings\\Nurbek\\NurbekOS Achievements';
    return `C:\\Documents and Settings\\Nurbek\\${win.title}`;
  }

  function onDesktopContext(event: ReactMouseEvent, shortcut: {id: AppId; label: string}) {
    event.preventDefault();
    event.stopPropagation();
    setSelected(shortcut.id);
    setContext({x: event.clientX, y: event.clientY, type: 'shortcut', id: shortcut.id, label: shortcut.label});
  }

  function onProjectContext(event: ReactMouseEvent, name: string) {
    event.preventDefault();
    event.stopPropagation();
    setSelected(name);
    setContext({x: event.clientX, y: event.clientY, type: 'project', project: name});
  }

  function activateOnTouch(action: () => void) {
    if (window.matchMedia('(pointer: coarse)').matches) action();
  }

  /** Where Back / Up lead from a window. */
  function parentOf(win: WindowState): AppId | null {
    if (win.app === 'projectDetail' || win.app === 'projectFolder' || win.app === 'properties') return 'projects';
    if (win.app === 'experienceProperties') return 'experience';
    if (win.app === 'achievementDetail') return 'achievements';
    if (win.app === 'gallery' && (win.project || win.achievement)) return 'gallery';
    if (win.app === 'recycle') return 'projects';
    if (win.app === 'snake' || win.app === 'minesweeper') return 'games';
    return null;
  }

  function goUp(win: WindowState) {
    const parent = parentOf(win);
    if (!parent) return;
    close(win.id);
    launch(parent);
  }

  function renderMenu(name: MenuName, win: WindowState) {
    const item = (label: string, action: () => void, extra?: {checked?: boolean; hint?: string; disabled?: boolean}) => (
      <button type="button" role="menuitem" key={label} disabled={extra?.disabled} onClick={action}>
        <span className="menu-check">{extra?.checked ? '✓' : ''}</span><span>{label}</span>{extra?.hint && <kbd>{extra.hint}</kbd>}
      </button>
    );
    const sep = (key: string) => <div className="menu-separator" key={key}/>;
    const path = pathFor(win, projects);
    switch (name) {
      case 'File': return [
        item('Open in new tab', () => path && window.open(path, '_blank', 'noopener'), {disabled: !path}),
        item('Copy link to this window', () => copyLink(win)),
        sep('f1'),
        item(win.maximized ? 'Restore' : 'Maximize', () => patch(win.id, {maximized: !win.maximized})),
        item('Minimize', () => minimize(win.id)),
        sep('f2'),
        item('Close', () => close(win.id), {hint: 'Esc'}),
      ];
      case 'Edit': return [
        item('Copy link', () => copyLink(win)),
        item('Find…', () => launch('search', 'Search Results'), {hint: 'F3'}),
      ];
      case 'View': return [
        item('Tiles', () => setViewMode('tiles'), {checked: viewMode === 'tiles'}),
        item('Details', () => setViewMode('details'), {checked: viewMode === 'details'}),
        sep('v1'),
        item('Folders pane', () => setFoldersPane(value => !value), {checked: foldersPane}),
      ];
      case 'Favorites': return [
        item('Telegram — @uzalisherov', () => { outbound(profile.links.telegram, 'Telegram'); window.open(profile.links.telegram, '_blank', 'noopener'); }),
        item('LinkedIn', () => { outbound(profile.links.linkedin, 'LinkedIn'); window.open(profile.links.linkedin, '_blank', 'noopener'); }),
        item('GitHub', () => { outbound(profile.links.github, 'GitHub'); window.open(profile.links.github, '_blank', 'noopener'); }),
        sep('fa1'),
        item('My CV (PDF)', () => window.open('/cv', '_blank', 'noopener')),
        item('Send me a message', () => launch('contact')),
      ];
      case 'Tools': return [
        item('Search', () => launch('search', 'Search Results'), {hint: '/'}),
        item('Terminal', () => launch('terminal')),
        item('Run…', () => launch('run')),
        sep('t1'),
        item('Interface sounds', toggleSound, {checked: sound}),
      ];
      case 'Help': return [
        item('Start Here', () => launch('welcome')),
        item('About nurbekOS', () => launch('about')),
        item('NurbekOS Achievements', () => launch('badges')),
      ];
    }
  }

  const explorerApps: AppId[] = ['projects', 'experience', 'projectFolder', 'projectDetail', 'achievements', 'achievementDetail', 'gallery', 'documents', 'games', 'badges', 'recycle', 'browser', 'search'];

  return (
    <main
      className="desktop"
      onClick={() => { setStart(false); setContext(null); setSelected(''); setMenu(null); }}
      onContextMenu={event => { event.preventDefault(); setContext(null); }}
    >
      <a className="skip-link" href="#desktop-icons">Skip to desktop shortcuts</a>

      {boot && (
        <div className="boot" role="status" aria-label="NurbekOS is starting">
          <div className="boot-logo"><span className="brand-mark">nurbek<b>OS</b></span><small>{profile.name}</small></div>
          <div className="boot-progress" aria-hidden="true"><span/></div>
          <button type="button" onClick={() => setBoot(false)}>Skip startup ›</button>
        </div>
      )}

      <Wallpaper phase={skyPhase(skyHour)}/>

      <div className="desktop-icons" id="desktop-icons" aria-label="Desktop shortcuts">
        {[...shortcuts, recycleShortcut].map(shortcut => (
          <button
            type="button"
            key={shortcut.id}
            className={`desktop-icon ${selected === shortcut.id ? 'selected' : ''} ${shortcut.id === 'recycle' ? 'recycle-icon' : ''}`}
            onClick={event => {
              event.stopPropagation();
              setSelected(shortcut.id);
              setContext(null);
              activateOnTouch(() => launch(shortcut.id));
            }}
            onDoubleClick={() => launch(shortcut.id)}
            onContextMenu={event => onDesktopContext(event, shortcut)}
            aria-label={`Open ${shortcut.label}`}
          >
            <Icon src={shortcut.icon} size={48}/>
            <span>{shortcut.label}</span>
          </button>
        ))}
      </div>

      <div className="desktop-brand" aria-hidden="true"><span className="brand-mark">nurbek<b>OS</b></span><small>{profile.name}</small></div>

      <aside className="now-gadget" aria-label={`About ${profile.name}`} onClick={event => event.stopPropagation()}>
        <div className="gadget-clock">
          <span className="gadget-time">{tashkentTime || '\u00a0'}</span>
          <span className="gadget-place">in Tashkent</span>
        </div>
        <p className="gadget-status">{SKY_STATUS[skyPhase(skyHour)]}</p>
        <div className="gadget-rule"/>
        <div className="now-head">
          <img src={profile.photo} alt="" width={40} height={40}/>
          <div><b>{profile.name}</b><span>{profile.headline}</span></div>
        </div>
        <ul className="gadget-now" aria-label="What I’m working on">{profile.now.slice(0, 4).map(item => <li key={item}>{item}</li>)}</ul>
        <div className="now-actions">
          <button type="button" className="xp-button primary" onClick={() => launch('contact')}>Message me</button>
          <a className="xp-button" href="/cv" target="_blank" rel="noopener noreferrer">CV</a>
        </div>
      </aside>

      <div className="desktop-hint" aria-hidden="true">Double-click an icon to open it. Press / to search.</div>

      {windows.filter(win => !win.minimized).map((win, index) => {
        const showExplorerChrome = explorerApps.includes(win.app);
        const showStatus = showExplorerChrome && win.app !== 'browser';
        return (
          <section
            key={win.id}
            className={`xp-window ${active === win.id ? 'is-active' : ''} ${win.maximized ? 'maximized' : ''} ${win.centered && !win.maximized ? 'centered' : ''} app-${win.app}`}
            style={win.maximized ? {zIndex: 10 + index} : {
              // Keep windows fully on screen, whatever the viewport size.
              left: win.centered ? undefined : `max(4px, min(${win.x}px, calc(100vw - min(${win.width}px, calc(100vw - 16px)) - 8px)))`,
              top: win.centered ? undefined : `max(4px, min(${win.y}px, calc(100dvh - min(${win.height}px, calc(100dvh - 55px)) - 42px)))`,
              width: `min(${win.width}px, calc(100vw - 16px))`,
              height: `min(${win.height}px, calc(100dvh - 55px))`,
              zIndex: 10 + index,
            }}
            onPointerDown={() => focus(win.id)}
            role="dialog"
            aria-label={win.title}
          >
            <div
              className="xp-titlebar"
              onPointerDown={event => {
                if (win.maximized || (event.target as HTMLElement).closest('button')) return;
                // Start from where the window actually is on screen (it may be centred or clamped).
                const rect = (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                const x = rect.left, y = rect.top;
                if (win.centered || x !== win.x || y !== win.y) patch(win.id, {centered: false, x, y});
                drag.current = {id: win.id, startX: event.clientX, startY: event.clientY, x, y};
              }}
              onDoubleClick={() => patch(win.id, {maximized: !win.maximized})}
            >
              <span className="title-left"><Icon src={windowIcon(win)} size={17}/>{win.title}</span>
              <span className="window-actions">
                <button type="button" aria-label={`Minimize ${win.title}`} onClick={() => minimize(win.id)}><i className="min-glyph"/></button>
                <button type="button" aria-label={`${win.maximized ? 'Restore' : 'Maximize'} ${win.title}`} onClick={() => patch(win.id, {maximized: !win.maximized})}><i className="max-glyph"/></button>
                <button type="button" className="close" aria-label={`Close ${win.title}`} onClick={() => close(win.id)}><i className="close-glyph"/></button>
              </span>
            </div>

            {showExplorerChrome && (
              <>
                <nav className="xp-menu" aria-label="Window menu" onClick={event => event.stopPropagation()}>
                  {(['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'] as MenuName[]).map(name => (
                    <div className="menu-root" key={name}>
                      <button
                        type="button"
                        className={menu?.win === win.id && menu.name === name ? 'open' : ''}
                        aria-haspopup="menu"
                        aria-expanded={menu?.win === win.id && menu.name === name}
                        onClick={() => setMenu(current => current?.win === win.id && current.name === name ? null : {win: win.id, name})}
                        onMouseEnter={() => setMenu(current => current && current.win === win.id ? {win: win.id, name} : current)}
                      >{name}</button>
                      {menu?.win === win.id && menu.name === name && (
                        <div className="xp-dropdown" role="menu" onClick={() => setMenu(null)}>
                          {renderMenu(name, win)}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
                <div className="xp-toolbar" role="toolbar" aria-label="Explorer toolbar">
                  <button type="button" disabled={!parentOf(win)} title="Back" onClick={() => goUp(win)}><Icon src={`${I}/back.svg`} size={24}/> <span>Back</span></button>
                  <button type="button" className="icon-only" disabled title="Forward"><Icon src={`${I}/forward.svg`} size={24}/></button>
                  <button type="button" className="icon-only" title="Up one level" disabled={!parentOf(win)} onClick={() => goUp(win)}><Icon src={`${I}/up.svg`} size={22}/></button>
                  <span className="toolbar-divider"/>
                  <button type="button" onClick={() => launch('search', 'Search Results')}><Icon src={`${I}/search.svg`} size={24}/> <span>Search</span></button>
                  <button type="button" className={foldersPane ? 'toolbar-pressed' : ''} onClick={() => setFoldersPane(value => !value)}><Icon src={`${I}/folder.svg`} size={23}/> <span>Folders</span></button>
                  <span className="toolbar-divider"/>
                  <button type="button" onClick={() => setViewMode(viewMode === 'tiles' ? 'details' : 'tiles')}><Icon src={`${I}/views.svg`} size={22}/> <span>{viewMode === 'tiles' ? 'Details' : 'Tiles'}</span></button>
                </div>
                <div className="xp-address">
                  <label>Address</label>
                  <div className="address-field"><Icon src={windowIcon(win)} size={17}/><input aria-label="Current address" value={addressFor(win)} readOnly/></div>
                  <button type="button" className="go" onClick={() => copyLink(win)} title="Copy a link to this window"><b>➜</b> Copy link</button>
                </div>
              </>
            )}

            <div className="xp-content">
              {win.app === 'welcome' && (
                <div className="welcome-app">
                  <aside className="welcome-side">
                    <div className="welcome-photo"><img src={profile.photo} alt={profile.name}/></div>
                    <b>{profile.name}</b>
                    <span>{profile.location}</span>
                    <div className="welcome-socials">
                      <a href={profile.links.telegram} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.telegram, 'Telegram')} aria-label="Telegram"><Icon src={`${I}/telegram.svg`} size={22}/></a>
                      <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.linkedin, 'LinkedIn')} aria-label="LinkedIn"><Icon src={`${I}/linkedin.svg`} size={22}/></a>
                      <a href={profile.links.github} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.github, 'GitHub')} aria-label="GitHub"><Icon src={`${I}/github.svg`} size={22}/></a>
                    </div>
                    <div className="welcome-side-note">{profile.education}</div>
                  </aside>
                  <div className="welcome-main">
                    <p className="welcome-kicker">Welcome to nurbekOS</p>
                    <h2 className="welcome-title">Hi, I’m {profile.name.split(' ')[0]}.</h2>
                    <p className="welcome-pitch">{profile.pitch}</p>
                    <div className="welcome-stats">
                      {profile.stats.map((stat, i) => <div key={stat.label} style={{animationDelay: `${0.15 + i * 0.08}s`}}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
                    </div>
                    <div className="welcome-cta">
                      <button type="button" className="xp-cta primary" onClick={() => openFrom(win.id, 'projects')}><Icon src={`${I}/my-projects.svg`} size={22}/>See my work</button>
                      <button type="button" className="xp-cta" onClick={() => openFrom(win.id, 'contact')}><Icon src={`${I}/mail.svg`} size={22}/>Get in touch</button>
                      <a className="xp-cta" href="/cv" target="_blank" rel="noopener noreferrer"><Icon src={`${I}/text-file.svg`} size={22}/>Download CV</a>
                    </div>
                    <div className="welcome-tour">
                      <span>Or explore it like it’s 2003:</span>
                      <button type="button" onClick={() => openFrom(win.id, 'experience')}>Work Experience</button>
                      <button type="button" onClick={() => openFrom(win.id, 'achievements')}>Achievements</button>
                      <button type="button" onClick={() => openFrom(win.id, 'gallery')}>My Pictures</button>
                      <button type="button" onClick={() => openFrom(win.id, 'games')}>Games</button>
                    </div>
                  </div>
                  <footer className="welcome-footer">
                    <label><input type="checkbox" checked={showWelcomeAtStartup} onChange={event => toggleWelcomeAtStartup(event.target.checked)}/> Show this window when nurbekOS starts</label>
                    <button type="button" className="xp-button" onClick={() => close(win.id)}>Close</button>
                  </footer>
                </div>
              )}

              {win.app === 'contact' && (
                <form className="mail-app" onSubmit={sendMessage} noValidate>
                  <div className="mail-toolbar">
                    <button type="submit" className="mail-tool" disabled={contactState.status === 'sending' || contactState.status === 'sent'}><Icon src={`${I}/send.svg`} size={26}/><span>{contactState.status === 'sending' ? 'Sending…' : 'Send'}</span></button>
                    <span className="toolbar-divider"/>
                    <a className="mail-tool" href={profile.links.telegram} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.telegram, 'Telegram')}><Icon src={`${I}/telegram.svg`} size={26}/><span>Telegram</span></a>
                    <a className="mail-tool" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.linkedin, 'LinkedIn')}><Icon src={`${I}/linkedin.svg`} size={26}/><span>LinkedIn</span></a>
                  </div>
                  {contactState.status === 'sent' ? (
                    <div className="mail-sent" role="status">
                      <Icon src={`${I}/send.svg`} size={56}/>
                      <h2>Message sent</h2>
                      <p>Thanks for writing — it landed straight in my inbox. I usually reply within a couple of days.</p>
                      <div><button type="button" className="xp-button" onClick={() => setContactState({status: 'idle'})}>Write another</button><button type="button" className="xp-button" onClick={() => close(win.id)}>Close</button></div>
                    </div>
                  ) : (<>
                    <div className="mail-fields">
                      <span className="mail-label">To:</span>
                      <div className="mail-to"><img src={profile.photo} alt="" width={18} height={18}/>{profile.name}</div>
                      <label className="mail-label" htmlFor={`name-${win.id}`}>From:</label>
                      <input id={`name-${win.id}`} value={contactForm.name} onChange={event => setContactForm(form => ({...form, name: event.target.value}))} placeholder="Your name" autoComplete="name" maxLength={80} required/>
                      <label className="mail-label" htmlFor={`contact-${win.id}`}>Reply to:</label>
                      <input id={`contact-${win.id}`} value={contactForm.contact} onChange={event => setContactForm(form => ({...form, contact: event.target.value}))} placeholder="Email or @telegram username" autoComplete="email" maxLength={120} required/>
                      <label className="mail-label" htmlFor={`topic-${win.id}`}>Subject:</label>
                      <select id={`topic-${win.id}`} value={contactForm.topic} onChange={event => setContactForm(form => ({...form, topic: event.target.value}))}>{TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select>
                    </div>
                    <textarea aria-label="Message" className="mail-body" value={contactForm.message} onChange={event => setContactForm(form => ({...form, message: event.target.value}))} placeholder={`Hi ${profile.name.split(' ')[0]},\n\n`} maxLength={4000} required/>
                    <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={contactForm.website} onChange={event => setContactForm(form => ({...form, website: event.target.value}))} name="website"/>
                    <div className={`mail-status ${contactState.status === 'error' ? 'error' : ''}`} role={contactState.status === 'error' ? 'alert' : undefined}>
                      {contactState.status === 'error' ? contactState.error : 'Messages go straight to me. I usually reply within a couple of days.'}
                    </div>
                  </>)}
                </form>
              )}

              {win.app === 'projects' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar">
                    <div className="task-panel"><strong>File and Folder Tasks</strong><button type="button" onClick={() => launch('search', 'Search Projects')}>Search these projects</button><button type="button" onClick={() => setViewMode(viewMode === 'tiles' ? 'details' : 'tiles')}>Change view</button></div>
                    <div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('about')}>My Computer</button><button type="button" onClick={() => launch('documents')}>My Documents</button><button type="button" onClick={() => launch('gallery')}>My Pictures</button><button type="button" onClick={() => launch('experience')}>Work Experience</button></div>
                    <div className="task-panel"><strong>Details</strong><p><b>My Projects</b><br/>{projects.length} objects<br/>{projects.filter(item => item.status === 'active').length} active</p></div>
                  </aside>}
                  <div className="explorer-main">
                    {viewMode === 'tiles' ? (<>
                      {projects.some(project => project.featured) && <section className="featured-strip" aria-label="Featured projects">
                        <h3 className="group-heading">Featured<span>{projects.filter(project => project.featured).length}</span></h3>
                        <div className="featured-grid">
                          {projects.filter(project => project.featured).map(project => (
                            <button type="button" key={project.name} className="featured-card" style={{'--tone': TONES[project.coverTone]} as CSSProperties} onClick={event => {event.stopPropagation(); openProject(project.name);}} onContextMenu={event => onProjectContext(event, project.name)}>
                              <span className="featured-top">
                                {project.logo ? <img src={project.logo} alt="" width={44} height={44}/> : <span className="featured-initial">{project.name[0]}</span>}
                                <span className={`pc-status s-${project.status}`}>{statusText(project.status)}</span>
                              </span>
                              <b>{project.name}</b>
                              <small>{project.description}</small>
                              {project.metrics?.[0] && <span className="featured-metric"><strong>{project.metrics[0].value}</strong>{project.metrics[0].label}</span>}
                            </button>
                          ))}
                        </div>
                      </section>}
                      <h3 className="group-heading files-heading">More projects &amp; experiments<span>{projects.filter(project => !project.featured && project.status !== 'archived').length}</span></h3>
                      <div className="explorer-files">
                        {projects.filter(project => !project.featured && project.status !== 'archived').map(project => (
                          <button
                            type="button"
                            key={project.name}
                            className={`file-item ${selected === project.name ? 'selected-file' : ''}`}
                            onClick={event => {event.stopPropagation(); openProject(project.name);}}
                            onDoubleClick={() => openProject(project.name)}
                            onContextMenu={event => onProjectContext(event, project.name)}
                            title="Open project"
                          >
                            <Icon src={projectIcon(project)} size={43}/>
                            <span className="file-copy"><span className="file-name">{project.name}</span><small>{project.kind}</small><small>{statusText(project.status)}</small></span>
                          </button>
                        ))}
                        <button type="button" className="file-item" onClick={event => {event.stopPropagation(); launch('recycle');}} title="Open the archive">
                          <Icon src={`${I}/recycle-bin.svg`} size={43}/>
                          <span className="file-copy"><span className="file-name">Archive</span><small>{projects.filter(project => project.status === 'archived').length} past projects</small><small>Lessons & finished work</small></span>
                        </button>
                      </div>
                    </>) : (
                      <div className="details-table" role="table" aria-label="Projects">
                        <div className="details-head" role="row"><span>Name</span><span>Type</span><span>Status</span><span>Timeline</span></div>
                        {projects.map(project => <button type="button" className="details-row" role="row" key={project.name} onDoubleClick={() => openProject(project.name)} onClick={() => openProject(project.name)}>
                          <span><Icon src={projectIcon(project)} size={18}/>{project.name}</span><span>{project.kind}</span><span>{project.status}</span><span>{project.year}</span>
                        </button>)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {win.app === 'projectDetail' && (() => {
                const project = projects.find(item => item.name === win.project);
                if (!project) return null;
                const projectPhotos = photos.filter(photo => photo.project === project.name).slice(0, 4);
                return (
                  <div className={`project-center-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                    {foldersPane && <aside className="explorer-sidebar project-sidebar">
                      <div className="task-panel"><strong>Project Tasks</strong>{project.url && <button type="button" onClick={() => visitProject(project.name)}>Open live website</button>}<button type="button" onClick={() => exploreProject(project.name)}>Explore project files</button><button type="button" onClick={() => projectProperties(project.name)}>View properties</button></div>
                      <div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('projects')}>My Projects</button><button type="button" onClick={() => launch('experience')}>Work Experience</button><button type="button" onClick={() => launch('achievements')}>Achievements</button></div>
                    </aside>}
                    <article className="project-center" style={{'--tone': TONES[project.coverTone]} as CSSProperties}>
                      <header className="pc-head">
                        <div className="pc-logo">{project.logo ? <img src={project.logo} alt=""/> : <span>{project.name[0]}</span>}</div>
                        <div className="pc-title">
                          <h2>{project.name}</h2>
                          <p>{project.role && <span className="pc-role">{project.role}</span>}<span>{project.kind}</span><span className={`pc-status s-${project.status}`}>{statusText(project.status)}</span></p>
                        </div>
                        <div className="pc-actions">
                          {project.url && <a className="xp-cta primary" href={project.url} target="_blank" rel="noopener noreferrer" onClick={() => outbound(project.url, `${project.name} website`)}>Visit {hostOf(project.url)}</a>}
                          <button type="button" className="xp-cta" onClick={() => copyLink(win)}>Copy link</button>
                        </div>
                      </header>
                      <p className="pc-lede">{project.description}</p>
                      {project.metrics && project.metrics.length > 0 && <div className="pc-metrics" aria-label="Impact">{project.metrics.map(metric => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}</div>}
                      <section className="pc-section"><h3>The story</h3><p>{project.detail}</p></section>
                      {projectPhotos.length > 0 && <section className="pc-section">
                        <h3>Photos</h3>
                        <div className="pc-photos">{projectPhotos.map(photo => <button type="button" key={photo.id} onClick={() => openPhoto(photo.id)} aria-label={`Open ${photo.title}`}><img src={photo.src} alt={photo.alt} loading="lazy"/></button>)}</div>
                        {photos.filter(photo => photo.project === project.name).length > projectPhotos.length && <button type="button" className="text-link-button" onClick={() => launch('gallery', `${project.name} - Pictures`, undefined, project.name)}>See all {photos.filter(photo => photo.project === project.name).length} photos</button>}
                      </section>}
                      <dl className="pc-facts">
                        <div><dt>Role</dt><dd>{project.role || 'Builder'}</dd></div>
                        <div><dt>Timeline</dt><dd>{project.year}</dd></div>
                        <div><dt>Focus</dt><dd>{project.tech.split('·').map(item => item.trim()).filter(Boolean).join(', ')}</dd></div>
                        {project.url && <div><dt>Website</dt><dd><a href={project.url} target="_blank" rel="noopener noreferrer" onClick={() => outbound(project.url, `${project.name} website`)}>{hostOf(project.url)}</a> <button type="button" className="text-link-button" onClick={() => visitProject(project.name)}>Preview inside nurbekOS</button></dd></div>}
                      </dl>
                      {(() => {
                        const index = projects.findIndex(item => item.name === project.name);
                        const prev = projects[index - 1];
                        const next = projects[index + 1];
                        const go = (target: Project, from: HTMLElement) => {
                          from.closest('.project-center')?.scrollTo({top: 0});
                          patch(win.id, {project: target.name, title: `${target.name} — Project Center`});
                          const path = pathFor({app: 'projectDetail', project: target.name}, projects);
                          if (path) track('open', {path});
                          sfx('click');
                        };
                        return <nav className="pc-nav" aria-label="More projects">
                          {prev ? <button type="button" onClick={event => go(prev, event.currentTarget)}><small>Previous</small><b>‹ {prev.name}</b></button> : <span/>}
                          {next ? <button type="button" className="next" onClick={event => go(next, event.currentTarget)}><small>Next</small><b>{next.name} ›</b></button> : <span/>}
                        </nav>;
                      })()}
                    </article>
                  </div>
                );
              })()}

              {win.app === 'projectFolder' && (() => {
                const project = projects.find(item => item.name === win.project);
                if (!project) return null;
                const projectPhotos = photos.filter(photo => photo.project === project.name);
                const files = [
                  ...(project.url ? [{name: 'website.url', type: 'url', icon: `${I}/internet-explorer.svg`, detail: 'Internet Shortcut'}] : []),
                  {name: 'PROJECT_INFO.txt', type: 'readme', icon: `${I}/text-file.svg`, detail: 'Text Document'},
                  ...(projectPhotos.length ? [{name: 'media', type: 'media', icon: `${I}/my-pictures.svg`, detail: `${projectPhotos.length} Pictures`}] : []),
                  {name: `${project.name}.properties`, type: 'properties', icon: `${I}/properties.svg`, detail: 'Project Properties'},
                ];
                return (
                  <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                    {foldersPane && <aside className="explorer-sidebar">
                      <div className="task-panel"><strong>File and Folder Tasks</strong><button type="button" onClick={() => openProject(project.name)}>Open Project Center</button><button type="button" onClick={() => projectProperties(project.name)}>View project properties</button>{project.url && <button type="button" onClick={() => visitProject(project.name)}>Open website</button>}</div>
                      <div className="task-panel"><strong>Details</strong><p><b>{project.name}</b><br/>{project.kind}<br/>{project.year}</p></div>
                    </aside>}
                    <div className="explorer-main">
                      <div className="explorer-files project-files">
                        {files.map(file => (
                          <button
                            type="button"
                            key={file.name}
                            className="file-item"
                            onDoubleClick={() => {
                              if (file.type === 'url') visitProject(project.name);
                              else if (file.type === 'properties') projectProperties(project.name);
                              else if (file.type === 'media') launch('gallery', `${project.name} - Pictures`, undefined, project.name);
                              else openProject(project.name);
                            }}
                            onClick={() => activateOnTouch(() => {
                              if (file.type === 'url') visitProject(project.name);
                              else if (file.type === 'properties') projectProperties(project.name);
                              else if (file.type === 'media') launch('gallery', `${project.name} - Pictures`, undefined, project.name);
                              else openProject(project.name);
                            })}
                          >
                            <Icon src={file.icon} size={43}/><span className="file-copy"><span className="file-name">{file.name}</span><small>{file.detail}</small></span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {win.app === 'browser' && (
                <div className="browser-view">
                  {win.project && <div className="browser-project"><span><Icon src={`${I}/internet-explorer.svg`} size={18}/><b>{win.project}</b></span><button type="button" onClick={() => openProject(win.project!)}>Project Center</button><button type="button" onClick={() => exploreProject(win.project!)}>Files</button><button type="button" onClick={() => projectProperties(win.project!)}>Properties</button></div>}
                  {win.url ? <>
                    <iframe key={win.url} src={win.url} title={`${win.project || win.url} website`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"/>
                    <div className="browser-fallback">If the page refuses to load, it may block embedding. <a href={win.url} target="_blank" rel="noopener noreferrer">Open it in a new tab ↗</a></div>
                  </> : <div className="no-website"><Icon src={`${I}/internet-explorer.svg`} size={58}/><h2>Internet Explorer</h2><p>No address was supplied.</p></div>}
                </div>
              )}

              {win.app === 'experience' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar">
                    <div className="task-panel"><strong>Experience Tasks</strong><button type="button" onClick={() => launch('search', 'Search Experience')}>Search experience</button><button type="button" onClick={() => setViewMode(viewMode === 'tiles' ? 'details' : 'tiles')}>Change view</button></div>
                    <div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('projects')}>My Projects</button><button type="button" onClick={() => launch('achievements')}>Achievements</button><button type="button" onClick={() => launch('documents')}>My Documents</button></div>
                    <div className="task-panel"><strong>Details</strong><p><b>Work Experience</b><br/>{experiences.length} organizations</p></div>
                  </aside>}
                  <div className="explorer-main">
                    {viewMode === 'tiles' ? <div className="experience-files">
                      {experiences.map(experience => <button type="button" key={experience.id} className="experience-file" onDoubleClick={() => experienceProperties(experience.id)} onClick={() => experienceProperties(experience.id)}>
                        <BrandIcon name={experience.organization} logo={experience.logo} size={52}/><span><b>{experience.organization}</b><small>{experience.role}</small><small>{experience.period}</small></span>
                      </button>)}
                    </div> : <div className="details-table experience-details" role="table" aria-label="Work experience">
                      <div className="details-head" role="row"><span>Organization</span><span>Role</span><span>Location</span><span>Period</span></div>
                      {experiences.map(experience => <button type="button" className="details-row" role="row" key={experience.id} onDoubleClick={() => experienceProperties(experience.id)} onClick={() => experienceProperties(experience.id)}>
                        <span><BrandIcon name={experience.organization} logo={experience.logo} size={22}/>{experience.organization}</span><span>{experience.role}</span><span>{experience.location}</span><span>{experience.period}</span>
                      </button>)}
                    </div>}
                  </div>
                </div>
              )}

              {win.app === 'achievements' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar">
                    <div className="task-panel"><strong>Achievement Tasks</strong><button type="button" onClick={() => launch('search', 'Search Achievements')}>Search achievements</button></div>
                    <div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('projects')}>My Projects</button><button type="button" onClick={() => launch('experience')}>Work Experience</button><button type="button" onClick={() => launch('gallery')}>My Pictures</button></div>
                    <div className="task-panel"><strong>Details</strong><p><b>Achievements</b><br/>{awards.length} items</p></div>
                  </aside>}
                  <div className="awards-timeline">
                    {[...new Set(awards.map(award => award.year))].map(year => (
                      <section className="award-year" key={year}>
                        <h3>{year}</h3>
                        <div className="award-items">
                          {awards.filter(award => award.year === year).map(award => {
                            const count = photos.filter(photo => photo.achievement === award.name).length;
                            return <button type="button" className="award-row" key={award.name} onClick={() => openAchievement(award.name)}>
                              <Icon src={`${I}/certificate.svg`} size={34}/>
                              <span className="award-copy"><b>{award.name}</b>{award.issuer && <small>{award.issuer}</small>}<span className="award-desc">{award.description}</span></span>
                              {count > 0 && <span className="award-photos">{count} {count === 1 ? 'photo' : 'photos'}</span>}
                            </button>;
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              )}

              {win.app === 'achievementDetail' && (() => {
                const award = awards.find(item => item.name === win.achievement);
                if (!award) return null;
                const awardPhotos = photos.filter(photo => photo.achievement === award.name).slice(0, 4);
                return <div className="achievement-detail">
                  <header><Icon src={`${I}/certificate.svg`} size={58}/><div><span className="award-year-tag">{award.year}</span><h2>{award.name}</h2>{award.issuer && <p>{award.issuer}</p>}</div></header>
                  <section><h3>About</h3><p>{award.description}</p></section>
                  {awardPhotos.length > 0 ? <section><h3>Photos & documents</h3><div className="inline-photo-grid achievement-photos">{awardPhotos.map(photo => <button type="button" key={photo.id} onClick={() => openPhoto(photo.id)}><img src={photo.src} alt={photo.alt} loading="lazy"/><span>{photo.title}</span></button>)}</div><button type="button" className="text-link-button" onClick={() => launch('gallery', `${award.name} - Pictures`, undefined, undefined, undefined, undefined, award.name)}>Open all pictures</button></section> : <section><h3>Photos</h3><p className="muted-copy">No public photo has been added for this achievement yet.</p></section>}
                </div>;
              })()}

              {win.app === 'gallery' && (() => {
                const galleryPhotos = win.project
                  ? photos.filter(photo => photo.project === win.project)
                  : win.achievement
                    ? photos.filter(photo => photo.achievement === win.achievement)
                    : photos;
                const order = ['Projects', 'Achievements', 'Experiences & Events', 'Acceptances', 'General Gallery'];
                const grouped = galleryPhotos.reduce<Record<string, typeof photos>>((acc, photo) => {
                  const key = win.project || win.achievement ? 'Pictures' : photo.section;
                  (acc[key] ||= []).push(photo);
                  return acc;
                }, {});
                const groups = Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)));
                return <div className={`explorer-layout gallery-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar picture-sidebar">
                    <div className="task-panel"><strong>Picture Tasks</strong><button type="button" onClick={() => galleryPhotos[0] && openPhoto(galleryPhotos[0].id)}>View as a slide show</button><button type="button" onClick={() => launch('search', 'Search Pictures')}>Search pictures</button></div>
                    <div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('documents')}>My Documents</button><button type="button" onClick={() => launch('projects')}>My Projects</button><button type="button" onClick={() => launch('achievements')}>Achievements</button>{(win.project || win.achievement) && <button type="button" onClick={() => launch('gallery')}>All Pictures</button>}</div>
                    <div className="task-panel"><strong>Details</strong><p><b>{win.project || win.achievement || 'My Pictures'}</b><br/>{galleryPhotos.length} images<br/>{win.project || win.achievement ? 'Filtered gallery' : 'Personal archive'}</p></div>
                  </aside>}
                  <div className="gallery-content">
                    <div className="gallery-note"><b>{win.project || win.achievement ? `${win.project || win.achievement} media` : 'My Pictures'}</b><span>{win.project || win.achievement ? 'Photos connected to this portfolio item.' : 'Projects, achievements, acceptances, events, and personal memories.'}</span></div>
                    {galleryPhotos.length === 0 ? <div className="empty-gallery"><Icon src={`${I}/my-pictures.svg`} size={54}/><p>No pictures have been added here yet.</p></div> : Object.entries(groups).map(([group, items]) => <section className="gallery-group" key={group}><h3>{group}<span>{items.length}</span></h3><div className="photo-grid">{items.map(photo => <button type="button" key={photo.id} className="photo-tile" onDoubleClick={() => openPhoto(photo.id)} onClick={() => openPhoto(photo.id)}><span className="photo-thumb"><img src={photo.src} alt={photo.alt} loading="lazy"/></span><span><b>{photo.title}</b><small>{photo.album} · {photo.date}</small></span></button>)}</div></section>)}
                  </div>
                </div>;
              })()}

              {win.app === 'photoViewer' && (() => {
                const photo = photos.find(item => item.id === win.photo) || photos[0];
                if (!photo) return null;
                return <div className="photo-viewer">
                  <div className="photo-stage"><img src={photo.src} alt={photo.alt} style={{transform: `scale(${photoZoom}) rotate(${photoRotation}deg)`}}/></div>
                  <div className="photo-info"><b>{photo.title}</b><span>{photo.caption}</span><small>{photo.album} · {photo.date}</small></div>
                  <div className="photo-toolbar" role="toolbar" aria-label="Photo viewer controls">
                    <button type="button" onClick={() => movePhoto(win.id, -1)} aria-label="Previous picture">◀</button>
                    <button type="button" onClick={() => movePhoto(win.id, 1)} aria-label="Next picture">▶</button>
                    <span className="photo-divider"/>
                    <button type="button" onClick={() => setPhotoZoom(value => Math.max(.5, +(value - .1).toFixed(1)))} aria-label="Zoom out">−</button>
                    <button type="button" onClick={() => setPhotoZoom(value => Math.min(2, +(value + .1).toFixed(1)))} aria-label="Zoom in">＋</button>
                    <button type="button" onClick={() => setPhotoZoom(1)} aria-label="Actual size">100%</button>
                    <span className="photo-divider"/>
                    <button type="button" onClick={() => setPhotoRotation(value => value - 90)} aria-label="Rotate left">↶</button>
                    <button type="button" onClick={() => setPhotoRotation(value => value + 90)} aria-label="Rotate right">↷</button>
                  </div>
                </div>;
              })()}

              {win.app === 'games' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar"><div className="task-panel"><strong>Game Tasks</strong><button type="button" onClick={openSnake}>Play Snake</button><button type="button" onClick={openMinesweeper}>Play Minesweeper</button></div><div className="task-panel"><strong>Details</strong><p><b>Games</b><br/>2 installed games<br/>Classic NurbekOS entertainment</p></div></aside>}
                  <div className="explorer-main">
                    <div className="explorer-files game-files">
                      <button type="button" className="file-item game-file" onDoubleClick={openSnake} onClick={openSnake}><Icon src={`${I}/snake.svg`} size={48}/><span className="file-copy"><span className="file-name">Snake.exe</span><small>Application · Classic arcade game</small><small>Arrow keys / WASD</small></span></button>
                      <button type="button" className="file-item game-file" onDoubleClick={openMinesweeper} onClick={openMinesweeper}><Icon src={`${I}/minesweeper.svg`} size={48}/><span className="file-copy"><span className="file-name">Minesweeper.exe</span><small>Application · Windows classic</small><small>10 mines · 9 × 9 board</small></span></button>
                    </div>
                  </div>
                </div>
              )}

              {win.app === 'snake' && (
                <div className="snake-app">
                  <div className="snake-topbar">
                    <div><b>Snake</b><span>Score: {snakeScore}</span><span>High score: {snakeHighScore}</span></div>
                    <div className="snake-actions"><button type="button" className="xp-button" onClick={() => setSnakeRunning(value => !value)}>{snakeRunning ? 'Pause' : snakeGameOver ? 'Game over' : 'Start'}</button><button type="button" className="xp-button" onClick={() => resetSnake(true)}>New Game</button></div>
                  </div>
                  <div className="snake-screen-wrap">
                    <div className="snake-screen" role="application" aria-label="Snake game board">
                      {Array.from({length: SNAKE_COLS * SNAKE_ROWS}, (_, index) => {
                        const x = index % SNAKE_COLS;
                        const y = Math.floor(index / SNAKE_COLS);
                        const snakeIndex = snake.findIndex(point => point.x === x && point.y === y);
                        const isFood = snakeFood.x === x && snakeFood.y === y;
                        return <span key={index} className={`snake-cell ${snakeIndex === 0 ? 'snake-head' : snakeIndex > 0 ? 'snake-body' : ''} ${isFood ? 'snake-food' : ''}`}/>;
                      })}
                      {!snakeRunning && <div className="snake-overlay"><b>{snakeGameOver ? 'GAME OVER' : snakeScore ? 'PAUSED' : 'SNAKE'}</b><span>{snakeGameOver ? `Score: ${snakeScore}` : 'Press an arrow key, WASD, or Start'}</span>{snakeGameOver && <button type="button" onClick={() => resetSnake(true)}>Play Again</button>}</div>}
                    </div>
                  </div>
                  <div className="snake-mobile-controls" aria-label="Snake touch controls">
                    <button type="button" aria-label="Move up" onClick={() => {setSnakeDirection(current => current === 'down' ? current : 'up'); setSnakeRunning(true);}}>▲</button>
                    <div><button type="button" aria-label="Move left" onClick={() => {setSnakeDirection(current => current === 'right' ? current : 'left'); setSnakeRunning(true);}}>◀</button><button type="button" aria-label="Move down" onClick={() => {setSnakeDirection(current => current === 'up' ? current : 'down'); setSnakeRunning(true);}}>▼</button><button type="button" aria-label="Move right" onClick={() => {setSnakeDirection(current => current === 'left' ? current : 'right'); setSnakeRunning(true);}}>▶</button></div>
                  </div>
                  <div className="snake-help">Arrow keys / WASD to move · Space to pause · Eat the red apple</div>
                </div>
              )}

              {win.app === 'minesweeper' && (
                <div className="mines-app">
                  <div className="mines-toolbar"><span className="mine-counter">💣 {MINE_COUNT - mineBoard.filter(cell => cell.flagged).length}</span><button type="button" className="mine-face" onClick={resetMinesweeper} aria-label="New game">{mineGameOver ? '😵' : mineWon ? '😎' : '🙂'}</button><button type="button" className={`xp-button ${mineFlagMode ? 'pressed' : ''}`} onClick={() => setMineFlagMode(value => !value)}>🚩 Flag</button></div>
                  <div className="mine-board" role="grid" aria-label="Minesweeper board">{mineBoard.map((cell, index) => <button type="button" key={index} role="gridcell" className={`mine-cell ${cell.revealed ? 'revealed' : ''} n${cell.adjacent}`} onClick={() => revealMineCell(index)} onContextMenu={event => {event.preventDefault(); flagMineCell(index);}} aria-label={cell.revealed ? cell.mine ? 'Mine' : `${cell.adjacent} adjacent mines` : cell.flagged ? 'Flagged cell' : 'Hidden cell'}>{cell.revealed ? cell.mine ? '💣' : cell.adjacent || '' : cell.flagged ? '🚩' : ''}</button>)}</div>
                  <div className="mines-help">Click to reveal · Right-click or use Flag mode · Clear all safe cells</div>
                </div>
              )}

              {win.app === 'terminal' && (
                <div className="terminal-app" onClick={() => document.getElementById(`terminal-${win.id}`)?.focus()}>
                  <div className="terminal-output" aria-live="polite">{terminalLines.map((line, index) => <div key={`${index}-${line}`}>{line || ' '}</div>)}</div>
                  <form className="terminal-prompt" onSubmit={runTerminalCommand}><span>C:\NurbekOS&gt;</span><input id={`terminal-${win.id}`} autoFocus value={terminalInput} onChange={event => setTerminalInput(event.target.value)} aria-label="Terminal command" autoComplete="off" spellCheck={false}/></form>
                </div>
              )}

              {win.app === 'badges' && (
                <div className="badges-app"><div className="badges-summary"><Icon src={`${I}/badge.svg`} size={52}/><div><b>NurbekOS Achievements</b><span>{unlockedBadges.length} of {OS_BADGES.length} unlocked</span></div></div><div className="badges-grid">{OS_BADGES.map(badge => { const unlocked = unlockedBadges.includes(badge.id); return <div className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`} key={badge.id}><div className="badge-medal">{unlocked ? '★' : '?'}</div><div><b>{unlocked ? badge.name : 'Locked'}</b><span>{unlocked ? badge.description : 'Keep exploring NurbekOS to unlock this achievement.'}</span></div></div>; })}</div></div>
              )}

              {win.app === 'documents' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar"><div className="task-panel"><strong>File and Folder Tasks</strong><button type="button" onClick={() => launch('search', 'Search Documents')}>Search this folder</button></div><div className="task-panel"><strong>Other Places</strong><button type="button" onClick={() => launch('gallery')}>My Pictures</button><button type="button" onClick={() => launch('projects')}>My Projects</button></div></aside>}
                  <div className="document-files">
                    <a className="document-file" href="/cv" target="_blank" rel="noopener noreferrer"><Icon src={`${I}/text-file.svg`} size={42}/><span><b>Nurbek_Alisherov_CV.pdf</b><small>Adobe PDF · Curriculum vitae</small></span></a>
                    <button type="button" className="document-file" onDoubleClick={() => launch('about')} onClick={() => launch('about')}><Icon src={`${I}/notepad.svg`} size={42}/><span><b>ABOUT_NURBEK.txt</b><small>Text Document · Opens System Properties</small></span></button>
                  </div>
                </div>
              )}

              {win.app === 'recycle' && (
                <div className={`explorer-layout ${foldersPane ? '' : 'sidebar-hidden'}`}>
                  {foldersPane && <aside className="explorer-sidebar"><div className="task-panel"><strong>Recycle Bin Tasks</strong><button type="button" onClick={() => launch('projects')}>View active projects</button></div><div className="task-panel"><strong>Details</strong><p><b>Recycle Bin</b><br/>Archived work is kept here instead of deleted.</p></div></aside>}
                  <div className="recycle-content">
                    <div className="recycle-intro"><Icon src={`${I}/recycle-bin.svg`} size={40}/><div><b>Archived Projects</b><span>{projects.filter(project => project.status === 'archived').length} items</span></div></div>
                    <div className="explorer-files recycle-files">{projects.filter(project => project.status === 'archived').map(project => <button type="button" key={project.name} className="file-item faded" onDoubleClick={() => openProject(project.name)} onClick={() => openProject(project.name)}><Icon src={`${I}/folder.svg`} size={42}/><span className="file-copy"><span className="file-name">{project.name}</span><small>{project.year}</small></span></button>)}</div>
                  </div>
                </div>
              )}

              {win.app === 'search' && (
                <div className="search-shell">
                  <aside className="search-companion">
                    <Icon src={`${I}/search.svg`} size={62}/>
                    <h2>Search Companion</h2>
                    <label htmlFor={`search-${win.id}`}>What do you want to search for?</label>
                    <input id={`search-${win.id}`} autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Project, award, role..."/>
                    <label htmlFor={`scope-${win.id}`}>Look in:</label>
                    <select id={`scope-${win.id}`} value={searchScope} onChange={event => setSearchScope(event.target.value as SearchScope)}>
                      <option value="all">NurbekOS</option><option value="projects">My Projects</option><option value="experience">Work Experience</option><option value="achievements">Achievements</option><option value="pictures">My Pictures</option>
                    </select>
                    <p className="search-tip">Tip: press <kbd>F3</kbd> or <kbd>/</kbd> from the desktop to open Search.</p>
                  </aside>
                  <div className="search-results">
                    <header><b>Search Results</b><span aria-live="polite">{searchQuery ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}` : 'Type a search term'}</span></header>
                    {!searchQuery && <div className="search-empty"><Icon src={`${I}/search.svg`} size={48}/><p>Start typing to search projects, work experience, achievements and pictures.</p></div>}
                    {searchQuery && searchResults.length === 0 && <div className="search-empty"><p>No files or folders matched “{searchQuery}”.</p></div>}
                    {searchResults.map(result => <button type="button" className="search-result" key={result.id} onDoubleClick={() => openSearchResult(result)} onClick={() => openSearchResult(result)}><Icon src={result.icon} size={34}/><span><b>{result.title}</b><small>{result.subtitle}</small><small className="result-type">{result.type}</small></span></button>)}
                  </div>
                </div>
              )}

              {win.app === 'run' && (
                <form className="run-dialog" onSubmit={runProgram}>
                  <div className="run-main"><Icon src={`${I}/run.svg`} size={36}/><p>Type the name of a program, folder, document, project, or Internet resource, and NurbekOS will open it for you.</p></div>
                  <label htmlFor={`run-${win.id}`}>Open:</label><input id={`run-${win.id}`} autoFocus value={runCommand} onChange={event => setRunCommand(event.target.value)} placeholder="projects, cv, telegram, linkedin..." aria-describedby={runError ? `run-error-${win.id}` : undefined}/>
                  {runError && <div className="run-error" id={`run-error-${win.id}`} role="alert">{runError}</div>}
                  <div className="run-actions"><button type="submit" className="xp-button">OK</button><button type="button" className="xp-button" onClick={() => close(win.id)}>Cancel</button><button type="button" className="xp-button" onClick={() => {close(win.id); launch('search', 'Search Results');}}>Browse...</button></div>
                </form>
              )}

              {win.app === 'about' && (
                <div className="system-properties">
                  <div className="property-tabs" role="tablist" aria-label="System Properties tabs">
                    {(['general', 'computer', 'portfolio', 'links'] as AboutTab[]).map(tab => <button type="button" role="tab" aria-selected={aboutTab === tab} key={tab} className={aboutTab === tab ? 'active' : ''} onClick={() => setAboutTab(tab)}>{tab === 'computer' ? 'Computer Name' : tab[0].toUpperCase() + tab.slice(1)}</button>)}
                  </div>
                  {aboutTab === 'general' && <div className="system-tab general-tab">
                    <div className="system-profile-photo"><img src={profile.photo} alt={`${profile.name} profile`} /></div>
                    <div className="system-copy"><h2>{profile.name}</h2><p className="system-headline">{profile.headline}</p><p>{profile.bio}</p><div className="system-rule"/><dl><dt>Registered to:</dt><dd>{profile.name}</dd><dt>Location:</dt><dd>{profile.location}</dd><dt>Studying:</dt><dd>{profile.education}</dd><dt>Focus:</dt><dd>{profile.focus}</dd></dl></div>
                  </div>}
                  {aboutTab === 'computer' && <div className="system-tab"><fieldset><legend>Computer description</legend><p>NurbekOS — interactive portfolio and project archive.</p></fieldset><fieldset><legend>Full computer name</legend><dl className="system-fields"><dt>Computer name:</dt><dd>{profile.computerName}</dd><dt>Workgroup:</dt><dd>{profile.workgroup}</dd></dl></fieldset><p className="system-note">This portfolio behaves like a desktop so visitors can explore work as files, folders and applications rather than as one long page.</p></div>}
                  {aboutTab === 'portfolio' && <div className="system-tab portfolio-tab"><div className="setting-row"><span><b>Projects</b><small>{projects.length} projects and experiments</small></span><button type="button" className="xp-button" onClick={() => launch('projects')}>Open</button></div><div className="setting-row"><span><b>Experience</b><small>{experiences.length} roles and organizations</small></span><button type="button" className="xp-button" onClick={() => launch('experience')}>Open</button></div><div className="setting-row"><span><b>Achievements</b><small>{awards.length} awards and recognitions</small></span><button type="button" className="xp-button" onClick={() => launch('achievements')}>Open</button></div><div className="setting-row"><span><b>Pictures</b><small>{photos.length} images currently installed</small></span><button type="button" className="xp-button" onClick={() => launch('gallery')}>Open</button></div><div className="setting-row"><span><b>Games</b><small>Snake.exe + Minesweeper.exe installed</small></span><button type="button" className="xp-button" onClick={() => launch('games')}>Open</button></div></div>}
                  {aboutTab === 'links' && <div className="system-tab links-tab"><p>Open Nurbek’s public profiles:</p><a href={profile.links.website} target="_blank" rel="noopener noreferrer">alisherov.com</a><a href={profile.links.github} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.github, 'GitHub')}>GitHub / alisherovuz</a><a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.linkedin, 'LinkedIn')}>LinkedIn / uzalisherov</a><a href={profile.links.telegram} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.telegram, 'Telegram')}>Telegram / @uzalisherov</a><a href="/cv" target="_blank" rel="noopener noreferrer">Curriculum vitae (PDF)</a></div>}
                  <div className="properties-actions"><button type="button" className="xp-button" onClick={() => close(win.id)}>OK</button><button type="button" className="xp-button" onClick={() => close(win.id)}>Cancel</button><button type="button" className="xp-button" disabled>Apply</button></div>
                </div>
              )}

              {win.app === 'properties' && (() => {
                const project = projects.find(item => item.name === win.project);
                if (!project) return null;
                return <div className="properties-body"><div className="property-tabs"><button type="button" className="active">General</button><button type="button">Details</button></div><div className="property-head"><Icon src={projectIcon(project)} size={45}/><input value={project.name} readOnly aria-label="Project name"/></div><div className="property-separator"/><dl className="property-grid"><dt>Type:</dt><dd>{project.kind}</dd><dt>Location:</dt><dd>C:\Documents and Settings\Nurbek\My Projects</dd><dt>Status:</dt><dd>{statusText(project.status)}</dd><dt>Timeline:</dt><dd>{project.year}</dd><dt>Role:</dt><dd>{project.role || 'Builder / contributor'}</dd></dl><div className="property-separator"/><p>{project.description}</p><p>{project.detail}</p><div className="property-separator"/><dl className="property-grid"><dt>Technology:</dt><dd>{project.tech}</dd>{project.url && <><dt>Website:</dt><dd><a href={project.url} target="_blank" rel="noopener noreferrer">{project.url}</a></dd></>}</dl><div className="properties-actions"><button type="button" className="xp-button" onClick={() => close(win.id)}>OK</button><button type="button" className="xp-button" onClick={() => close(win.id)}>Cancel</button><button type="button" className="xp-button" disabled>Apply</button></div></div>;
              })()}

              {win.app === 'experienceProperties' && (() => {
                const experience = experiences.find(item => item.id === win.experience);
                if (!experience) return null;
                const experiencePhotos = photos.filter(photo => photo.experience === experience.id).slice(0, 4);
                return <div className="properties-body"><div className="property-tabs"><button type="button" className="active">General</button><button type="button">Summary</button></div><div className="property-head experience-property-head"><BrandIcon name={experience.organization} logo={experience.logo} size={56}/><div className="experience-property-title"><b>{experience.organization}</b><span>{experience.role}</span></div></div><div className="property-separator"/><dl className="property-grid"><dt>Role:</dt><dd>{experience.role}</dd><dt>Period:</dt><dd>{experience.period}</dd><dt>Location:</dt><dd>{experience.location}</dd>{experience.website && <><dt>Website:</dt><dd><a href={experience.website} target="_blank" rel="noopener noreferrer">{experience.website}</a></dd></>}</dl><div className="property-separator"/><p>{experience.description}</p>{experience.highlights.length > 0 && <ul className="experience-highlights">{experience.highlights.map(item => <li key={item}>{item}</li>)}</ul>}{experiencePhotos.length > 0 && <div className="property-photo-strip">{experiencePhotos.map(photo => <button type="button" key={photo.id} onClick={() => openPhoto(photo.id)}><img src={photo.src} alt={photo.alt} loading="lazy"/></button>)}</div>}{experience.relatedProject && <div className="linked-project"><button type="button" className="xp-button" onClick={() => openProject(experience.relatedProject!)}>Open related project: {experience.relatedProject}</button></div>}<div className="properties-actions"><button type="button" className="xp-button" onClick={() => close(win.id)}>OK</button><button type="button" className="xp-button" onClick={() => close(win.id)}>Cancel</button></div></div>;
              })()}
            </div>

            {showStatus && <div className="status-bar"><span>{win.app === 'projects' ? `${projects.length} objects` : win.app === 'experience' ? `${experiences.length} objects` : win.app === 'gallery' ? `${win.project ? photos.filter(photo => photo.project === win.project).length : win.achievement ? photos.filter(photo => photo.achievement === win.achievement).length : photos.length} pictures` : win.app === 'achievements' ? `${awards.length} objects` : win.app === 'games' ? '2 objects' : win.app === 'badges' ? `${unlockedBadges.length} of ${OS_BADGES.length} unlocked` : 'Ready'}</span><span>My Computer</span></div>}

            {!win.maximized && !['run', 'about', 'properties', 'experienceProperties', 'photoViewer'].includes(win.app) && <button type="button" className="resize-handle" aria-label={`Resize ${win.title}`} onPointerDown={event => {event.stopPropagation(); resize.current = {id: win.id, startX: event.clientX, startY: event.clientY, width: win.width, height: win.height};}}/>}
          </section>
        );
      })}

      {context && <div className="xp-context-menu" style={{left: Math.min(context.x, window.innerWidth - 220), top: Math.min(context.y, window.innerHeight - 200)}} onClick={event => event.stopPropagation()} role="menu">
        {context.type === 'shortcut' ? <>
          <button type="button" role="menuitem" onClick={() => launch(context.id)}><b>Open</b></button><div className="menu-separator"/><button type="button" role="menuitem" onClick={() => launch('search', 'Search Results')}>Search...</button><div className="menu-separator"/><button type="button" role="menuitem" onClick={() => context.id === 'about' ? launch('about') : launch(context.id)}>Properties</button>
        </> : <>
          <button type="button" role="menuitem" onClick={() => openProject(context.project)}><b>Open</b></button><button type="button" role="menuitem" onClick={() => exploreProject(context.project)}>Explore</button>{projects.find(item => item.name === context.project)?.url && <button type="button" role="menuitem" onClick={() => visitProject(context.project)}>Open Website</button>}<div className="menu-separator"/><button type="button" role="menuitem" onClick={() => projectProperties(context.project)}>Properties</button>
        </>}
      </div>}

      {start && <section className="start-menu" onClick={event => event.stopPropagation()} aria-label="Start menu">
        <header className="start-header"><img className="start-profile-photo" src={profile.photo} alt={`${profile.name} profile`} /><span><b>{profile.name}</b><small>{profile.headline}</small></span></header>
        <div className="start-columns">
          <div>
            <button type="button" onClick={() => launch('welcome')}><Icon src={`${I}/welcome.svg`} size={34}/><span><b>Start Here</b><small>Who I am, in 30 seconds</small></span></button>
            <button type="button" onClick={() => launch('contact')}><Icon src={`${I}/mail.svg`} size={34}/><span><b>Contact Me</b><small>Send a message straight to me</small></span></button>
            <div className="start-separator"/>
            <button type="button" onClick={() => launch('projects')}><Icon src={`${I}/my-projects.svg`} size={34}/><span><b>My Projects</b><small>Products, experiments & archives</small></span></button>
            <button type="button" onClick={() => launch('experience')}><Icon src={`${I}/folder.svg`} size={34}/><span><b>Work Experience</b><small>Roles, teams & organizations</small></span></button>
            <button type="button" onClick={() => launch('achievements')}><Icon src={`${I}/achievements.svg`} size={34}/><span><b>Achievements</b><small>Awards & recognitions</small></span></button>
            <button type="button" onClick={() => launch('gallery')}><Icon src={`${I}/my-pictures.svg`} size={34}/><span><b>My Pictures</b><small>Photos, projects & memories</small></span></button>
            <button type="button" onClick={() => launch('games')}><Icon src={`${I}/games.svg`} size={34}/><span><b>Games</b><small>Snake, Minesweeper & classic fun</small></span></button>
          </div>
          <div>
            <button type="button" onClick={() => launch('documents')}><Icon src={`${I}/my-documents.svg`} size={27}/><b>My Documents</b></button>
            <button type="button" onClick={() => launch('about')}><Icon src={`${I}/my-computer.svg`} size={27}/><b>My Computer</b></button>
            <button type="button" onClick={() => launch('search', 'Search Results')}><Icon src={`${I}/search.svg`} size={27}/><b>Search</b></button>
            <button type="button" onClick={() => launch('run', 'Run')}><Icon src={`${I}/run.svg`} size={27}/><b>Run...</b></button>
            <button type="button" onClick={() => launch('terminal', 'NurbekOS Terminal')}><Icon src={`${I}/cmd.svg`} size={27}/><b>Terminal</b></button>
            <button type="button" onClick={() => launch('badges', 'NurbekOS Achievements')}><Icon src={`${I}/badge.svg`} size={27}/><b>NurbekOS Achievements</b></button>
            <div className="start-separator"/>
            <a href={profile.links.telegram} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.telegram, 'Telegram')}><Icon src={`${I}/telegram.svg`} size={27}/><b>Telegram</b></a><a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => outbound(profile.links.linkedin, 'LinkedIn')}><Icon src={`${I}/linkedin.svg`} size={27}/><b>LinkedIn</b></a>
            <a href="/cv" target="_blank" rel="noopener noreferrer"><Icon src={`${I}/text-file.svg`} size={27}/><b>CV / Resume</b></a>
          </div>
        </div>
        <footer className="start-footer"><button type="button" onClick={() => {setWindows([]); setActive(''); setStart(false); setBoot(true); window.setTimeout(() => {setBoot(false); play('startup'); const id = `win-${++serial}`; setWindows([makeWindow(id, 'welcome', {}, 0)]); setActive(id);}, 900);}}><span className="power-icon">↻</span> Restart NurbekOS</button></footer>
      </section>}

      {toast && !badgeToast && <Toast>{toast}</Toast>}

      {badgeToast && <div className="badge-toast" role="status"><div className="badge-toast-icon">★</div><div><b>Achievement unlocked!</b><span>{badgeToast.name}</span></div></div>}

      <footer className="taskbar" onClick={event => event.stopPropagation()}>
        <button type="button" className={`start-button ${start ? 'pressed' : ''}`} onClick={() => {setStart(value => !value); setContext(null);}} aria-expanded={start}><i>start</i></button>
        <div className="task-apps" aria-label="Open windows">
          {windows.map(win => <button type="button" key={win.id} className={`${active === win.id && !win.minimized ? 'active-task' : ''}`} onClick={() => focus(win.id)} title={win.title}><Icon src={windowIcon(win)} size={17}/><span>{win.title}</span></button>)}
        </div>
        <div className="tray"><button type="button" className={`tray-icon ${sound ? '' : 'muted'}`} onClick={toggleSound} aria-label={sound ? 'Mute interface sounds' : 'Enable interface sounds'} aria-pressed={sound} title={sound ? 'Sounds on — click to mute' : 'Sounds off — click to enable'}><Icon src={`${I}/volume.svg`} size={16}/></button><span title={today}>{time}</span></div>
      </footer>
    </main>
  );
}
