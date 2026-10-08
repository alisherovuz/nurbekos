# NurbekOS v4.3 v4.2

Windows XP-inspired interactive portfolio for Nurbek Alisherov.

## What changed in v4.2

- Added the real photo archive: 62 public-ready images and documents.
- My Pictures now groups photos into Projects, Achievements, Acceptances, and Experiences & Events.
- Project Center windows show up to 4 related photos and can open a filtered project gallery.
- Achievement items now open detail windows with related photos/documents.
- Digital Generation and Startup Ambassadors experience properties include photo previews.
- Added local project logos for EduGrands, Empira, MentorGo, and Lumora.
- Kept the XP-style photo viewer with next/previous, zoom, rotate, keyboard navigation, and lazy-loaded thumbnails.
- All imported media is optimized WebP and the sensitive offer-letter images use the redacted public versions.

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

## Photo structure

Public media is stored under:

```text
public/media/
├── achievements/
├── projects/
└── experiences-and-events/
```

The photo registry is in `app/data.ts`. A machine-readable copy is also available at `public/media/manifest.json`.

## Update portfolio content

The main content registry is `app/data.ts`:

- `profile`
- `projects`
- `experiences`
- `awards`
- `photos`

## Deploy

Push to the GitHub repository connected to Vercel. Vercel should redeploy automatically.

See `PRODUCTION_AUDIT.md` before deploying.


## v4.3
- Added Nurbek's real profile photo to the Start menu and System Properties.
- Added the profile portrait to My Pictures → General Gallery.
