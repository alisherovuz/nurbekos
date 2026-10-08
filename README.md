# NurbekOS v4

Windows XP-inspired interactive portfolio for Nurbek Alisherov.

## What changed in v4

- More authentic Explorer chrome: menu bar, toolbar, address bar, XP task panes, details/tile views and status bar.
- Rich Project Center windows with overview, status, role, timeline, technologies, website launch, files and properties.
- Functional My Pictures library with a Windows Picture and Fax Viewer-style viewer, next/previous navigation, zoom and rotation.
- System Properties / About Me with General, Computer Name, Portfolio and Links tabs.
- Search Companion covering projects, experience, achievements and pictures.
- Functional Run dialog with commands such as `projects`, `experience`, `pictures`, `cv`, `github`, project names and `https://...` URLs.
- Mobile behavior: full-screen app windows, touch-friendly open behavior, responsive Explorer and Start menu.
- Accessibility: keyboard Search shortcut (`F3` or `/`), focus styles, semantic labels, reduced-motion handling, keyboard photo navigation and a skip link.
- Production hardening: pinned runtime dependencies, security response headers, tighter external-link handling and sandboxed project-site iframes.

## Install and run

```bash
npm install
npm run dev
```

Production check:

```bash
npm run typecheck
npm run build
npm run audit:prod
```

## Add real photos

1. Put optimized `.webp`, `.jpg` or `.png` files in `public/photos/`.
2. Add each photo to the `photos` array in `app/data.ts`.
3. Give every photo a useful `alt` description.

Two existing NurbekOS build screenshots are included so the photo viewer is functional immediately.

## Update portfolio content

The main content registry is `app/data.ts`:

- `profile`
- `projects`
- `experiences`
- `awards`
- `photos`

Most content changes do not require touching the desktop/window logic.

## Deploy

Push to the GitHub repository connected to Vercel. If Vercel is already linked to the repository, the push should trigger a deployment automatically.

See `PRODUCTION_AUDIT.md` before deploying.
