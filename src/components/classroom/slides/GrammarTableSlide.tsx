// FriendlyTeaching.cl — GrammarTableSlide
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function GrammarTableSlide({ slide }: Props) {
  const headers = slide.tableHeaders ?? [];
  const rows = slide.tableRows ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {slide.content && (
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{slide.content}</p>
      )}

      <div className="overflow-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="bg-[#C8A8DC] text-white font-bold px-4 py-3 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F0E5FF]/30'}>
                {[row.col1, row.col2, row.col3, row.col4]
                  .filter(Boolean)
                  .map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-gray-700 border-b border-gray-100">
                      {cell}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {slide.tips && (
        <div className="mt-4 bg-[#B8E8E8]/30 border border-[#B8E8E8] rounded-xl p-4">
          <p className="text-xs font-bold text-teal-700 mb-1">💡 Tip</p>
          <p className="text-sm text-teal-600">{slide.tips}</p>
        </div>
      )}
    </div>
  );
}
