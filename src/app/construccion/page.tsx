import Link from 'next/link';

export default function ConstruccionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #E8D5F5 50%, #D8C5F0 100%)' }}>

      {/* Cat image */}
      <div className="text-[120px] leading-none select-none mb-2 animate-bounce">
        🐱
      </div>
      <div className="text-[48px] leading-none select-none mb-8" style={{ marginTop: '-20px' }}>
        ⛑️🔨
      </div>

      <h1 className="text-3xl font-extrabold text-[#5A3D7A] text-center mb-3">
        ¡En Construcción!
      </h1>
      <p className="text-gray-500 text-center max-w-sm leading-relaxed mb-8">
        Estamos trabajando duro para traerte el portal del estudiante.
        ¡Vuelve pronto!
      </p>

      <Link
        href="/portal"
        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
      >
        ← Volver
      </Link>

      <p className="mt-10 text-xs text-gray-300">© {new Date().getFullYear()} FriendlyTeaching.cl</p>
    </div>
  );
}
