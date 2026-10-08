'use client';

import {useEffect, useRef, useState} from 'react';
import {awards, experiences, projects} from './data';

type AppId =
  | 'welcome'
  | 'projects'
  | 'experience'
  | 'experienceProperties'
  | 'projectFolder'
  | 'properties'
  | 'achievements'
  | 'gallery'
  | 'about'
  | 'documents'
  | 'recycle'
  | 'browser';

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
  url?: string;
  project?: string;
  experience?: string;
};


type ContextMenuState =
  | {x: number; y: number; type: 'shortcut'; id: AppId; label: string}
  | {x: number; y: number; type: 'project'; project: string}
  | null;

const I = '/icons/xp';

const shortcuts: {id: AppId; label: string; icon: string}[] = [
  {id: 'projects', label: 'My Projects', icon: `${I}/my-projects.svg`},
  {id: 'experience', label: 'Work Experience', icon: `${I}/folder.svg`},
  {id: 'achievements', label: 'Achievements', icon: `${I}/achievements.svg`},
  {id: 'gallery', label: 'My Pictures', icon: `${I}/my-pictures.svg`},
  {id: 'documents', label: 'My Documents', icon: `${I}/my-documents.svg`},
  {id: 'about', label: 'My Computer', icon: `${I}/my-computer.svg`},
  {id: 'recycle', label: 'Recycle Bin', icon: `${I}/recycle-bin.svg`},
];

let serial = 0;

function Icon({src, size = 32, className = ''}: {src: string; size?: number; className?: string}) {
  return <img className={`xp-icon ${className}`} src={src} width={size} height={size} alt="" draggable={false}/>;
}


function BrandIcon({name, logo, size = 52}: {name: string; logo?: string; size?: number}) {
  const initials = name.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  return (
    <span className="brand-icon" style={{width: size, height: size}}>
      <span>{initials}</span>
      {logo && <img src={logo} alt="" draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }}/>} 
    </span>
  );
}

export default function Home() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [active, setActive] = useState('');
  const [start, setStart] = useState(false);
  const [time, setTime] = useState('');
  const [sound, setSound] = useState(false);
  const [selected, setSelected] = useState('');
  const [boot, setBoot] = useState(true);
  const [bootSeen, setBootSeen] = useState(false);
  const [context, setContext] = useState<ContextMenuState>(null);

  const drag = useRef<{id: string; startX: number; startY: number; x: number; y: number} | null>(null);
  const resize = useRef<{id: string; startX: number; startY: number; width: number; height: number} | null>(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}));
    tick();
    const i = setInterval(tick, 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setBoot(false);
      setBootSeen(true);
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (drag.current) {
        const d = drag.current;
        setWindows(ws => ws.map(w => w.id === d.id ? {
          ...w,
          x: Math.max(0, d.x + e.clientX - d.startX),
          y: Math.max(0, d.y + e.clientY - d.startY),
        } : w));
      }
      if (resize.current) {
        const r = resize.current;
        setWindows(ws => ws.map(w => w.id === r.id ? {
          ...w,
          width: Math.max(360, r.width + e.clientX - r.startX),
          height: Math.max(240, r.height + e.clientY - r.startY),
        } : w));
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

  function launch(app: AppId, title?: string, url?: string, project?: string, experience?: string) {
    setStart(false);
    setContext(null);
    const id = `win-${++serial}`;
    const width = app === 'browser' ? 900 : app === 'gallery' ? 760 : (app === 'properties' || app === 'experienceProperties') ? 540 : 700;
    const height = app === 'browser' ? 585 : (app === 'properties' || app === 'experienceProperties') ? 500 : 500;
    setWindows(ws => [...ws, {
      id,
      app,
      title: title || shortcuts.find(s => s.id === app)?.label || 'NurbekOS',
      x: Math.max(16, 92 + (ws.length % 5) * 34),
      y: Math.max(24, 52 + (ws.length % 5) * 28),
      width,
      height,
      minimized: false,
      maximized: false,
      url,
      project,
      experience,
    }]);
    setActive(id);
  }

  function focus(id: string) {
    setActive(id);
    setWindows(ws => {
      const w = ws.find(v => v.id === id);
      return w ? [...ws.filter(v => v.id !== id), {...w, minimized: false}] : ws;
    });
  }

  function patch(id: string, change: Partial<WindowState>) {
    setWindows(ws => ws.map(w => w.id === id ? {...w, ...change} : w));
  }

  function close(id: string) {
    setWindows(ws => ws.filter(w => w.id !== id));
    setActive(a => a === id ? '' : a);
  }

  function openProject(name: string) {
    const p = projects.find(x => x.name === name);
    if (!p) return;
    if (p.url) launch('browser', `${name} - Microsoft Internet Explorer`, p.url, name);
    else launch('projectFolder', name, undefined, name);
  }

  function exploreProject(name: string) {
    launch('projectFolder', name, undefined, name);
  }

  function projectProperties(name: string) {
    launch('properties', `${name} Properties`, undefined, name);
  }

  function experienceProperties(id: string) {
    const exp = experiences.find(x => x.id === id);
    if (!exp) return;
    launch('experienceProperties', `${exp.organization} Properties`, undefined, undefined, id);
  }

  function projectIcon(name: string) {
    const p = projects.find(x => x.name === name);
    if (!p) return `${I}/folder.svg`;
    if (p.url) return `${I}/internet-explorer.svg`;
    if (p.kind.toLowerCase().includes('bot') || p.kind.toLowerCase().includes('prototype')) return `${I}/executable.svg`;
    return `${I}/folder.svg`;
  }

  function windowIcon(w: WindowState) {
    if (w.app === 'browser') return `${I}/internet-explorer.svg`;
    if (w.app === 'achievements') return `${I}/achievements.svg`;
    if (w.app === 'experience' || w.app === 'experienceProperties') return `${I}/my-documents.svg`;
    if (w.app === 'gallery') return `${I}/my-pictures.svg`;
    if (w.app === 'about') return `${I}/my-computer.svg`;
    if (w.app === 'recycle') return `${I}/recycle-bin.svg`;
    if (w.app === 'properties') return `${I}/properties.svg`;
    if (w.app === 'documents') return `${I}/my-documents.svg`;
    if (w.app === 'projects') return `${I}/my-projects.svg`;
    return `${I}/folder.svg`;
  }

  function addressFor(w: WindowState) {
    if (w.app === 'browser') return w.url || `C:\Projects\${w.project || ''}`;
    if (w.app === 'projectFolder') return `C:\Documents and Settings\Nurbek\My Projects\${w.project}`;
    if (w.app === 'properties') return `${w.project || w.title}`;
    if (w.app === 'experienceProperties') return `${w.experience || w.title}`;
    return `C:\Documents and Settings\Nurbek\${w.title}`;
  }

  function onDesktopContext(e: React.MouseEvent, shortcut: {id: AppId; label: string}) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(shortcut.id);
    setContext({x: e.clientX, y: e.clientY, type: 'shortcut', id: shortcut.id, label: shortcut.label});
  }

  function onProjectContext(e: React.MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(name);
    setContext({x: e.clientX, y: e.clientY, type: 'project', project: name});
  }

  return (
    <main
      className="desktop"
      onClick={() => { setStart(false); setContext(null); setSelected(''); }}
      onContextMenu={e => { e.preventDefault(); setContext(null); }}
    >
      {boot && !bootSeen && (
        <div className="boot">
          <div className="boot-logo"><span className="boot-word">nurbek</span><span>OS</span><small>XP edition</small></div>
          <div className="boot-progress"><span/></div>
          <button onClick={() => setBoot(false)}>Skip startup ›</button>
        </div>
      )}

      <div className="desktop-icons">
        {shortcuts.map(s => (
          <button
            key={s.id}
            className={`desktop-icon ${selected === s.id ? 'selected' : ''}`}
            onClick={e => { e.stopPropagation(); setSelected(s.id); setContext(null); }}
            onDoubleClick={() => launch(s.id)}
            onContextMenu={e => onDesktopContext(e, s)}
            onKeyDown={e => { if (e.key === 'Enter') launch(s.id); }}
          >
            <Icon src={s.icon} size={48}/>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="desktop-brand">nurbekOS <small>still building...</small></div>

      {windows.filter(w => !w.minimized).map((w, i) => (
        <section
          key={w.id}
          className={`xp-window ${active === w.id ? 'is-active' : ''} ${w.maximized ? 'maximized' : ''}`}
          style={w.maximized ? {zIndex: 10 + i} : {
            left: w.x,
            top: w.y,
            width: `min(${w.width}px, calc(100vw - 16px))`,
            height: `min(${w.height}px, calc(100dvh - 55px))`,
            zIndex: 10 + i,
          }}
          onPointerDown={() => focus(w.id)}
        >
          <div
            className="xp-titlebar"
            onPointerDown={e => {
              if (w.maximized || (e.target as HTMLElement).closest('button')) return;
              drag.current = {id: w.id, startX: e.clientX, startY: e.clientY, x: w.x, y: w.y};
            }}
            onDoubleClick={() => patch(w.id, {maximized: !w.maximized})}
          >
            <span className="title-left"><Icon src={windowIcon(w)} size={17}/>{w.title}</span>
            <span className="window-actions">
              <button aria-label="Minimize" onClick={() => patch(w.id, {minimized: true})}><i className="min-glyph"/></button>
              <button aria-label="Maximize" onClick={() => patch(w.id, {maximized: !w.maximized})}><i className="max-glyph"/></button>
              <button className="close" aria-label="Close" onClick={() => close(w.id)}><i className="close-glyph"/></button>
            </span>
          </div>

          {w.app !== 'properties' && w.app !== 'experienceProperties' && (
            <>
              <div className="xp-menu">File&nbsp;&nbsp;&nbsp; Edit&nbsp;&nbsp;&nbsp; View&nbsp;&nbsp;&nbsp; Favorites&nbsp;&nbsp;&nbsp; Tools&nbsp;&nbsp;&nbsp; Help</div>
              <div className="xp-toolbar">
                <button><Icon src={`${I}/back.svg`} size={23}/> <span>Back</span></button>
                <button className="icon-only"><Icon src={`${I}/forward.svg`} size={23}/></button>
                <span className="toolbar-divider"/>
                <button><Icon src={`${I}/refresh.svg`} size={21}/> <span>Refresh</span></button>
                <span className="toolbar-divider"/>
                <button onClick={() => launch('projects')}><Icon src={`${I}/folder.svg`} size={23}/> <span>Folders</span></button>
              </div>
              <div className="xp-address">
                <span>Address</span>
                <div className="address-field"><Icon src={windowIcon(w)} size={17}/><span>{addressFor(w)}</span></div>
                <span className="go"><b>➜</b> Go</span>
              </div>
            </>
          )}

          <div className="xp-content">
            {w.app === 'projects' && (
              <div className="explorer-layout">
                <aside className="explorer-sidebar">
                  <div className="task-panel"><strong>File and Folder Tasks</strong><button>Make a new folder</button><button>Publish this folder to the Web</button></div>
                  <div className="task-panel"><strong>Other Places</strong><button onClick={() => launch('about')}>My Computer</button><button onClick={() => launch('documents')}>My Documents</button><button onClick={() => launch('gallery')}>My Pictures</button><button onClick={() => launch('experience')}>Work Experience</button></div>
                  <div className="task-panel"><strong>Details</strong><p><b>My Projects</b><br/>{projects.length} objects</p></div>
                </aside>
                <div className="explorer-files">
                  {projects.map(p => (
                    <button
                      key={p.name}
                      className={`file-item ${selected === p.name ? 'selected-file' : ''}`}
                      onClick={e => {e.stopPropagation(); setSelected(p.name);}}
                      onDoubleClick={() => openProject(p.name)}
                      onContextMenu={e => onProjectContext(e, p.name)}
                      title={p.url ? 'Double-click to open website' : 'Double-click to explore project files'}
                    >
                      <Icon src={projectIcon(p.name)} size={43}/>
                      <span className="file-name">{p.name}</span>
                      <small>{p.url ? 'Internet Shortcut' : p.status === 'experiment' ? 'Application / experiment' : 'File Folder'}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {w.app === 'projectFolder' && (() => {
              const p = projects.find(x => x.name === w.project);
              if (!p) return null;
              const projectFiles = [
                ...(p.url ? [{name: 'website.url', type: 'url', icon: `${I}/internet-explorer.svg`}] : []),
                {name: 'README.txt', type: 'readme', icon: `${I}/text-file.svg`},
                {name: 'screenshots', type: 'screenshots', icon: `${I}/my-pictures.svg`},
                ...(p.kind.toLowerCase().includes('ai') ? [{name: 'demo.exe', type: 'demo', icon: `${I}/executable.svg`}] : []),
                {name: `${p.name}.properties`, type: 'properties', icon: `${I}/properties.svg`},
              ];
              return (
                <div className="explorer-layout">
                  <aside className="explorer-sidebar">
                    <div className="task-panel"><strong>File and Folder Tasks</strong><button onClick={() => projectProperties(p.name)}>View project properties</button>{p.url && <button onClick={() => openProject(p.name)}>Open website</button>}</div>
                    <div className="task-panel"><strong>Details</strong><p><b>{p.name}</b><br/>{p.kind}<br/>{p.year}</p></div>
                  </aside>
                  <div className="explorer-files project-files">
                    {projectFiles.map(file => (
                      <button
                        key={file.name}
                        className="file-item"
                        onDoubleClick={() => {
                          if (file.type === 'url') openProject(p.name);
                          else if (file.type === 'properties' || file.type === 'readme') projectProperties(p.name);
                          else if (file.type === 'screenshots') launch('gallery', `${p.name} - Pictures`);
                          else launch('welcome', `${p.name} demo.exe`, undefined, p.name);
                        }}
                      >
                        <Icon src={file.icon} size={43}/><span className="file-name">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {w.app === 'browser' && (
              <div className="browser-view">
                {w.project && (
                  <div className="browser-project">
                    <span><Icon src={`${I}/internet-explorer.svg`} size={18}/><b>{w.project}</b></span>
                    <button onClick={() => exploreProject(w.project!)}>Explore project files</button>
                    <button onClick={() => projectProperties(w.project!)}>Properties</button>
                  </div>
                )}
                {w.url ? (
                  <>
                    <iframe key={w.url} src={w.url} title={`${w.project} live website`} sandbox="allow-scripts allow-same-origin allow-forms allow-popups"/>
                    <div className="browser-fallback">If the site refuses to load, it blocks embedding. <a href={w.url} target="_blank" rel="noopener noreferrer">Open the real website in a new tab ↗</a></div>
                  </>
                ) : (
                  <div className="no-website"><Icon src={`${I}/folder.svg`} size={58}/><h2>{w.project || 'Project'} — Project Files</h2><p>{projects.find(p => p.name === w.project)?.description}</p><button className="xp-button" onClick={() => exploreProject(w.project || '')}>Explore files</button></div>
                )}
              </div>
            )}

            {w.app === 'experience' && (
              <div className="explorer-layout">
                <aside className="explorer-sidebar">
                  <div className="task-panel"><strong>Experience Tasks</strong><button>Arrange by organization</button><button>View as tiles</button></div>
                  <div className="task-panel"><strong>Other Places</strong><button onClick={() => launch('projects')}>My Projects</button><button onClick={() => launch('achievements')}>Achievements</button><button onClick={() => launch('documents')}>My Documents</button></div>
                  <div className="task-panel"><strong>Details</strong><p><b>Work Experience</b><br/>{experiences.length} organizations</p></div>
                </aside>
                <div className="experience-files">
                  {experiences.map(exp => (
                    <button key={exp.id} className="experience-file" onDoubleClick={() => experienceProperties(exp.id)}>
                      <BrandIcon name={exp.organization} logo={exp.logo}/>
                      <span><b>{exp.organization}</b><small>{exp.role}</small><small>{exp.period}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {w.app === 'achievements' && (
              <div className="explorer-layout">
                <aside className="explorer-sidebar">
                  <div className="task-panel"><strong>Picture Tasks</strong><button>View as a slide show</button><button>Order prints online</button></div>
                  <div className="task-panel"><strong>Details</strong><p><b>Achievements</b><br/>{awards.length} objects</p></div>
                </aside>
                <div className="award-files">
                  {awards.map(a => (
                    <button key={a.name} className="award-file" onDoubleClick={() => launch('welcome', a.name)}>
                      <Icon src={`${I}/certificate.svg`} size={48}/>
                      <span><b>{a.name}</b><small>{a.year} · {a.description}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {w.app === 'gallery' && (
              <div className="explorer-layout">
                <aside className="explorer-sidebar">
                  <div className="task-panel"><strong>Picture Tasks</strong><button>View as a slide show</button><button>Print pictures</button><button>Copy all items to CD</button></div>
                  <div className="task-panel"><strong>Details</strong><p>Your real photo albums will live here.</p></div>
                </aside>
                <div className="gallery-content">
                  <div className="gallery-note">No fake photos here — these folders are placeholders for your actual event and life photos.</div>
                  <div className="album-grid">
                    {['Hackathons & Competitions','Building EduGrants','Digital Generation Camps','Startup Events','Random Life Moments','Behind the Scenes'].map(a => (
                      <button key={a}><Icon src={`${I}/my-pictures.svg`} size={52}/><span>{a}</span><small>File folder</small></button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {w.app === 'about' && (
              <div className="about-content">
                <div className="about-head"><Icon src={`${I}/my-computer.svg`} size={64}/><div><h2>Nurbek Alisherov</h2><p>Student · Founder · Researcher</p><p>Tashkent, Uzbekistan</p></div></div>
                <fieldset><legend>System</legend><p><b>Operating system:</b> NurbekOS XP Edition</p><p><b>Specialization:</b> Artificial intelligence, education technology, building things</p><p><b>Currently:</b> British Management University · Foundation Year</p></fieldset>
                <fieldset><legend>Registered to</legend><p>Nurbek Alisherov</p><p>alisherov.com</p></fieldset>
                <fieldset><legend>Links</legend><p><a href="https://alisherov.com" target="_blank" rel="noreferrer">alisherov.com</a> · <a href="https://www.linkedin.com/in/uzalisherov" target="_blank" rel="noreferrer">LinkedIn</a> · <a href="https://t.me/uzalisherov" target="_blank" rel="noreferrer">Telegram</a></p></fieldset>
              </div>
            )}

            {w.app === 'documents' && (
              <div className="explorer-layout">
                <aside className="explorer-sidebar">
                  <div className="task-panel"><strong>File and Folder Tasks</strong><button>Make a new folder</button><button>Share this folder</button></div>
                  <div className="task-panel"><strong>Details</strong><p><b>My Documents</b><br/>2 objects</p></div>
                </aside>
                <div className="document-files">
                  <a className="document-file" href="/cv.pdf" target="_blank" rel="noopener noreferrer"><Icon src={`${I}/text-file.svg`} size={44}/><span><b>Curriculum Vitae.pdf</b><small>Open my current two-page CV.</small></span></a>
                  <a className="document-file" href="https://t.me/uzalisherov" target="_blank" rel="noopener noreferrer"><Icon src={`${I}/notepad.svg`} size={44}/><span><b>My Writing.url</b><small>Telegram blog — education, startups, AI and building projects.</small></span></a>
                </div>
              </div>
            )}

            {w.app === 'properties' && (() => {
              const p = projects.find(x => x.name === w.project);
              if (!p) return <div className="properties-body">No project selected.</div>;
              return (
                <div className="properties-body">
                  <div className="property-tabs"><button className="active">General</button><button>Details</button><button>Versions</button></div>
                  <div className="property-head"><Icon src={p.url ? `${I}/internet-explorer.svg` : `${I}/folder.svg`} size={48}/><input value={p.name} readOnly/></div>
                  <div className="property-separator"/>
                  <dl className="property-grid"><dt>Type:</dt><dd>{p.kind}</dd><dt>Status:</dt><dd>{p.status}</dd><dt>Location:</dt><dd>C:\My Projects\{p.name}</dd><dt>Created:</dt><dd>{p.year}</dd>{p.role && <><dt>Role:</dt><dd>{p.role}</dd></>}</dl>
                  <div className="property-separator"/>
                  <p>{p.description}</p><p>{p.detail}</p>
                  <dl className="property-grid"><dt>Technology:</dt><dd>{p.tech}</dd><dt>Website:</dt><dd>{p.url || 'No public website'}</dd></dl>
                  <div className="properties-actions"><button onClick={() => close(w.id)}>OK</button><button onClick={() => close(w.id)}>Cancel</button><button disabled>Apply</button></div>
                </div>
              );
            })()}

            {w.app === 'experienceProperties' && (() => {
              const exp = experiences.find(x => x.id === w.experience);
              if (!exp) return <div className="properties-body">No experience selected.</div>;
              return (
                <div className="properties-body">
                  <div className="property-tabs"><button className="active">General</button><button>Work</button><button>Links</button></div>
                  <div className="property-head experience-property-head"><BrandIcon name={exp.organization} logo={exp.logo} size={58}/><div className="experience-property-title"><b>{exp.organization}</b><span>{exp.role}</span></div></div>
                  <div className="property-separator"/>
                  <dl className="property-grid"><dt>Position:</dt><dd>{exp.role}</dd><dt>Period:</dt><dd>{exp.period}</dd><dt>Location:</dt><dd>{exp.location}</dd><dt>Website:</dt><dd>{exp.website ? <a href={exp.website} target="_blank" rel="noopener noreferrer">{exp.website}</a> : 'No public website'}</dd></dl>
                  <div className="property-separator"/>
                  <p>{exp.description}</p>
                  <ul className="experience-highlights">{exp.highlights.map(h => <li key={h}>{h}</li>)}</ul>
                  <div className="properties-actions">
                    {exp.relatedProject && <button onClick={() => openProject(exp.relatedProject!)}>Open project</button>}
                    {exp.website && <button onClick={() => window.open(exp.website, '_blank', 'noopener,noreferrer')}>Website</button>}
                    <button onClick={() => close(w.id)}>OK</button>
                  </div>
                </div>
              );
            })()}

            {w.app === 'recycle' && (
              <div className="recycle-content">
                <div className="recycle-intro"><Icon src={`${I}/recycle-bin.svg`} size={52}/><div><b>Recycle Bin</b><span>Finished, paused and abandoned builds. Double-click one to inspect it.</span></div></div>
                <div className="explorer-files recycle-files">
                  {projects.filter(p => p.status === 'archived').map(p => (
                    <button key={p.name} className="file-item" onDoubleClick={() => projectProperties(p.name)}>
                      <Icon src={`${I}/folder.svg`} size={43}/><span className="file-name">{p.name}</span><small>Archived project</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {w.app === 'welcome' && (
              <div className="about-content"><h2>{w.title === 'Welcome' ? 'Welcome to NurbekOS!' : w.title}</h2><p>{w.project ? 'Interactive demo placeholder. We can turn this into a real mini-app when you send the project materials.' : 'Feel free to explore the things I’ve built. Double-click desktop icons, right-click files, drag windows around, and open multiple projects at once.'}</p></div>
            )}
          </div>

          {w.app !== 'properties' && w.app !== 'experienceProperties' && <div className="xp-status"><span>{w.app === 'projects' ? `${projects.length} objects` : w.app === 'achievements' ? `${awards.length} objects` : w.app === 'experience' ? `${experiences.length} organizations` : 'Done'}</span><span>My Computer</span></div>}

          {!w.maximized && <div className="resize-handle" onPointerDown={e => {e.stopPropagation(); resize.current = {id: w.id, startX: e.clientX, startY: e.clientY, width: w.width, height: w.height};}}/>}
        </section>
      ))}

      {context && (
        <div className="xp-context-menu" style={{left: Math.min(context.x, typeof window !== 'undefined' ? window.innerWidth - 210 : context.x), top: Math.min(context.y, typeof window !== 'undefined' ? window.innerHeight - 180 : context.y)}} onClick={e => e.stopPropagation()}>
          {context.type === 'shortcut' ? (
            <>
              <button className="default" onClick={() => launch(context.id)}><b>Open</b></button>
              <div className="menu-separator"/>
              <button onClick={() => launch(context.id)}>Explore</button>
              <div className="menu-separator"/>
              <button onClick={() => {setContext(null); launch('about', `${context.label} Properties`);}}>Properties</button>
            </>
          ) : (
            <>
              <button className="default" onClick={() => openProject(context.project)}><b>Open</b></button>
              <button onClick={() => exploreProject(context.project)}>Explore project files</button>
              {projects.find(p => p.name === context.project)?.url && <button onClick={() => window.open(projects.find(p => p.name === context.project)!.url, '_blank', 'noopener,noreferrer')}>Open website in new tab</button>}
              <div className="menu-separator"/>
              <button onClick={() => projectProperties(context.project)}>Properties</button>
            </>
          )}
        </div>
      )}

      {start && (
        <div className="start-menu" onClick={e => e.stopPropagation()}>
          <div className="start-header"><Icon src={`${I}/user.svg`} size={46}/><b>Nurbek Alisherov</b></div>
          <div className="start-columns">
            <div>
              {shortcuts.slice(0, 5).map(s => <button key={s.id} onClick={() => launch(s.id)}><Icon src={s.icon} size={32}/><span><b>{s.label}</b><small>{s.id === 'projects' ? 'Things I have built' : s.id === 'achievements' ? 'Awards & milestones' : s.id === 'gallery' ? 'Photos & memories' : s.id === 'experience' ? 'Places I have worked' : 'CV & writing'}</small></span></button>)}
            </div>
            <div>
              {shortcuts.slice(5).map(s => <button key={s.id} onClick={() => launch(s.id)}><Icon src={s.icon} size={28}/><b>{s.label}</b></button>)}
              <button onClick={() => launch('welcome', 'Welcome')}><Icon src={`${I}/my-computer.svg`} size={28}/><b>Welcome</b></button>
            </div>
          </div>
          <div className="start-footer">
            <button onClick={() => setSound(!sound)}><Icon src={`${I}/volume.svg`} size={22}/> Sound {sound ? 'on' : 'off'}</button>
            <button onClick={() => {setWindows([]); setStart(false);}}>▣ Log Off</button>
          </div>
        </div>
      )}

      <div className="taskbar" onClick={e => e.stopPropagation()}>
        <button className="start-button" onClick={() => {setStart(!start); setContext(null);}}><span className="start-flag"><i/><i/><i/><i/></span><span>start</span></button>
        <div className="task-apps">
          {windows.map(w => (
            <button key={w.id} className={active === w.id && !w.minimized ? 'task-active' : ''} onClick={() => w.minimized ? focus(w.id) : active === w.id ? patch(w.id, {minimized: true}) : focus(w.id)}>
              <Icon src={windowIcon(w)} size={18}/><span>{w.title}</span>
            </button>
          ))}
        </div>
        <div className="tray"><span className="tray-chevron">‹</span><Icon src={`${I}/volume.svg`} size={17}/><span>{time}</span></div>
      </div>
    </main>
  );
}
