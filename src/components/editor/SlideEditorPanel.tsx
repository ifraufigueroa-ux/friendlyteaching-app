// FriendlyTeaching.cl — SlideEditorPanel (formulario dinámico por tipo)
'use client';
import { useLessonStore } from '@/store/lessonStore';
import MediaUploader from '@/components/ui/MediaUploader';
import type { Slide, SlidePhase, SlideType, VocabWord, MultipleChoiceOption, GrammarRow, MatchingPair } from '@/types/firebase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white';
const textareaCls = `${inputCls} resize-none`;

// ─── Shared base fields (title, subtitle, phase, teacherNotes) ────────────────

function BaseFields({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Título">
        <input className={inputCls} value={slide.title ?? ''} onChange={e => onChange({ title: e.target.value })} placeholder="Título de la slide" />
      </Field>
      <Field label="Subtítulo (opcional)">
        <input className={inputCls} value={slide.subtitle ?? ''} onChange={e => onChange({ subtitle: e.target.value })} placeholder="Subtítulo" />
      </Field>
      <Field label="Fase">
        <select className={inputCls} value={slide.phase ?? 'while'} onChange={e => onChange({ phase: e.target.value as SlidePhase })}>
          <option value="pre">PRE — Calentamiento</option>
          <option value="while">WHILE — Actividad principal</option>
          <option value="post">POST — Cierre</option>
        </select>
      </Field>
      <Field label="Nota del Profesor (privada)">
        <textarea className={textareaCls} rows={2} value={slide.teacherNotes ?? ''} onChange={e => onChange({ teacherNotes: e.target.value })} placeholder="Solo visible para ti durante la clase" />
      </Field>
    </>
  );
}

// ─── Type-specific field editors ─────────────────────────────────────────────

function CoverEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Imagen de fondo (opcional)">
        <MediaUploader folder="images" currentUrl={slide.imageUrl} onUpload={url => onChange({ imageUrl: url })} />
      </Field>
    </>
  );
}

function FreeTextEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Contenido / Texto principal">
        <textarea className={textareaCls} rows={6} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Texto, instrucciones o preguntas..." />
      </Field>
      <Field label="Imagen (opcional)">
        <MediaUploader folder="images" currentUrl={slide.imageUrl} onUpload={url => onChange({ imageUrl: url })} />
      </Field>
    </>
  );
}

function VocabularyEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const words: VocabWord[] = slide.words ?? [];

  function updateWord(i: number, patch: Partial<VocabWord>) {
    const next = words.map((w, idx) => idx === i ? { ...w, ...patch } : w);
    onChange({ words: next });
  }
  function addWord() { onChange({ words: [...words, { word: '', translation: '' }] }); }
  function removeWord(i: number) { onChange({ words: words.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-3">
      {words.map((w, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400">Palabra {i + 1}</span>
            <button onClick={() => removeWord(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={w.word} onChange={e => updateWord(i, { word: e.target.value })} placeholder="Palabra en inglés" />
            <input className={inputCls} value={w.translation} onChange={e => updateWord(i, { translation: e.target.value })} placeholder="Traducción" />
          </div>
          <input className={inputCls} value={w.pronunciation ?? ''} onChange={e => updateWord(i, { pronunciation: e.target.value })} placeholder="Pronunciación (ej: /həˈloʊ/)" />
          <input className={inputCls} value={w.example ?? ''} onChange={e => updateWord(i, { example: e.target.value })} placeholder="Ejemplo de uso" />
        </div>
      ))}
      <button onClick={addWord} className="w-full py-2 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-sm font-semibold hover:bg-[#F0E5FF] transition-colors">
        + Añadir palabra
      </button>
    </div>
  );
}

function MultipleChoiceEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const options: MultipleChoiceOption[] = slide.options ?? [];

  function updateOption(i: number, patch: Partial<MultipleChoiceOption>) {
    const next = options.map((o, idx) => {
      if (idx === i) return { ...o, ...patch };
      if (patch.isCorrect) return { ...o, isCorrect: false }; // single correct
      return o;
    });
    onChange({ options: next });
  }
  function addOption() { onChange({ options: [...options, { id: String(options.length), text: '', isCorrect: false }] }); }
  function removeOption(i: number) { onChange({ options: options.filter((_, idx) => idx !== i) }); }

  return (
    <>
      <Field label="Pregunta">
        <textarea className={textareaCls} rows={3} value={slide.question ?? ''} onChange={e => onChange({ question: e.target.value })} placeholder="¿Cuál es la respuesta correcta?" />
      </Field>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opciones</label>
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio" name="correct" checked={!!opt.isCorrect}
              onChange={() => updateOption(i, { isCorrect: true })}
              className="accent-[#C8A8DC]" title="Correcta"
            />
            <input className={`${inputCls} flex-1`} value={opt.text} onChange={e => updateOption(i, { text: e.target.value })} placeholder={`Opción ${i + 1}`} />
            <button onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
          </div>
        ))}
        <p className="text-[10px] text-gray-400">El círculo indica la respuesta correcta</p>
        <button onClick={addOption} className="w-full py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
          + Añadir opción
        </button>
      </div>
    </>
  );
}

function TrueFalseEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Afirmación">
        <textarea className={textareaCls} rows={3} value={slide.question ?? ''} onChange={e => onChange({ question: e.target.value })} placeholder="Escribe una afirmación verdadera o falsa..." />
      </Field>
      <Field label="Respuesta correcta">
        <select className={inputCls} value={slide.correctAnswer ?? 'true'} onChange={e => onChange({ correctAnswer: e.target.value })}>
          <option value="true">✅ True (Verdadero)</option>
          <option value="false">❌ False (Falso)</option>
        </select>
      </Field>
    </>
  );
}

function GrammarTableEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const headers = slide.tableHeaders ?? ['', ''];
  const rows: GrammarRow[] = slide.tableRows ?? [{ col1: '', col2: '' }];
  const cols = headers.length;

  function updateHeader(i: number, val: string) {
    const next = [...headers]; next[i] = val; onChange({ tableHeaders: next });
  }
  function updateCell(ri: number, col: keyof GrammarRow, val: string) {
    const next = rows.map((r, idx) => idx === ri ? { ...r, [col]: val } : r);
    onChange({ tableRows: next });
  }
  function addRow() { onChange({ tableRows: [...rows, { col1: '', col2: '', col3: '', col4: '' }] }); }
  function removeRow(i: number) { onChange({ tableRows: rows.filter((_, idx) => idx !== i) }); }
  function setColumns(n: number) {
    const h = Array.from({ length: n }, (_, i) => headers[i] ?? '');
    onChange({ tableHeaders: h });
  }

  const colKeys: (keyof GrammarRow)[] = ['col1', 'col2', 'col3', 'col4'];

  return (
    <>
      <Field label="Contenido / Descripción">
        <textarea className={textareaCls} rows={2} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Descripción opcional de la tabla..." />
      </Field>
      <Field label="Número de columnas">
        <select className={inputCls} value={cols} onChange={e => setColumns(Number(e.target.value))}>
          <option value={2}>2 columnas</option>
          <option value={3}>3 columnas</option>
          <option value={4}>4 columnas</option>
        </select>
      </Field>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="bg-[#F0E5FF] p-1.5">
                  <input className="w-full bg-transparent font-bold text-[#5A3D7A] text-center focus:outline-none placeholder-[#C8A8DC]"
                    value={h} onChange={e => updateHeader(i, e.target.value)} placeholder={`Col ${i + 1}`} />
                </th>
              ))}
              <th className="w-6 bg-[#F0E5FF]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {colKeys.slice(0, cols).map(ck => (
                  <td key={ck} className="p-1">
                    <input className="w-full bg-transparent focus:outline-none px-1 text-gray-700"
                      value={row[ck] ?? ''} onChange={e => updateCell(ri, ck, e.target.value)} placeholder="..." />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="w-full mt-2 py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
        + Añadir fila
      </button>
    </>
  );
}

function MatchingEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const pairs: MatchingPair[] = slide.pairs ?? [];

  function updatePair(i: number, patch: Partial<MatchingPair>) {
    onChange({ pairs: pairs.map((p, idx) => idx === i ? { ...p, ...patch } : p) });
  }
  function addPair() { onChange({ pairs: [...pairs, { left: '', right: '' }] }); }
  function removePair(i: number) { onChange({ pairs: pairs.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <input className={`${inputCls} flex-1`} value={pair.left} onChange={e => updatePair(i, { left: e.target.value })} placeholder="Izquierda" />
          <span className="text-gray-300 font-bold">↔</span>
          <input className={`${inputCls} flex-1`} value={pair.right} onChange={e => updatePair(i, { right: e.target.value })} placeholder="Derecha" />
          <button onClick={() => removePair(i)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={addPair} className="w-full py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
        + Añadir par
      </button>
    </div>
  );
}

function DragDropEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const blanks = slide.blanks ?? [];

  function updateWord(i: number, val: string) {
    const next = [...blanks]; next[i] = val; onChange({ blanks: next });
  }
  function addWord() { onChange({ blanks: [...blanks, ''] }); }
  function removeWord(i: number) { onChange({ blanks: blanks.filter((_, idx) => idx !== i) }); }

  return (
    <>
      <Field label="Instrucción / Contexto">
        <input className={inputCls} value={slide.question ?? ''} onChange={e => onChange({ question: e.target.value })} placeholder="Ej: Ordena las palabras para formar una oración" />
      </Field>
      <Field label="Respuesta correcta (palabras en orden)">
        <input className={inputCls} value={slide.correctAnswer ?? ''} onChange={e => onChange({ correctAnswer: e.target.value })} placeholder="Ej: I am a student" />
      </Field>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Palabras disponibles (se mezclarán)</label>
        {blanks.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={`${inputCls} flex-1`} value={w} onChange={e => updateWord(i, e.target.value)} placeholder={`Palabra ${i + 1}`} />
            <button onClick={() => removeWord(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
        <button onClick={addWord} className="w-full py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
          + Añadir palabra
        </button>
      </div>
    </>
  );
}

function ListeningEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const lines = slide.dialogLines ?? [];

  function updateLine(i: number, patch: Partial<{ speaker: string; text: string }>) {
    onChange({ dialogLines: lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) });
  }
  function addLine() { onChange({ dialogLines: [...lines, { speaker: lines.length % 2 === 0 ? 'A' : 'B', text: '' }] }); }
  function removeLine(i: number) { onChange({ dialogLines: lines.filter((_, idx) => idx !== i) }); }

  return (
    <>
      <Field label="Descripción / Instrucciones">
        <textarea className={textareaCls} rows={2} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Instrucciones para el estudiante..." />
      </Field>
      <Field label="Audio (opcional)">
        <MediaUploader folder="audio" currentUrl={slide.audioUrl} onUpload={url => onChange({ audioUrl: url })} />
      </Field>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diálogo</label>
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={line.speaker}
              onChange={e => updateLine(i, { speaker: e.target.value })}
              className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            >
              {['A','B','C','D','Teacher','Student'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className={`${inputCls} flex-1`} value={line.text} onChange={e => updateLine(i, { text: e.target.value })} placeholder="Línea del diálogo..." />
            <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">✕</button>
          </div>
        ))}
        <button onClick={addLine} className="w-full py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
          + Añadir línea
        </button>
      </div>
      <Field label="Pregunta de comprensión (opcional)">
        <input className={inputCls} value={slide.question ?? ''} onChange={e => onChange({ question: e.target.value })} placeholder="¿Qué dice A al final?" />
      </Field>
    </>
  );
}

function WritingPromptEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Prompt / Consigna">
        <textarea className={textareaCls} rows={3} value={slide.prompt ?? ''} onChange={e => onChange({ prompt: e.target.value })} placeholder="Ej: Write about your daily routine using Present Simple..." />
      </Field>
      <Field label="Instrucciones adicionales">
        <textarea className={textareaCls} rows={2} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Mínimo 80 palabras, usa conectores..." />
      </Field>
    </>
  );
}

function SpeakingEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  const prompts = slide.prompt?.split('|').map(p => p.trim()).filter(Boolean) ?? [];

  function setPrompts(arr: string[]) { onChange({ prompt: arr.join(' | ') }); }

  return (
    <>
      <Field label="Instrucción principal">
        <textarea className={textareaCls} rows={2} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Ej: Talk about your weekend with your partner." />
      </Field>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preguntas / Temas (opcionales)</label>
        {prompts.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={`${inputCls} flex-1`} value={p}
              onChange={e => setPrompts(prompts.map((x, idx) => idx === i ? e.target.value : x))}
              placeholder={`Pregunta ${i + 1}`} />
            <button onClick={() => setPrompts(prompts.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
        <button onClick={() => setPrompts([...prompts, ''])} className="w-full py-1.5 border-2 border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-xs font-semibold hover:bg-[#F0E5FF] transition-colors">
          + Añadir pregunta
        </button>
      </div>
    </>
  );
}

function SelectionEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Contexto / Instrucción">
        <textarea className={textareaCls} rows={2} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Ej: Choose the correct option for each sentence." />
      </Field>
      <MultipleChoiceEditor slide={slide} onChange={onChange} />
    </>
  );
}

function ImageLabelEditor({ slide, onChange }: { slide: Slide; onChange: (p: Partial<Slide>) => void }) {
  return (
    <>
      <Field label="Imagen">
        <MediaUploader folder="images" currentUrl={slide.imageUrl} onUpload={url => onChange({ imageUrl: url })} />
      </Field>
      <Field label="Descripción / Contenido">
        <textarea className={textareaCls} rows={4} value={slide.content ?? ''} onChange={e => onChange({ content: e.target.value })} placeholder="Describe la imagen o añade etiquetas con formato:\n1. Label → Descripción\n2. Label → Descripción" />
      </Field>
    </>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<SlideType, string> = {
  cover: 'Portada', free_text: 'Texto libre', vocabulary: 'Vocabulario',
  multiple_choice: 'Opción múltiple', grammar_table: 'Tabla gramática',
  selection: 'Selección', listening: 'Escuchar', true_false: 'V / F',
  matching: 'Relacionar', drag_drop: 'Ordenar', writing_prompt: 'Escritura',
  speaking: 'Hablar', image_label: 'Imagen',
  video: 'Video', cloze_test: 'Cloze', image_hotspot: 'Hotspot', sorting: 'Clasificar',
};

export default function SlideEditorPanel() {
  const { lesson, currentSlideIndex, updateSlide } = useLessonStore();
  const slides = lesson?.slides ?? [];
  const slide = slides[currentSlideIndex];

  if (!slide) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Selecciona una slide para editar
      </div>
    );
  }

  const onChange = (patch: Partial<Slide>) => updateSlide(currentSlideIndex, patch);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
          Editar — {TYPE_LABEL[slide.type]}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">Slide {currentSlideIndex + 1} de {slides.length}</p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <BaseFields slide={slide} onChange={onChange} />
        <hr className="border-gray-100 my-4" />

        {slide.type === 'cover'            && <CoverEditor slide={slide} onChange={onChange} />}
        {slide.type === 'free_text'        && <FreeTextEditor slide={slide} onChange={onChange} />}
        {slide.type === 'vocabulary'       && <VocabularyEditor slide={slide} onChange={onChange} />}
        {slide.type === 'multiple_choice'  && <MultipleChoiceEditor slide={slide} onChange={onChange} />}
        {slide.type === 'true_false'       && <TrueFalseEditor slide={slide} onChange={onChange} />}
        {slide.type === 'grammar_table'    && <GrammarTableEditor slide={slide} onChange={onChange} />}
        {slide.type === 'matching'         && <MatchingEditor slide={slide} onChange={onChange} />}
        {slide.type === 'drag_drop'        && <DragDropEditor slide={slide} onChange={onChange} />}
        {slide.type === 'listening'        && <ListeningEditor slide={slide} onChange={onChange} />}
        {slide.type === 'writing_prompt'   && <WritingPromptEditor slide={slide} onChange={onChange} />}
        {slide.type === 'speaking'         && <SpeakingEditor slide={slide} onChange={onChange} />}
        {slide.type === 'selection'        && <SelectionEditor slide={slide} onChange={onChange} />}
        {slide.type === 'image_label'      && <ImageLabelEditor slide={slide} onChange={onChange} />}
      </div>
    </div>
  );
}
