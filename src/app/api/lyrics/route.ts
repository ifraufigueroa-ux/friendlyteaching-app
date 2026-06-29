// FriendlyTeaching.cl — Lyrics API (lyrics.ovh proxy)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist');
  const title = req.nextUrl.searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json({ error: 'artist and title required' }, { status: 400 });
  }

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    const data = await res.json();
    if (!data.lyrics) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }

    // Clean up lyrics: remove excessive blank lines
    const lyrics = data.lyrics
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({ lyrics });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
