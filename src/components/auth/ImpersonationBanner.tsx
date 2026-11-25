// FriendlyTeaching.cl — Impersonation banner
//
// Renders a persistent top banner whenever the current Firebase session
// is a teacher impersonating a student (custom-claims
// impersonatedBy/impersonatedByEmail on the id token). One-tap "Return
// to your account" signs the student session out and sends the teacher
// back to /auth/login with their email prefilled.

'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { endImpersonation, readImpersonationClaims } from '@/lib/firebase/impersonate';
import { UserCircle2, LogOut } from 'lucide-react';

interface State {
  impersonatedByEmail: string;
  impersonatedByName:  string;
}

export default function ImpersonationBanner() {
  const [state, setState] = useState<State | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function refresh(user: User | null) {
      if (!user) { if (mounted) setState(null); return; }
      const claims = await readImpersonationClaims();
      if (!mounted) return;
      if (!claims?.impersonatedBy) { setState(null); return; }
      setState({
        impersonatedByEmail: claims.impersonatedByEmail ?? '',
        impersonatedByName:  claims.impersonatedByName  ?? '',
      });
    }
    void refresh(auth.currentUser);
    const unsub = onAuthStateChanged(auth, (user) => { void refresh(user); });
    return () => { mounted = false; unsub(); };
  }, []);

  if (!state) return null;

  const who = state.impersonatedByName || state.impersonatedByEmail || 'the teacher';

  async function leave() {
    setLeaving(true);
    try { await endImpersonation(); }
    catch { setLeaving(false); }
  }

  return (
    <div className="sticky top-0 z-[70] bg-amber-500 text-amber-950 border-b border-amber-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-xs sm:text-sm">
        <UserCircle2 className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <p className="flex-1 min-w-0">
          You are signed in as this student.{' '}
          <span className="font-bold">{who}</span> has an impersonation session open.
        </p>
        <button
          onClick={leave}
          disabled={leaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-900 text-amber-50 text-xs font-bold hover:bg-amber-950 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <LogOut className="w-3 h-3" strokeWidth={2.5} />
          {leaving ? 'Returning…' : 'Return to my account'}
        </button>
      </div>
    </div>
  );
}
