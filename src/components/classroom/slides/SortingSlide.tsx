// FriendlyTeaching.cl — SortingSlide (drag items into categories)
// Categories stored in slide.tableHeaders[], items in slide.blanks[].
// correctAnswer = pipe-separated category indices for each item: "0|1|0|2|1"
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function SortingSlide({ slide }: Props) {
  const categories = slide.tableHeaders ?? [];
  const items = slide.blanks ?? [];
  const correctMapping = (slide.correctAnswer ?? '').split('|').map((s) => parseInt(s.trim(), 10));

  // State: which category each item has been placed in (-1 = unplaced)
  const [placements, setPlacements] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const unplacedItems = items.map((item, i) => ({ item, index: i })).filter((_, i) => !(i in placements));

  function placeItem(itemIdx: number, catIdx: number) {
    setPlacements((prev) => ({ ...prev, [itemIdx]: catIdx }));
    setChecked(false);
  }

  function removeItem(itemIdx: number) {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[itemIdx];
      return next;
    });
    setChecked(false);
  }

  function reset() {
    setPlacements({});
    setChecked(false);
  }

  const allPlaced = Object.keys(placements).length === items.length;
  const totalCorrect = checked
    ? items.filter((_, i) => placements[i] === correctMapping[i]).length
    : 0;

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.question && <p className="text-gray-600 mt-2">{slide.question}</p>}
      </div>

      {/* Unplaced items pool */}
      {unplacedItems.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Arrastra o haz click para clasificar:</p>
          <div className="flex flex-wrap gap-2">
            {unplacedItems.map(({ item, index }) => (
              <div key={index} className="group relative">
                <span className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 cursor-pointer hover:border-[#C8A8DC] transition-colors inline-block">
                  {item}
                </span>
                {/* Quick-place buttons on hover */}
                <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10">
                  {categories.map((cat, ci) => (
                    <button
                      key={ci}
                      onClick={() => placeItem(index, ci)}
                      className="px-2 py-1 text-[10px] font-bold bg-[#5A3D7A] text-white rounded shadow-lg hover:bg-[#9B7CB8] whitespace-nowrap transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category columns */}
      <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)` }}>
        {categories.map((cat, ci) => {
          const catItems = items
            .map((item, i) => ({ item, index: i }))
            .filter(({ index }) => placements[index] === ci);

          return (
            <div key={ci} className="bg-[#F0E5FF]/30 rounded-2xl p-3 min-h-[120px]">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-2 text-center border-b border-[#E0D5FF] pb-1">
                {cat}
              </p>
              <div className="space-y-1.5">
                {catItems.map(({ item, index }) => {
                  let cls = 'bg-[#C8A8DC] text-white';
                  if (checked) {
                    cls = placements[index] === correctMapping[index]
                      ? 'bg-green-400 text-white'
                      : 'bg-red-400 text-white';
                  }
                  return (
                    <button
                      key={index}
                      onClick={() => !checked && removeItem(index)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${cls} ${!checked ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                    >
                      {item} {!checked && '×'}
                    </button>
                  );
                })}
                {catItems.length === 0 && (
                  <p className="text-center text-gray-300 text-xs py-4">Vacío</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => setChecked(true)}
          disabled={!allPlaced}
          className="px-5 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
        >
          Verificar
        </button>
        <button
          onClick={reset}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Resetear
        </button>
      </div>

      {checked && (
        <div className={`text-center py-3 rounded-xl font-bold ${
          totalCorrect === items.length ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-700'
        }`}>
          {totalCorrect === items.length
            ? '🎉 ¡Todo correcto!'
            : `${totalCorrect}/${items.length} correctas. Los items en rojo están mal clasificados.`}
        </div>
      )}
    </div>
  );
}
