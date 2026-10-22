// FriendlyTeaching.cl — Class reminder cron
//
// Scheduled by vercel.json to run every 5 minutes. On each tick:
//   1. Compute the current wall-clock time in America/Santiago.
//   2. Query all non-cancelled bookings whose weekStart falls in the
//      current or next week (recurring bookings also match naturally,
//      since the writer creates one doc per week).
//   3. For each booking, resolve its exact Santiago datetime and keep
//      those whose start is in the [now + 10 min, now + 20 min] window
//      — the 10-min span absorbs cron jitter without ever skipping one.
//   4. Dedup via booking.reminderSentAt so a resend never happens, even
//      if two cron ticks race on the same window boundary.
//   5. POST to /api/notify with the class_access_link template.
//
// Protected by CRON_SECRET: Vercel sends `Authorization: Bearer $CRON_SECRET`
// automatically when the env var is set and the schedule is a vercel.json
// cron. Any other caller gets 401.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
// Prevent any accidental caching on Vercel's edge — this route must always
// run fresh and never serve a cached 200 to the scheduler.
export const dynamic = 'force-dynamic';

const TEACHER_TZ = 'America/Santiago';
const LESSON_LENGTH_MIN = 45; // "10:00 – 10:45-ish"
// The scheduler fires at :45 every hour (GitHub Actions, cron `45 * * * *`).
// Classes are on :00, so the ideal fire-to-class gap is exactly 15 min.
// GitHub Actions can be a few minutes early or late, though, so we accept
// any booking starting in the next 30 min and let reminderSentAt dedup
// anything a retry might catch twice.
const WINDOW_MIN_START = 0;
const WINDOW_MIN_END = 30;

const EN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/** Format a Date as e.g. "October 22nd, 2026" using the teacher timezone. */
function formatEnglishDate(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: 'long', day: 'numeric',
  }).formatToParts(d);
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10);
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${month} ${day}${ordinalSuffix(day)}, ${year}`;
}

/** English weekday name for a Date in the given timezone. */
function englishWeekday(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' })
    .format(d);
}

function formatHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Add minutes to a {hour, minute} wall-clock, with carry into the next hour.
 *  Only used to render "10:00 – 10:45-ish" — not for datetime math. */
function addMinutes(hour: number, minute: number, delta: number): { hour: number; minute: number } {
  const total = hour * 60 + minute + delta;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}

/** Build a UTC epoch for a given calendar wall-clock in a specific timezone.
 *  Uses the offset-via-Intl trick so DST transitions resolve correctly. */
function wallClockInTzToUtcMs(
  year: number, month1to12: number, day: number,
  hour: number, minute: number, tz: string,
): number {
  // Guess 1: pretend the wall clock is already UTC, then measure the offset
  // that the target tz reports for that instant, and correct.
  const guess = Date.UTC(year, month1to12 - 1, day, hour, minute, 0);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(guess));
  const got = {
    year: parseInt(parts.find((p) => p.type === 'year')!.value, 10),
    month: parseInt(parts.find((p) => p.type === 'month')!.value, 10),
    day: parseInt(parts.find((p) => p.type === 'day')!.value, 10),
    hour: parseInt(parts.find((p) => p.type === 'hour')!.value, 10),
    minute: parseInt(parts.find((p) => p.type === 'minute')!.value, 10),
  };
  const gotUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute, 0);
  const offsetMs = gotUtc - guess;
  return guess - offsetMs;
}

/** Resolve a booking to its concrete UTC start instant.
 *  Booking stores weekStart (Monday of its week) + dayOfWeek (1=Mon..6=Sat)
 *  + hour + minute, all in the teacher's local time. */
function bookingStartUtcMs(
  weekStartMs: number, dayOfWeek: number, hour: number, minute: number, tz: string,
): number {
  // Interpret weekStart as midnight on that Monday in the teacher tz.
  const wsLocal = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(weekStartMs));
  const y = parseInt(wsLocal.find((p) => p.type === 'year')!.value, 10);
  const m = parseInt(wsLocal.find((p) => p.type === 'month')!.value, 10);
  const d0 = parseInt(wsLocal.find((p) => p.type === 'day')!.value, 10);

  // dayOfWeek 1=Mon..6=Sat → day offset 0..5. For a defensive 7 (Sun) → 6.
  const dayOffset = Math.max(0, Math.min(6, dayOfWeek - 1));
  // Build the target wall-clock then flatten to UTC via wallClockInTzToUtcMs.
  // Rolling day via Date keeps month/year boundaries honest.
  const tmp = new Date(Date.UTC(y, m - 1, d0));
  tmp.setUTCDate(tmp.getUTCDate() + dayOffset);
  return wallClockInTzToUtcMs(
    tmp.getUTCFullYear(), tmp.getUTCMonth() + 1, tmp.getUTCDate(),
    hour, minute, tz,
  );
}

interface BookingDoc {
  teacherId: string;
  studentName: string;
  studentEmail?: string;
  dayOfWeek: number;
  hour: number;
  minute?: number;
  status: string;
  isRecurring: boolean;
  weekStart: Timestamp;
  reminderSentAt?: Timestamp;
  timezone?: string;
}

export async function GET(req: NextRequest) {
  // Vercel sends `Authorization: Bearer $CRON_SECRET` when the env var is
  // set. In dev the CLI calls this endpoint with no header — accept that
  // only when CRON_SECRET itself isn't configured.
  const authHeader = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (expected) {
    if (authHeader !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const meetLink = process.env.GOOGLE_MEET_LINK;
  if (!meetLink) {
    return NextResponse.json({
      ok: false,
      error: 'GOOGLE_MEET_LINK env var not set — refusing to send without a link',
    }, { status: 500 });
  }

  const bccEmail = process.env.CLASS_REMINDER_BCC ?? 'friendlyteaching.cl@gmail.com';
  const replyTo = process.env.CLASS_REMINDER_REPLY_TO ?? 'ifraufigueroa@gmail.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://friendlyteaching.cl';

  const nowMs = Date.now();
  const windowStartMs = nowMs + WINDOW_MIN_START * 60 * 1000;
  const windowEndMs = nowMs + WINDOW_MIN_END * 60 * 1000;

  // Pull non-cancelled bookings whose weekStart is within the last 8 days
  // and next 8 days. That's enough slack to cover the current week and the
  // next one around Sunday→Monday rollover without scanning the whole 52-doc
  // recurring tail.
  const db = adminDb();
  const horizonLowerMs = nowMs - 8 * 24 * 60 * 60 * 1000;
  const horizonUpperMs = nowMs + 8 * 24 * 60 * 60 * 1000;
  const snap = await db.collection('bookings')
    .where('weekStart', '>=', Timestamp.fromMillis(horizonLowerMs))
    .where('weekStart', '<=', Timestamp.fromMillis(horizonUpperMs))
    .get();

  const sent: Array<{ id: string; to: string; at: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const docSnap of snap.docs) {
    const b = docSnap.data() as BookingDoc;
    const id = docSnap.id;

    if (b.status === 'cancelled') { skipped.push({ id, reason: 'cancelled' }); continue; }
    if (!b.studentEmail) { skipped.push({ id, reason: 'no studentEmail' }); continue; }
    if (b.reminderSentAt) { skipped.push({ id, reason: 'already sent' }); continue; }

    const tz = b.timezone || TEACHER_TZ;
    const minute = b.minute ?? 0;
    const weekStartMs = b.weekStart.toMillis();
    const startMs = bookingStartUtcMs(weekStartMs, b.dayOfWeek, b.hour, minute, tz);

    if (startMs < windowStartMs || startMs > windowEndMs) {
      skipped.push({ id, reason: `out of window (${new Date(startMs).toISOString()})` });
      continue;
    }

    // Build email fields
    const startDate = new Date(startMs);
    const classDate = formatEnglishDate(startDate, tz);
    const classDayEn = englishWeekday(startDate, tz);
    const endHM = addMinutes(b.hour, minute, LESSON_LENGTH_MIN);
    const classTimeRange = `${formatHHMM(b.hour, minute)} – ${formatHHMM(endHM.hour, endHM.minute)}-ish`;

    try {
      const notifyRes = await fetch(`${appUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'class_access_link',
          to: b.studentEmail,
          bcc: bccEmail,
          replyTo,
          studentName: b.studentName,
          classDate,
          classDayEn,
          classTimeRange,
          meetLink,
        }),
      });

      if (!notifyRes.ok) {
        const err = await notifyRes.text();
        failed.push({ id, error: err.slice(0, 300) });
        continue;
      }

      await docSnap.ref.update({ reminderSentAt: FieldValue.serverTimestamp() });
      sent.push({ id, to: b.studentEmail, at: startDate.toISOString() });
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    now: new Date(nowMs).toISOString(),
    scanned: snap.size,
    sent,
    failed,
    skippedCount: skipped.length,
  });
}
