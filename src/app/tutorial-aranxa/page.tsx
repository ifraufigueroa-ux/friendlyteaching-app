// FriendlyTeaching.cl — Tutorial para Aranxa: Fusionar nombres en el horario
import Image from 'next/image';

export default function TutorialAranxa() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-white to-[#F0E8FF] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center space-y-4">
          <Image
            src="/logo-friendlyteaching.jpg"
            alt="FriendlyTeaching"
            width={80}
            height={80}
            className="mx-auto rounded-2xl shadow-lg"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-[#9B7CB8]">
            FriendlyTeaching.cl · Tutorial
          </p>
          <h1 className="text-3xl font-extrabold text-[#3D1F6B] leading-tight">
            Cómo fusionar nombres<br />
            <span className="text-[#7B5EA7]">en tu horario</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Si el mismo estudiante aparece con nombres distintos (con o sin apellido,
            con o sin tilde), esta función los unifica en uno solo.
          </p>
        </div>

        {/* ── Step 1 ─────────────────────────────────────────────── */}
        <StepCard
          number={1}
          emoji="📅"
          title="Ve a tu Horario Semanal"
          color="purple"
        >
          <p>
            En el menú lateral izquierdo, haz clic en <Strong>Horario</Strong>.
            Verás tu calendario semanal con todas tus clases.
          </p>
          <Screenshot label="Menú lateral → Horario" icon="📅" />
        </StepCard>

        {/* ── Step 2 ─────────────────────────────────────────────── */}
        <StepCard
          number={2}
          emoji="🔗"
          title='Haz clic en "Fusionar nombres"'
          color="violet"
        >
          <p>
            En la parte superior del horario, junto al botón de Disponibilidad,
            verás el botón <Strong>🔗 Fusionar nombres</Strong>. Haz clic ahí.
          </p>
          <div className="flex items-center gap-2 bg-white border-2 border-[#E0D5FF] rounded-xl px-4 py-3 w-fit mx-auto mt-3">
            <span className="text-sm font-semibold text-[#5A3D7A] bg-[#F0E5FF] px-3 py-1.5 rounded-full">
              🔗 Fusionar nombres
            </span>
            <span className="text-sm font-semibold text-[#5A3D7A] bg-[#F0E5FF] px-3 py-1.5 rounded-full">
              ⚙️ Disponibilidad
            </span>
          </div>
        </StepCard>

        {/* ── Step 3 ─────────────────────────────────────────────── */}
        <StepCard
          number={3}
          emoji="👈"
          title="Selecciona los nombres duplicados"
          color="pink"
        >
          <p>
            Se abrirá una ventana con <Strong>todos los nombres</Strong> de tu horario
            en la columna izquierda. Toca los nombres que son la misma persona
            (uno por uno se pondrán en azul).
          </p>
          <div className="bg-white border border-[#F0E5FF] rounded-2xl p-4 mt-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Ejemplo — selecciona ambos:
            </p>
            <NameChip name="Mila Mo" selected />
            <NameChip name="Mila Mogollón" selected />
            <NameChip name="Helena" />
            <NameChip name="Helena Barraza" />
          </div>
          <Tip>
            Puedes seleccionar 2 o más nombres a la vez antes de agrupar.
          </Tip>
        </StepCard>

        {/* ── Step 4 ─────────────────────────────────────────────── */}
        <StepCard
          number={4}
          emoji="📦"
          title='Haz clic en "Agrupar"'
          color="purple"
        >
          <p>
            Cuando tengas 2 o más nombres seleccionados, aparecerá el botón
            <Strong> 🔗 Agrupar X nombres</Strong>. Haz clic para crear el grupo.
          </p>
          <div className="flex justify-center mt-3">
            <div className="bg-[#5A3D7A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md">
              🔗 Agrupar 2 nombres
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            El grupo aparecerá en la <Strong>columna derecha</Strong>.
            Repite este proceso para cada par de duplicados que tengas.
          </p>
        </StepCard>

        {/* ── Step 5 ─────────────────────────────────────────────── */}
        <StepCard
          number={5}
          emoji="⭐"
          title="Elige cuál nombre conservar"
          color="violet"
        >
          <p>
            En cada grupo de la columna derecha, toca el nombre que quieres
            <Strong> conservar</Strong>. Ese quedará en morado — los demás
            se tacharán (serán reemplazados).
          </p>
          <div className="bg-white border border-[#F0E5FF] rounded-2xl p-4 mt-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B7CB8] mb-2">Grupo 1</p>
            <CanonicalChip name="Mila Mo" isCanonical label="conservar" />
            <CanonicalChip name="Mila Mogollón" isCanonical={false} />
          </div>
          <Tip>
            Por defecto se elige el nombre más largo (con apellido completo),
            pero puedes cambiarlo tocando el que prefieras.
          </Tip>
        </StepCard>

        {/* ── Step 6 ─────────────────────────────────────────────── */}
        <StepCard
          number={6}
          emoji="🔗"
          title="Fusionar todo de una vez"
          color="pink"
        >
          <p>
            Cuando hayas creado todos los grupos, haz clic en el botón
            <Strong> 🔗 Fusionar</Strong> al final de la ventana.
          </p>
          <div className="bg-[#F9F5FF] border border-[#E8DAFF] rounded-2xl p-4 mt-3 space-y-2 text-sm text-gray-600">
            <p>✅ Se actualizarán todas las <Strong>clases del horario</Strong></p>
            <p>✅ Se unificará el <Strong>historial de clases</Strong> completo</p>
            <p>✅ Sin pérdida de datos — solo un renombrado</p>
          </div>
          <Tip>
            El número entre paréntesis del botón indica cuántos registros
            se van a modificar en total.
          </Tip>
        </StepCard>

        {/* ── Step 7 ─────────────────────────────────────────────── */}
        <StepCard
          number={7}
          emoji="✅"
          title="¡Listo!"
          color="green"
        >
          <p>
            Al terminar verás el mensaje de confirmación con cuántos registros
            se actualizaron. Cierra la ventana y tu horario ya mostrará los
            nombres unificados.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mt-3">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-bold text-gray-800">Registros actualizados</p>
            <p className="text-sm text-gray-500 mt-1">
              Clases e historial unificados bajo un solo nombre.
            </p>
          </div>
        </StepCard>

        {/* ── Cheat sheet ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-[#E8DAFF] shadow-sm p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9B7CB8] mb-4 text-center">
            Nombres a fusionar en tu horario
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Andrée', 'Andrée Barraza'],
              ['Anto Acuña', 'Antonia Acuña'],
              ['Beatriz Sepulv', 'Beatriz Sepúlveda'],
              ['Fabricio', 'Fabricio Melendez'],
              ['Helena', 'Helena Barraza'],
              ['Joaquin', 'Joaquin Zapata'],
              ['Mila Mo', 'Mila Mogollón'],
            ].map(([a, b]) => (
              <div key={a} className="col-span-2 flex items-center gap-2 bg-[#F9F5FF] rounded-xl px-3 py-2">
                <span className="text-red-400 text-xs font-mono flex-shrink-0">✗</span>
                <span className="text-gray-500 text-xs flex-1">{a}</span>
                <span className="text-[#9B7CB8] text-xs">→</span>
                <span className="font-semibold text-[#5A3D7A] text-xs flex-1 text-right">{b}</span>
                <span className="text-green-500 text-xs font-mono flex-shrink-0">✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="text-center pt-4 pb-8 space-y-5">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-[#E0D5FF]" />
            <Image
              src="/logo-friendlyteaching.jpg"
              alt="FriendlyTeaching"
              width={40}
              height={40}
              className="rounded-xl shadow-sm opacity-70"
            />
            <div className="h-px w-16 bg-[#E0D5FF]" />
          </div>
          <p className="text-[#9B7CB8] text-sm">FriendlyTeaching.cl</p>
          <p className="text-2xl font-bold text-[#5A3D7A] tracking-wide">
            te amo gatita 🐱💜
          </p>
        </div>

      </div>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StepCard({
  number, emoji, title, color, children,
}: {
  number: number;
  emoji: string;
  title: string;
  color: 'purple' | 'violet' | 'pink' | 'green';
  children: React.ReactNode;
}) {
  const palette = {
    purple: { ring: 'border-[#C8A8DC]', num: 'bg-[#5A3D7A] text-white', bg: 'bg-[#F9F5FF]' },
    violet: { ring: 'border-[#B89FD8]', num: 'bg-[#7B5EA7] text-white', bg: 'bg-[#F4EEFF]' },
    pink:   { ring: 'border-[#E8A8D0]', num: 'bg-[#C0609A] text-white', bg: 'bg-[#FFF0F8]' },
    green:  { ring: 'border-[#86C8A0]', num: 'bg-[#3D9A65] text-white', bg: 'bg-[#F0FFF6]' },
  }[color];

  return (
    <div className={`rounded-3xl border-2 ${palette.ring} ${palette.bg} p-6 space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full ${palette.num} flex items-center justify-center text-sm font-extrabold flex-shrink-0 shadow-sm`}>
          {number}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h2 className="font-bold text-[#3D1F6B] text-base">{title}</h2>
        </div>
      </div>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed pl-12">
        {children}
      </div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-[#5A3D7A] font-semibold">{children}</strong>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-white/70 border border-[#E8DAFF] rounded-xl px-3 py-2 mt-2 text-xs text-[#7B5EA7]">
      <span className="flex-shrink-0 mt-0.5">💡</span>
      <span>{children}</span>
    </div>
  );
}

function Screenshot({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="bg-white border border-[#E0D5FF] rounded-2xl p-4 mt-3 flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">En el menú lateral:</p>
        <p className="text-sm font-semibold text-[#5A3D7A]">{label}</p>
      </div>
    </div>
  );
}

function NameChip({ name, selected }: { name: string; selected?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border-2 transition-all
      ${selected
        ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold'
        : 'bg-white border-[#E0D5FF] text-gray-500'
      }`}>
      <span>{name}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {selected ? '✓ seleccionado' : 'toca para seleccionar'}
      </span>
    </div>
  );
}

function CanonicalChip({
  name, isCanonical, label,
}: { name: string; isCanonical: boolean; label?: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border-2
      ${isCanonical
        ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold'
        : 'bg-white border-[#E0D5FF] text-gray-400 line-through decoration-gray-400'
      }`}>
      <span className="flex items-center gap-2">
        {isCanonical && label && (
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{label}</span>
        )}
        {name}
      </span>
      {isCanonical && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">se conserva</span>}
    </div>
  );
}
