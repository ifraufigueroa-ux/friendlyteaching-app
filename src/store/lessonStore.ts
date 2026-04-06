// FriendlyTeaching.cl — Lesson Editor Store (Zustand)
import { create } from 'zustand';
import type { Lesson, Slide, SlideType, SlidePhase } from '@/types/firebase';

function newSlide(type: SlideType): Slide {
  const base: Slide = { type, phase: 'while', title: 'Nueva slide' };
  switch (type) {
    case 'cover':       return { ...base, phase: 'pre', title: 'Título de la lección', subtitle: 'Subtítulo opcional' };
    case 'vocabulary':  return { ...base, phase: 'pre', words: [{ word: '', translation: '' }] };
    case 'multiple_choice': return { ...base, question: '', options: [
      { id: '0', text: '', isCorrect: true },
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
    ]};
    case 'true_false':  return { ...base, question: '', correctAnswer: 'true' };
    case 'matching':    return { ...base, pairs: [{ left: '', right: '' }] };
    case 'drag_drop':   return { ...base, question: '', blanks: [''], correctAnswer: '' };
    case 'grammar_table': return { ...base, tableHeaders: ['', ''], tableRows: [{ col1: '', col2: '' }] };
    case 'listening':   return { ...base, dialogLines: [{ speaker: 'A', text: '' }] };
    case 'writing_prompt': return { ...base, phase: 'post', prompt: '' };
    case 'speaking':    return { ...base, phase: 'post', prompt: '' };
    case 'selection':   return { ...base, options: [{ id: '0', text: '', isCorrect: true }, { id: '1', text: '', isCorrect: false }] };
    default:            return base;
  }
}

interface LessonState {
  lesson: Lesson | null;
  currentSlideIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;

  setLesson: (lesson: Lesson) => void;
  setCurrentSlide: (index: number) => void;
  updateSlide: (index: number, patch: Partial<Slide>) => void;
  addSlide: (type: SlideType, afterIndex?: number) => void;
  removeSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  duplicateSlide: (index: number) => void;
  setIsSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  markSaved: () => void;
  updateLessonMeta: (patch: Partial<Pick<Lesson, 'title' | 'duration' | 'isPublished' | 'objectives' | 'canvaMode' | 'canvaEmbed' | 'presentationUrl'>>) => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  lesson: null,
  currentSlideIndex: 0,
  isDirty: false,
  isSaving: false,
  error: null,

  setLesson: (lesson) => set({ lesson, currentSlideIndex: 0, isDirty: false }),

  setCurrentSlide: (index) => set({ currentSlideIndex: index }),

  updateSlide: (index, patch) => set((state) => {
    if (!state.lesson) return state;
    const slides = [...state.lesson.slides];
    slides[index] = { ...slides[index], ...patch };
    return { lesson: { ...state.lesson, slides }, isDirty: true };
  }),

  addSlide: (type, afterIndex) => set((state) => {
    if (!state.lesson) return state;
    const slide = newSlide(type);
    const slides = [...state.lesson.slides];
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : slides.length;
    slides.splice(insertAt, 0, slide);
    return { lesson: { ...state.lesson, slides }, currentSlideIndex: insertAt, isDirty: true };
  }),

  removeSlide: (index) => set((state) => {
    if (!state.lesson) return state;
    const slides = state.lesson.slides.filter((_, i) => i !== index);
    const currentSlideIndex = Math.min(state.currentSlideIndex, Math.max(0, slides.length - 1));
    return { lesson: { ...state.lesson, slides }, currentSlideIndex, isDirty: true };
  }),

  moveSlide: (from, to) => set((state) => {
    if (!state.lesson) return state;
    const slides = [...state.lesson.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    return { lesson: { ...state.lesson, slides }, currentSlideIndex: to, isDirty: true };
  }),

  duplicateSlide: (index) => set((state) => {
    if (!state.lesson) return state;
    const slides = [...state.lesson.slides];
    const copy = { ...slides[index], id: undefined };
    slides.splice(index + 1, 0, copy);
    return { lesson: { ...state.lesson, slides }, currentSlideIndex: index + 1, isDirty: true };
  }),

  updateLessonMeta: (patch) => set((state) => {
    if (!state.lesson) return state;
    return { lesson: { ...state.lesson, ...patch }, isDirty: true };
  }),

  setIsSaving: (v) => set({ isSaving: v }),
  setError: (e) => set({ error: e }),
  markSaved: () => set({ isDirty: false }),
}));
