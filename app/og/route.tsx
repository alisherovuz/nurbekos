import {ImageResponse} from 'next/og';
import {promises as fs} from 'fs';
import path from 'path';

let photoCache: string | null | undefined;

async function profilePhoto(origin: string) {
  if (photoCache !== undefined) return photoCache;
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public', 'profile', 'nurbek-alisherov.jpg'));
    photoCache = `data:image/jpeg;base64,${file.toString('base64')}`;
  } catch {
    try {
      const res = await fetch(new URL('/profile/nurbek-alisherov.jpg', origin));
      const buf = Buffer.from(await res.arrayBuffer());
      photoCache = res.ok ? `data:image/jpeg;base64,${buf.toString('base64')}` : null;
    } catch {
      photoCache = null;
    }
  }
  return photoCache;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = (url.searchParams.get('t') || 'Nurbek Alisherov').slice(0, 60);
  const subtitle = (url.searchParams.get('s') || '').slice(0, 160);
  const kicker = (url.searchParams.get('k') || 'nurbekOS').slice(0, 60);
  const photo = await profilePhoto(url.origin);

  return new ImageResponse(
    (
      <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#3b8fd8 0%,#69b5ed 55%,#acd8f5 72%,#5aa046 73%,#3f8a39 100%)', fontFamily: 'sans-serif'}}>
        <div style={{display: 'flex', margin: '56px 64px 0', flexDirection: 'column', borderRadius: 18, border: '6px solid #1761c5', background: '#ece9d8', boxShadow: '0 20px 50px rgba(10,40,90,.35)', overflow: 'hidden', height: 470}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 22px', background: 'linear-gradient(180deg,#5ca2f1 0%,#2778e5 20%,#1761d3 55%,#0b49bc 85%,#2d74d8 100%)', color: '#fff', fontSize: 28, fontWeight: 700}}>
            <div style={{display: 'flex'}}>{kicker}</div>
            <div style={{display: 'flex', gap: 8}}>
              <div style={{width: 34, height: 32, borderRadius: 6, background: '#3d7ed4', border: '2px solid #d7e8ff'}}/>
              <div style={{width: 34, height: 32, borderRadius: 6, background: '#3d7ed4', border: '2px solid #d7e8ff'}}/>
              <div style={{width: 34, height: 32, borderRadius: 6, background: '#d94c2f', border: '2px solid #ffe1d8'}}/>
            </div>
          </div>
          <div style={{display: 'flex', flex: 1, alignItems: 'center', padding: '0 48px', gap: 44, background: '#fff'}}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" width={230} height={230} style={{borderRadius: 24, objectFit: 'cover', border: '6px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,.25)'}}/>
            )}
            <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
              <div style={{fontSize: title.length > 26 ? 58 : 72, fontWeight: 800, color: '#163e78', lineHeight: 1.05, letterSpacing: -2}}>{title}</div>
              {subtitle && <div style={{marginTop: 18, fontSize: 30, color: '#3a4a60', lineHeight: 1.3}}>{subtitle}</div>}
            </div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'auto 64px 28px', color: '#fff', fontSize: 30, fontWeight: 700}}>
          <div style={{display: 'flex', padding: '8px 26px', borderRadius: '0 22px 22px 0', background: 'linear-gradient(180deg,#7bd465,#389934 50%,#1e7326)', fontStyle: 'italic'}}>start</div>
          <div style={{display: 'flex'}}>alisherov.com</div>
        </div>
      </div>
    ),
    {width: 1200, height: 630, headers: {'cache-control': 'public, max-age=86400, s-maxage=604800'}},
  );
}
