// FriendlyTeaching.cl — Printable TOEFL Writing feedback
//
// Opens in a new tab from the teacher's session review modal. Lays out
// the full Writing submission for A4 printing / "Save as PDF" in Chrome:
// received email + student reply + ideal answer, AD prompt + student
// response + ideal answer, each with AI feedback, strengths, areas to
// improve and the rubric breakdown.
//
// Auto-triggers the browser print dialog on mount. The sidebar + chrome
// are hidden via @media print so the printout is clean.

'use client';

import { use, useEffect, useState } from 'react';
import { doc, getDoc, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getMock } from '@/lib/data/toefl/mock-1';
import { upgradeWritingSubmission } from '@/lib/toefl/gradeWriting';
import type {
  TOEFLSession, TOEFLMock, WritingSectionSubmission,
  EmailSubmission, WritingSubmission, BuildSentenceAnswer,
  TOEFLEmailPrompt, TOEFLWritingPrompt, TOEFLBuildSentenceItem,
} from '@/types/toefl';

export default function WritingPrintPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<TOEFLSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap: DocumentSnapshot = await getDoc(doc(db, 'toeflSessions', sessionId));
        if (cancelled) return;
        if (!snap.exists()) { setError('Sesión no encontrada'); setLoading(false); return; }
        setSession({ id: snap.id, ...snap.data() } as TOEFLSession);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Error cargando sesión');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  // Fire the browser print dialog once everything has rendered and the
  // web fonts are ready. If `document.fonts` isn't available we fall
  // back to a short timeout.
  useEffect(() => {
    if (loading || error || !session) return;
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      window.print();
    };
    if ('fonts' in document) {
      document.fonts.ready.then(() => setTimeout(fire, 300));
    } else {
      setTimeout(fire, 800);
    }
  }, [loading, error, session]);

  return (
    <>
      <PrintStyles />
      {loading && <CenteredMsg>Cargando feedback…</CenteredMsg>}
      {error && <CenteredMsg>{error}</CenteredMsg>}
      {session && <PrintReport session={session} />}
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────

function PrintReport({ session }: { session: TOEFLSession }) {
  const mock = getMock(session.mockId) ?? null;
  const submission = upgradeWritingSubmission(session.results?.writing?.submission);
  const writingScore = session.results?.writing?.score.score;
  const completedAt = session.completedAt?.toDate?.() ?? session.createdAt?.toDate?.() ?? new Date();

  return (
    <div className="writing-print">
      {/* Floating "Imprimir / Guardar como PDF" button, hidden when
          actually printing. */}
      <div className="no-print flex items-center justify-between gap-3 px-6 py-4 bg-[#2D1B4E] text-white sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/90">
            Vista para imprimir
          </p>
          <p className="text-sm text-white/80 mt-0.5">
            Usa <strong>Ctrl/Cmd + P</strong> o el botón de la derecha para
            guardar como PDF.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-full text-sm font-black uppercase tracking-wider bg-amber-300 text-[#2D1B4E] hover:bg-amber-200 active:scale-95 transition-all shadow-lg"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      <article className="page">
        <ReportHeader
          studentName={session.studentName ?? 'Estudiante'}
          studentEmail={session.studentEmail ?? ''}
          mock={mock}
          completedAt={completedAt}
          writingScore={writingScore}
        />

        {!submission || !mock ? (
          <p className="text-sm text-gray-600">Sin submission disponible para esta sesión.</p>
        ) : (
          <>
            <BuildSentenceSection
              answers={submission.buildSentence}
              items={mock.writing.buildSentence}
            />
            <EmailSection
              submission={submission.email}
              prompt={mock.writing.email}
            />
            <DiscussionSection
              submission={submission.discussion}
              prompt={mock.writing.discussion}
            />
          </>
        )}

        <footer className="mt-10 pt-4 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
          <span>FriendlyTeaching.cl · Reporte generado {new Date().toLocaleDateString('es-CL')}</span>
          <span>Writing Feedback · {session.id}</span>
        </footer>
      </article>
    </div>
  );
}

function ReportHeader({
  studentName, studentEmail, mock, completedAt, writingScore,
}: {
  studentName:  string;
  studentEmail: string;
  mock:         TOEFLMock | null;
  completedAt:  Date;
  writingScore: number | undefined;
}) {
  return (
    <header className="border-b-2 border-[#2D1B4E] pb-4 mb-6 flex items-end justify-between gap-6">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]">
          FriendlyTeaching.cl · TOEFL Writing
        </p>
        <h1 className="font-serif text-3xl font-bold text-[#2D1B4E] leading-tight mt-1">
          Writing feedback — {studentName}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {studentEmail && <>{studentEmail} · </>}
          {mock?.title ?? 'TOEFL Mock'} ·{' '}
          {completedAt.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      {writingScore != null && (
        <div className="text-right flex-shrink-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Writing</p>
          <p className="font-serif text-4xl font-black text-[#2D1B4E] tabular-nums leading-none">
            {writingScore.toFixed(1)}<span className="text-xl text-[#5A3D7A]/60">/30</span>
          </p>
        </div>
      )}
    </header>
  );
}

// ─── Task 1 · Build a Sentence ────────────────────────────────

function BuildSentenceSection({
  answers, items,
}: {
  answers: BuildSentenceAnswer[];
  items:   TOEFLBuildSentenceItem[];
}) {
  const total   = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const itemById = new Map(items.map(it => [it.id, it]));

  return (
    <section className="mb-8 break-inside-avoid">
      <SectionTitle eyebrow="Task 1" title={`Build a Sentence · ${correct} / ${total}`} />
      <ol className="mt-3 space-y-3 list-none">
        {answers.map((a, i) => {
          const item = itemById.get(a.itemId);
          return (
            <li key={a.itemId} className="border border-gray-200 rounded-lg p-3 break-inside-avoid">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-1">
                {`${i + 1}. ${a.correct ? '✓ Correcto' : '✗ Incorrecto'}`}
              </p>
              {item?.prompt && (
                <p className="text-[12px] text-gray-700 mb-1 italic">{item.prompt}</p>
              )}
              {item?.chips && (
                <p className="text-[12px] text-gray-600 mb-1">
                  Palabras: <span className="font-semibold text-[#2D1B4E]">{item.chips.join(' · ')}</span>
                </p>
              )}
              <p className="text-[13px] mb-1">
                <strong>Respuesta de la estudiante:</strong>{' '}
                <span className={a.correct ? 'text-emerald-800' : 'text-rose-700 line-through decoration-rose-300'}>
                  {a.answer || <em className="not-italic text-gray-400">(sin respuesta)</em>}
                </span>
              </p>
              {item?.correct && (
                <p className="text-[13px] text-gray-700">
                  <strong>Respuesta ideal:</strong> <span className="text-emerald-800">{item.correct}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Task 2 · Email ──────────────────────────────────────────

function EmailSection({
  submission, prompt,
}: {
  submission: EmailSubmission;
  prompt:     TOEFLEmailPrompt;
}) {
  return (
    <section className="mb-8">
      <SectionTitle eyebrow="Task 2" title="Write an Email" />

      {/* Scenario + received email */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 break-inside-avoid">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-800 mb-1">
          Escenario
        </p>
        <p className="text-[13px] text-gray-800 mb-3 leading-relaxed">{prompt.scenario}</p>

        <p className="text-[11px] font-black uppercase tracking-widest text-amber-800 mb-1">
          Email recibido
        </p>
        <div className="bg-white border border-amber-200 rounded-lg p-3 text-[12px] text-gray-800 leading-relaxed">
          <p className="mb-1"><strong>De:</strong> {prompt.receivedEmail.from}</p>
          <p className="mb-2"><strong>Asunto:</strong> {prompt.receivedEmail.subject}</p>
          <p className="whitespace-pre-wrap">{prompt.receivedEmail.body}</p>
        </div>

        <p className="text-[11px] font-black uppercase tracking-widest text-amber-800 mt-3 mb-1">
          Instrucciones · {prompt.minWords}+ palabras · {prompt.timerMin} min
        </p>
        <ul className="list-disc pl-5 text-[12px] text-gray-800 space-y-0.5">
          {prompt.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>

      <AnswerPair
        studentHeading={`Respuesta de la estudiante · ${submission.wordCount} palabras${submission.aiScore != null ? ` · ${submission.aiScore}/5` : ''}`}
        studentText={submission.text}
        idealHeading={prompt.sampleAnswer ? `Respuesta ideal · ${prompt.sampleAnswer.scoreOn5}/5` : 'Respuesta ideal'}
        idealText={prompt.sampleAnswer?.text ?? '(No hay respuesta modelo cargada para esta tarea.)'}
      />

      <FeedbackBlock
        feedback={submission.aiFeedback}
        strengths={submission.aiStrengths}
        improvements={submission.aiImprovements}
        rubric={submission.aiRubric
          ? [
              { label: 'Task response', value: submission.aiRubric.taskResponse },
              { label: 'Organisation',  value: submission.aiRubric.organisation },
              { label: 'Language use',  value: submission.aiRubric.languageUse },
            ]
          : []}
        whyIdealWorks={prompt.sampleAnswer?.whyItWorks ?? []}
      />
    </section>
  );
}

// ─── Task 3 · Academic Discussion ────────────────────────────

function DiscussionSection({
  submission, prompt,
}: {
  submission: WritingSubmission;
  prompt:     TOEFLWritingPrompt;
}) {
  return (
    <section className="mb-8">
      <SectionTitle eyebrow="Task 3" title="Academic Discussion" />

      {/* Prompt */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4 break-inside-avoid">
        <p className="text-[11px] font-black uppercase tracking-widest text-violet-800 mb-1">
          Instrucciones del profesor
        </p>
        <p className="text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">
          {prompt.professorPost}
        </p>

        <p className="text-[11px] font-black uppercase tracking-widest text-violet-800 mb-1">
          Pregunta
        </p>
        <p className="text-[13px] text-gray-800 leading-relaxed mb-3">{prompt.question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white border border-violet-200 rounded-lg p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-violet-800 mb-1">
              {prompt.studentA.name}
            </p>
            <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
              {prompt.studentA.text}
            </p>
          </div>
          <div className="bg-white border border-violet-200 rounded-lg p-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-violet-800 mb-1">
              {prompt.studentB.name}
            </p>
            <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
              {prompt.studentB.text}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-violet-800 mt-2">
          {prompt.minWords}+ palabras · {prompt.timerMin} min
        </p>
      </div>

      <AnswerPair
        studentHeading={`Respuesta de la estudiante · ${submission.wordCount} palabras${submission.aiScore != null ? ` · ${submission.aiScore}/5` : ''}`}
        studentText={submission.text}
        idealHeading={prompt.sampleAnswer ? `Respuesta ideal · ${prompt.sampleAnswer.scoreOn5}/5` : 'Respuesta ideal'}
        idealText={prompt.sampleAnswer?.text ?? '(No hay respuesta modelo cargada para esta tarea.)'}
      />

      <FeedbackBlock
        feedback={submission.aiFeedback}
        strengths={submission.aiStrengths}
        improvements={submission.aiImprovements}
        rubric={submission.aiRubric
          ? [
              { label: 'Development',  value: submission.aiRubric.development },
              { label: 'Organisation', value: submission.aiRubric.organisation },
              { label: 'Language use', value: submission.aiRubric.languageUse },
            ]
          : []}
        whyIdealWorks={prompt.sampleAnswer?.whyItWorks ?? []}
      />
    </section>
  );
}

// ─── Shared pieces ───────────────────────────────────────────

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9B7CB8]">{eyebrow}</p>
      <h2 className="font-serif text-xl font-bold text-[#2D1B4E] leading-tight mt-0.5">{title}</h2>
    </div>
  );
}

function AnswerPair({
  studentHeading, studentText, idealHeading, idealText,
}: {
  studentHeading: string;
  studentText:    string;
  idealHeading:   string;
  idealText:      string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 break-inside-avoid">
        <p className="text-[11px] font-black uppercase tracking-widest text-rose-800 mb-2">
          {studentHeading}
        </p>
        <p className="text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {studentText || <em className="not-italic text-gray-400">(sin respuesta)</em>}
        </p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 break-inside-avoid">
        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-800 mb-2">
          {idealHeading}
        </p>
        <p className="text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
          {idealText}
        </p>
      </div>
    </div>
  );
}

function FeedbackBlock({
  feedback, strengths, improvements, rubric, whyIdealWorks,
}: {
  feedback:      string | undefined;
  strengths:     string[] | undefined;
  improvements:  string[] | undefined;
  rubric:        { label: string; value: number | undefined }[];
  whyIdealWorks: string[];
}) {
  return (
    <div className="bg-[#FAF5FF] border border-[#E8D5F0] rounded-xl p-4 space-y-3 break-inside-avoid">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
          Feedback AI
        </p>
        <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
          {feedback ?? <em className="not-italic text-gray-500">(sin feedback)</em>}
        </p>
      </div>

      {rubric.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
            Rúbrica
          </p>
          <div className="grid grid-cols-3 gap-2">
            {rubric.map(r => (
              <div key={r.label} className="bg-white border border-[#E8D5F0] rounded-lg p-2 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#9B7CB8]">{r.label}</p>
                <p className="font-serif text-xl font-bold text-[#2D1B4E] tabular-nums leading-none mt-0.5">
                  {r.value ?? '—'}<span className="text-[11px] text-[#5A3D7A]/60">/5</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {strengths && strengths.length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-1">
              Fortalezas
            </p>
            <ul className="list-disc pl-4 text-[12px] text-gray-800 space-y-0.5">
              {strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {improvements && improvements.length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-800 mb-1">
              A mejorar
            </p>
            <ul className="list-disc pl-4 text-[12px] text-gray-800 space-y-0.5">
              {improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {whyIdealWorks.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-1">
            Por qué la respuesta ideal funciona
          </p>
          <ul className="list-disc pl-4 text-[12px] text-gray-800 space-y-0.5">
            {whyIdealWorks.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function CenteredMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}

// ─── Print styles ────────────────────────────────────────────

function PrintStyles() {
  return (
    <style>{`
      /* Hide app chrome (sidebar + mobile overlay) when printing and on
         this page even when viewing on screen. The parent dashboard
         layout tags the sidebar with data-hide-in-fullscreen. */
      [data-hide-in-fullscreen] { display: none !important; }

      .writing-print { background: white; min-height: 100vh; color: #1f2937; }
      .writing-print .page { max-width: 820px; margin: 0 auto; padding: 32px 36px; }

      @media print {
        .no-print { display: none !important; }
        .writing-print { background: white !important; }
        .writing-print .page { max-width: none; padding: 0; margin: 0; }
        @page { size: A4; margin: 14mm 12mm; }
        /* Keep the soft tints in print — most browsers honor
           print-color-adjust when the user ticks "Background graphics". */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        section { page-break-inside: auto; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
      }
    `}</style>
  );
}
