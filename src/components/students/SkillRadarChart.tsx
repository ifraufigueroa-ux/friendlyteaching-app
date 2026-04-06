'use client';
// FriendlyTeaching.cl — Skill Radar Chart Component
// Renders a spider / radar chart using Recharts for a single set of skill scores.

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SkillScores } from '@/types/firebase';

const SKILL_LABELS: Record<keyof SkillScores, string> = {
  speaking: 'Hablar',
  listening: 'Escuchar',
  reading: 'Leer',
  writing: 'Escribir',
  grammar: 'Gramática',
  vocabulary: 'Vocabulario',
};

interface Props {
  scores: SkillScores;
  previousScores?: SkillScores | null;
  size?: number;
  compact?: boolean;
}

export function SkillRadarChart({ scores, previousScores, compact = false }: Props) {
  const data = (Object.keys(SKILL_LABELS) as (keyof SkillScores)[]).map(key => ({
    skill: SKILL_LABELS[key],
    value: scores[key],
    prev: previousScores?.[key] ?? undefined,
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={compact ? 200 : 280}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#E5D8F0" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{
            fill: '#5A3D7A',
            fontSize: compact ? 10 : 12,
            fontWeight: 600,
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tickCount={6}
          tick={{ fill: '#9B8AAA', fontSize: 9 }}
          axisLine={false}
        />
        {/* Previous assessment (ghost) */}
        {previousScores && (
          <Radar
            name="Anterior"
            dataKey="prev"
            stroke="#D0B8E8"
            fill="#D0B8E8"
            fillOpacity={0.15}
            strokeDasharray="4 2"
            strokeWidth={1.5}
          />
        )}
        {/* Current assessment */}
        <Radar
          name="Actual"
          dataKey="value"
          stroke="#9B7CB8"
          fill="#C8A8DC"
          fillOpacity={0.4}
          strokeWidth={2}
          dot={{ r: 4, fill: '#9B7CB8', strokeWidth: 0 }}
        />
        <Tooltip
          formatter={(value) => [`${value}/5`]}
          contentStyle={{
            background: '#FFFCF7',
            border: '1px solid #E5D8F0',
            borderRadius: 10,
            fontSize: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
