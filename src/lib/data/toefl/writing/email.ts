// TOEFL Writing — Write an Email prompts.
//
// One prompt per mock. Each scenario places the student in a specific
// role (student, employee, tenant) and asks them to reply to a short
// received email. The rubric-graded reply must:
//   1. Address ALL three key points listed.
//   2. Match the register of the received email (formal / neutral).
//   3. Stay ≥ 90 words and land under 7 minutes.
//
// AI-graded on task response + organisation + language use, 0-5 raw.

import type { TOEFLEmailPrompt } from '@/types/toefl';

export const emailPromptMock1: TOEFLEmailPrompt = {
  id: 'w1-email-library-hours',
  scenario:
    `You are a first-year student. You have received an email from the university library about a change in opening hours that affects your study group.`,
  receivedEmail: {
    from:    'Ms. Chen · Library Services',
    subject: 'Reduced weekend hours starting next month',
    body:
      `Dear students,\n\nStarting on 1 March, the main library will close at 6 pm on Saturdays and Sundays instead of the current 10 pm. This change is due to reduced overnight staffing. If you use the library frequently on weekend evenings, please write back so we can consider your feedback before finalising the schedule.\n\nBest regards,\nMs. Chen`,
  },
  taskInstruction:
    `Write a reply to Ms. Chen that addresses ALL three points below. Your reply should be at least 90 words.`,
  keyPoints: [
    'Explain how often you currently use the library on weekend evenings.',
    'Say how the new schedule would affect your study group.',
    'Suggest one alternative that would help students in your situation.',
  ],
  minWords: 90,
  timerMin: 7,
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Dear Ms. Chen,\n\nThank you for asking for feedback before changing the schedule.\n\nMy study group meets in the main library almost every Saturday and Sunday evening, usually from six to nine. We are a group of four second-year students preparing for our statistics final in April, and the quiet study rooms on the third floor are the only place on campus that stays consistently silent during that stretch of the week.\n\nIf the library closes at six, we will lose our main revision window. Moving to a café is not really an option — the noise makes group problem-solving very difficult.\n\nOne alternative that would help many of us would be to keep the third-floor study rooms open until nine on weekends, even if the rest of the building closes. That would need only one member of staff to sign students in and out, which might fit the reduced overnight staffing you mentioned.\n\nThank you for considering this suggestion.\n\nBest regards,\nMartín Herrera`,
    whyItWorks: [
      'Cubre los tres puntos en orden y sin ambigüedad — el rubric premia esa completitud.',
      'Registro formal apropiado ("Dear Ms. Chen", "Best regards") — matchea el email recibido.',
      'Detalles concretos (six to nine, four students, statistics final) que hacen creíble el pedido.',
      'Propuesta accionable y realista (staff mínimo) — muestra empatía con la restricción del emisor.',
      'Estructura clara con párrafos que separan cada punto — organisation score alto.',
    ],
  },
};

export const emailPromptMock2: TOEFLEmailPrompt = {
  id: 'w2-email-professor-extension',
  scenario:
    `You are a student who has been sick for a week. You have received an email from your professor about a paper that is due tomorrow.`,
  receivedEmail: {
    from:    'Prof. Martin · Media Studies 210',
    subject: 'Final paper — reminder',
    body:
      `Dear students,\n\nThis is a reminder that your final paper on "news consumption habits" is due tomorrow, Friday, at 5 pm. Late submissions lose one letter grade per day. If any of you have serious difficulties finishing on time, please email me before the deadline and explain the situation.\n\nRegards,\nProf. Martin`,
  },
  taskInstruction:
    `Write a reply to Prof. Martin that addresses ALL three points below. Your reply should be at least 90 words.`,
  keyPoints: [
    'Explain the situation that is preventing you from finishing on time.',
    'Say clearly what you are requesting (e.g. an extension) and for how long.',
    'Offer to send what you have so far or meet during office hours if useful.',
  ],
  minWords: 90,
  timerMin: 7,
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Dear Prof. Martin,\n\nThank you for the reminder. I am writing to explain my situation before the deadline, as you suggested in your email.\n\nI have been at home with the flu since last Friday and I am still recovering. I lost most of last weekend to a high fever and I have only been able to work in short sessions this week. My paper on news consumption habits is roughly two thirds complete, but I still need to run one final analysis and revise the conclusion.\n\nWould it be possible to have an extension until Monday, 5 pm? That would give me the weekend to finish the draft properly without submitting rushed work.\n\nI can send you what I have so far this evening if that is helpful, or I could stop by your office hours on Monday to discuss the direction of the argument. I have kept a doctor's note in case you need it.\n\nThank you very much for your understanding.\n\nBest regards,\nDaniela Ochoa`,
    whyItWorks: [
      'Nombra el pedido explícito ("extension until Monday, 5 pm") — no deja que el profe adivine cuánto tiempo pide.',
      'Registro académico consistente con el "Prof. Martin" del email recibido.',
      'Muestra responsabilidad: menciona que dos tercios ya están listos, ofrece adelantarlo, ofrece doctor\'s note.',
      'Propone dos formas concretas de seguir (mandar borrador o ir a office hours) — cubre el punto 3.',
      'Tono maduro sin súplica ni excusas exageradas — el evaluador humano lo lee como profesional.',
    ],
  },
};

export const emailPromptMock3: TOEFLEmailPrompt = {
  id: 'w3-email-scholarship-reference',
  scenario:
    `You have applied for a study-abroad scholarship. You have received an email from the scholarship office asking for one more document.`,
  receivedEmail: {
    from:    'Scholarship Office',
    subject: 'Missing document — reference letter',
    body:
      `Dear applicant,\n\nWe have received your application, but the reference letter listed in your file has not arrived. Applications without a reference letter cannot proceed to the interview stage. The revised deadline is Wednesday of next week at 5 pm. Please tell us how you plan to resolve this so we can note it in your file.\n\nBest,\nScholarship Office`,
  },
  taskInstruction:
    `Write a reply to the Scholarship Office that addresses ALL three points below. Your reply should be at least 90 words.`,
  keyPoints: [
    'Confirm that you understand the new deadline and thank them for the extension.',
    'Explain who your reference is and when the letter will arrive.',
    'Ask what happens if the letter arrives one or two days late.',
  ],
  minWords: 90,
  timerMin: 7,
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Dear Scholarship Office,\n\nThank you for reaching out and for granting me additional time until Wednesday at 5 pm. I understand that my application cannot move to the interview stage without the reference letter, and I appreciate the extension.\n\nMy reference is Dr. Patel, who supervised my undergraduate research project last year. She confirmed by email this morning that she has drafted the letter and expects to submit it by Monday. I have asked her to send it directly to your office as well as to me, so we both have a record of the submission.\n\nOne last question: if for any reason the letter is delayed by one or two days beyond Wednesday, is there a mechanism (for example, a provisional submission or a note from my referee) that would allow my application to remain in the pool? I would like to know so I can plan accordingly and communicate with Dr. Patel if any issue comes up.\n\nThank you again for your help.\n\nBest regards,\nJorge Salinas`,
    whyItWorks: [
      'Confirma la fecha explícitamente ("Wednesday at 5 pm") — muestra que leyó el email con cuidado.',
      'Nombra al referente ("Dr. Patel"), su rol y una fecha concreta — cubre el punto 2 sin generalidades.',
      'La pregunta del punto 3 es específica y educada: pide un procedimiento, no un favor.',
      'Estrategia doble ("directly to your office as well as to me") demuestra planificación proactiva.',
      'Cierre neutral y profesional, sin sobreagradecer — matchea el registro del "Scholarship Office".',
    ],
  },
};

export const emailPromptMock4: TOEFLEmailPrompt = {
  id: 'w4-email-internship-decision',
  scenario:
    `You are a computer-science student who applied for a summer internship. You have received an email offering you the position, but with conditions.`,
  receivedEmail: {
    from:    'Ms. Lin · Recruiting, Nova AI',
    subject: 'Internship offer — decision needed by Friday',
    body:
      `Dear candidate,\n\nWe are pleased to offer you our summer internship starting on 3 June for ten weeks. The role is on-site in Santiago and is offered as unpaid, though we do cover a monthly commuting stipend. Please confirm by this Friday whether you accept, and let us know if you have any questions before you decide.\n\nBest,\nMs. Lin`,
  },
  taskInstruction:
    `Write a reply to Ms. Lin that addresses ALL three points below. Your reply should be at least 90 words.`,
  keyPoints: [
    'Thank her for the offer and say clearly whether you plan to accept.',
    'Ask one specific question about the terms (compensation, hours, or remote days).',
    'Mention one detail about your schedule or commitments that Ms. Lin should know about.',
  ],
  minWords: 90,
  timerMin: 7,
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Dear Ms. Lin,\n\nThank you very much for the offer. I am very interested in the internship at Nova AI and I intend to accept, subject to one clarification and one small scheduling note.\n\nMy question is about the working schedule. The email mentions on-site work in Santiago; would there be any flexibility for one remote day per week, or is the team fully in person? I ask because my current thesis supervisor and I meet each Wednesday morning and I would like to protect that slot until I defend in mid-July.\n\nOn the same topic, I want to be transparent about my calendar. My thesis defence is scheduled for 15 July, which falls in the sixth week of the internship. I would need one full day off that week to defend. I can adjust hours in the surrounding days to compensate.\n\nThank you again for the opportunity. I look forward to your reply.\n\nBest regards,\nCamila Rojas`,
    whyItWorks: [
      'Dice el "sí" claramente y de entrada, sin dejarlo colgando — señala profesionalismo.',
      'La pregunta del punto 2 es concreta y con razón (thesis supervisor) — no un "just wondering".',
      'La revelación del thesis defence es proactiva y ofrece compensación de horas — muestra ownership.',
      'Registro neutro-profesional apropiado al email de recruiting.',
      'Estructura: aceptación → pregunta → información + solución → cierre. Cada párrafo cumple una función.',
    ],
  },
};
