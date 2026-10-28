// FriendlyTeaching.cl — Leads (Evaluation Requests) inbox
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/firebase/config';
import {
  collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc,
  serverTimestamp,
  type Timestamp, type QuerySnapshot, type DocumentData,
  type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import TopBar from '@/components/layout/TopBar';
import { Lock, MailX, Mail, MessageSquare } from 'lucide-react';

const ALLOWED_EMAILS = ['ifraufigueroa@gmail.com', 'aranxa.brunam@gmail.com'];

type LeadStatus = 'new' | 'contacted' | 'converted' | 'discarded';

interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  edad: string;
  nivel: string;
  objetivo: string;
  inicio: string;
  plan: string;
  status: LeadStatus;
  emailSent: boolean;
  emailError: string | null;
  createdAt: Timestamp | null;
}

const STATUS_META: Record<LeadStatus, { label: string; chip: string; dot: string }> = {
  new:       { label: 'New',        chip: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500'   },
  contacted: { label: 'Contacted',  chip: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'    },
  converted: { label: 'Converted',  chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  discarded: { label: 'Discarded',  chip: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400'     },
};

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Beginner',
  basico: 'Elementary',
  intermedio: 'Intermediate',
  avanzado: 'Advanced',
};

function digitsOnly(s: string): string {
  return s.replace(/\D+/g, '');
}

function fmtDate(ts: Timestamp | null): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function LeadsPage() {
  const { profile, isInitialized } = useAuthStore();
  const email = profile?.email ?? '';
  const isAllowed = ALLOWED_EMAILS.includes(email);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isAllowed) { setLoading(false); return; }
    const q = query(collection(db, 'evaluationRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const rows: Lead[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const v = d.data() as Partial<Lead>;
        return {
          id: d.id,
          nombre: v.nombre ?? '',
          email: v.email ?? '',
          telefono: v.telefono ?? '',
          edad: v.edad ?? '',
          nivel: v.nivel ?? '',
          objetivo: v.objetivo ?? '',
          inicio: v.inicio ?? '',
          plan: v.plan ?? '',
          status: (v.status as LeadStatus | undefined) ?? 'new',
          emailSent: v.emailSent ?? false,
          emailError: v.emailError ?? null,
          createdAt: (v.createdAt as Timestamp | undefined) ?? null,
        };
      });
      setLeads(rows);
      setLoading(false);
    }, (e: FirestoreError) => {
      setErr(e.message);
      setLoading(false);
    });
    return () => unsub();
  }, [isAllowed]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus | 'all', number> = { all: leads.length, new: 0, contacted: 0, converted: 0, discarded: 0 };
    for (const l of leads) c[l.status]++;
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    return filter === 'all' ? leads : leads.filter(l => l.status === filter);
  }, [leads, filter]);

  async function setStatus(id: string, status: LeadStatus) {
    await updateDoc(doc(db, 'evaluationRequests', id), { status, updatedAt: serverTimestamp() });
  }

  async function remove(id: string) {
    if (!confirm('Delete this lead? This action can\'t be undone.')) return;
    await deleteDoc(doc(db, 'evaluationRequests', id));
  }

  // ── Access gate ─────────────────────────────────────────────
  if (!isInitialized) return null;
  if (!isAllowed) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Leads" subtitle="Free evaluation requests" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center space-y-3">
            <Lock className="w-10 h-10 mx-auto text-gray-400" strokeWidth={2.25} />
            <p className="font-bold text-gray-700">Restricted access</p>
            <p className="text-sm text-gray-500">This section is only available to Ignacio and Aranxa.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Leads — Free Evaluations"
        subtitle={`${counts.all} requests total · ${counts.new} not contacted`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Administration', href: '/dashboard/teacher/admin' },
          { label: 'Leads' },
        ]}
      />

      <div className="flex-1 p-6 overflow-auto space-y-4 max-w-6xl mx-auto w-full">

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'contacted', 'converted', 'discarded'] as const).map(key => {
            const active = filter === key;
            const label = key === 'all' ? 'All' : STATUS_META[key].label;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#5A3D7A] text-white border-[#5A3D7A]'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label} · {counts[key]}
              </button>
            );
          })}
        </div>

        {/* ── Status / errors ── */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
            Loading leads…
          </div>
        )}
        {err && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            Error: {err}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-2">
            <MailX className="w-10 h-10 mx-auto text-gray-400" strokeWidth={2.25} />
            <p className="font-bold text-gray-700">No leads {filter !== 'all' && `in "${STATUS_META[filter].label}"`}</p>
            <p className="text-sm text-gray-400">
              New submissions from the landing page form will appear here in real time.
            </p>
          </div>
        )}

        {/* ── Leads list ── */}
        <div className="space-y-2.5">
          {filtered.map(lead => {
            const isOpen = expanded === lead.id;
            const meta = STATUS_META[lead.status];
            const wapp = digitsOnly(lead.telefono);
            return (
              <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Header row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : lead.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm truncate">{lead.nombre || '(No name)'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>
                        {meta.label}
                      </span>
                      {!lead.emailSent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-100 inline-flex items-center gap-1" title={lead.emailError ?? ''}>
                          <MailX className="w-3 h-3" strokeWidth={2.5} /> not sent
                        </span>
                      )}
                      {lead.plan && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#F0E5FF] text-[#5A3D7A] border-[#E8D5F5]">
                          {lead.plan}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {lead.email || '—'} · {lead.telefono || '—'} · {fmtDate(lead.createdAt)}
                    </p>
                  </div>
                  <span className="text-gray-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-4">

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm pt-3">
                      <Field label="Email"      value={lead.email} />
                      <Field label="Phone"      value={lead.telefono} />
                      <Field label="Age"        value={lead.edad} />
                      <Field label="Level"      value={NIVEL_LABEL[lead.nivel] ?? lead.nivel} />
                      <Field label="When to start?" value={lead.inicio} />
                      <Field label="Selected plan" value={lead.plan} />
                      {lead.objetivo && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Goal</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 whitespace-pre-wrap">{lead.objetivo}</p>
                        </div>
                      )}
                      {lead.emailError && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Email send error</p>
                          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 break-all">{lead.emailError}</p>
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {wapp && (
                        <a
                          href={`https://wa.me/${wapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.5} /> WhatsApp
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent('FriendlyTeaching — Free evaluation')}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" strokeWidth={2.5} /> Reply by email
                        </a>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Status:</span>
                      {(Object.keys(STATUS_META) as LeadStatus[]).map(s => {
                        const active = lead.status === s;
                        const m = STATUS_META[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(lead.id, s)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                              active ? m.chip : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => remove(lead.id)}
                        className="ml-auto px-3 py-1 rounded-full text-[11px] font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value || '—'}</p>
    </div>
  );
}
