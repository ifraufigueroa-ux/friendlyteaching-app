import Link from 'next/link';

const INTERNAL_TOOLS = [
  {
    href:        '/dashboard/teacher/tools/whiteboard',
    icon:        '🖊️',
    title:       'Pizarra',
    description: 'Dibuja, escribe y explica conceptos con lápiz, formas y texto. Exporta como PNG.',
    gradient:    'from-[#7B5EA7] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/30',
    badge:       null,
  },
  {
    href:        '/dashboard/teacher/music',
    icon:        '🎵',
    title:       'Friendlyrics®',
    description: 'Crea lecciones de inglés basadas en canciones reales. Busca una canción, genera ejercicios con IA y asígnalos.',
    gradient:    'from-[#EC4899] to-[#F472B6]',
    glow:        'shadow-pink-200/40',
    badge:       'Nuevo',
  },
  {
    href:        '/dashboard/teacher/friendlyflix',
    icon:        '🎬',
    title:       'Friendlyflix®',
    description: 'Crea lecciones con clips de series y películas en YouTube. Diálogo con huecos sincronizado con el video.',
    gradient:    'from-[#E50914] to-[#FF6B6B]',
    glow:        'shadow-red-200/40',
    badge:       'Beta',
  },
  {
    href:        '/dashboard/teacher/texts',
    icon:        '📖',
    title:       'FriendlyTales®',
    description: 'Pega un texto (artículo, diálogo, script). Opcionalmente añade audio de YouTube o genera TTS con ElevenLabs. IA arma el deck CLT de 10 slides.',
    gradient:    'from-[#1B2C3F] to-[#4B6A85]',
    glow:        'shadow-slate-200/40',
    badge:       'Beta',
  },
  {
    href:        '/dashboard/teacher/cue-cards',
    icon:        '🎤',
    title:       'IELTS Speaking Mocks',
    description: 'Simulacros completos de IELTS Speaking: Parte 1 + 2 (cue cards) + 3. Instrucciones y timers por parte.',
    gradient:    'from-[#5A3D7A] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/40',
    badge:       'Nuevo',
  },
  {
    href:        '/dashboard/teacher/ielts/listening',
    icon:        '🎧',
    title:       'IELTS Listening Mocks',
    description: 'Mock completo de 40 preguntas × 4 secciones con audio, timer flotante y diagnóstico por band + tipo de pregunta + carga cognitiva.',
    gradient:    'from-[#5A3D7A] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/40',
    badge:       'Nuevo',
  },
  {
    href:        '/dashboard/teacher/ielts/writing',
    icon:        '✍️',
    title:       'IELTS Writing Mocks',
    description: 'Full mock (60 min, T1 + T2) o práctica individual. Academic + General Training. AI grading con band descriptors oficiales.',
    gradient:    'from-[#5A3D7A] to-[#9B7CB8]',
    glow:        'shadow-[#C8A8DC]/40',
    badge:       'Nuevo',
  },
  {
    href:        '/dashboard/teacher/tools/qa-simulator',
    icon:        '🎯',
    title:       'Q&A Simulator',
    description: 'Simulación tipo foro internacional para defensas de tesis. Categorías, timer, racha y modo grabación.',
    gradient:    'from-[#10B981] to-[#34D399]',
    glow:        'shadow-emerald-200/40',
    badge:       'Nuevo',
  },
];

const EXTERNAL_TOOLS = [
  {
    href:        'https://app.off2class.com/',
    icon:        '📚',
    title:       'Off2Class',
    description: 'Gestiona tareas, ejercicios y progreso de tus estudiantes.',
    gradient:    'from-[#F59E0B] to-[#FBBF24]',
    glow:        'shadow-amber-200/40',
  },
  {
    href:        'https://ellii.com',
    icon:        '🌐',
    title:       'Ellii',
    description: 'Plataforma interactiva de práctica de inglés para tus alumnos.',
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
          <h1 className="text-3xl font-extrabold text-white mb-1">Herramientas</h1>
          <p className="text-white/60 text-sm">Todo lo que necesitas para tus clases, en un solo lugar.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Internal tools ───────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7B5EA7] to-[#C8A8DC] flex items-center justify-center text-white text-xs">✦</div>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Nuestras herramientas</h2>
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
                  <span>Abrir</span>
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
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Plataformas externas</h2>
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
                    externo ↗
                  </span>
                </div>

                <div>
                  <p className="font-bold text-gray-700 text-base mb-1 group-hover:text-gray-900 transition-colors">{title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-600 mt-auto transition-colors">
                  <span>Ir a plataforma</span>
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
