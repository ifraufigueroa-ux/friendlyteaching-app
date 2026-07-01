// FriendlyTeaching.cl — Leads (prospective students)
'use client';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import {
  useLeads, createLead, updateLeadStatus, deleteLead,
  type Lead, type LeadStatus, type LeadSource,
} from '@/hooks/useLeads';

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:       'Nuevo',
  contacted: 'Contactado',
  trial:     'Clase de prueba',
  converted: 'Convertido',
  lost:      'Perdido',
};

const STATUS_STYLES: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  new:       { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  contacted: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  trial:     { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  converted: { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  lost:      { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200' },
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  whatsapp:  '💬 WhatsApp',
  instagram: '📸 Instagram',
  referral:  '🤝 Referido',
  web:       '🌐 Web',
  other:     '• Otro',
};

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'trial', 'converted', 'lost'];

export default function LeadsPage() {
  const { profile } = useAuthStore();
  const uid = profile?.uid ?? auth.currentUser?.uid ?? '';
  const { leads, loading, error } = useLeads();

  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add-lead form state
  const [fullName, setFullName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [source, setSource]       = useState<LeadSource>('whatsapp');
  const [interestedIn, setInterestedIn] = useState('');
  const [notes, setNotes]         = useState('');

  const counts = useMemo(() => {
    const c: Record<LeadStatus | 'all', number> = {
      all: leads.length, new: 0, contacted: 0, trial: 0, converted: 0, lost: 0,
    };
    for (const l of leads) c[l.status]++;
    return c;
  }, [leads]);

  const convertedRate = leads.length > 0
    ? Math.round((counts.converted / leads.length) * 100)
    : 0;

  const visible = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !uid) return;
    setSaving(true);
    try {
      await createLead({
        teacherId: uid,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        source,
        status: 'new',
        interestedIn: interestedIn.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setFullName(''); setPhone(''); setEmail('');
      setSource('whatsapp'); setInterestedIn(''); setNotes('');
      setFormOpen(false);
    } catch (err) {
      console.error('[leads] createLead failed', err);
      alert('No se pudo crear el lead. Revisa tu conexión.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, next: LeadStatus) {
    try { await updateLeadStatus(id, next); }
    catch (err) { console.error('[leads] status change failed', err); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el lead de ${name}?`)) return;
    try { await deleteLead(id); }
    catch (err) { console.error('[leads] delete failed', err); }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Leads"
        subtitle="Prospectos y estudiantes potenciales"
        actions={
          <button
            onClick={() => setFormOpen((o) => !o)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] text-white text-sm font-bold shadow-purple-sm hover:opacity-90 transition-opacity"
          >
            {formOpen ? '× Cerrar' : '+ Nuevo lead'}
          </button>
        }
      />
      <div className="flex-1 p-6 overflow-auto space-y-6 bg-mesh">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={counts.all}       color="#C8A8DC" />
          <StatCard label="Nuevos" value={counts.new}       color="#93C5FD" />
          <StatCard label="Contactados" value={counts.contacted} color="#FCD34D" />
          <StatCard label="Convertidos" value={counts.converted} sub={`${convertedRate}%`} color="#86EFAC" />
          <StatCard label="Perdidos" value={counts.lost}    color="#D1D5DB" />
        </div>

        {/* Add-lead form (collapsible) */}
        {formOpen && (
          <form onSubmit={handleCreate} className="glass-card rounded-2xl p-5 space-y-3 shadow-glass">
            <p className="font-bold text-sm text-[#5A3D7A]">Nuevo lead</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre completo *"
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9B7CB8]"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono / WhatsApp"
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9B7CB8]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9B7CB8]"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#9B7CB8]"
              >
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="instagram">📸 Instagram</option>
                <option value="referral">🤝 Referido</option>
                <option value="web">🌐 Web</option>
                <option value="other">Otro</option>
              </select>
              <input
                value={interestedIn}
                onChange={(e) => setInterestedIn(e.target.value)}
                placeholder="Interesado en (nivel, objetivo…)"
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm sm:col-span-2 focus:outline-none focus:border-[#9B7CB8]"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas"
                rows={2}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm sm:col-span-2 resize-none focus:outline-none focus:border-[#9B7CB8]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !fullName.trim()}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] text-white text-xs font-bold disabled:opacity-40"
              >
                {saving ? 'Guardando…' : 'Guardar lead'}
              </button>
            </div>
          </form>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos <span className="opacity-60">({counts.all})</span>
          </FilterPill>
          {STATUS_ORDER.map((s) => (
            <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)}>
              {STATUS_LABEL[s]} <span className="opacity-60">({counts[s]})</span>
            </FilterPill>
          ))}
        </div>

        {/* Leads list */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Cargando…</div>
        ) : visible.length === 0 ? (
          <EmptyState hasAny={leads.length > 0} onAdd={() => setFormOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-3 stat-glow">
      <div className="flex items-center gap-2">
        <span className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
        <div>
          <p className="text-xl font-extrabold text-gray-800 leading-none">{value}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-[#5A3D7A] text-white shadow-purple-sm'
          : 'bg-white/70 text-gray-600 hover:bg-[#F0E5FF] border border-white/60'
      }`}
    >
      {children}
    </button>
  );
}

function LeadCard({
  lead, onStatusChange, onDelete,
}: {
  lead: Lead;
  onStatusChange: (id: string, next: LeadStatus) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const s = STATUS_STYLES[lead.status];
  const digits = (lead.phone ?? '').replace(/\D/g, '');
  const waPhone = digits.startsWith('56') ? digits
    : digits.startsWith('9') && digits.length === 9 ? `56${digits}` : digits;
  const created = lead.createdAt?.toDate?.();
  const initial = lead.fullName[0]?.toUpperCase() ?? '?';

  return (
    <div className="glass-card rounded-2xl p-4 hover-lift shadow-glass">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-purple-sm">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-gray-800 text-sm truncate">{lead.fullName}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border} flex-shrink-0`}>
              {STATUS_LABEL[lead.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
            <span>{SOURCE_LABEL[lead.source]}</span>
            {created && (
              <>
                <span>·</span>
                <span>{created.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
              </>
            )}
          </div>
          {lead.interestedIn && (
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">
              🎯 {lead.interestedIn}
            </p>
          )}
          {lead.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">{lead.notes}</p>
          )}

          {/* Contact + status actions */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {digits && (
              <a
                href={`https://wa.me/${waPhone}?text=Hola%20${encodeURIComponent(lead.fullName.split(' ')[0])}%2C%20soy%20de%20FriendlyTeaching%20%F0%9F%91%8B`}
                target="_blank" rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-[#25D366] hover:bg-[#1ebe5c] text-white text-[10px] font-bold transition-colors"
              >
                💬 WhatsApp
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="px-2.5 py-1 rounded-full bg-[#F0E5FF] hover:bg-[#E0D5FF] text-[#5A3D7A] text-[10px] font-bold transition-colors"
              >
                ✉️ Email
              </a>
            )}
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
              className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 focus:outline-none focus:border-[#9B7CB8]"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={() => onDelete(lead.id, lead.fullName)}
              className="ml-auto text-[10px] font-bold text-gray-300 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasAny, onAdd }: { hasAny: boolean; onAdd: () => void }) {
  return (
    <div className="glass-card rounded-2xl p-10 text-center space-y-3 shadow-glass">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-3xl shadow-purple-md">
        ✨
      </div>
      <p className="font-bold text-[#5A3D7A]">
        {hasAny ? 'No hay leads con este filtro' : 'Aún no tienes leads'}
      </p>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">
        Registra prospectos desde WhatsApp, Instagram o referidos y llévalos por el pipeline
        hasta convertirlos en estudiantes activos.
      </p>
      {!hasAny && (
        <button
          onClick={onAdd}
          className="mt-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-purple-sm"
        >
          + Agregar primer lead
        </button>
      )}
    </div>
  );
}
