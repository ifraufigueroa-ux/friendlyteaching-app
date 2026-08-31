// Shared countdown hook for TOEFL runners.
//
// Uses a closure-local `remaining` counter instead of the React `left` state
// as the source of truth. React `left` is only used to trigger re-renders.
// This eliminates a class of bugs where a prior run's terminal state (left=0)
// carries over to the next `running=true` transition and fires `onExpire`
// immediately — which is what caused Speaking tasks 2-4 to skip prep+speak
// when all four tasks share the same 15s/45s timings.
//
// The interval clears itself the tick it reaches 0, so `onExpire` fires
// exactly once even if the parent is slow to unmount or flip `running`.

import { useEffect, useRef, useState } from 'react';

export function useCountdown(initialSec: number, running: boolean, onExpire?: () => void) {
  const [left, setLeft] = useState(initialSec);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    let remaining = initialSec;
    setLeft(remaining);
    const id = setInterval(() => {
      remaining -= 1;
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        expireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, initialSec]);

  return left;
}
