# NurbekOS v3

A Windows XP-inspired personal website for Nurbek Alisherov, built with Next.js, React and TypeScript.

## Run locally

```bash
npm install --prefer-offline --no-audit
npm run dev
```

Then open `http://localhost:3000`.

## What changed in v3

- Added a central content registry in `app/data.ts` for projects, experience and awards.
- Expanded My Projects with projects surfaced from Nurbek's public LinkedIn Projects section plus current CV material.
- Added **Work Experience** as a real Explorer-style folder.
- Organization entries use public/official logos where a stable logo URL is available and fall back to initials if the image cannot load.
- Double-click an organization to open a Windows XP-style **Properties** dialog with role, dates, location, highlights, website and linked project.
- Experience and projects cross-link where relevant (for example EduGrants, Empira, MentorGo, Lumora and DavomatAI).
- Recycle Bin now contains archived/finished builds instead of being empty.
- The current CV is bundled at `public/cv.pdf` and opens from My Documents.
- Project Properties now include status and role where available.
- Kept all v2 desktop, cursor, Explorer, Start-menu, window-management and browser-preview behavior.

## Content registry

To add another project or job later, edit only `app/data.ts`. The Explorer windows and Properties dialogs read from that file automatically.

## Real assets to add next

1. Add screenshots to `public/projects/<project>/` and wire the `screenshots` folder to a project-specific album.
2. Add real personal/event photos to `public/photos/`.
3. Replace remote logo URLs with local brand assets when you have the original logo files.
4. Turn selected `demo.exe` placeholders into real interactive mini-apps.

## Visual assets

The XP-style icons and cursors in `public/icons/xp/` and `public/cursors/` are original recreations for this project, not extracted Windows assets.

Some organization logos are loaded remotely from official/public sources for identification. The Startup Ambassadors logo URL points to a file by StartUp Ambassadors on Wikimedia Commons licensed CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Startup_Ambassadors_2.png
