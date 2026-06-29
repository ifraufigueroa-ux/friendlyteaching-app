// FriendlyTeaching.cl — Spotify OAuth: redirect to Spotify login (one-time setup)
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId    = process.env.SPOTIFY_CLIENT_ID?.trim();
  const redirectUri = (process.env.SPOTIFY_REDIRECT_URI ?? 'https://friendlyteaching.cl/api/spotify/callback').trim();

  if (!clientId) {
    return new NextResponse('SPOTIFY_CLIENT_ID env var not set', { status: 500 });
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         'user-read-private user-read-email',
    show_dialog:   'true',
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
