import { act, fireEvent, render, screen } from '@testing-library/react';
import ChestTray from './ChestTray';
import { awardChest, CHEST_EVENT } from '../../utils/chests';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

describe('the chest waits, then reveals fixed contents', () => {
  beforeEach(() => { localStorage.clear(); mockNavigate.mockClear(); jest.useFakeTimers(); });
  afterEach(() => jest.useRealTimers());

  test('nothing shows until a chest is earned, and then only a small waiting chest', () => {
    const { container } = render(<ChestTray />);
    expect(container.firstChild).toBeNull();
    act(() => { awardChest('level-4'); });
    expect(screen.getByRole('button', { name: /chest to open/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opening it reveals what that level unlocked, and offers to wear it', () => {
    awardChest('level-4');
    render(<ChestTray />);
    fireEvent.click(screen.getByRole('button', { name: /chest to open/ }));
    act(() => { jest.advanceTimersByTime(1200); });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Level 4: Builder' })).toBeInTheDocument();
    expect(screen.getAllByText('Hacker Outfit').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Wear it' }));
    expect(mockNavigate).toHaveBeenCalledWith('/character');
  });

  test('a badge chest goes to the profile, and an opened chest never comes back', () => {
    awardChest('first-build');
    render(<ChestTray />);
    fireEvent.click(screen.getByRole('button', { name: /chest to open/ }));
    act(() => { jest.advanceTimersByTime(1200); });
    expect(screen.getAllByText('First build').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('button', { name: /chest to open/ })).not.toBeInTheDocument();
    act(() => { awardChest('first-build'); window.dispatchEvent(new Event(CHEST_EVENT)); });
    expect(screen.queryByRole('button', { name: /chest to open/ })).not.toBeInTheDocument();
  });
});
