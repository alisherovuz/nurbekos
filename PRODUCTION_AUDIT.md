# NurbekOS v4 — Production & Security Audit

Audit date: 2026-10-08

## Changes already applied

### Runtime dependency baseline

- Next.js is pinned to `15.5.27`.
- React and React DOM are pinned to `19.3.0`.
- The project no longer uses the broad `^15.5.0` / `^19.1.0` runtime ranges from v3.

Why: the official Next.js v15.5.27 release includes the September 30, 2026 security fixes, including fixes for cache-poisoning advisories. Earlier 2026 React Server Components advisories identify affected React 19.1.x / 19.2.x patch ranges; v4 moves to the later 19.3.0 runtime line.

Official references:
- https://github.com/vercel/next.js/releases/tag/v15.5.27
- https://github.com/vercel/next.js/security/advisories
- https://github.com/react/react/security/advisories

### Response headers

`next.config.ts` now sends:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy` disabling camera, microphone, geolocation, payment and USB
- `Strict-Transport-Security: max-age=31536000`

The `X-Powered-By` header is disabled.

### External content

- External links use `rel="noopener noreferrer"`.
- Project websites opened inside the faux Internet Explorer are sandboxed and cannot navigate the parent page.
- Embedded pages receive `strict-origin-when-cross-origin` referrer policy.
- No `dangerouslySetInnerHTML`, `eval`, Server Actions, API routes or environment-secret reads are present in the v4 source.

### Accessibility and interaction

- Visible focus states are provided for keyboard users.
- `F3` and `/` open Search when focus is not in a form control.
- Photo Viewer supports Left/Right arrows.
- `prefers-reduced-motion` is respected.
- Mobile/coarse-pointer users can open shortcuts and files with a single tap instead of requiring double-click.
- Window controls and major actions have accessible labels.

## Items to verify locally before production

These require a normal dependency install / build environment and were not claimed as completed by this source-only audit:

```bash
npm install
npm run typecheck
npm run build
npm run audit:prod
```

Also verify:

1. Vercel is building with Node 20.9+.
2. `npm audit --omit=dev` reports no unresolved production vulnerabilities.
3. `package-lock.json` is committed after installing the pinned runtime dependencies.
4. Every external project website either embeds successfully or shows the built-in fallback link.
5. Remote organization logos that fail are acceptable because the UI falls back to initials.
6. CV PDF opens correctly from `/cv.pdf`.
7. Mobile Safari and Chrome can scroll content inside maximized windows.

## CSP decision

A strict Content Security Policy is intentionally not enabled in this version because NurbekOS embeds multiple third-party project websites and remote organization logos. A CSP added without testing Next.js hydration and every allowed frame/image origin could break the portfolio.

Recommended next security pass: replace remote logos with local assets and decide which project origins are allowed to embed. Then introduce a nonce/hash-based CSP rather than a permissive policy.

## Data/content note

The portfolio is client-side and contains only public portfolio content. Do not add private tokens, API keys, application secrets, private documents or unpublished personal information to `app/data.ts` or `public/`.
