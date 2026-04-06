// FriendlyTeaching.cl — useAILesson hook
// Client-side hook for AI lesson generation.

'use client';
import { useState, useCallback } from 'react';
import type { AILessonRequest, AILessonResponse } from '@/app/api/ai-lesson/route';

export function useAILesson() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AILessonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (req: AILessonRequest): Promise<AILessonResponse | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(data.error ?? `Error ${res.status}`);
        return null;
      }

      const data: AILessonResponse = await res.json();
      setResult(data);
      return data;
    } catch {
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

  return { generate, loading, result, error, reset };
}
