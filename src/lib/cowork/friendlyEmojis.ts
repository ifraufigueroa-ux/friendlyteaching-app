// FriendlyTeaching.cl — Registro de "Friendly emojis" del Co-Work.
// Son las ilustraciones del cat mascot que usamos como iconos del
// sidebar, reusadas como stickers insertables en el chat.
//
// Formato de shortcode: :ft-<slug>: — se parsean en el renderer de
// mensajes (`renderMessageText`) y se expanden a <img>.

export type FriendlyEmoji = {
  code: string;        // ej. "ft-planner" (sin los dos puntos)
  label: string;       // tooltip + a11y
  src: string;         // ruta en /public
};

export const FRIENDLY_EMOJIS: FriendlyEmoji[] = [
  { code: 'ft-cowork',       label: 'Co-Work',           src: '/sidebar-icons/co-work.png' },
  { code: 'ft-panel',        label: 'Panel principal',   src: '/sidebar-icons/panel-principal.png' },
  { code: 'ft-estudiantes',  label: 'Estudiantes',       src: '/sidebar-icons/estudiantes.png' },
  { code: 'ft-historial',    label: 'Historial',         src: '/sidebar-icons/historial-clases.png' },
  { code: 'ft-lecciones',    label: 'Lecciones',         src: '/sidebar-icons/lecciones.png' },
  { code: 'ft-importar',     label: 'Importar',          src: '/sidebar-icons/importar-lecciones.png' },
  { code: 'ft-planner',      label: 'Planner',           src: '/sidebar-icons/planner.png' },
  { code: 'ft-tareas',       label: 'Tareas',            src: '/sidebar-icons/tareas.png' },
  { code: 'ft-placement',    label: 'Placement',         src: '/sidebar-icons/placement-test.png' },
  { code: 'ft-palabra',      label: 'Palabra del día',   src: '/sidebar-icons/palabra-dia.png' },
  { code: 'ft-leads',        label: 'Leads',             src: '/sidebar-icons/leads.png' },
  { code: 'ft-recordatorios', label: 'Recordatorios',    src: '/sidebar-icons/recordatorios.png' },
  { code: 'ft-facturacion',  label: 'Facturación',       src: '/sidebar-icons/facturacion.png' },
  { code: 'ft-actividades',  label: 'Actividades',       src: '/sidebar-icons/actividades.png' },
  { code: 'ft-herramientas', label: 'Herramientas',      src: '/sidebar-icons/herramientas.png' },
  { code: 'ft-tutoriales',   label: 'Tutoriales',        src: '/sidebar-icons/tutoriales.png' },
  { code: 'ft-perfil',       label: 'Mi perfil',         src: '/sidebar-icons/mi-perfil.png' },
];

const BY_CODE = new Map(FRIENDLY_EMOJIS.map(e => [e.code, e]));

export function findFriendlyEmoji(code: string): FriendlyEmoji | undefined {
  return BY_CODE.get(code);
}

// Catálogo de emojis unicode comunes para el picker. Agrupados por tono
// para que el picker se lea bien sin librerías externas.
export type EmojiGroup = { title: string; emojis: string[] };

export const UNICODE_EMOJIS: EmojiGroup[] = [
  { title: 'Caras', emojis: ['😀','😄','😁','😊','😇','🙂','😉','😍','🥰','😘','😎','🤩','🥳','🤔','🤗','😅','😂','🤣','🥺','😭','😤','😡','😱','😴','🤯','🤪','😏','🫡','🫠','🫶'] },
  { title: 'Gestos', emojis: ['👍','👎','👌','🙌','👏','🙏','🤝','💪','✌️','🤞','🤟','🤘','👋','🤚','☝️','👆','👉','👈','👇','🫰','🫵','🧠','🫀'] },
  { title: 'Corazones', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💖','💗','💞','💝','💘','💓','💕','💔','❣️','💟'] },
  { title: 'Objetos', emojis: ['🎉','🎊','🎁','🎂','🏆','🥇','🥈','🥉','🏅','🎯','🔥','✨','⭐','🌟','💫','⚡','💥','💯','✅','❌','⚠️','❓','❗','💡','📌','📍','🔔','🔕','🔖','📝','📚','📖','🎓','✏️','🖊️'] },
  { title: 'Comida', emojis: ['☕','🍵','🧃','🍺','🍷','🥂','🍾','🍕','🍔','🍟','🌮','🌯','🍣','🍜','🍲','🥗','🍎','🍌','🍓','🥐','🍞','🧀','🍫','🍪','🍰','🎂','🍿'] },
  { title: 'Clima & naturaleza', emojis: ['☀️','🌤️','⛅','🌦️','🌧️','⛈️','🌩️','❄️','☃️','🌈','🌸','🌺','🌻','🌷','🌹','🌵','🍀','🌱','🌴','🐱','🐶','🦊','🐻','🐼','🦁','🐨','🦉'] },
];
