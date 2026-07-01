// FriendlyTeaching.cl — Teacher Music Lessons (Sounter-style)
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import {
  useMusicLessons,
  createMusicLesson,
  publishMusicLesson,
  deleteMusicLesson,
  assignMusicLesson,
} from '@/hooks/useMusicLessons';
import TopBar from '@/components/layout/TopBar';
import TranscriptClipEditor from '@/components/teacher/TranscriptClipEditor';
import type { Slide, LessonLevel, SongData, MusicLesson } from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface SongResult {
  trackId: number;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  genre: string;
}

// ─── Step indicator ───────────────────────────────────────────
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
      ${done ? 'bg-green-500 text-white' : active ? 'bg-[#5A3D7A] text-white' : 'bg-gray-200 text-gray-400'}`}>
      {done ? '✓' : n}
    </div>
  );
}

// ─── Assign Modal ────────────────────────────────────────────
function AssignModal({
  lesson,
  students,
  onClose,
}: {
  lesson: MusicLesson;
  students: { uid: string; fullName: string }[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(lesson.assignedTo ?? []);
  const [saving, setSaving] = useState(false);

  function toggle(uid: string) {
    setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  }

  async function save() {
    setSaving(true);
    await assignMusicLesson(lesson.id!, selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#5A3D7A]">Asignar estudiantes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {students.map(s => (
            <label key={s.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0E5FF]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(s.uid)}
                onChange={() => toggle(s.uid)}
                className="accent-[#5A3D7A] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{s.fullName}</span>
            </label>
          ))}
          {students.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No hay estudiantes activos.</p>}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">Cancelar</button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function TeacherMusicPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const { lessons, loading: loadingLib } = useMusicLessons(uid);
  const { students } = useStudents();
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'approved');

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SongResult | null>(null);
  const [lyrics, setLyrics] = useState('');
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [level, setLevel] = useState<LessonLevel>('B1');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [assignTarget, setAssignTarget] = useState<MusicLesson | null>(null);
  const [manualEditorOpen, setManualEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MusicLesson | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'student') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/song-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  async function handleSelectSong(song: SongResult) {
    setSelected(song);
    setLyrics('');
    setLyricsError('');
    setYoutubeUrl('');
    setStep(2);
    setFetchingLyrics(true);
    try {
      const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setLyrics(data.lyrics ?? '');
    } catch {
      setLyricsError('Lyrics not found automatically. Paste them below.');
    } finally {
      setFetchingLyrics(false);
    }
  }

  async function handleGenerate() {
    if (!selected || !lyrics.trim()) return;
    setGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/music-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          artist: selected.artist,
          lyrics,
          level,
          songData: { albumArt: selected.albumArt, previewUrl: selected.previewUrl ?? undefined, youtubeUrl: youtubeUrl.trim() || undefined },
        }),
      });
      const data = await res.json();
      if (data.slides) {
        setSlides(data.slides);
        setStep(3);
      } else {
        setGenerateError(data.error ?? 'No se pudo generar la lección. Intenta de nuevo.');
      }
    } catch {
      setGenerateError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!selected || !slides.length) return;
    setSaving(true);
    setSaveError('');
    try {
      const song: SongData = {
        title: selected.title,
        artist: selected.artist,
        albumArt: selected.albumArt,
        previewUrl: selected.previewUrl ?? undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        lyrics,
      };
      const SONG_DATA_TYPES = new Set(['lyrics', 'song_cover', 'lyrics_game', 'translation_game', 'friendlyrics_end']);
      const enrichedSlides = slides.map(s =>
        SONG_DATA_TYPES.has(s.type) ? { ...s, songData: song } : s,
      );
      await createMusicLesson({ teacherId: uid, song, level, slides: enrichedSlides });
      setStep(1);
      setSelected(null);
      setLyrics('');
      setSlides([]);
      setQuery('');
      setResults([]);
    } catch (err) {
      console.error('[handleSave]', err);
      setSaveError('No se pudo guardar. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
      <TopBar title="🎵 Friendlyrics®" />

      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-8">

        {/* ── Wizard card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8DAFF] overflow-hidden">
          {/* Steps header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F0E5FF] bg-gradient-to-r from-[#F9F5FF] to-white">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div className="flex-1 h-0.5 bg-gray-200 rounded"><div className={`h-full rounded transition-all bg-[#5A3D7A] ${step > 1 ? 'w-full' : 'w-0'}`} /></div>
            <StepDot n={2} active={step === 2} done={step > 2} />
            <div className="flex-1 h-0.5 bg-gray-200 rounded"><div className={`h-full rounded transition-all bg-[#5A3D7A] ${step > 2 ? 'w-full' : 'w-0'}`} /></div>
            <StepDot n={3} active={step === 3} done={false} />
            <div className="ml-2 text-sm text-gray-500">
              {step === 1 && 'Search a song'}
              {step === 2 && 'Review lyrics & settings'}
              {step === 3 && 'Preview & save lesson'}
            </div>
          </div>

          <div className="p-6">
            {/* ── Step 1: Search ──────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Manual transcript entry point — mirror of the Friendlyflix flow */}
                <button
                  onClick={() => { setEditTarget(null); setManualEditorOpen(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-white border border-pink-100 hover:border-pink-300 hover:from-pink-100 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center text-white text-lg shadow-sm">
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#5A3D7A]">Manual con transcript</p>
                    <p className="text-[11px] text-gray-500">Pega el transcript de YouTube + marca <code className="bg-pink-100 text-pink-700 px-1 rounded font-mono">{`{{blank}}`}</code>. Genera el deck CLT automáticamente.</p>
                  </div>
                  <span className="text-pink-500 group-hover:translate-x-0.5 transition-transform">→</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">o busca en iTunes</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search song or artist… (e.g. Shape of You Ed Sheeran)"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E0D5FF] focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-[#FAFAFA]"
                  />
                  {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">Searching…</span>}
                </div>

                {results.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {results.map(song => (
                      <button
                        key={song.trackId}
                        onClick={() => handleSelectSong(song)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#F0E5FF] hover:border-[#C8A8DC] hover:bg-[#F9F5FF] transition-all text-left group"
                      >
                        {song.albumArt
                          ? <Image src={song.albumArt} alt={song.title} width={80} height={80} className="w-20 h-20 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                          : <div className="w-20 h-20 rounded-lg bg-[#F0E5FF] flex items-center justify-center text-3xl">🎵</div>
                        }
                        <div className="w-full min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{song.title}</p>
                          <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {query && !searching && results.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-6">No results. Try a different search.</p>
                )}
              </div>
            )}

            {/* ── Step 2: Lyrics & settings ───────────────────── */}
            {step === 2 && selected && (
              <div className="space-y-5">
                {/* Selected song header */}
                <div className="flex items-center gap-4 bg-[#F9F5FF] rounded-xl p-4">
                  {selected.albumArt && (
                    <Image src={selected.albumArt} alt={selected.title} width={56} height={56} className="w-14 h-14 rounded-lg shadow-sm" />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-[#5A3D7A]">{selected.title}</p>
                    <p className="text-sm text-gray-500">{selected.artist} · {selected.album}</p>
                  </div>
                  <button onClick={() => setStep(1)} className="ml-auto text-xs text-gray-400 hover:text-[#5A3D7A] underline">Change</button>
                </div>

                {/* Lyrics area */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Lyrics {fetchingLyrics && <span className="font-normal text-gray-400 animate-pulse">fetching…</span>}
                    {lyricsError && <span className="font-normal text-amber-500 ml-1">{lyricsError}</span>}
                  </label>
                  <textarea
                    value={lyrics}
                    onChange={e => setLyrics(e.target.value)}
                    rows={10}
                    placeholder="Lyrics will appear here automatically, or paste them manually…"
                    className="w-full p-3 rounded-xl border border-[#E0D5FF] focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm font-mono bg-[#FAFAFA] resize-none"
                  />
                </div>

                {/* YouTube URL */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">YouTube URL <span className="font-normal text-gray-400">(optional — embeds the music video)</span></label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E0D5FF] focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-[#FAFAFA]"
                  />
                </div>

                {/* Level */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Student Level</label>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                          ${level === l ? 'bg-[#5A3D7A] text-white border-[#5A3D7A]' : 'border-[#E0D5FF] text-gray-600 hover:border-[#C8A8DC]'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !lyrics.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] hover:opacity-90 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><span className="animate-spin inline-block">⚙️</span> Generando lección…</>
                  ) : (
                    <><span>🤖</span> Generar lección con IA</>
                  )}
                </button>

                {generateError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <span>{generateError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Preview & save ──────────────────────── */}
            {step === 3 && selected && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-[#F9F5FF] rounded-xl p-4">
                  {selected.albumArt && (
                    <Image src={selected.albumArt} alt={selected.title} width={48} height={48} className="w-12 h-12 rounded-lg shadow-sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#5A3D7A]">{selected.title} <span className="text-gray-400 font-normal">by</span> {selected.artist}</p>
                    <p className="text-xs text-gray-400">{slides.length} slides generated · Level {level}</p>
                  </div>
                </div>

                {/* Slide preview list */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {slides.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#F9F5FF] border border-[#F0E5FF]">
                      <span className="text-base">{slideIcon(s.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 truncate">{s.title ?? s.type}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{s.type.replace('_', ' ')} · {s.phase}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[#E0D5FF] text-gray-600 hover:bg-[#F9F5FF]"
                  >
                    Back & regenerate
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : '💾 Guardar en biblioteca'}
                  </button>
                </div>

                {saveError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <span>{saveError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Library ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-[#5A3D7A] mb-3">Biblioteca Friendlyrics® compartida</h2>
          {loadingLib ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🎵</p>
              <p className="text-sm">No music lessons yet. Search a song above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map(lesson => (
                <MusicLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isOwner={lesson.teacherId === uid}
                  onAssign={() => setAssignTarget(lesson)}
                  onEdit={() => { setEditTarget(lesson); setManualEditorOpen(true); }}
                  onDelete={() => deleteMusicLesson(lesson.id!)}
                  onTogglePublish={() => publishMusicLesson(lesson.id!, lesson.publishStatus !== 'published')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {assignTarget && (
        <AssignModal
          lesson={assignTarget}
          students={activeStudents}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {manualEditorOpen && (
        <TranscriptClipEditor
          mode="song"
          teacherId={uid}
          initial={editTarget ?? undefined}
          onClose={() => { setManualEditorOpen(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

function MusicLessonCard({
  lesson,
  isOwner,
  onAssign,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  lesson: MusicLesson;
  isOwner: boolean;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const published = lesson.publishStatus === 'published';

  return (
    <div className="bg-white rounded-2xl border border-[#F0E5FF] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-4">
        {lesson.song.albumArt
          ? <Image src={lesson.song.albumArt} alt={lesson.song.title} width={56} height={56} className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0" />
          : <div className="w-14 h-14 rounded-xl bg-[#F0E5FF] flex items-center justify-center text-2xl flex-shrink-0">🎵</div>
        }
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 truncate text-sm">{lesson.song.title}</p>
          <p className="text-xs text-gray-400 truncate">{lesson.song.artist}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">{lesson.level}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {published ? 'Published' : 'Draft'}
            </span>
            {!isOwner && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                🤝 Compartida
              </span>
            )}
            <span className="text-[10px] text-gray-400">{lesson.slides.length} slides</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[#F0E5FF] px-4 py-2.5 flex gap-2">
        <Link
          href={`/dashboard/student/music/${lesson.id}`}
          className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E8DAFF] transition-colors text-center"
        >
          ▶ Abrir
        </Link>
        {isOwner && (
          <button
            onClick={onEdit}
            className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 transition-colors"
            title="Editar transcript + blanks"
          >
            ✏️ Editar
          </button>
        )}
        {isOwner && (
          <button
            onClick={onTogglePublish}
            className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-[#E0D5FF] text-gray-600 hover:bg-[#F9F5FF] transition-colors"
          >
            {published ? '📤 Quitar' : '✅ Publicar'}
          </button>
        )}
        <button
          onClick={onAssign}
          className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] transition-colors"
        >
          👥 Asignar
        </button>
        {isOwner && (confirmDelete ? (
          <button
            onClick={onDelete}
            className="text-xs font-semibold py-1.5 px-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs py-1.5 px-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            🗑️
          </button>
        ))}
      </div>
    </div>
  );
}

function slideIcon(type: string): string {
  const map: Record<string, string> = {
    lyrics: '🎵', vocabulary: '📖', cloze_test: '✏️',
    multiple_choice: '🔘', speaking: '🗣️', listening: '🎧',
    cover: '🖼️', free_text: '📝',
    song_cover: '🎵', vocab_match: '🔤', predictions: '🔮',
    lyrics_game: '🎮', listening_quiz: '🎧', language_focus: '🔬',
    language_practice: '✏️', translation_game: '🌐',
    wrapup: '💬', friendlyrics_end: '🏆',
  };
  return map[type] ?? '📄';
}
