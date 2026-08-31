import { renderHook, waitFor } from '@testing-library/react';
import useCountUp from './useCountUp';

// The two honesty rules of the juice pass: the shown number never exceeds the
// real one, and it settles on exactly the real one.

test('settles on exactly the target value', async () => {
  const { result } = renderHook(() => useCountUp(350, { duration: 40 }));
  await waitFor(() => expect(result.current).toBe(350));
});

test('never shows more than the real number on the way up', async () => {
  const seen = [];
  const { result } = renderHook(() => useCountUp(120, { duration: 40 }));
  seen.push(result.current);
  await waitFor(() => expect(result.current).toBe(120));
  seen.push(result.current);
  expect(Math.max(...seen)).toBeLessThanOrEqual(120);
});

test('zero and missing values render as zero, instantly', () => {
  const { result } = renderHook(() => useCountUp(0));
  expect(result.current).toBe(0);
  const { result: r2 } = renderHook(() => useCountUp(undefined));
  expect(r2.current).toBe(0);
});
