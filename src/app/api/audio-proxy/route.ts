// FriendlyTeaching.cl — same-origin audio proxy
//
// Firebase Storage sirve MP3s con CORS restringido: el <audio> puede
// reproducirlos (request "opaque") pero fetch() desde el cliente falla
// con "Failed to fetch". Eso rompe el transcode a WAV en AudioWithSpeed
// (ver src/app/dashboard/teacher/ielts/listening/page.tsx) y también
// cualquier feature futuro que necesite manipular el audio en cliente.
//
// GET /api/audio-proxy?url=<firebase-storage-url>
//   - Whitelist estricta al dominio de Firebase Storage (anti-SSRF).
//   - Propaga el header Range del cliente al upstream para que el seek
//     nativo del <audio> siga funcionando con Range requests.
//   - Devuelve status 206 cuando el upstream responde parcial, 200 full.

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST = 'firebasestorage.googleapis.com';

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) {
    return NextResponse.json({ error: 'url query param required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (parsed.host !== ALLOWED_HOST) {
    return NextResponse.json({ error: `host not allowed: ${parsed.host}` }, { status: 403 });
  }

  const range = req.headers.get('range');
  const upstream = await fetch(parsed.toString(), {
    headers: range ? { Range: range } : {},
    cache: 'no-store',
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `upstream ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  const pass = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'last-modified', 'etag'];
  for (const h of pass) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Cache-Control chico para que el mismo audio no se re-baje sección
  // por sección durante el mismo intento del alumno.
  headers.set('cache-control', 'public, max-age=3600');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
