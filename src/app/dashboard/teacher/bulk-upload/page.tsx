// FriendlyTeaching.cl — Bulk Upload de Lecciones (JSON → Firestore)
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import TopBar from '@/components/layout/TopBar';
import type { Lesson, Course, LessonLevel } from '@/types/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadResult {
  code: string;
  title: string;
  status: 'ok' | 'error' | 'skipped';
  message?: string;
}

interface LessonJSON {
  code?: string;
  courseId?: string;
  unit?: number;
  lessonNumber?: number;
  title?: string;
  level?: LessonLevel;
  duration?: number;
  objectives?: string[];
  isPublished?: boolean;
  slides?: unknown[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidLesson(obj: unknown): obj is LessonJSON {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.code === 'string' && typeof o.title === 'string' && Array.isArray(o.slides);
}

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

// ─── Sample JSON ──────────────────────────────────────────────────────────────

const SAMPLE_JSON = JSON.stringify(
  [
    {
      code: 'U1.L1',
      courseId: 'course_a1',
      unit: 1,
      lessonNumber: 1,
      title: 'Hello & Greetings',
      level: 'A1',
      duration: 45,
      objectives: ['Greet people formally and informally', 'Introduce yourself'],
      isPublished: false,
      slides: [
        { type: 'cover', phase: 'pre', title: 'Hello & Greetings', subtitle: 'Unit 1 · Lesson 1' },
        {
          type: 'vocabulary',
          phase: 'pre',
          title: 'Key vocabulary',
          words: [
            { word: 'Hello', translation: 'Hola', pronunciation: '/həˈloʊ/', example: 'Hello, how are you?' },
            { word: 'Goodbye', translation: 'Adiós', pronunciation: '/ˌɡʊdˈbaɪ/', example: 'Goodbye, see you tomorrow!' },
          ],
        },
        {
          type: 'multiple_choice',
          phase: 'while',
          title: 'Choose the correct greeting',
          question: 'Which phrase is formal?',
          options: [
            { id: '0', text: 'Good morning, sir.', isCorrect: true },
            { id: '1', text: 'Hey!', isCorrect: false },
            { id: '2', text: 'Yo!', isCorrect: false },
          ],
        },
        { type: 'writing_prompt', phase: 'post', title: 'Write your introduction', prompt: 'Write 3 sentences introducing yourself to a new colleague.' },
      ],
    },
  ],
  null,
  2
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<LessonJSON[]>([]);
  const [parseError, setParseError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [done, setDone] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'student') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  // Fetch courses for reference
  useEffect(() => {
    getDocs(collection(db, 'courses'))
      .then((snap: QuerySnapshot<DocumentData>) => {
        const list: Course[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Course));
        setCourses(list);
      })
      .catch(() => {/* silently ignore */});
  }, []);

  // Parse JSON text
  const handleParse = (text: string) => {
    setJsonText(text);
    setParseError('');
    setParsed([]);
    setResults([]);
    setDone(false);
    if (!text.trim()) return;
    try {
      const raw: unknown = JSON.parse(text);
      const arr = Array.isArray(raw) ? raw : [raw];
      const valid = arr.filter(isValidLesson);
      if (valid.length === 0) {
        setParseError('No se encontraron lecciones válidas. Cada lección debe tener: code, title y slides.');
        return;
      }
      if (valid.length < arr.length) {
        setParseError(`⚠️ ${arr.length - valid.length} ítem(s) ignorados por falta de code, title o slides.`);
      }
      setParsed(valid);
    } catch (e) {
      setParseError(`JSON inválido: ${(e as Error).message}`);
    }
  };

  // File drop / select
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => handleParse(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Upload to Firestore
  const handleUpload = async () => {
    if (!parsed.length || uploading) return;
    setUploading(true);
    setDone(false);
    const res: UploadResult[] = [];

    // Check for existing lesson codes (Firestore 'in' max 10 items — chunk by 10)
    const existingCodes = new Set<string>();
    if (!overwrite) {
      try {
        const codes = parsed.map((l) => l.code).filter(Boolean) as string[];
        for (let i = 0; i < codes.length; i += 10) {
          const chunk = codes.slice(i, i + 10);
          const snap = await getDocs(query(collection(db, 'lessons'), where('code', 'in', chunk)));
          snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
            const data = d.data();
            if (typeof data.code === 'string') existingCodes.add(data.code);
          });
        }
      } catch {
        /* ignore check errors */
      }
    }

    for (const lesson of parsed) {
      const code = lesson.code ?? 'unknown';
      const title = lesson.title ?? 'Sin título';
      try {
        if (!overwrite && existingCodes.has(code)) {
          res.push({ code, title, status: 'skipped', message: 'Ya existe (usa "Sobrescribir" para reemplazar)' });
          continue;
        }
        const docRef = doc(collection(db, 'lessons'));
        const lessonData: Omit<Lesson, 'id'> = {
          code,
          courseId: lesson.courseId ?? 'uncategorized',
          unit: lesson.unit ?? 1,
          lessonNumber: lesson.lessonNumber ?? 1,
          title,
          level: LEVELS.includes(lesson.level as LessonLevel) ? (lesson.level as LessonLevel) : 'A1',
          duration: lesson.duration,
          objectives: lesson.objectives ?? [],
          isPublished: lesson.isPublished ?? false,
          slides: (lesson.slides ?? []) as Lesson['slides'],
          slidesJson: JSON.stringify(lesson.slides ?? []),
          createdAt: serverTimestamp() as Lesson['createdAt'],
          updatedAt: serverTimestamp() as Lesson['updatedAt'],
          lastEditedBy: firebaseUser?.uid ?? '',
          teacherId: firebaseUser?.uid ?? '',  // ← required for useLessons('teacher') filter
          version: 1,
        };
        await setDoc(docRef, lessonData);
        res.push({ code, title, status: 'ok' });
      } catch (e) {
        res.push({ code, title, status: 'error', message: (e as Error).message });
      }
    }

    setResults(res);
    setUploading(false);
    setDone(true);
  };

  const okCount = results.filter((r) => r.status === 'ok').length;
  const errCount = results.filter((r) => r.status === 'error').length;
  const skipCount = results.filter((r) => r.status === 'skipped').length;

  return (
    <div className="min-h-screen bg-[#FFFCF7] p-6">
      <TopBar
        title="📥 Carga masiva de lecciones"
        subtitle="Importa lecciones desde un archivo .json directamente a Firestore"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Lecciones', href: '/dashboard/teacher/lessons' },
          { label: 'Carga masiva' }
        ]}
      />

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Input */}
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#C8A8DC] rounded-2xl p-6 text-center cursor-pointer hover:bg-[#F9F5FF] transition-colors"
          >
            <p className="text-3xl mb-2">📂</p>
            <p className="text-sm font-semibold text-[#5A3D7A]">Arrastra un archivo .json aquí</p>
            <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* JSON textarea */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
              O pega el JSON directamente
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleParse(e.target.value)}
              rows={10}
              placeholder='[{ "code": "U1.L1", "title": "...", "slides": [...] }]'
              className="w-full text-xs font-mono border border-[#C8A8DC] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
            />
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">{parseError}</p>
            </div>
          )}

          {/* Options */}
          {parsed.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
                ✅ {parsed.length} lección(es) válidas detectadas
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  className="w-4 h-4 accent-[#C8A8DC]"
                />
                <span className="text-sm text-gray-700">Sobrescribir lecciones existentes (mismo código)</span>
              </label>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? '⏳ Subiendo...' : `📤 Subir ${parsed.length} lección(es) a Firestore`}
              </button>
            </div>
          )}

          {/* Sample download */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ejemplo de formato JSON</p>
            <button
              onClick={() => {
                const blob = new Blob([SAMPLE_JSON], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'ejemplo_leccion.json'; a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] underline"
            >
              ⬇ Descargar ejemplo (ejemplo_leccion.json)
            </button>
          </div>
        </div>

        {/* RIGHT: Preview + Results */}
        <div className="space-y-4">
          {/* Courses reference */}
          {courses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-2">IDs de cursos disponibles</p>
              <div className="space-y-1">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-500">{c.id}</span>
                    <span className="text-gray-700 font-medium">{c.title} ({c.level})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview parsed */}
          {parsed.length > 0 && !done && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Vista previa</p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {parsed.map((l, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#F9F5FF]">
                    <span className="text-xs font-mono text-[#9B7CB8] flex-shrink-0 mt-0.5">{l.code}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#5A3D7A] truncate">{l.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {l.level} · {l.slides?.length ?? 0} slides · {l.duration ?? '?'} min
                      </p>
                    </div>
                    <span className="text-[10px] bg-white rounded-full px-2 py-0.5 text-gray-400 border border-gray-100 flex-shrink-0">
                      {l.isPublished ? '✓ pub' : 'draft'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {done && results.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">Resultado</p>
                <div className="flex gap-2 text-xs">
                  {okCount > 0 && <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">✓ {okCount} ok</span>}
                  {errCount > 0 && <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">✗ {errCount} error</span>}
                  {skipCount > 0 && <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">⊘ {skipCount} omitidas</span>}
                </div>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                      r.status === 'ok' ? 'bg-green-50' :
                      r.status === 'error' ? 'bg-red-50' : 'bg-amber-50'
                    }`}
                  >
                    <span className="flex-shrink-0 font-bold">
                      {r.status === 'ok' ? '✓' : r.status === 'error' ? '✗' : '⊘'}
                    </span>
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-gray-500">{r.code}</span>
                      {' '}
                      <span className="font-semibold text-gray-700">{r.title}</span>
                      {r.message && <p className="text-[10px] text-gray-500 mt-0.5">{r.message}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {okCount > 0 && (
                <Link
                  href="/dashboard/teacher/lessons"
                  className="mt-3 block text-center text-xs font-bold text-[#9B7CB8] hover:text-[#5A3D7A] underline"
                >
                  Ver lecciones importadas →
                </Link>
              )}
            </div>
          )}

          {/* Format reference */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Campos requeridos</p>
            <div className="text-[10px] font-mono space-y-0.5 text-gray-600">
              <p><span className="text-[#C8A8DC] font-bold">code</span> — Código único (ej: U1.L1)</p>
              <p><span className="text-[#C8A8DC] font-bold">title</span> — Título de la lección</p>
              <p><span className="text-[#C8A8DC] font-bold">slides</span> — Array de slides</p>
              <p className="mt-1 text-gray-400">Opcionales: courseId, unit, lessonNumber, level, duration, objectives, isPublished</p>
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-3 mb-1">Tipos de slide</p>
            <div className="text-[10px] font-mono text-gray-500 flex flex-wrap gap-1">
              {['cover','free_text','vocabulary','multiple_choice','grammar_table','selection','listening','true_false','matching','drag_drop','writing_prompt','speaking','image_label'].map(t => (
                <span key={t} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
