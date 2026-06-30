// FriendlyTeaching.cl — SlideRenderer (dynamic dispatcher)
import type { Slide } from '@/types/firebase';
import CoverSlide from './slides/CoverSlide';
import FreeTextSlide from './slides/FreeTextSlide';
import VocabularySlide from './slides/VocabularySlide';
import MultipleChoiceSlide from './slides/MultipleChoiceSlide';
import GrammarTableSlide from './slides/GrammarTableSlide';
import TrueFalseSlide from './slides/TrueFalseSlide';
import MatchingSlide from './slides/MatchingSlide';
import SelectionSlide from './slides/SelectionSlide';
import ListeningSlide from './slides/ListeningSlide';
import WritingPromptSlide from './slides/WritingPromptSlide';
import SpeakingSlide from './slides/SpeakingSlide';
import DragDropSlide from './slides/DragDropSlide';
import ImageLabelSlide from './slides/ImageLabelSlide';
import VideoSlide from './slides/VideoSlide';
import ClozeSlide from './slides/ClozeSlide';
import ImageHotspotSlide from './slides/ImageHotspotSlide';
import SortingSlide from './slides/SortingSlide';
import PredictionsSlide from './slides/PredictionsSlide';
import LanguageFocusSlide from './slides/LanguageFocusSlide';
import LanguagePracticeSlide from './slides/LanguagePracticeSlide';
import ClipDialogueGameSlide from './slides/ClipDialogueGameSlide';
import ClipComprehensionSlide from './slides/ClipComprehensionSlide';
import ClipVocabMatchSlide from './slides/ClipVocabMatchSlide';
import ClipPredictionsSlide from './slides/ClipPredictionsSlide';
import ClipLanguageFocusSlide from './slides/ClipLanguageFocusSlide';
import ClipControlledPracticeSlide from './slides/ClipControlledPracticeSlide';
import AudioPlayer from './AudioPlayer';

interface Props {
  slide: Slide;
  courseTitle?: string;
  isTeacher?: boolean;
  slideIndex?: number;
  onAnswer?: (slideIndex: number, isCorrect: boolean) => void;
  youtubeUrl?: string;
}

export default function SlideRenderer({ slide, courseTitle, isTeacher, slideIndex, onAnswer, youtubeUrl }: Props) {
  const slideContent = renderSlide(slide, courseTitle, isTeacher, slideIndex, onAnswer, youtubeUrl);

  // Wrap with audio player if the slide has an audioUrl
  if (slide.audioUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">{slideContent}</div>
        <div className="flex-shrink-0 px-4 pb-3 pt-1">
          <AudioPlayer src={slide.audioUrl} label={slide.type === 'listening' ? 'Audio de escucha' : undefined} />
        </div>
      </div>
    );
  }

  return slideContent;
}

function renderSlide(
  slide: Slide,
  courseTitle?: string,
  isTeacher?: boolean,
  slideIndex?: number,
  onAnswer?: (slideIndex: number, isCorrect: boolean) => void,
  youtubeUrl?: string,
) {
  switch (slide.type) {
    case 'cover':
      return <CoverSlide slide={slide} courseTitle={courseTitle} />;
    case 'free_text':
      return <FreeTextSlide slide={slide} isTeacher={isTeacher} />;
    case 'vocabulary':
      return <VocabularySlide slide={slide} />;
    case 'multiple_choice':
      return <MultipleChoiceSlide slide={slide} onAnswer={onAnswer && slideIndex !== undefined ? (ok) => onAnswer(slideIndex, ok) : undefined} />;
    case 'grammar_table':
      return <GrammarTableSlide slide={slide} />;
    case 'true_false':
      return <TrueFalseSlide slide={slide} onAnswer={onAnswer && slideIndex !== undefined ? (ok) => onAnswer(slideIndex, ok) : undefined} />;
    case 'matching':
      return <MatchingSlide slide={slide} />;
    case 'selection':
      return <SelectionSlide slide={slide} />;
    case 'listening':
      return <ListeningSlide slide={slide} />;
    case 'writing_prompt':
      return <WritingPromptSlide slide={slide} />;
    case 'speaking':
      return <SpeakingSlide slide={slide} isTeacher={isTeacher} />;
    case 'drag_drop':
      return <DragDropSlide slide={slide} />;
    case 'image_label':
      return <ImageLabelSlide slide={slide} />;
    case 'video':
      return <VideoSlide slide={slide} />;
    case 'cloze_test':
      return <ClozeSlide slide={slide} />;
    case 'image_hotspot':
      return <ImageHotspotSlide slide={slide} />;
    case 'sorting':
      return <SortingSlide slide={slide} />;
    case 'predictions':
      return <PredictionsSlide slide={slide} />;
    case 'language_focus':
      return <LanguageFocusSlide slide={slide} isTeacher={isTeacher} />;
    case 'language_practice':
      return <LanguagePracticeSlide slide={slide} />;
    case 'clip_dialogue_game':
      return <ClipDialogueGameSlide slide={slide} youtubeUrl={youtubeUrl} />;
    case 'clip_comprehension':
      return <ClipComprehensionSlide slide={slide} />;
    case 'clip_vocab_match':
      return <ClipVocabMatchSlide slide={slide} />;
    case 'clip_predictions':
      return <ClipPredictionsSlide slide={slide} />;
    case 'clip_language_focus':
      return <ClipLanguageFocusSlide slide={slide} />;
    case 'clip_controlled_practice':
      return <ClipControlledPracticeSlide slide={slide} />;
    case 'clip_production':
      return <ClipPredictionsSlide slide={slide} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">🔧</p>
            <p className="font-medium">Tipo de slide no soportado: {slide.type}</p>
          </div>
        </div>
      );
  }
}
