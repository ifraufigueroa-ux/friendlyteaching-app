// FriendlyTeaching.cl — useAIGrade hook
// Client-side hook for requesting AI grading of writing/speaking submissions.

'use client';
import { useState, useCallback } from 'react';
import type { AIGradeRequest, AIGradeResponse } from '@/app/api/ai-grade/route';

export function useAIGrade() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIGradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grade = useCallback(async (req: AIGradeRequest): Promise<AIGradeResponse | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(data.error ?? `Error ${res.status}`);
        return null;
      }

      const data: AIGradeResponse = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { grade, loading, result, error, reset };
}
