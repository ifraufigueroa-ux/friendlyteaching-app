// FriendlyTeaching.cl — Env var health check (does NOT leak values)
// GET /api/debug-env
// Returns which of the AI-related env vars are set at runtime + which
// VERCEL_ENV/target the function is running against. Safe to expose:
// the actual key values are never included.

import { NextResponse } from 'next/server';

export async function GET() {
  const check = (name: string) => {
    const v = process.env[name];
    if (!v) return { present: false, length: 0, sample: null };
    return {
      present: true,
      length:  v.length,
      // Show just the first 4 characters so you can tell if it's the right key
      // family without leaking it (Groq keys start with gsk_, Anthropic with
      // sk-ant-, OpenAI with sk-, ElevenLabs with sk_ or hex, etc.).
      sample:  v.slice(0, 4),
    };
  };

  return NextResponse.json({
    runtime: {
      VERCEL_ENV:    process.env.VERCEL_ENV ?? null,
      VERCEL_REGION: process.env.VERCEL_REGION ?? null,
      NODE_ENV:      process.env.NODE_ENV ?? null,
    },
    aiKeys: {
      GROQ_API_KEY:       check('GROQ_API_KEY'),
      OPENAI_API_KEY:     check('OPENAI_API_KEY'),
      ANTHROPIC_API_KEY:  check('ANTHROPIC_API_KEY'),
      ELEVENLABS_API_KEY: check('ELEVENLABS_API_KEY'),
      ELEVEN_KEY:         check('ELEVEN_KEY'),
    },
    // List every env var name that starts with 'GROQ' or 'OPENAI' or
    // 'ANTHROPIC' — helps spot a typo like GROC_API_KEY or GROQ_KEY.
    aiKeyNames: Object.keys(process.env)
      .filter(k => /^(GROQ|OPENAI|ANTHROPIC|ELEVEN)/i.test(k))
      .sort(),
  });
}
