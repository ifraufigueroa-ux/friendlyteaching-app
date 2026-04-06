// FriendlyTeaching.cl — Gamification engine
// Badge definitions, XP calculations, streak logic, level thresholds.

import type { Badge, BadgeId, StudentGamification } from '@/types/firebase';

// ── Badge Catalog ─────────────────────────────────────────────

export const BADGE_CATALOG: Record<BadgeId, Omit<Badge, 'unlockedAt'>> = {
  first_lesson:      { id: 'first_lesson',      name: 'Primer Paso',       description: 'Completa tu primera lección',               icon: '🎯', xpReward: 20 },
  five_lessons:      { id: 'five_lessons',       name: 'En Racha',          description: 'Completa 5 lecciones',                      icon: '🔥', xpReward: 50 },
  ten_lessons:       { id: 'ten_lessons',        name: 'Dedicado',          description: 'Completa 10 lecciones',                     icon: '⭐', xpReward: 100 },
  perfect_score:     { id: 'perfect_score',      name: 'Perfección',        description: 'Obtén 100% en una tarea',                   icon: '💎', xpReward: 30 },
  streak_3:          { id: 'streak_3',           name: 'Consistente',       description: 'Racha de estudio de 3 días',                icon: '📅', xpReward: 15 },
  streak_7:          { id: 'streak_7',           name: 'Semana Completa',   description: 'Racha de estudio de 7 días',                icon: '🏆', xpReward: 40 },
  streak_30:         { id: 'streak_30',          name: 'Imparable',         description: 'Racha de estudio de 30 días',               icon: '👑', xpReward: 150 },
  homework_hero:     { id: 'homework_hero',      name: 'Héroe de Tareas',   description: 'Envía 10 tareas a tiempo',                  icon: '📝', xpReward: 60 },
  early_bird:        { id: 'early_bird',         name: 'Madrugador',        description: 'Envía tarea antes del plazo 5 veces',       icon: '🐦', xpReward: 40 },
  vocabulary_master: { id: 'vocabulary_master',   name: 'Vocabulario Pro',   description: 'Completa 5 slides de vocabulario',          icon: '📚', xpReward: 35 },
  grammar_guru:      { id: 'grammar_guru',        name: 'Gurú Gramático',   description: 'Completa 5 slides de gramática',            icon: '✏️', xpReward: 35 },
  level_up:          { id: 'level_up',            name: 'Subida de Nivel',  description: 'Sube de nivel por primera vez',              icon: '🚀', xpReward: 25 },
  all_skills:        { id: 'all_skills',          name: 'Completo',         description: 'Puntaje 4+ en todas las habilidades',       icon: '🌟', xpReward: 100 },
};

// ── Level Thresholds ──────────────────────────────────────────

const XP_PER_LEVEL = 100;

export function xpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const currentLevelXp = xp % XP_PER_LEVEL;
  return {
    current: currentLevelXp,
    needed: XP_PER_LEVEL,
    progress: currentLevelXp / XP_PER_LEVEL,
  };
}

export function getLevelTitle(level: number): string {
  if (level <= 2)  return 'Principiante';
  if (level <= 5)  return 'Aprendiz';
  if (level <= 10) return 'Estudiante';
  if (level <= 20) return 'Avanzado';
  if (level <= 35) return 'Experto';
  return 'Maestro';
}

// ── Streak Logic ──────────────────────────────────────────────

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function calculateStreak(lastActivityDate: string, currentStreak: number): { newStreak: number; isNewDay: boolean } {
  const today = getTodayStr();
  if (lastActivityDate === today) {
    return { newStreak: currentStreak, isNewDay: false };
  }
  const yesterday = getYesterdayStr();
  if (lastActivityDate === yesterday) {
    return { newStreak: currentStreak + 1, isNewDay: true };
  }
  // Streak broken — start fresh
  return { newStreak: 1, isNewDay: true };
}

// ── Badge Check Logic ─────────────────────────────────────────

export function checkNewBadges(stats: StudentGamification): BadgeId[] {
  const earned = new Set(stats.badges);
  const newBadges: BadgeId[] = [];

  const check = (id: BadgeId, condition: boolean) => {
    if (!earned.has(id) && condition) newBadges.push(id);
  };

  check('first_lesson',      stats.lessonsCompleted >= 1);
  check('five_lessons',      stats.lessonsCompleted >= 5);
  check('ten_lessons',       stats.lessonsCompleted >= 10);
  check('perfect_score',     stats.perfectScores >= 1);
  check('streak_3',          stats.currentStreak >= 3 || stats.longestStreak >= 3);
  check('streak_7',          stats.currentStreak >= 7 || stats.longestStreak >= 7);
  check('streak_30',         stats.currentStreak >= 30 || stats.longestStreak >= 30);
  check('homework_hero',     stats.homeworksOnTime >= 10);
  check('early_bird',        stats.homeworksOnTime >= 5);
  // level_up is checked externally when level changes

  return newBadges;
}

// ── Weekly XP Key ─────────────────────────────────────────────

export function getCurrentWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ── Default Gamification Profile ──────────────────────────────

export function createDefaultGamification(studentId: string): Omit<StudentGamification, 'id' | 'createdAt'> {
  return {
    studentId,
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    lessonsCompleted: 0,
    homeworksSubmitted: 0,
    homeworksOnTime: 0,
    perfectScores: 0,
    badges: [],
    weeklyXp: {},
  };
}
