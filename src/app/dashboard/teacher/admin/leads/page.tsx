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
  new:       { label: 'Nuevo',     chip: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500'   },
  contacted: { label: 'Contactado', chip: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500'    },
  converted: { label: 'Convertido', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  discarded: { label: 'Descartado', chip: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400'     },
};

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function digitsOnly(s: string): string {
  return s.replace(/\D+/g, '');
}

function fmtDate(ts: Timestamp | null): string {
  if (!ts) return '—';
  const d = ts.toDate();
  return d.toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
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
    if (!confirm('¿Eliminar este lead? Esta acción no se puede deshacer.')) return;
    await deleteDoc(doc(db, 'evaluationRequests', id));
  }

  // ── Access gate ─────────────────────────────────────────────
  if (!isInitialized) return null;
  if (!isAllowed) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Leads" subtitle="Solicitudes de evaluación gratuita" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center space-y-3">
            <p className="text-4xl">🔒</p>
            <p className="font-bold text-gray-700">Acceso restringido</p>
            <p className="text-sm text-gray-500">Esta sección solo está disponible para Ignacio y Aranxa.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Leads — Evaluaciones Gratuitas"
        subtitle={`${counts.all} solicitudes en total · ${counts.new} sin contactar`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Administración', href: '/dashboard/teacher/admin' },
          { label: 'Leads' },
        ]}
      />

      <div className="flex-1 p-6 overflow-auto space-y-4 max-w-6xl mx-auto w-full">

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'contacted', 'converted', 'discarded'] as const).map(key => {
            const active = filter === key;
            const label = key === 'all' ? 'Todos' : STATUS_META[key].label;
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
            Cargando leads…
          </div>
        )}
        {err && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            Error: {err}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center space-y-2">
            <p className="text-4xl">📭</p>
            <p className="font-bold text-gray-700">Sin leads {filter !== 'all' && `en "${STATUS_META[filter].label}"`}</p>
            <p className="text-sm text-gray-400">
              Las nuevas solicitudes del formulario de la landing aparecerán aquí en tiempo real.
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
                      <p className="font-bold text-gray-800 text-sm truncate">{lead.nombre || '(Sin nombre)'}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.chip}`}>
                        {meta.label}
                      </span>
                      {!lead.emailSent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-100" title={lead.emailError ?? ''}>
                          ✉ no enviado
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
                      <Field label="Teléfono"   value={lead.telefono} />
                      <Field label="Edad"       value={lead.edad} />
                      <Field label="Nivel"      value={NIVEL_LABEL[lead.nivel] ?? lead.nivel} />
                      <Field label="¿Cuándo comenzar?" value={lead.inicio} />
                      <Field label="Plan seleccionado" value={lead.plan} />
                      {lead.objetivo && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Objetivo</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 whitespace-pre-wrap">{lead.objetivo}</p>
                        </div>
                      )}
                      {lead.emailError && (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Error al enviar email</p>
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
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent('FriendlyTeaching — Evaluación gratuita')}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-colors"
                        >
                          ✉ Responder email
                        </a>
                      )}
                    </div>

                    {/* Status changer */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Estado:</span>
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
                        Eliminar
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
