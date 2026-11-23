// FriendlyTeaching.cl — Library of English-language novels
//
// 50 public-domain titles sourced from Standard Ebooks, grouped by
// CEFR band so the shelf matches a student's reading level. Each
// book has:
//   · pageUrl  — the Standard Ebooks catalogue page (used to cite the source)
//   · epubUrl  — the pre-uploaded Firebase Storage URL set by
//                scripts/upload-library-epubs.js (filled lazily — the
//                UI gracefully degrades to the original SE URL when a
//                book hasn't been mirrored yet)
//
// The Storage mirror matters because:
//   1. Standard Ebooks sometimes refuses cross-origin fetches from
//      the browser (the old HTML prototype saw this).
//   2. Pre-downloading means the first open is instant for the
//      student, not "wait while we download a 1 MB file".
//   3. We control the URL + cache headers, so repeat opens are cheap.

export type LibraryLevel = 'A' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LibraryBook {
  /** Stable id used as Firestore doc key + storage filename. */
  id:        string;
  /** Band grouping for the catalogue view. */
  level:     LibraryLevel;
  /** Human label shown on the chip (A1 · A2, B1, …). */
  levelLabel: string;
  title:     string;
  author:    string;
  /** Standard Ebooks catalogue page (public attribution + fallback). */
  pageUrl:   string;
  /** Firebase Storage mirror URL. Populated by the upload script. */
  epubUrl?:  string;
  /** Approximate word count — drives the "~X hours of reading" chip. */
  words?:    number;
}

export const LIBRARY_LEVEL_NAMES: Record<LibraryLevel, string> = {
  A:  'Básico a Pre-Intermedio',
  B1: 'Intermedio',
  B2: 'Intermedio Alto',
  C1: 'Avanzado',
  C2: 'Competencia Bilingüe',
};

/** Derive the Standard Ebooks direct .epub URL from a catalogue page.
 *  Pattern: /ebooks/<slug>/<slug2>[/<translator>] →
 *           /ebooks/.../downloads/<slug>_<slug2>[_<translator>].epub?source=download
 *  The ?source=download suffix is critical — without it SE serves an
 *  HTML meta-refresh intermediate page. */
export function pageToStandardEbooksEpub(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const slugs = parts.slice(1);
    const fileSlug = slugs.join('_');
    return `${u.origin}/${parts.join('/')}/downloads/${fileSlug}.epub?source=download`;
  } catch { return null; }
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  // ─── A · A1-A2 — Básico / Pre-intermedio ─────────────────
  { id: 'peter-rabbit',          level: 'A',  levelLabel: 'A1 · A2', title: 'Peter Rabbit & Other Tales',       author: 'Beatrix Potter',       pageUrl: 'https://standardebooks.org/ebooks/beatrix-potter/short-fiction' },
  { id: 'aesops-fables',         level: 'A',  levelLabel: 'A1 · A2', title: "Aesop's Fables",                   author: 'Aesop',                pageUrl: 'https://standardebooks.org/ebooks/aesop/fables/v-s-vernon-jones' },
  { id: 'just-so-stories',       level: 'A',  levelLabel: 'A1 · A2', title: 'Just So Stories',                  author: 'Rudyard Kipling',      pageUrl: 'https://standardebooks.org/ebooks/rudyard-kipling/just-so-stories' },
  { id: 'doctor-dolittle',       level: 'A',  levelLabel: 'A1 · A2', title: 'The Story of Doctor Dolittle',     author: 'Hugh Lofting',         pageUrl: 'https://standardebooks.org/ebooks/hugh-lofting/the-story-of-doctor-dolittle' },
  { id: 'alice-wonderland',      level: 'A',  levelLabel: 'A1 · A2', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll',        pageUrl: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel' },
  { id: 'wizard-of-oz',          level: 'A',  levelLabel: 'A1 · A2', title: 'The Wonderful Wizard of Oz',       author: 'L. Frank Baum',        pageUrl: 'https://standardebooks.org/ebooks/l-frank-baum/the-wonderful-wizard-of-oz' },
  { id: 'peter-and-wendy',       level: 'A',  levelLabel: 'A1 · A2', title: 'Peter and Wendy',                  author: 'J. M. Barrie',         pageUrl: 'https://standardebooks.org/ebooks/j-m-barrie/peter-and-wendy' },
  { id: 'tom-sawyer',            level: 'A',  levelLabel: 'A1 · A2', title: 'The Adventures of Tom Sawyer',     author: 'Mark Twain',           pageUrl: 'https://standardebooks.org/ebooks/mark-twain/the-adventures-of-tom-sawyer' },
  { id: 'black-beauty',          level: 'A',  levelLabel: 'A1 · A2', title: 'Black Beauty',                     author: 'Anna Sewell',          pageUrl: 'https://standardebooks.org/ebooks/anna-sewell/black-beauty' },
  { id: 'wind-in-the-willows',   level: 'A',  levelLabel: 'A1 · A2', title: 'The Wind in the Willows',          author: 'Kenneth Grahame',      pageUrl: 'https://standardebooks.org/ebooks/kenneth-grahame/the-wind-in-the-willows' },

  // ─── B1 ──────────────────────────────────────────────────
  { id: 'hound-of-the-baskervilles', level: 'B1', levelLabel: 'B1', title: 'The Hound of the Baskervilles',     author: 'Arthur Conan Doyle',   pageUrl: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-hound-of-the-baskervilles' },
  { id: 'time-machine',          level: 'B1', levelLabel: 'B1', title: 'The Time Machine',                     author: 'H. G. Wells',          pageUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-time-machine' },
  { id: 'christmas-carol',       level: 'B1', levelLabel: 'B1', title: 'A Christmas Carol',                    author: 'Charles Dickens',      pageUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-christmas-carol' },
  { id: 'jekyll-hyde',           level: 'B1', levelLabel: 'B1', title: 'Dr. Jekyll and Mr. Hyde',              author: 'Robert L. Stevenson',  pageUrl: 'https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde' },
  { id: 'call-of-the-wild',      level: 'B1', levelLabel: 'B1', title: 'The Call of the Wild',                 author: 'Jack London',          pageUrl: 'https://standardebooks.org/ebooks/jack-london/the-call-of-the-wild' },
  { id: 'white-fang',            level: 'B1', levelLabel: 'B1', title: 'White Fang',                           author: 'Jack London',          pageUrl: 'https://standardebooks.org/ebooks/jack-london/white-fang' },
  { id: 'invisible-man',         level: 'B1', levelLabel: 'B1', title: 'The Invisible Man',                    author: 'H. G. Wells',          pageUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-invisible-man' },
  { id: 'tarzan',                level: 'B1', levelLabel: 'B1', title: 'Tarzan of the Apes',                   author: 'Edgar Rice Burroughs', pageUrl: 'https://standardebooks.org/ebooks/edgar-rice-burroughs/tarzan-of-the-apes' },
  { id: 'secret-adversary',      level: 'B1', levelLabel: 'B1', title: 'The Secret Adversary',                 author: 'Agatha Christie',      pageUrl: 'https://standardebooks.org/ebooks/agatha-christie/the-secret-adversary' },
  { id: 'mysterious-affair-at-styles', level: 'B1', levelLabel: 'B1', title: 'The Mysterious Affair at Styles', author: 'Agatha Christie',    pageUrl: 'https://standardebooks.org/ebooks/agatha-christie/the-mysterious-affair-at-styles' },

  // ─── B2 ──────────────────────────────────────────────────
  { id: 'great-gatsby',          level: 'B2', levelLabel: 'B2', title: 'The Great Gatsby',                     author: 'F. Scott Fitzgerald',  pageUrl: 'https://standardebooks.org/ebooks/f-scott-fitzgerald/the-great-gatsby' },
  { id: 'dracula',               level: 'B2', levelLabel: 'B2', title: 'Dracula',                              author: 'Bram Stoker',          pageUrl: 'https://standardebooks.org/ebooks/bram-stoker/dracula' },
  { id: 'frankenstein',          level: 'B2', levelLabel: 'B2', title: 'Frankenstein',                         author: 'Mary Shelley',         pageUrl: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein' },
  { id: 'jane-eyre',             level: 'B2', levelLabel: 'B2', title: 'Jane Eyre',                            author: 'Charlotte Brontë',     pageUrl: 'https://standardebooks.org/ebooks/charlotte-bronte/jane-eyre' },
  { id: 'little-women',          level: 'B2', levelLabel: 'B2', title: 'Little Women',                         author: 'Louisa May Alcott',    pageUrl: 'https://standardebooks.org/ebooks/louisa-may-alcott/little-women' },
  { id: 'tale-two-cities',       level: 'B2', levelLabel: 'B2', title: 'A Tale of Two Cities',                 author: 'Charles Dickens',      pageUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-tale-of-two-cities' },
  { id: 'war-of-the-worlds',     level: 'B2', levelLabel: 'B2', title: 'The War of the Worlds',                author: 'H. G. Wells',          pageUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-war-of-the-worlds' },
  { id: 'anne-green-gables',     level: 'B2', levelLabel: 'B2', title: 'Anne of Green Gables',                 author: 'L. M. Montgomery',     pageUrl: 'https://standardebooks.org/ebooks/l-m-montgomery/anne-of-green-gables' },
  { id: 'scarlet-pimpernel',     level: 'B2', levelLabel: 'B2', title: 'The Scarlet Pimpernel',                author: 'Baroness Orczy',       pageUrl: 'https://standardebooks.org/ebooks/baroness-orczy/the-scarlet-pimpernel' },
  { id: 'phantom-opera',         level: 'B2', levelLabel: 'B2', title: 'The Phantom of the Opera',             author: 'Gaston Leroux',        pageUrl: 'https://standardebooks.org/ebooks/gaston-leroux/the-phantom-of-the-opera/alexander-teixeira-de-mattos' },

  // ─── C1 ──────────────────────────────────────────────────
  { id: 'dorian-gray',           level: 'C1', levelLabel: 'C1', title: 'The Picture of Dorian Gray',           author: 'Oscar Wilde',          pageUrl: 'https://standardebooks.org/ebooks/oscar-wilde/the-picture-of-dorian-gray' },
  { id: 'pride-prejudice',       level: 'C1', levelLabel: 'C1', title: 'Pride and Prejudice',                  author: 'Jane Austen',          pageUrl: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice' },
  { id: 'great-expectations',    level: 'C1', levelLabel: 'C1', title: 'Great Expectations',                   author: 'Charles Dickens',      pageUrl: 'https://standardebooks.org/ebooks/charles-dickens/great-expectations' },
  { id: 'sense-sensibility',     level: 'C1', levelLabel: 'C1', title: 'Sense and Sensibility',                author: 'Jane Austen',          pageUrl: 'https://standardebooks.org/ebooks/jane-austen/sense-and-sensibility' },
  { id: 'wuthering-heights',     level: 'C1', levelLabel: 'C1', title: 'Wuthering Heights',                    author: 'Emily Brontë',         pageUrl: 'https://standardebooks.org/ebooks/emily-bronte/wuthering-heights' },
  { id: 'middlemarch',           level: 'C1', levelLabel: 'C1', title: 'Middlemarch',                          author: 'George Eliot',         pageUrl: 'https://standardebooks.org/ebooks/george-eliot/middlemarch' },
  { id: 'tess-durbervilles',     level: 'C1', levelLabel: 'C1', title: "Tess of the d'Urbervilles",            author: 'Thomas Hardy',         pageUrl: 'https://standardebooks.org/ebooks/thomas-hardy/tess-of-the-durbervilles' },
  { id: 'age-of-innocence',      level: 'C1', levelLabel: 'C1', title: 'The Age of Innocence',                 author: 'Edith Wharton',        pageUrl: 'https://standardebooks.org/ebooks/edith-wharton/the-age-of-innocence' },
  { id: 'the-awakening',         level: 'C1', levelLabel: 'C1', title: 'The Awakening',                        author: 'Kate Chopin',          pageUrl: 'https://standardebooks.org/ebooks/kate-chopin/the-awakening' },
  { id: 'north-and-south',       level: 'C1', levelLabel: 'C1', title: 'North and South',                      author: 'Elizabeth Gaskell',    pageUrl: 'https://standardebooks.org/ebooks/elizabeth-gaskell/north-and-south' },

  // ─── C2 ──────────────────────────────────────────────────
  { id: 'heart-of-darkness',     level: 'C2', levelLabel: 'C2', title: 'Heart of Darkness',                    author: 'Joseph Conrad',        pageUrl: 'https://standardebooks.org/ebooks/joseph-conrad/heart-of-darkness' },
  { id: 'moby-dick',             level: 'C2', levelLabel: 'C2', title: 'Moby-Dick',                            author: 'Herman Melville',      pageUrl: 'https://standardebooks.org/ebooks/herman-melville/moby-dick' },
  { id: 'ulysses',               level: 'C2', levelLabel: 'C2', title: 'Ulysses',                              author: 'James Joyce',          pageUrl: 'https://standardebooks.org/ebooks/james-joyce/ulysses' },
  { id: 'to-the-lighthouse',     level: 'C2', levelLabel: 'C2', title: 'To the Lighthouse',                    author: 'Virginia Woolf',       pageUrl: 'https://standardebooks.org/ebooks/virginia-woolf/to-the-lighthouse' },
  { id: 'mrs-dalloway',          level: 'C2', levelLabel: 'C2', title: 'Mrs Dalloway',                         author: 'Virginia Woolf',       pageUrl: 'https://standardebooks.org/ebooks/virginia-woolf/mrs-dalloway' },
  { id: 'turn-of-the-screw',     level: 'C2', levelLabel: 'C2', title: 'The Turn of the Screw',                author: 'Henry James',          pageUrl: 'https://standardebooks.org/ebooks/henry-james/the-turn-of-the-screw' },
  { id: 'portrait-of-a-lady',    level: 'C2', levelLabel: 'C2', title: 'The Portrait of a Lady',               author: 'Henry James',          pageUrl: 'https://standardebooks.org/ebooks/henry-james/the-portrait-of-a-lady' },
  { id: 'tristram-shandy',       level: 'C2', levelLabel: 'C2', title: 'Tristram Shandy',                      author: 'Laurence Sterne',      pageUrl: 'https://standardebooks.org/ebooks/laurence-sterne/the-life-and-opinions-of-tristram-shandy-gentleman' },
  { id: 'jude-the-obscure',      level: 'C2', levelLabel: 'C2', title: 'Jude the Obscure',                     author: 'Thomas Hardy',         pageUrl: 'https://standardebooks.org/ebooks/thomas-hardy/jude-the-obscure' },
  { id: 'house-of-mirth',        level: 'C2', levelLabel: 'C2', title: 'The House of Mirth',                   author: 'Edith Wharton',        pageUrl: 'https://standardebooks.org/ebooks/edith-wharton/the-house-of-mirth' },
];

export function findLibraryBook(id: string): LibraryBook | undefined {
  return LIBRARY_BOOKS.find(b => b.id === id);
}

export function libraryBooksByLevel(): Record<LibraryLevel, LibraryBook[]> {
  const out: Record<LibraryLevel, LibraryBook[]> = { A: [], B1: [], B2: [], C1: [], C2: [] };
  for (const b of LIBRARY_BOOKS) out[b.level].push(b);
  return out;
}
