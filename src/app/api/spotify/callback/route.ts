// FriendlyTeaching.cl — Spotify OAuth callback (one-time setup to get refresh token)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) {
    return new NextResponse(`Spotify auth error: ${error ?? 'no code'}`, { status: 400 });
  }

  const clientId     = (process.env.SPOTIFY_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET ?? '').trim();
  const redirectUri  = (process.env.SPOTIFY_REDIRECT_URI ?? 'https://friendlyteaching.cl/api/spotify/callback').trim();

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(`Token exchange failed: ${text}`, { status: 500 });
  }

  const data = await res.json() as { refresh_token?: string; access_token?: string };

  // Show the refresh token so the user can copy it into Vercel env vars
  const html = `<!DOCTYPE html>
<html>
<head><title>Spotify conectado — FriendlyTeaching</title>
<style>body{font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px}
code{background:#f3f0ff;padding:4px 8px;border-radius:6px;word-break:break-all;font-size:14px;display:block;margin:12px 0}
.ok{color:#16a34a;font-weight:bold}.copy{cursor:pointer;background:#5A3D7A;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:14px}</style>
</head>
<body>
<p class="ok">✓ Spotify conectado correctamente</p>
<p>Copia este <strong>Refresh Token</strong> y agrégalo como variable de entorno en Vercel con el nombre <code>SPOTIFY_REFRESH_TOKEN</code>:</p>
<code id="token">${data.refresh_token ?? '(no refresh token — asegúrate de pedir scope offline)'}</code>
<button class="copy" onclick="navigator.clipboard.writeText(document.getElementById('token').innerText).then(()=>this.textContent='¡Copiado!')">Copiar</button>
<p style="margin-top:32px;color:#666;font-size:13px">Después de agregar la variable, haz un nuevo deploy en Vercel y Friendlyrics usará timestamps de Spotify.</p>
</body>
</html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
