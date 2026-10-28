import Link from 'next/link';

const INTERNAL_TOOLS = [
  {
    href:        '/dashboard/teacher/tools/whiteboard',
    icon:        '🖊️',
    title:       'Whiteboard',
    description: 'Draw, write, and explain concepts with pen, shapes, and text. Export as PNG.',
    gradient:    'from-[#7B5EA7] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/30',
    badge:       null,
  },
  {
    href:        '/dashboard/teacher/music',
    icon:        '🎵',
    title:       'Friendlyrics®',
    description: 'Build English lessons around real songs. Search a track, generate exercises with AI, and assign them.',
    gradient:    'from-[#EC4899] to-[#F472B6]',
    glow:        'shadow-pink-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/friendlyflix',
    icon:        '🎬',
    title:       'Friendlyflix®',
    description: 'Build lessons around YouTube clips from TV and movies. Gap-fill dialogue synced to the video.',
    gradient:    'from-[#E50914] to-[#FF6B6B]',
    glow:        'shadow-red-200/40',
    badge:       'Beta',
  },
  {
    href:        '/dashboard/teacher/texts',
    icon:        '📖',
    title:       'FriendlyTales®',
    description: 'Paste a text (article, dialogue, script). Optionally add YouTube audio or generate TTS with ElevenLabs. AI builds the 10-slide CLT deck.',
    gradient:    'from-[#1B2C3F] to-[#4B6A85]',
    glow:        'shadow-slate-200/40',
    badge:       'Beta',
  },
  {
    href:        '/dashboard/teacher/ielts',
    icon:        '🇬🇧',
    title:       'IELTS GT Simulator',
    description: 'Full IELTS General Training mock: Listening + Reading + Writing + Speaking. Class presets, 0–9 band scoring, and AI grading for Writing.',
    gradient:    'from-[#5A3D7A] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/ielts-beginners',
    icon:        '🌱',
    title:       'IELTS GT Beginners',
    description: 'A2 version of the mock: short audio (~2 min), 0.85x speed, simple vocabulary. For students just starting the exam.',
    gradient:    'from-[#10B981] to-[#5A3D7A]',
    glow:        'shadow-emerald-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/ielts-intermediate',
    icon:        '🌿',
    title:       'IELTS GT Intermediate',
    description: 'B1/B2 version of the mock: 32 questions, ~3 min audio per section, 0.95x speed. The bridge between Beginners and the full mock.',
    gradient:    'from-[#3B82F6] to-[#5A3D7A]',
    glow:        'shadow-blue-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/ielts-upper-intermediate',
    icon:        '🌳',
    title:       'IELTS GT Upper-Intermediate',
    description: 'B2 version of the mock: 40 questions (full exam volume), natural 1.0x speed, every question type including plan-map and multi-select.',
    gradient:    'from-[#A855F7] to-[#5A3D7A]',
    glow:        'shadow-purple-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/ielts-advanced',
    icon:        '🔥',
    title:       'IELTS GT Advanced',
    description: 'B2+/C1 version of the mock: real-exam lexical density and distractors, longer scripts, mostly inferential questions. For band 7+.',
    gradient:    'from-[#F43F5E] to-[#5A3D7A]',
    glow:        'shadow-rose-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/toefl',
    icon:        '🎓',
    title:       'TOEFL Academic Simulator',
    description: 'Full TOEFL iBT mock: Reading, Listening, Speaking, Writing. ETS-style 0–120 scoring + AI grading for W and S.',
    gradient:    'from-[#5A3D7A] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/icao',
    icon:        '🛫',
    title:       'OACI Aviation English',
    description: '8-stage ICAO Operational Level 4 prep program. Vocabulary, ATC phraseology, listening, non-routine, and mock tests with ElevenLabs multi-voice audio.',
    gradient:    'from-[#1E3A8A] to-[#5A3D7A]',
    glow:        'shadow-blue-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/tools/qa-simulator',
    icon:        '🎯',
    title:       'Q&A Simulator',
    description: 'International-forum style simulation for thesis defenses. Categories, timer, streak, and recording mode.',
    gradient:    'from-[#10B981] to-[#34D399]',
    glow:        'shadow-emerald-200/40',
    badge:       'New',
  },
  {
    href:        '/dashboard/teacher/tools/tongue-twisters',
    icon:        '👅',
    title:       'Random Tongue Twisters',
    description: 'Tongue-twister roulette for pronunciation warm-ups. Filters by target sound (/r-l/, /th/, /s-sh/…), built-in TTS with speed control, and a "say it 3× fast" counter.',
    gradient:    'from-[#F472B6] to-[#FB923C]',
    glow:        'shadow-pink-200/40',
    badge:       'New',
  },
];

const EXTERNAL_TOOLS = [
  {
    href:        'https://app.off2class.com/',
    icon:        '📚',
    title:       'Off2Class',
    description: 'Manage homework, exercises, and student progress.',
    gradient:    'from-[#F59E0B] to-[#FBBF24]',
    glow:        'shadow-amber-200/40',
  },
  {
    href:        'https://ellii.com',
    icon:        '🌐',
    title:       'Ellii',
    description: 'Interactive English practice platform for your students.',
    gradient:    'from-[#06B6D4] to-[#22D3EE]',
    glow:        'shadow-cyan-200/40',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] px-8 py-10">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative max-w-4xl mx-auto">
          <p className="text-[#C8A8DC] text-xs font-bold uppercase tracking-widest mb-1">FriendlyTeaching.cl</p>
          <h1 className="text-3xl font-extrabold text-white mb-1">Tools</h1>
          <p className="text-white/60 text-sm">Everything you need for your classes, in one place.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Internal tools ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7B5EA7] to-[#C8A8DC] flex items-center justify-center text-white text-xs">✦</div>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Our tools</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INTERNAL_TOOLS.map(({ href, icon, title, description, gradient, glow, badge }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-white border border-[#E8D5F0] hover:border-transparent hover:shadow-xl ${glow} transition-all duration-200 overflow-hidden`}
              >
                {/* Gradient top accent */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                  </div>
                  {badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-200">
                      {badge}
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-bold text-[#2D1B4E] text-base mb-1 group-hover:text-[#5A3D7A] transition-colors">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-[#9B7CB8] group-hover:text-[#5A3D7A] mt-auto transition-colors">
                  <span>Open</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── External tools ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs">⎋</div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">External platforms</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXTERNAL_TOOLS.map(({ href, icon, title, description, gradient, glow }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-xl ${glow} transition-all duration-200 overflow-hidden`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                    external ↗
                  </span>
                </div>

                <div>
                  <p className="font-bold text-gray-700 text-base mb-1 group-hover:text-gray-900 transition-colors">{title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-600 mt-auto transition-colors">
                  <span>Go to platform</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </a>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
