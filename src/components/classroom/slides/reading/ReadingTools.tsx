// Friendlytext reading slide — Tools panel (right column, below image).
// Three modes:
//   · dictionary  → click a word to look it up (EN↔ES + EN↔EN)
//   · ipa         → click a word to see IPA transcription
//   · whiteboard  → opens the standalone whiteboard overlay
// Dictionary and IPA are "activation" toggles that flip a mode on/off; the
// parent decides what to do when a word is clicked while the mode is active.
'use client';

export type ReadingTool = 'dictionary' | 'ipa' | 'whiteboard' | null;

interface Props {
  active: ReadingTool;
  onSelectDictionary: () => void;
  onSelectIPA: () => void;
  onOpenWhiteboard: () => void;
}

interface ToolButtonProps {
  icon: string;
  label: string;
  sublabel: string;
  active?: boolean;
  onClick: () => void;
  accent: string;
}

function ToolButton({ icon, label, sublabel, active, onClick, accent }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all text-left',
        active
          ? `${accent} text-white border-transparent shadow-md scale-[1.02]`
          : 'bg-white/70 border-[#E8D9BE] hover:bg-white hover:border-[#4B6A85]/40 hover:shadow-sm',
      ].join(' ')}
    >
      <div className={[
        'w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0',
        active ? 'bg-white/25' : 'bg-[#F5EFE1] border border-[#E8D9BE]',
      ].join(' ')}>
        <span>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[12px] font-bold leading-tight ${active ? 'text-white' : 'text-[#1B2C3F]'}`}>
          {label}
        </p>
        <p className={`text-[10px] leading-tight ${active ? 'text-white/80' : 'text-[#4B6A85]'}`}>
          {sublabel}
        </p>
      </div>
      {active && (
        <span className="text-[9px] font-black uppercase tracking-widest bg-white/25 rounded-full px-1.5 py-0.5">
          ON
        </span>
      )}
    </button>
  );
}

export default function ReadingTools({
  active,
  onSelectDictionary,
  onSelectIPA,
  onOpenWhiteboard,
}: Props) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#E8D9BE] shadow-md p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#4B6A85] mb-2 px-1">
        Tools
      </p>
      <div className="space-y-2">
        <ToolButton
          icon="📖"
          label="Dictionary"
          sublabel="EN ↔ ES  ·  EN ↔ EN"
          active={active === 'dictionary'}
          onClick={onSelectDictionary}
          accent="bg-gradient-to-r from-[#1B2C3F] to-[#4B6A85]"
        />
        <ToolButton
          icon="/ə/"
          label="IPA transcriber"
          sublabel="Click any word → phonetics"
          active={active === 'ipa'}
          onClick={onSelectIPA}
          accent="bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7]"
        />
        <ToolButton
          icon="🖊️"
          label="Whiteboard"
          sublabel="Open a full-screen pizarra"
          active={active === 'whiteboard'}
          onClick={onOpenWhiteboard}
          accent="bg-gradient-to-r from-[#B45309] to-[#E8B547]"
        />
      </div>
      {(active === 'dictionary' || active === 'ipa') && (
        <p className="mt-2 px-1 text-[10px] text-[#4B6A85] italic">
          {active === 'dictionary'
            ? 'Haz clic en una palabra del texto para buscarla.'
            : 'Haz clic en una palabra del texto para ver su IPA.'}
        </p>
      )}
    </div>
  );
}
