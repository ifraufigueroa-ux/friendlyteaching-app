// TOEFL Reading Passage 8 — Mock 4 (Music history)
// Subject: the emergence of jazz in New Orleans at the turn of the 20th century.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage8: TOEFLReadingPassage = {
  id:    'p8-jazz-origins',
  title: 'The Emergence of Jazz in New Orleans',
  wordCount: 707,
  paragraphs: [
    // 1
    `Historians of American music have long identified New Orleans at the turn of the twentieth century as the place where jazz first coalesced as a recognisable style. What is more difficult, and continues to be debated, is why New Orleans specifically. Many American cities of the period had substantial African-American musical traditions, brass-band cultures, and popular dance venues, yet none produced anything quite comparable in the same years. Explanations tend to emphasise the unusual demographic and cultural mixture of the city, its particular musical infrastructure, and a specific institutional shift that pushed a large number of trained musicians into unfamiliar musical territory.`,
    // 2
    `Louisiana had, since its founding, been culturally distinct from most of the American South. Colonial French and Spanish rule left legal and social traditions that permitted a much larger population of free people of colour than existed elsewhere in the region, and among this population — the so-called Creoles of colour — a tradition of formal European musical training was well established by the mid-nineteenth century. Alongside this community lived a much larger population of African-Americans whose musical practice grew primarily out of the spirituals, work songs, and rhythmic traditions of the plantations, later refined in the churches and dance halls of the city.`,
    // 3
    `In most of the American South, these two musical worlds had few opportunities to intersect. In New Orleans, they overlapped constantly. The city's neighbourhoods were densely mixed, its taverns and dance halls open to a socially varied clientele, and its brass-band culture — sustained by the frequent processions, funerals, and public celebrations of the Catholic calendar — provided a shared stage on which musicians from both traditions performed. The historian John Chilton has argued that jazz's foundational innovation, the fusion of European harmonic sophistication with African-American rhythmic invention, was possible in New Orleans in a way it was not elsewhere because in New Orleans the two traditions were physically adjacent.`,
    // 4
    `A second and more specific factor is often cited: the Louisiana state legislature's decision, in 1894, to reclassify people of mixed African and European descent under the same legal category as African-Americans, ending the intermediate status that Creoles of colour had previously enjoyed. Among the many consequences of this reclassification was that Creole musicians, who had until then largely performed in venues serving a white and Creole audience — playing formal European dance music, marches, and light operatic pieces — were increasingly restricted from those venues and pushed into working alongside African-American musicians in the more informal dance halls that welcomed them.`,
    // 5
    `The musical consequences of this forced migration were far-reaching. Creole musicians brought with them years of formal training, familiarity with written notation, and technical polish; the African-American players they now worked with brought the rhythmic devices — syncopation, the "blue" notes deliberately bent between the notes of the European scale, and a tradition of collective improvisation — that would become jazz's most distinctive features. The two groups had to find a common musical vocabulary quickly, because they were now playing together for audiences that expected dance music every night. The syntheses they arrived at during the first decade of the twentieth century are recognisable, in retrospect, as the earliest jazz.`,
    // 6
    `A last factor is technological rather than social. The commercial availability of relatively inexpensive brass instruments in the decades after the American Civil War meant that a working musician of modest means could own and maintain the tools of the trade. The cornet, trombone, and clarinet — all central to early jazz ensembles — became widely accessible in New Orleans as war-surplus and civilian production together saturated the local market. When Louis Armstrong, born in poverty in 1901, took up the cornet as a boy, he was walking a path that thousands of other New Orleans children had begun to walk in the previous quarter century.`,
    // 7
    `By the outbreak of the First World War, this convergence of factors had produced a distinctive local music, though the word "jazz" was scarcely yet used to describe it and no recordings had been made. When New Orleans musicians travelled north during the war and its aftermath — Armstrong to Chicago, others to New York — they carried the music with them, and it entered a national and, before long, international life. But the essential features of the style, and the specific mixture that made them possible, had already taken shape in the streets, halls, and marching bands of a single unusual American city.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, what continues to be debated among historians of American music?',
      options: [
        'Whether jazz originated in New Orleans at all',
        'Why jazz coalesced specifically in New Orleans rather than in other American cities with similar traditions',
        'Whether jazz is truly a distinct musical style',
        'The exact year of the first jazz recording',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "refined" in paragraph 2 is closest in meaning to',
      options: ['abandoned', 'developed and polished', 'formalised in writing', 'exported'],
      correct: 1,
    },
    {
      id: 'q3', type: 'inference', refPara: 2,
      prompt: 'What can be inferred from paragraph 2 about the Creoles of colour in mid-nineteenth-century New Orleans?',
      options: [
        'They rejected European musical forms',
        'They had a tradition of formal European musical training uncommon elsewhere in the American South',
        'They were legally identical to African-Americans throughout the century',
        'They played almost no role in the city\'s musical life',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'rhetorical-purpose', refPara: 3,
      prompt: 'Why does the author cite the historian John Chilton in paragraph 3?',
      options: [
        'To dispute the claim that jazz originated in New Orleans',
        'To argue that the physical adjacency of two musical traditions in New Orleans enabled a fusion not possible elsewhere',
        'To identify Chilton as the composer of the earliest jazz pieces',
        'To emphasise that jazz began in the Catholic churches of New Orleans',
      ],
      correct: 1,
    },
    {
      id: 'q5', type: 'factual', refPara: 4,
      prompt: 'What did the 1894 Louisiana legislation change for Creoles of colour?',
      options: [
        'It gave them access to state musical academies',
        'It reclassified them under the same legal category as African-Americans, ending their intermediate status',
        'It required them to learn written notation',
        'It banned them from performing music entirely',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'sentence-simplification', refPara: 5,
      prompt: 'Which best expresses the essential information in the highlighted sentence: "The two groups had to find a common musical vocabulary quickly, because they were now playing together for audiences that expected dance music every night."',
      options: [
        'The two groups refused to collaborate and lost their audiences',
        'Because they were now performing together nightly for dance audiences, the two groups had to develop a shared musical language rapidly',
        'Audiences demanded that European traditions replace African-American traditions',
        'The two groups continued to play in separate venues even after reclassification',
      ],
      correct: 1,
    },
    {
      id: 'q7', type: 'factual', refPara: 5,
      prompt: 'According to paragraph 5, which of the following were brought into the new synthesis by African-American musicians?',
      options: [
        'Formal training and familiarity with notation',
        'Syncopation, "blue" notes, and collective improvisation',
        'The instruments used in early jazz ensembles',
        'The Catholic calendar of processions',
      ],
      correct: 1,
    },
    {
      id: 'q8', type: 'negative-factual', refPara: 6,
      prompt: 'Paragraph 6 mentions all of the following as factors in the accessibility of brass instruments in New Orleans EXCEPT',
      options: [
        'commercial availability at relatively low cost after the Civil War',
        'the availability of war-surplus instruments',
        'ongoing civilian production of instruments',
        'a specific municipal programme to distribute cornets to children',
      ],
      correct: 3,
    },
    {
      id: 'q9', type: 'reference', refPara: 7,
      prompt: 'The word "it" in paragraph 7 (in "it entered a national and, before long, international life") refers most directly to',
      options: [
        'the First World War',
        'the music the New Orleans musicians carried with them',
        'Chicago',
        'the recording industry',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What is the main point the passage makes about the origins of jazz?',
      options: [
        'Jazz was invented by a single individual whose name is now unknown',
        'Jazz was the outcome of a specific mixture of demographic, cultural, institutional, and even technological factors present in New Orleans',
        'Jazz emerged only after New Orleans musicians moved north to Chicago',
        'Jazz would have emerged in any large American city with a brass-band culture',
      ],
      correct: 1,
    },
  ],
};
