import { renderHook, act } from '@testing-library/react';
import { getTheme, setTheme, useTheme, nightClass, THEME_KEY } from './theme';

beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.theme; });

test('morning by default, night when chosen, remembered in this browser', () => {
  expect(getTheme()).toBe('morning');
  expect(setTheme('night')).toBe('night');
  expect(localStorage.getItem(THEME_KEY)).toBe('night');
  expect(document.documentElement.dataset.theme).toBe('night');
  expect(getTheme()).toBe('night');
  expect(setTheme('nonsense')).toBe('morning');
});

test('every page root hears the switch', () => {
  const { result } = renderHook(() => useTheme());
  expect(result.current).toBe('morning');
  act(() => { setTheme('night'); });
  expect(result.current).toBe('night');
  expect(nightClass('night', 'kh--night')).toBe(' night kh--night');
  expect(nightClass('morning', 'kh--night')).toBe('');
});
