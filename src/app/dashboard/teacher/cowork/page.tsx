// FriendlyTeaching.cl — COWORK (workspace del equipo docente)
// Espacio privado sólo para profesores: chat común, tablón de avisos
// y presencia en vivo. Pensado para escalar cuando la academia sume
// más profes.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import TopBar from '@/components/layout/TopBar';
import { useCoworkChat } from '@/hooks/useCoworkChat';
import { markCoworkChatSeen } from '@/hooks/useCoworkChatUnread';
import { useCoworkAnnouncements } from '@/hooks/useCoworkAnnouncements';
import { useCoworkPresence } from '@/hooks/useCoworkPresence';
import type { CoworkAnnouncement, CoworkMessage, CoworkPresence } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';

// ── Helpers ────────────────────────────────────────────────────

function tsToDate(ts: Timestamp | undefined | null): Date | null {
  if (!ts) return null;
  try { return ts.toDate(); } catch { return null; }
}

function formatTime(ts: Timestamp | undefined | null): string {
  const d = tsToDate(ts);
  if (!d) return '';
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(ts: Timestamp | undefined | null): string {
  const d = tsToDate(ts);
  if (!d) return '';
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  if (isSameDay) return 'Hoy';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
}

function initialsFrom(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

function relativeMinutes(ts: Timestamp | undefined | null): string {
  const d = tsToDate(ts);
  if (!d) return '';
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

// ── Announcement composer ──────────────────────────────────────

function AnnouncementComposer({
  onSubmit,
  onCancel,
  disabled,
}: {
  onSubmit: (title: string, body: string) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(title, body);
      setTitle(''); setBody('');
      onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar');
    } finally { setSaving(false); }
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 border border-[#DDD0F5]">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del aviso"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#C8A8DC] focus:outline-none text-sm font-semibold text-[#3D1F6B] placeholder-gray-400"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escribe el aviso para tu equipo…"
        rows={4}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#C8A8DC] focus:outline-none text-sm text-gray-700 placeholder-gray-400 resize-none"
      />
      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
          {error}
        </p>
      )}
      {disabled && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
          Cargando sesión… reintenta en un segundo.
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handle}
          disabled={saving || disabled || !title.trim() || !body.trim()}
          className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#7B5EA7] to-[#5A3D7A] text-white shadow-md disabled:opacity-40"
        >
          {saving ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}

// ── Announcement card ──────────────────────────────────────────

function AnnouncementCard({
  ann,
  currentUid,
  onTogglePin,
  onMarkRead,
  onDelete,
}: {
  ann: CoworkAnnouncement;
  currentUid: string;
  onTogglePin: (a: CoworkAnnouncement) => void;
  onMarkRead: (id: string, uid: string) => void;
  onDelete: (id: string) => void;
}) {
  const isRead = !!ann.readBy?.[currentUid];
  const isOwner = ann.authorId === currentUid;

  return (
    <div className={`rounded-2xl p-4 border transition-all ${
      ann.pinned
        ? 'bg-gradient-to-br from-[#FFF5C8]/60 to-[#FFE0D5]/40 border-[#FFDC7A]'
        : 'bg-white/80 border-[#EDE5FF]'
    } ${!isRead ? 'ring-2 ring-[#C8A8DC]/40' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {ann.pinned && <span className="text-xs">📌</span>}
            <h4 className="text-sm font-bold text-[#3D1F6B] truncate">{ann.title}</h4>
            {!isRead && <span className="w-2 h-2 rounded-full bg-[#7B5EA7] flex-shrink-0" />}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {ann.authorName} · {relativeMinutes(ann.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onTogglePin(ann)}
            title={ann.pinned ? 'Desanclar' : 'Anclar'}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F0E5FF] text-sm"
          >
            {ann.pinned ? '📌' : '📍'}
          </button>
          {isOwner && (
            <button
              onClick={() => { if (confirm('¿Eliminar aviso?')) onDelete(ann.id); }}
              title="Eliminar"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 text-sm"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ann.body}</p>
      {!isRead && (
        <button
          onClick={() => onMarkRead(ann.id, currentUid)}
          className="mt-2 text-[11px] font-semibold text-[#7B5EA7] hover:text-[#5A3D7A]"
        >
          Marcar como leído
        </button>
      )}
    </div>
  );
}

// ── Chat message row ───────────────────────────────────────────

function MessageRow({
  msg,
  isMine,
  showAuthor,
  onEdit,
  onDelete,
}: {
  msg: CoworkMessage;
  isMine: boolean;
  showAuthor: boolean;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(msg.text);
  const isDeleted = !!msg.deletedAt;

  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {showAuthor ? (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${
          isMine ? 'bg-gradient-to-br from-[#7B5EA7] to-[#5A3D7A]' : 'bg-gradient-to-br from-[#B8E8E8] to-[#7EB8D8]'
        }`}>
          {initialsFrom(msg.authorName)}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAuthor && (
          <p className={`text-[10px] font-bold text-gray-500 mb-0.5 px-1 ${isMine ? 'text-right' : ''}`}>
            {msg.authorName}
          </p>
        )}
        <div className={`group relative px-3 py-2 rounded-2xl text-sm shadow-sm ${
          isMine
            ? 'bg-gradient-to-br from-[#7B5EA7] to-[#5A3D7A] text-white rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
        }`}>
          {isDeleted ? (
            <em className="opacity-60">— mensaje eliminado —</em>
          ) : editing ? (
            <div className="space-y-1.5 min-w-[220px]">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="w-full text-gray-800 bg-white/95 rounded-lg px-2 py-1 text-sm resize-none border border-white/50"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => { setEditing(false); setDraft(msg.text); }}
                  className={`text-[10px] font-semibold ${isMine ? 'text-white/80 hover:text-white' : 'text-gray-500'}`}
                >Cancelar</button>
                <button
                  onClick={async () => { await onEdit(msg.id, draft); setEditing(false); }}
                  className={`text-[10px] font-bold ${isMine ? 'text-white' : 'text-[#5A3D7A]'}`}
                >Guardar</button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
          )}
          <div className={`flex items-center gap-1.5 mt-1 text-[9px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
            <span>{formatTime(msg.createdAt)}</span>
            {msg.editedAt && <span>· editado</span>}
          </div>

          {isMine && !isDeleted && !editing && (
            <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white rounded-full shadow-md px-1 py-0.5 border border-gray-100">
              <button onClick={() => setEditing(true)} className="w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-100 rounded-full" title="Editar">✏️</button>
              <button onClick={() => { if (confirm('¿Eliminar mensaje?')) onDelete(msg.id); }} className="w-6 h-6 flex items-center justify-center text-xs hover:bg-red-50 rounded-full" title="Eliminar">🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Presence card ──────────────────────────────────────────────

function PresenceItem({ p, isOnline }: { p: CoworkPresence; isOnline: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/60 transition-colors">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B5EA7] to-[#5A3D7A] flex items-center justify-center text-[11px] font-bold text-white">
          {initialsFrom(p.fullName)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          isOnline ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#3D1F6B] truncate">{p.fullName}</p>
        <p className="text-[10px] text-gray-400 truncate">
          {isOnline ? 'En línea' : `Visto ${relativeMinutes(p.lastSeen)}`}
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function CoworkPage() {
  const router = useRouter();
  const { profile, role, isInitialized } = useAuthStore();

  // authStore.profile puede quedar null tras montar la página (bug de hidratación
  // conocido). Suscribimos onAuthStateChanged directo para tener siempre un uid
  // válido — sin él las escrituras a Firestore fallan por reglas.
  const [authUid, setAuthUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  const [authName, setAuthName] = useState<string>(
    () => auth.currentUser?.displayName ?? auth.currentUser?.email?.split('@')[0] ?? '',
  );
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthUid(u?.uid ?? '');
      setAuthName(u?.displayName ?? u?.email?.split('@')[0] ?? '');
    });
  }, []);

  const uid = profile?.uid || authUid;
  const fullName = profile?.fullName || authName;

  // Guard: sólo profesores. Estudiantes van al dashboard.
  useEffect(() => {
    if (isInitialized && role && role !== 'teacher') {
      router.replace('/dashboard');
    }
  }, [isInitialized, role, router]);

  const { messages, sendMessage, editMessage, deleteMessage } = useCoworkChat();
  const {
    pinned, recent, unreadCount,
    createAnnouncement, togglePin, markRead, removeAnnouncement,
  } = useCoworkAnnouncements(uid);
  const { presences, onlineNow } = useCoworkPresence(uid, fullName, profile?.profileImage);

  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  // Marcar el chat como visto cada vez que llegan mensajes estando en la
  // sección — así el badge del sidebar se resetea en tiempo real mientras
  // el profe tiene la pestaña abierta.
  useEffect(() => {
    if (role === 'teacher') markCoworkChatSeen();
  }, [messages.length, role]);

  const onlineUids = useMemo(() => new Set(onlineNow.map(p => p.uid)), [onlineNow]);

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    if (!uid) {
      setSendError('No hay sesión activa. Recarga la página e inicia sesión.');
      return;
    }
    setSendError(null);
    setDraft('');
    try {
      await sendMessage(uid, fullName || 'Profesor/a', text, profile?.profileImage);
    } catch (e) {
      // Restauramos el borrador para que el profe pueda reintentar.
      setDraft(text);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setSendError(`No se pudo enviar: ${msg}`);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isInitialized) return null;
  if (role && role !== 'teacher') return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        title="Co-Work"
        subtitle={`Espacio del equipo docente · ${onlineNow.length} en línea`}
        breadcrumbs={[
          { label: 'Panel', href: '/dashboard/teacher' },
          { label: 'Co-Work' },
        ]}
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr_240px] gap-4 p-4 overflow-hidden">

        {/* ── Anuncios ─────────────────────────────────── */}
        <aside className="glass-card rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div>
              <h3 className="text-sm font-extrabold text-[#3D1F6B]">📌 Tablón</h3>
              <p className="text-[10px] text-gray-500">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
            <button
              onClick={() => setComposing(v => !v)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#7B5EA7] to-[#5A3D7A] text-white shadow-sm"
            >
              {composing ? '×' : '+ Nuevo'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {composing && (
              <AnnouncementComposer
                onSubmit={(t, b) => createAnnouncement(uid, fullName || 'Profesor/a', t, b)}
                onCancel={() => setComposing(false)}
                disabled={!uid}
              />
            )}
            {pinned.map(a => (
              <AnnouncementCard
                key={a.id}
                ann={a}
                currentUid={uid}
                onTogglePin={togglePin}
                onMarkRead={markRead}
                onDelete={removeAnnouncement}
              />
            ))}
            {recent.map(a => (
              <AnnouncementCard
                key={a.id}
                ann={a}
                currentUid={uid}
                onTogglePin={togglePin}
                onMarkRead={markRead}
                onDelete={removeAnnouncement}
              />
            ))}
            {pinned.length === 0 && recent.length === 0 && !composing && (
              <div className="text-center py-10 text-gray-400 text-xs">
                <p className="text-2xl mb-2">🪴</p>
                <p>Sin avisos aún.</p>
                <p className="mt-1">Publica el primero para tu equipo.</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Chat ─────────────────────────────────────── */}
        <section className="glass-card rounded-2xl flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-extrabold text-[#3D1F6B]">💬 Chat del equipo</h3>
            <p className="text-[10px] text-gray-500">Mensajes visibles para todos los profesores</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-20 text-gray-400 text-sm">
                <p className="text-3xl mb-2">👋</p>
                <p>Aún no hay mensajes.</p>
                <p className="mt-1">Rompe el hielo con un saludo al equipo.</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const isMine = msg.authorId === uid;
              // Agrupamos mensajes consecutivos del mismo autor dentro de 5 min.
              const prevTs = prev?.createdAt?.toMillis?.() ?? 0;
              const thisTs = msg.createdAt?.toMillis?.() ?? 0;
              const sameCluster = prev
                && prev.authorId === msg.authorId
                && (thisTs - prevTs) < 5 * 60 * 1000;

              const showDay = !prev
                || formatDay(prev.createdAt) !== formatDay(msg.createdAt);

              return (
                <div key={msg.id} className="space-y-2">
                  {showDay && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {formatDay(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <MessageRow
                    msg={msg}
                    isMine={isMine}
                    showAuthor={!sameCluster}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                  />
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
            {sendError && (
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-1.5">
                <span>{sendError}</span>
                <button onClick={() => setSendError(null)} className="text-red-500 hover:text-red-700">×</button>
              </div>
            )}
            {!uid && (
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                Cargando sesión… espera un segundo antes de enviar.
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Escribe un mensaje para el equipo… (Enter para enviar, Shift+Enter salto de línea)"
                className="flex-1 resize-none px-3 py-2 rounded-2xl border border-gray-200 focus:border-[#C8A8DC] focus:outline-none text-sm max-h-32"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || !uid}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#7B5EA7] to-[#5A3D7A] text-white font-bold text-sm shadow-md disabled:opacity-40 flex-shrink-0"
              >
                Enviar
              </button>
            </div>
          </div>
        </section>

        {/* ── Presencia ────────────────────────────────── */}
        <aside className="glass-card rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          <div className="px-2 py-1 mb-2">
            <h3 className="text-sm font-extrabold text-[#3D1F6B]">👥 Equipo</h3>
            <p className="text-[10px] text-gray-500">
              {onlineNow.length} en línea · {presences.length} en total
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5">
            {presences
              .slice()
              .sort((a, b) => {
                const aOn = onlineUids.has(a.uid) ? 0 : 1;
                const bOn = onlineUids.has(b.uid) ? 0 : 1;
                if (aOn !== bOn) return aOn - bOn;
                return a.fullName.localeCompare(b.fullName);
              })
              .map(p => (
                <PresenceItem key={p.uid} p={p} isOnline={onlineUids.has(p.uid)} />
              ))}
            {presences.length === 0 && (
              <p className="text-xs text-gray-400 px-2">Nadie ha entrado al Co-Work aún.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
