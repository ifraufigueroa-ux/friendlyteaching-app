// FriendlyTeaching.cl — Renderer de texto de mensajes del Co-Work.
// Convierte shortcodes `:ft-xxx:` en <img> con los friendly emojis.
// El texto normal se preserva tal cual (incluyendo whitespace via CSS).

import Image from 'next/image';
import { findFriendlyEmoji } from './friendlyEmojis';

const SHORTCODE_RE = /:(ft-[a-z0-9_-]+):/g;

// `size` en px — por defecto 28, un pelín más grande que el texto para
// que la ilustración se lea pero sin romper el ritmo del mensaje.
export function renderMessageText(text: string, size = 28): React.ReactNode[] {
  if (!text) return [];
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  SHORTCODE_RE.lastIndex = 0;

  let i = 0;
  while ((match = SHORTCODE_RE.exec(text)) !== null) {
    const [full, code] = match;
    const emoji = findFriendlyEmoji(code);
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index));
    }
    if (emoji) {
      out.push(
        <Image
          key={`${code}-${i++}`}
          src={emoji.src}
          alt={emoji.label}
          title={emoji.label}
          width={size}
          height={size}
          className="inline-block align-middle mx-0.5 rounded-md"
          unoptimized
        />,
      );
    } else {
      // Shortcode desconocido — mostrar como texto literal para no perderlo.
      out.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex));
  }
  return out;
}
