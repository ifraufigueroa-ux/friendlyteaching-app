'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const FEATURES = [
  { icon: '🎯', title: 'Clases Personalizadas', desc: 'Cada estudiante es único. Adaptamos el contenido a tu nivel y objetivos específicos.' },
  { icon: '💻', title: '100% Online', desc: 'Aprende desde cualquier lugar, en el horario que mejor se ajuste a tu rutina.' },
  { icon: '👥', title: 'Todas las Edades', desc: 'Desde niños hasta adultos, tenemos el programa perfecto para cada etapa.' },
  { icon: '✅', title: 'Evaluación Gratuita', desc: 'Conoce tu nivel actual sin compromiso y recibe un plan de estudios personalizado.' },
  { icon: '📊', title: 'Seguimiento Continuo', desc: 'Medimos tu progreso constantemente para asegurar que alcances tus metas.' },
  { icon: '🎓', title: 'Profesores Certificados', desc: 'Aprende con expertos apasionados por la enseñanza del inglés.' },
];

const STEPS = [
  { n: 1, title: 'Evaluación Inicial', desc: 'Determinamos tu nivel actual y objetivos de aprendizaje.' },
  { n: 2, title: 'Plan Personalizado', desc: 'Creamos un programa adaptado a tu nivel, intereses y horario.' },
  { n: 3, title: 'Clases Interactivas', desc: 'Material dinámico y conversación real desde el primer día.' },
  { n: 4, title: 'Práctica Continua', desc: 'Ejercicios y material complementario entre clases.' },
  { n: 5, title: 'Evaluación de Progreso', desc: 'Ajustamos el programa según tu avance regularmente.' },
];

const PLANS = [
  {
    name: 'Básico', price: '$60.000', period: 'por mes', featured: false, badge: null,
    features: ['4 clases al mes (1 x semana)', 'Clases de 60 minutos', 'Material digital incluido', 'Evaluación inicial gratuita', 'Acceso a plataforma'],
  },
  {
    name: 'Premium', price: '$112.000', period: 'por mes', featured: true, badge: 'MÁS POPULAR',
    features: ['8 clases al mes (2 x semana)', 'Clases de 60 minutos', 'Material + ejercicios extras', 'Evaluación inicial gratuita', 'Acceso prioritario', 'Soporte por WhatsApp'],
  },
  {
    name: 'Intensivo', price: '$144.000', period: 'por mes', featured: false, badge: null,
    features: ['12 clases al mes (3 x semana)', 'Clases de 60 minutos', 'Material completo personalizado', 'Evaluación inicial gratuita', 'Acceso ilimitado', 'Soporte 24/7', 'Conversación grupal'],
  },
];

const TESTIMONIALS = [
  { quote: 'Después de 6 meses con Friendly Teaching, logré el trabajo que tanto quería. Las clases personalizadas hicieron toda la diferencia. ¡Totalmente recomendado!', name: 'María José Contreras', role: 'Ingeniera Comercial', initials: 'MC' },
  { quote: 'Mi hijo de 8 años ama las clases. Los profesores son muy pacientes y usan juegos interactivos que lo mantienen motivado. Ha mejorado muchísimo.', name: 'Patricia Silva', role: 'Madre de estudiante', initials: 'PS' },
  { quote: 'Llevo 3 meses estudiando y ya puedo mantener conversaciones fluidas. El método es súper efectivo y la flexibilidad de horarios es perfecta para mi rutina.', name: 'Roberto González', role: 'Contador', initials: 'RG' },
];

// ── Shared pill button style ──
const pill = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 hover:-translate-y-0.5';
const pillPrimary   = `${pill} bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white shadow-md hover:shadow-lg`;
const pillOutline   = `${pill} bg-white/80 hover:bg-[#F0E5FF] text-[#5A3D7A] border border-[#C8A8DC] hover:border-[#9B7CB8]`;
const pillWhite     = `${pill} bg-white/80 hover:bg-white text-[#5A3D7A] shadow-md hover:shadow-lg`;

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', edad: '', nivel: '', objetivo: '', inicio: '' });
  const [formSent, setFormSent] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--gradient-hero)' }}>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#E8D5F5] shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm flex-shrink-0 ring-2 ring-[#C8A8DC]/30">
              <Image src="/logo-friendlyteaching.jpg" alt="Logo" width={36} height={36} className="object-cover w-full h-full" />
            </div>
            <span className="font-extrabold text-[#5A3D7A] text-lg tracking-tight">FriendlyTeaching.cl</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
            {[['metodologia','Metodología'],['planes','Planes'],['testimonios','Testimonios'],['evaluacion','Evaluación Gratuita']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-[#5A3D7A] transition-colors">{label}</button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className={`${pillOutline} px-4 py-2 text-sm`}>
              🔐 Portal de Clases
            </Link>
            <button onClick={() => scrollTo('evaluacion')} className={`${pillPrimary} px-4 py-2 text-sm`}>
              Evaluación Gratuita
            </button>
          </div>

          <button className="md:hidden text-[#5A3D7A] text-2xl" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-[#F0E5FF] px-6 py-4 flex flex-col gap-4 text-sm font-semibold text-gray-700">
            {[['metodologia','Metodología'],['planes','Planes'],['testimonios','Testimonios'],['evaluacion','Evaluación Gratuita']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-left hover:text-[#5A3D7A] transition-colors">{label}</button>
            ))}
            <Link href="/auth/login" className="text-[#5A3D7A] font-bold">🔐 Portal de Clases</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="inicio" className="flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Floating logo */}
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-full bg-[#C8A8DC]/40 blur-3xl scale-150" />
          <div className="animate-pulse-ring absolute inset-0 rounded-full border-4 border-[#C8A8DC]/30 scale-110" />
          <div className="animate-float relative w-52 h-52 rounded-full bg-gradient-to-br from-[#D8BEE8] via-[#C8A8DC] to-[#9B7CB8] p-[5px] shadow-2xl shadow-[#C8A8DC]/60">
            <div className="w-full h-full rounded-full overflow-hidden bg-white ring-4 ring-white/60">
              <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={208} height={208} className="object-cover w-full h-full" />
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 bg-white/80 text-[#5A3D7A] text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm border border-[#E0D5FF]">
          🇬🇧 Academia de Inglés Online
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl mb-5 text-[#4B2E7A] tracking-tight">
          Aprende inglés de forma<br />
          <span className="text-gradient-purple">amigable y efectiva</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-10 leading-relaxed">
          Clases 100% online, personalizadas para tu nivel y ritmo. Metodología CLT, profesores certificados y horarios flexibles.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => scrollTo('evaluacion')} className={`${pillPrimary} px-8 py-4 text-lg`}>
            Comenzar Ahora →
          </button>
          <button onClick={() => scrollTo('planes')} className={`${pillWhite} px-8 py-4 text-lg`}>
            Ver Planes
          </button>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <h2 className="text-3xl font-extrabold text-center text-[#4B2E7A] mb-2 tracking-tight">¿Por qué elegir Friendly Teaching?</h2>
        <p className="text-center text-gray-400 mb-10">Aprende inglés con el mejor método adaptado a tus necesidades</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/80 rounded-3xl p-6 border border-[#E8D5F5] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="w-12 h-12 rounded-2xl bg-[#F0E5FF] flex items-center justify-center text-2xl mb-4">{icon}</div>
              <h3 className="font-bold text-[#5A3D7A] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── METHODOLOGY ── */}
      <section id="metodologia" className="max-w-6xl mx-auto px-6 pb-24 w-full">
        <h2 className="text-3xl font-extrabold text-center text-[#4B2E7A] mb-2 tracking-tight">Nuestra Metodología</h2>
        <p className="text-center text-gray-400 mb-10">Un enfoque probado para el éxito en el aprendizaje del inglés</p>

        <div className="bg-gradient-to-br from-[#F0E5FF] to-[#E4D4F8] rounded-3xl p-8 mb-10 text-center border border-[#DDD0F0]">
          <h3 className="text-2xl font-extrabold text-[#5A3D7A] mb-4">Communicative Language Teaching (CLT)</h3>
          <p className="text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
            En Friendly Teaching utilizamos el método <strong>CLT</strong>, que prioriza la <strong>comunicación real</strong> como centro del aprendizaje. Nuestros estudiantes aprenden inglés usándolo en situaciones auténticas — no memorizando reglas de manera aislada.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {['🗣️ Speaking', '🎧 Listening', '📖 Reading', '✍️ Writing'].map(s => (
              <div key={s} className="bg-white rounded-2xl py-3 text-sm font-bold text-[#5A3D7A] shadow-sm border border-white">{s}</div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="bg-white/80 rounded-3xl p-5 border border-[#E8D5F5] shadow-sm text-center hover:-translate-y-1 transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#C8A8DC] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-3 shadow-md">{n}</div>
              <h4 className="font-bold text-[#5A3D7A] text-sm mb-1">{title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="planes" className="max-w-6xl mx-auto px-6 pb-24 w-full">
        <h2 className="text-3xl font-extrabold text-center text-[#4B2E7A] mb-2 tracking-tight">Planes y Precios</h2>
        <p className="text-center text-gray-400 mb-12">Elige el plan que mejor se adapte a tus necesidades</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative rounded-3xl p-7 flex flex-col transition-all duration-200
              ${plan.featured
                ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white md:scale-105 shadow-2xl shadow-[#C8A8DC]/40'
                : 'bg-white/90 border border-[#E8D5F5] shadow-md hover:shadow-lg hover:-translate-y-1'}`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFB8D9] text-[#5A3D7A] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap border border-white">
                  ✨ {plan.badge}
                </div>
              )}
              <h3 className={`text-xl font-extrabold mb-1 ${plan.featured ? 'text-white' : 'text-[#5A3D7A]'}`}>{plan.name}</h3>
              <div className={`text-4xl font-extrabold mb-0.5 tracking-tight ${plan.featured ? 'text-white' : 'text-[#4B2E7A]'}`}>{plan.price}</div>
              <p className={`text-sm mb-6 ${plan.featured ? 'text-white/70' : 'text-gray-400'}`}>{plan.period}</p>
              <ul className="flex-1 space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className={`text-sm flex items-start gap-2.5 ${plan.featured ? 'text-white/90' : 'text-gray-600'}`}>
                    <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${plan.featured ? 'bg-white/20 text-white' : 'bg-[#F0E5FF] text-[#9B7CB8]'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setSelectedPlan(plan.name); scrollTo('evaluacion'); }}
                className={`w-full py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg
                  ${plan.featured ? 'bg-white text-[#5A3D7A] hover:bg-[#F0E5FF]' : 'bg-[#C8A8DC] text-white hover:bg-[#9B7CB8]'}`}>
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonios" className="max-w-6xl mx-auto px-6 pb-24 w-full">
        <h2 className="text-3xl font-extrabold text-center text-[#4B2E7A] mb-2 tracking-tight">Lo que dicen nuestros estudiantes</h2>
        <p className="text-center text-gray-400 mb-10">Historias reales de éxito</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, initials }) => (
            <div key={name} className="bg-white/90 rounded-3xl p-7 border border-[#E8D5F5] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
              <div className="text-4xl text-[#C8A8DC] leading-none font-serif select-none">"</div>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 italic">"{quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E5FF]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">{initials}</div>
                <div>
                  <p className="font-bold text-[#5A3D7A] text-sm">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                  <div className="text-yellow-400 text-xs mt-0.5">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EVALUATION FORM ── */}
      <section id="evaluacion" className="max-w-3xl mx-auto px-6 pb-24 w-full">
        <h2 className="text-3xl font-extrabold text-center text-[#4B2E7A] mb-2 tracking-tight">¡Agenda tu Evaluación Gratuita!</h2>
        <p className="text-center text-gray-400 mb-10">Descubre tu nivel de inglés y recibe un plan de estudios personalizado</p>

        <div className="bg-white/90 rounded-3xl p-8 border border-[#E8D5F5] shadow-lg">
          {formSent ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-extrabold text-[#5A3D7A] mb-2">¡Solicitud enviada!</h3>
              <p className="text-gray-500 mb-6">Nos pondremos en contacto contigo muy pronto para coordinar tu evaluación gratuita.</p>
              <button onClick={() => setFormSent(false)} className={`${pillOutline} px-5 py-2 text-sm`}>Enviar otra solicitud</button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setFormSent(true); }}>
              {selectedPlan && (
                <div className="mb-5 bg-[#F0E5FF] rounded-2xl px-4 py-3 text-sm text-[#5A3D7A] font-semibold flex items-center justify-between border border-[#DDD0F0]">
                  <span>✓ Plan seleccionado: <strong>{selectedPlan}</strong></span>
                  <button type="button" onClick={() => setSelectedPlan(null)} className="text-xs text-gray-400 underline font-normal ml-2">cambiar</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {[
                  { label: 'Nombre Completo *', name: 'nombre', type: 'text', placeholder: 'Ej: Juan Pérez', required: true },
                  { label: 'Email *', name: 'email', type: 'email', placeholder: 'tu@email.com', required: true },
                  { label: 'Teléfono / WhatsApp *', name: 'telefono', type: 'tel', placeholder: '+56 9 1234 5678', required: true },
                ].map(({ label, name, type, placeholder, required }) => (
                  <div key={name} className={name === 'telefono' ? 'sm:col-span-2 sm:max-w-xs' : ''}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <input required={required} type={type} name={name} value={(formData as Record<string,string>)[name]} onChange={handleChange} placeholder={placeholder}
                      className="w-full px-4 py-3 border-2 border-[#E8D5F5] rounded-2xl text-sm focus:outline-none focus:border-[#C8A8DC] bg-white transition-colors" />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Edad *</label>
                  <select required name="edad" value={formData.edad} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#E8D5F5] rounded-2xl text-sm focus:outline-none focus:border-[#C8A8DC] bg-white transition-colors">
                    <option value="">Selecciona...</option>
                    <option value="6-12">6–12 años (Niños)</option>
                    <option value="13-17">13–17 años (Adolescentes)</option>
                    <option value="18-30">18–30 años (Jóvenes adultos)</option>
                    <option value="31-50">31–50 años (Adultos)</option>
                    <option value="51+">51+ años (Adultos mayores)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">¿Cuál es tu nivel actual de inglés? *</label>
                  <select required name="nivel" value={formData.nivel} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#E8D5F5] rounded-2xl text-sm focus:outline-none focus:border-[#C8A8DC] bg-white transition-colors">
                    <option value="">Selecciona...</option>
                    <option value="principiante">Principiante (No sé inglés)</option>
                    <option value="basico">Básico (Conozco algunas palabras)</option>
                    <option value="intermedio">Intermedio (Puedo mantener conversaciones simples)</option>
                    <option value="avanzado">Avanzado (Hablo con fluidez pero quiero perfeccionarme)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">¿Cuál es tu objetivo principal?</label>
                  <textarea name="objetivo" value={formData.objetivo} onChange={handleChange} rows={2}
                    placeholder="Ej: Necesito inglés para mi trabajo, quiero viajar al extranjero..."
                    className="w-full px-4 py-3 border-2 border-[#E8D5F5] rounded-2xl text-sm focus:outline-none focus:border-[#C8A8DC] resize-none transition-colors" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">¿Cuándo te gustaría comenzar? *</label>
                  <select required name="inicio" value={formData.inicio} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#E8D5F5] rounded-2xl text-sm focus:outline-none focus:border-[#C8A8DC] bg-white transition-colors">
                    <option value="">Selecciona...</option>
                    <option value="inmediato">Lo antes posible</option>
                    <option value="1-2-semanas">En 1–2 semanas</option>
                    <option value="1-mes">En un mes</option>
                    <option value="flexible">Soy flexible</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={`${pillPrimary} w-full py-4 text-base`}>
                Solicitar Evaluación Gratuita 🎓
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white/70 border-t border-[#E8D5F5] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#C8A8DC]/40">
              <Image src="/logo-friendlyteaching.jpg" alt="Logo" width={28} height={28} className="object-cover" />
            </div>
            <span className="font-extrabold text-[#5A3D7A]">FriendlyTeaching.cl</span>
          </div>
          <div className="flex items-center gap-5 text-xl">
            <a href="https://instagram.com/friendlyteaching.cl" target="_blank" rel="noopener noreferrer" title="Instagram" className="hover:scale-110 transition-transform">📷</a>
            <a href="https://wa.me/56912345678" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="hover:scale-110 transition-transform">💬</a>
            <a href="mailto:contacto@friendlyteaching.cl" title="Email" className="hover:scale-110 transition-transform">✉️</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hover:text-[#5A3D7A] transition-colors font-medium">🔐 Portal de Clases</Link>
            <span>© {new Date().getFullYear()} Friendly Teaching</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
