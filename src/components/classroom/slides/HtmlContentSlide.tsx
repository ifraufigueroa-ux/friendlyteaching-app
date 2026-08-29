// FriendlyTeaching.cl — HtmlContentSlide
//
// Free-form HTML canvas para clases donde queremos armar layouts custom
// (paneles de METAR, mockups de radar, tablas de fraseología ATC, etc.)
// sin tener que crear un slide component nuevo por caso.
//
// Seguridad: DOMPurify limpia el markup antes del render. Aunque el HTML
// venga de contenido interno del repo, corremos el sanitizer igual como
// defensa en profundidad — si algún día un mock se carga desde Firestore
// o desde input de un teacher, no cambia nada acá.
//
// Config del sanitizer: permitimos SVG (para radares/iconos) y target="_blank"
// en links. Todo lo demás queda con los defaults de DOMPurify (scripts,
// event handlers, javascript: URLs y tags peligrosos como <object> se
// borran). El atributo `class` está permitido por default, así que las
// clases Tailwind funcionan tal cual.
'use client';

import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import type { Slide } from '@/types/firebase';

interface Props {
  slide: Slide;
  isTeacher?: boolean;
}

export default function HtmlContentSlide({ slide, isTeacher }: Props) {
  const cleanHtml = useMemo(() => {
    if (!slide.htmlContent) return '';
    return DOMPurify.sanitize(slide.htmlContent, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true },
      ADD_ATTR: ['target'],  // habilita <a target="_blank">
    });
  }, [slide.htmlContent]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {(slide.title || slide.subtitle) && (
        <div className="px-6 pt-6">
          {slide.title && (
            <h2 className="text-3xl font-bold text-[#5A3D7A]">{slide.title}</h2>
          )}
          {slide.subtitle && (
            <p className="text-base text-gray-500 mt-1">{slide.subtitle}</p>
          )}
        </div>
      )}

      {cleanHtml ? (
        <div
          className="ft-html-slide flex-1 px-6 py-4"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          (Este slide no tiene contenido HTML configurado.)
        </div>
      )}

      {isTeacher && slide.teacherNotes && (
        <div className="mx-6 mb-6 mt-2 bg-[#FFF5C8] border border-[#FFE070] rounded-xl p-4 flex gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-xs font-bold text-[#7A5E00] mb-1">Nota para el Profesor</p>
            <p className="text-sm text-[#5A4500] whitespace-pre-wrap">{slide.teacherNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
