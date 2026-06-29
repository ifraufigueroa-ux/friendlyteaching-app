// FriendlyTeaching.cl — Song Search API (iTunes proxy)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q?.trim()) return NextResponse.json({ results: [] });

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=20&country=US`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    const results = (data.results ?? []).map((t: Record<string, unknown>) => ({
      trackId: t.trackId,
      title: t.trackName,
      artist: t.artistName,
      album: t.collectionName,
      albumArt: (t.artworkUrl100 as string)?.replace('100x100', '300x300') ?? '',
      previewUrl: t.previewUrl ?? null,
      genre: t.primaryGenreName,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
