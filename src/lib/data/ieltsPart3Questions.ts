// FriendlyTeaching.cl — IELTS Speaking Part 3 question bank
// Questions are tagged by target band so the teacher can push the student
// up a level (more abstract, more hypothetical, more nuanced) or scale back
// to concrete, opinion-style prompts.
//
// Banding rule of thumb:
//   Band 6 → concrete, personal, present-tense, simple opinion.
//   Band 7 → comparison, change over time, advantages/disadvantages.
//   Band 8 → abstract cause-effect, hypothetical, "to what extent".
//   Band 9 → speculative, multi-faceted, philosophically loaded.

export type IELTSBand = 6 | 7 | 8 | 9;

export interface Part3Question {
  band: IELTSBand;
  topic: string;
  emoji: string;
  question: string;
}

export const IELTS_PART3_QUESTIONS: Part3Question[] = [
  // ─── Band 6 ─────────────────────────────────────────────────────────
  { band: 6, emoji: '🤖', topic: 'Technology & AI',         question: 'Do you think computers are useful in everyday life?' },
  { band: 6, emoji: '🤖', topic: 'Technology & AI',         question: 'Why do most people enjoy using technology?' },
  { band: 6, emoji: '🌍', topic: 'Environment & climate',   question: 'What can people do at home to help the environment?' },
  { band: 6, emoji: '🌍', topic: 'Environment & climate',   question: 'Is the weather in your country changing?' },
  { band: 6, emoji: '🎓', topic: 'Education & learning',    question: 'Why is education important for children?' },
  { band: 6, emoji: '🎓', topic: 'Education & learning',    question: 'Do you think school subjects today are useful for life?' },
  { band: 6, emoji: '📰', topic: 'Media & news',            question: 'Do people in your country watch a lot of TV?' },
  { band: 6, emoji: '📣', topic: 'Advertising',             question: 'Are advertisements helpful for shoppers?' },
  { band: 6, emoji: '🚨', topic: 'Fake news',               question: 'Have you ever read news online that turned out to be untrue?' },
  { band: 6, emoji: '🏛️', topic: 'Culture & society',       question: 'What are some traditional festivals in your country?' },
  { band: 6, emoji: '🛠️', topic: 'A useful skill',          question: 'What skills are useful for finding a job today?' },
  { band: 6, emoji: '🗺️', topic: 'A memorable trip',        question: 'Why do people enjoy travelling on holiday?' },
  { band: 6, emoji: '🌟', topic: 'A person you admire',     question: 'Who do most young people admire in your country?' },
  { band: 6, emoji: '📱', topic: 'A piece of technology',   question: 'What devices do families usually have at home?' },
  { band: 6, emoji: '📖', topic: 'An interesting book',     question: 'Do children in your country read many books?' },
  { band: 6, emoji: '💼', topic: 'Work & careers',          question: 'Is it important to enjoy your job?' },
  { band: 6, emoji: '🏙️', topic: 'Cities & hometowns',      question: 'What makes a city a pleasant place to live?' },
  { band: 6, emoji: '🍽️', topic: 'Food & diet',             question: 'What kinds of food are popular with families?' },
  { band: 6, emoji: '🎵', topic: 'Music',                   question: 'What music do young people listen to today?' },
  { band: 6, emoji: '⚽', topic: 'Sport',                   question: 'Why is sport good for children?' },
  { band: 6, emoji: '👫', topic: 'Friendship & community',  question: 'How do most people meet their friends?' },
  { band: 6, emoji: '🗣️', topic: 'Languages',               question: 'Why do many people want to learn English?' },

  // ─── Band 7 ─────────────────────────────────────────────────────────
  { band: 7, emoji: '🤖', topic: 'Technology & AI',         question: 'How has technology changed the way people communicate in the last twenty years?' },
  { band: 7, emoji: '🤖', topic: 'Technology & AI',         question: 'What are the main advantages of using artificial intelligence at work?' },
  { band: 7, emoji: '🌍', topic: 'Environment & climate',   question: 'Why do you think some people don\'t take climate change seriously?' },
  { band: 7, emoji: '🌍', topic: 'Environment & climate',   question: 'What can governments do to encourage greener behaviour from citizens?' },
  { band: 7, emoji: '🎓', topic: 'Education & learning',    question: 'How is online learning different from traditional classroom learning?' },
  { band: 7, emoji: '🎓', topic: 'Education & learning',    question: 'Should schools focus more on practical skills or academic subjects?' },
  { band: 7, emoji: '📰', topic: 'Media & news',            question: 'Do you think traditional newspapers will disappear in the future?' },
  { band: 7, emoji: '📣', topic: 'Advertising',             question: 'How do advertisements influence what young people buy?' },
  { band: 7, emoji: '🚨', topic: 'Fake news',               question: 'How can people tell whether the news they read online is reliable?' },
  { band: 7, emoji: '🏛️', topic: 'Culture & society',       question: 'How do younger generations help preserve cultural traditions?' },
  { band: 7, emoji: '🛠️', topic: 'A useful skill',          question: 'Why are some skills harder to learn later in life?' },
  { band: 7, emoji: '🗺️', topic: 'A memorable trip',        question: 'What kinds of trips tend to leave the strongest memories?' },
  { band: 7, emoji: '🌟', topic: 'A person you admire',     question: 'Why do public figures often have a strong influence on young people?' },
  { band: 7, emoji: '📱', topic: 'A piece of technology',   question: 'Do you think people rely too much on their smartphones?' },
  { band: 7, emoji: '📖', topic: 'An interesting book',     question: 'Why do some books remain popular for many decades?' },
  { band: 7, emoji: '💼', topic: 'Work & careers',          question: 'What factors make a workplace genuinely enjoyable?' },
  { band: 7, emoji: '🏙️', topic: 'Cities & hometowns',      question: 'How are big cities and small towns different in your country?' },
  { band: 7, emoji: '🍽️', topic: 'Food & diet',             question: 'Why has fast food become more popular than home-cooked meals?' },
  { band: 7, emoji: '🎵', topic: 'Music',                   question: 'Why does music from different generations sound so different?' },
  { band: 7, emoji: '⚽', topic: 'Sport',                   question: 'What are the benefits of team sports compared with individual sports?' },
  { band: 7, emoji: '✈️', topic: 'Travel & tourism',        question: 'How has tourism changed the places people visit most?' },
  { band: 7, emoji: '👫', topic: 'Friendship & community',  question: 'Are friendships made online as strong as friendships made in person?' },
  { band: 7, emoji: '🗣️', topic: 'Languages',               question: 'Why is it useful to know more than one language?' },

  // ─── Band 8 ─────────────────────────────────────────────────────────
  { band: 8, emoji: '🤖', topic: 'Technology & AI',         question: 'What impact might artificial intelligence have on creative industries like art and writing?' },
  { band: 8, emoji: '🤖', topic: 'Technology & AI',         question: 'In what ways could AI widen the gap between developed and developing countries?' },
  { band: 8, emoji: '🌍', topic: 'Environment & climate',   question: 'Why do governments find it so difficult to take strong action on climate change?' },
  { band: 8, emoji: '🌍', topic: 'Environment & climate',   question: 'How can individual lifestyle changes meaningfully address a problem as global as climate change?' },
  { band: 8, emoji: '🎓', topic: 'Education & learning',    question: 'How might the role of teachers change as AI becomes more common in classrooms?' },
  { band: 8, emoji: '🎓', topic: 'Education & learning',    question: 'To what extent does formal education really prepare people for the realities of working life?' },
  { band: 8, emoji: '📰', topic: 'Media & news',            question: 'How do news outlets shape public opinion on political issues?' },
  { band: 8, emoji: '📣', topic: 'Advertising',             question: 'To what extent does advertising encourage people to buy things they don\'t actually need?' },
  { band: 8, emoji: '🚨', topic: 'Fake news',               question: 'What are the long-term social effects of widespread misinformation?' },
  { band: 8, emoji: '🏛️', topic: 'Culture & society',       question: 'How does globalisation threaten the survival of local cultures?' },
  { band: 8, emoji: '🛠️', topic: 'A useful skill',          question: 'Why do schools sometimes fail to teach the skills people really need in life?' },
  { band: 8, emoji: '🗺️', topic: 'A memorable trip',        question: 'How can significant journeys reshape a person\'s view of the world?' },
  { band: 8, emoji: '🌟', topic: 'A person you admire',     question: 'Why do people often admire those who overcome adversity more than those who are simply talented?' },
  { band: 8, emoji: '📱', topic: 'A piece of technology',   question: 'How has the smartphone changed the way personal relationships are formed and maintained?' },
  { band: 8, emoji: '📖', topic: 'An interesting book',     question: 'Why is fiction sometimes more powerful than non-fiction at conveying truths about society?' },
  { band: 8, emoji: '💼', topic: 'Work & careers',          question: 'How have remote and hybrid working models reshaped career expectations?' },
  { band: 8, emoji: '🏙️', topic: 'Cities & hometowns',      question: 'What role do cities play in driving broader social and economic change?' },
  { band: 8, emoji: '🍽️', topic: 'Food & diet',             question: 'How does the global food industry contribute to environmental problems?' },
  { band: 8, emoji: '🎵', topic: 'Music',                   question: 'In what ways does music reflect the values of a particular generation?' },
  { band: 8, emoji: '⚽', topic: 'Sport',                   question: 'How does professional sport mirror broader changes in society?' },
  { band: 8, emoji: '✈️', topic: 'Travel & tourism',        question: 'What are the cultural costs of mass tourism on host communities?' },
  { band: 8, emoji: '👫', topic: 'Friendship & community',  question: 'How have digital communication tools changed the very nature of friendship?' },
  { band: 8, emoji: '🗣️', topic: 'Languages',               question: 'How does losing a minority language affect the identity of a community?' },

  // ─── Band 9 ─────────────────────────────────────────────────────────
  { band: 9, emoji: '🤖', topic: 'Technology & AI',         question: 'To what extent should governments regulate artificial intelligence to balance innovation with public safety?' },
  { band: 9, emoji: '🤖', topic: 'Technology & AI',         question: 'In what ways might increasing reliance on AI reshape our understanding of human creativity and authorship?' },
  { band: 9, emoji: '🌍', topic: 'Environment & climate',   question: 'How do tensions between economic growth and environmental sustainability reflect deeper philosophical disagreements about progress?' },
  { band: 9, emoji: '🌍', topic: 'Environment & climate',   question: 'To what extent are individual carbon-conscious choices undermined by the political and economic structures we live within?' },
  { band: 9, emoji: '🎓', topic: 'Education & learning',    question: 'Could the rise of personalised AI tutoring fundamentally undermine the social purposes of formal schooling?' },
  { band: 9, emoji: '🎓', topic: 'Education & learning',    question: 'Should education prioritise the cultivation of character over the transmission of knowledge?' },
  { band: 9, emoji: '📰', topic: 'Media & news',            question: 'In an era of algorithmic curation, can the press still meaningfully claim to inform public debate?' },
  { band: 9, emoji: '📣', topic: 'Advertising',             question: 'Does the persuasive power of modern advertising erode our ability to make genuinely autonomous choices?' },
  { band: 9, emoji: '🚨', topic: 'Fake news',               question: 'How might widespread misinformation reshape democratic institutions over the coming decades?' },
  { band: 9, emoji: '🏛️', topic: 'Culture & society',       question: 'To what extent is cultural identity inevitably reshaped by economic forces beyond a society\'s control?' },
  { band: 9, emoji: '🛠️', topic: 'A useful skill',          question: 'As automation accelerates, which uniquely human skills will become most valuable, and why?' },
  { band: 9, emoji: '🗺️', topic: 'A memorable trip',        question: 'Can transformative travel still exist in a world where every destination has already been documented and shared?' },
  { band: 9, emoji: '🌟', topic: 'A person you admire',     question: 'Why does society sometimes elevate deeply flawed figures as role models, and what does that say about its collective values?' },
  { band: 9, emoji: '📱', topic: 'A piece of technology',   question: 'Does our growing dependence on personal technology represent genuine empowerment or a subtle loss of autonomy?' },
  { band: 9, emoji: '📖', topic: 'An interesting book',     question: 'In a culture saturated with short-form content, can long-form literature still retain its capacity to shape thought?' },
  { band: 9, emoji: '💼', topic: 'Work & careers',          question: 'How might shifts in the nature of work redefine concepts like identity, purpose and community over the next generation?' },
  { band: 9, emoji: '🏙️', topic: 'Cities & hometowns',      question: 'How do cities both reflect and accelerate broader transformations in human civilisation?' },
  { band: 9, emoji: '🍽️', topic: 'Food & diet',             question: 'Could the way societies eat become a meaningful indicator of their underlying ethical values?' },
  { band: 9, emoji: '🎵', topic: 'Music',                   question: 'In an age of streaming and algorithmic discovery, can music still serve as a unifying force across generations?' },
  { band: 9, emoji: '⚽', topic: 'Sport',                   question: 'What role does elite sport play in reinforcing or challenging national narratives?' },
  { band: 9, emoji: '✈️', topic: 'Travel & tourism',        question: 'To what extent does the modern travel industry commodify experiences that were once considered transformative?' },
  { band: 9, emoji: '👫', topic: 'Friendship & community',  question: 'How might the increasing mediation of relationships through technology reshape human notions of intimacy and trust?' },
  { band: 9, emoji: '🗣️', topic: 'Languages',               question: 'How do linguistic shifts mirror deeper changes in how societies understand power, identity and belonging?' },

  // ─── Extra topical clusters (2026 refresh) ────────────────────────
  // Money & finance
  { band: 6, emoji: '💰', topic: 'Money & finance',          question: 'Do young people in your country tend to save money?' },
  { band: 7, emoji: '💰', topic: 'Money & finance',          question: 'Why do you think some people find it hard to manage their money?' },
  { band: 8, emoji: '💰', topic: 'Money & finance',          question: 'How does financial insecurity shape the choices people make about work and family?' },
  { band: 9, emoji: '💰', topic: 'Money & finance',          question: 'To what extent do prevailing attitudes toward wealth reveal a society\'s underlying values?' },

  // Health & wellbeing
  { band: 6, emoji: '🏥', topic: 'Health & wellbeing',       question: 'What do people in your country do to stay healthy?' },
  { band: 7, emoji: '🏥', topic: 'Health & wellbeing',       question: 'Why do you think mental health is discussed more openly today than in the past?' },
  { band: 8, emoji: '🏥', topic: 'Health & wellbeing',       question: 'How do modern lifestyles contribute to the rise of chronic health problems?' },
  { band: 9, emoji: '🏥', topic: 'Health & wellbeing',       question: 'To what extent should healthcare be treated as a public responsibility rather than an individual one?' },

  // Family & generations
  { band: 6, emoji: '👨‍👩‍👧', topic: 'Family & generations',    question: 'Do families in your country spend a lot of time together?' },
  { band: 7, emoji: '👨‍👩‍👧', topic: 'Family & generations',    question: 'How is family life today different from family life in your parents\' generation?' },
  { band: 8, emoji: '👨‍👩‍👧', topic: 'Family & generations',    question: 'What social forces are reshaping the traditional family unit in most countries?' },
  { band: 9, emoji: '👨‍👩‍👧', topic: 'Family & generations',    question: 'How might shifting family structures redefine what people expect from private life and public policy?' },

  // Government, laws & citizenship
  { band: 6, emoji: '🏛️', topic: 'Government & laws',        question: 'What are some rules that everyone in your country has to follow?' },
  { band: 7, emoji: '🏛️', topic: 'Government & laws',        question: 'Why is it important for citizens to be involved in their community?' },
  { band: 8, emoji: '🏛️', topic: 'Government & laws',        question: 'How much responsibility should governments take for shaping citizens\' behaviour, and where should that stop?' },
  { band: 9, emoji: '🏛️', topic: 'Government & laws',        question: 'To what extent can democratic institutions still hold power accountable in an era of concentrated economic influence?' },
];
