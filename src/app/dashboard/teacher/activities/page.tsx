// FriendlyTeaching.cl — Reusable Activity Bank
'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useActivities, type Activity, type ActivitySkill } from '@/hooks/useActivities';
import TopBar from '@/components/layout/TopBar';
import type { LessonLevel } from '@/types/firebase';

// ── Config ────────────────────────────────────────────────────────────────────

const SKILLS: { id: ActivitySkill; label: string; icon: string; color: string }[] = [
  { id: 'vocabulary', label: 'Vocabulario',  icon: '📚', color: 'bg-blue-100 text-blue-700' },
  { id: 'grammar',    label: 'Gramática',    icon: '📐', color: 'bg-purple-100 text-purple-700' },
  { id: 'reading',    label: 'Lectura',      icon: '📖', color: 'bg-sky-100 text-sky-700' },
  { id: 'listening',  label: 'Escuchar',     icon: '👂', color: 'bg-pink-100 text-pink-700' },
  { id: 'speaking',   label: 'Hablar',       icon: '🗣️', color: 'bg-orange-100 text-orange-700' },
  { id: 'writing',    label: 'Escritura',    icon: '✍️', color: 'bg-green-100 text-green-700' },
  { id: 'general',    label: 'General',      icon: '🌟', color: 'bg-gray-100 text-gray-600' },
];

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const LEVEL_COLORS: Record<string, string> = {
  A0:'bg-gray-100 text-gray-500', A1:'bg-blue-100 text-blue-700',
  A2:'bg-sky-100 text-sky-700', B1:'bg-green-100 text-green-700',
  'B1+':'bg-emerald-100 text-emerald-700', B2:'bg-amber-100 text-amber-700',
  C1:'bg-purple-100 text-purple-700',
};

function skillMeta(id: ActivitySkill) {
  return SKILLS.find(s => s.id === id) ?? SKILLS[SKILLS.length - 1];
}

// ── Activity form modal ───────────────────────────────────────────────────────

type FormState = {
  title: string;
  skill: ActivitySkill;
  level: LessonLevel | '';
  description: string;
  content: string;
  duration: string;
  tags: string;
};

const EMPTY_FORM: FormState = {
  title: '', skill: 'vocabulary', level: '', description: '', content: '', duration: '', tags: '',
};

function ActivityFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Activity;
  onSave: (data: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          title: initial.title,
          skill: initial.skill,
          level: initial.level ?? '',
          description: initial.description,
          content: initial.content ?? '',
          duration: String(initial.duration ?? ''),
          tags: (initial.tags ?? []).join(', '),
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-[#5A3D7A]">{initial ? 'Editar actividad' : 'Nueva actividad'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Título *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ej: Vocabulary bingo — Daily routines"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent" />
          </div>

          {/* Skill + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Habilidad</label>
              <select value={form.skill} onChange={e => set('skill', e.target.value as ActivitySkill)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]">
                {SKILLS.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Nivel</label>
              <select value={form.level} onChange={e => set('level', e.target.value as LessonLevel | '')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]">
                <option value="">Todos los niveles</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Duration + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Duración (min)</label>
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Tags (separados por ,)</label>
              <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="Ej: dinámico, parejas, PPP"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]" />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">
              Instrucciones / Cómo aplicar la actividad *
            </label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Describe cómo ejecutar esta actividad en clase..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent" />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">
              Contenido (opcional)
            </label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)}
              rows={4} placeholder="Preguntas, textos, listas de vocabulario, ejercicios..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent font-mono text-xs" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!form.title || !form.description) return;
              setSaving(true);
              try { await onSave(form); }
              finally { setSaving(false); }
            }}
            disabled={saving || !form.title.trim() || !form.description.trim()}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : initial ? 'Actualizar' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onUse,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  onUse: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = skillMeta(activity.skill);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-800 text-sm leading-snug">{activity.title}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activity.level && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[activity.level]}`}>
                {activity.level}
              </span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          {activity.duration && <span>⏱️ {activity.duration} min</span>}
          {(activity.timesUsed ?? 0) > 0 && <span>✅ {activity.timesUsed}× usada</span>}
          {(activity.tags?.length ?? 0) > 0 && (
            <span className="truncate">{activity.tags!.join(' · ')}</span>
          )}
        </div>

        {!expanded && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{activity.description}</p>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-1">Instrucciones</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{activity.description}</p>
          </div>
          {activity.content && (
            <div>
              <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-1">Contenido</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl px-3 py-2 font-mono leading-relaxed overflow-x-auto">
                {activity.content}
              </pre>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onUse}
              className="flex-1 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-xs font-bold transition-colors">
              ✅ Usar en clase
            </button>
            <button onClick={onEdit}
              className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition-colors">
              ✏️
            </button>
            <button onClick={onDelete}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold transition-colors">
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';
  const { activities, loading, createActivity, updateActivity, deleteActivity, incrementUsed } = useActivities(teacherId);

  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [skillFilter, setSkillFilter] = useState<ActivitySkill | ''>('');
  const [levelFilter, setLevelFilter] = useState<LessonLevel | ''>('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => activities.filter(a => {
    if (skillFilter && a.skill !== skillFilter) return false;
    if (levelFilter && a.level !== levelFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
        !a.description.toLowerCase().includes(search.toLowerCase()) &&
        !(a.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [activities, skillFilter, levelFilter, search]);

  async function handleSave(form: FormState) {
    const payload = {
      title: form.title.trim(),
      skill: form.skill,
      level: (form.level as LessonLevel) || undefined,
      description: form.description.trim(),
      content: form.content.trim() || undefined,
      duration: form.duration ? parseInt(form.duration) : undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (editActivity) {
      await updateActivity(editActivity.id, payload);
      setEditActivity(null);
    } else {
      await createActivity(payload);
      setShowForm(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="🎯 Banco de Actividades"
        subtitle={`${activities.length} actividade${activities.length !== 1 ? 's' : ''} guardada${activities.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Actividad' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6 space-y-4">

        {/* Action + filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            ➕ Nueva actividad
          </button>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
          />
        </div>

        {/* Skill filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSkillFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!skillFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'}`}
          >
            Todas ({activities.length})
          </button>
          {SKILLS.map(s => {
            const count = activities.filter(a => a.skill === s.id).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                onClick={() => setSkillFilter(skillFilter === s.id ? '' : s.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  skillFilter === s.id ? 'bg-[#C8A8DC] text-white' : `${s.color} opacity-80 hover:opacity-100 border border-transparent`
                }`}
              >
                {s.icon} {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Level filter row */}
        {activities.some(a => a.level) && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setLevelFilter('')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${!levelFilter ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {LEVELS.filter(l => activities.some(a => a.level === l)).map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${levelFilter === l ? 'bg-[#5A3D7A] text-white' : `${LEVEL_COLORS[l]} opacity-80 hover:opacity-100 border border-transparent`}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            {activities.length === 0 ? (
              <>
                <p className="text-4xl mb-3">🎯</p>
                <p className="text-gray-500 text-sm font-semibold">Tu banco de actividades está vacío</p>
                <p className="text-xs text-gray-400 mt-1 mb-5">Crea actividades reutilizables: dinámicas, ejercicios, juegos de vocabulario...</p>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold transition-colors hover:bg-[#9B7CB8]">
                  ➕ Crear primera actividad
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-500 text-sm">No hay actividades que coincidan.</p>
                <button onClick={() => { setSkillFilter(''); setLevelFilter(''); setSearch(''); }} className="mt-2 text-xs text-[#9B7CB8] underline">Limpiar filtros</button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(a => (
              <ActivityCard
                key={a.id}
                activity={a}
                onEdit={() => setEditActivity(a)}
                onDelete={async () => {
                  if (confirm(`¿Eliminar "${a.title}"?`)) await deleteActivity(a.id);
                }}
                onUse={() => incrementUsed(a.id, a.timesUsed ?? 0)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <ActivityFormModal
          onSave={async data => { await handleSave(data); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editActivity && (
        <ActivityFormModal
          initial={editActivity}
          onSave={async data => { await handleSave(data); setEditActivity(null); }}
          onClose={() => setEditActivity(null)}
        />
      )}
    </div>
  );
}
