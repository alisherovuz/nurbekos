import Link from 'next/link';

export const metadata = {title: 'Page not found · nurbekOS'};

export default function NotFound() {
  return (
    <main className="desktop not-found-desktop">
      <section className="xp-window is-active not-found-window" role="alertdialog" aria-labelledby="nf-title">
        <div className="xp-titlebar"><span className="title-left">nurbekOS</span></div>
        <div className="not-found-body">
          <div className="not-found-icon" aria-hidden="true">!</div>
          <div>
            <h1 id="nf-title">Windows cannot find this page.</h1>
            <p>The file or folder you’re looking for doesn’t exist on nurbekOS. Check the address and try again.</p>
            <div className="not-found-actions">
              <Link className="xp-button primary" href="/">Go to desktop</Link>
              <Link className="xp-button" href="/projects">Browse projects</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
