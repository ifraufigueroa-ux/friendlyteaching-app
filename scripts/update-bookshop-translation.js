// Patch: rewrite the translation_game slide in the Bookshop lesson so the
// English source AND Spanish translation cover the ENTIRE story (was a
// single 4-sentence passage). Blanks redistributed across the whole text.
//
// Everything except the translation slide is left untouched.

const { initAdmin } = require('./_lessonBackup');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const LESSON_ID = 'dMqIzYmYtqYHiE3WkPK3';

// FULL story (verbatim from the reading slide) as translationText.
const FULL_EN = `Every Saturday afternoon, when the sky over the city turned grey, Mateo walked to the little bookshop on Rainy Street. The shop was old and narrow, with a wooden door that always squeaked, and a bell above it that laughed when it rang.

Inside, the smell was warm — a mix of old paper, cinnamon tea, and something like memory. The owner was Elena, a woman in her sixties who wore round glasses and a soft blue cardigan. She never asked Mateo what he wanted. She simply watched him from behind the counter and, after a moment, disappeared into the back and returned with a single book.

"For this Saturday," she would say, sliding it across the wood.

Mateo did not understand how she did it. Once she gave him a book about the sea when he had not slept for three nights. Once she gave him a book of short poems the week his grandfather died. He never told her what was happening in his life. He did not have to.

One rainy afternoon, Mateo found the courage to ask.

"Elena, how do you always choose the right book?"

She smiled, closed her eyes for a second, and answered slowly.

"I don't choose the book, Mateo. I choose the reader. Books are patient. They wait for the person who needs them."

Mateo walked home through the wet streets that day carrying a small novel about a man who learned to talk to strangers. He did not know it yet, but in three weeks he would begin a conversation on a train that would change his life.

Years later, when Elena was gone and the bookshop had become a café, Mateo still passed by Rainy Street on grey Saturdays. He would stop for a moment, look at the empty window, and whisper, "Thank you."

Some places do not disappear. They simply move inside us, and keep choosing us, again and again.`;

// Full Spanish translation — same paragraph structure and line count as EN.
// {{blank}} markers appear in the same order as blanksData below.
const FULL_ES = `Cada sábado por la tarde, cuando el cielo sobre la ciudad se ponía {{blank}}, Mateo caminaba a la pequeña librería de la calle Rainy. La tienda era vieja y {{blank}}, con una puerta de madera que siempre chirriaba, y una campana encima que reía cuando sonaba.

Adentro, el olor era cálido — una mezcla de papel viejo, té de canela y algo parecido a un {{blank}}. La dueña era Elena, una mujer de unos sesenta que llevaba anteojos redondos y un suave {{blank}} azul. Nunca le preguntaba a Mateo qué quería. Simplemente lo miraba desde detrás del {{blank}} y, después de un momento, desaparecía al fondo y volvía con un solo libro.

"Para este sábado," le decía, deslizándolo sobre la madera.

Mateo no entendía cómo lo hacía. Una vez le dio un libro sobre el mar cuando no había dormido en tres noches. Una vez le dio un libro de poemas cortos la semana en que murió su {{blank}}. Nunca le contó a Elena lo que pasaba en su vida. No hacía falta.

Una tarde lluviosa, Mateo reunió el {{blank}} para preguntarle.

"Elena, ¿cómo eliges siempre el libro correcto?"

Ella sonrió, cerró los ojos un segundo y respondió despacio.

"Yo no elijo el libro, Mateo. Elijo al {{blank}}. Los libros son {{blank}}. Esperan a la persona que los {{blank}}."

Mateo caminó a casa por las calles mojadas ese día llevando una pequeña {{blank}} sobre un hombre que aprendió a hablar con desconocidos. Todavía no lo sabía, pero en tres semanas empezaría una conversación en un tren que cambiaría su vida.

Años después, cuando Elena ya no estaba y la librería se había convertido en un café, Mateo seguía pasando por la calle Rainy los sábados grises. Se detenía un momento, miraba la ventana vacía y {{blank}}, "Gracias."

Algunos lugares no desaparecen. Simplemente se {{blank}} dentro de nosotros y siguen eligiéndonos, una y otra vez.`;

// 12 blanks, same order as {{blank}} above. Each set = correct word first,
// followed by 3 same-POS Spanish distractors within ±2 letters length.
const BLANKS = [
  { word: 'gris',       options: ['gris', 'azul', 'rosa', 'rojo'] },              // sky turned grey
  { word: 'estrecha',   options: ['estrecha', 'amplia', 'grande', 'moderna'] },   // shop was narrow
  { word: 'recuerdo',   options: ['recuerdo', 'olvido', 'silencio', 'perfume'] }, // something like memory
  { word: 'cárdigan',   options: ['cárdigan', 'sombrero', 'vestido', 'pañuelo'] },// soft blue cardigan
  { word: 'mostrador',  options: ['mostrador', 'estante', 'balcón', 'armario'] },// behind the counter
  { word: 'abuelo',     options: ['abuelo', 'hermano', 'primo', 'vecino'] },     // his grandfather died
  { word: 'valor',      options: ['valor', 'miedo', 'sueño', 'humor'] },         // found the courage
  { word: 'lector',     options: ['lector', 'escritor', 'dueño', 'cliente'] },   // I choose the reader
  { word: 'pacientes',  options: ['pacientes', 'rápidos', 'antiguos', 'ruidosos'] }, // Books are patient
  { word: 'necesitan',  options: ['necesitan', 'compran', 'olvidan', 'guardan'] }, // person who needs them
  { word: 'novela',     options: ['novela', 'revista', 'carta', 'agenda'] },     // small novel
  { word: 'susurraba',  options: ['susurraba', 'gritaba', 'lloraba', 'reía'] },  // whisper "Thank you"
  { word: 'mudan',      options: ['mudan', 'quedan', 'pierden', 'cambian'] },    // move inside us
];

// Sanity check — {{blank}} count === BLANKS.length
const markerCount = (FULL_ES.match(/\{\{blank\}\}/g) || []).length;
if (markerCount !== BLANKS.length) {
  console.error(`✗ Mismatch: FULL_ES has ${markerCount} {{blank}} markers but BLANKS has ${BLANKS.length}`);
  process.exit(1);
}

(async () => {
  initAdmin();
  const db = getFirestore();
  const ref = db.collection('textLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found:', LESSON_ID); process.exit(1); }

  const data = snap.data();
  const slides = [...(data.slides || [])];
  const idx = slides.findIndex(s => s.type === 'translation_game');
  if (idx < 0) { console.error('No translation_game slide found'); process.exit(1); }

  slides[idx] = {
    ...slides[idx],
    translationText: FULL_EN,
    content: FULL_ES,
    blanksData: BLANKS,
  };

  await ref.update({ slides, updatedAt: FieldValue.serverTimestamp() });
  console.log(`✅ Patched slide[${idx}] (translation_game) with ${BLANKS.length} blanks across full story.`);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
