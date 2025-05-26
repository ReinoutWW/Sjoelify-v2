import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { GameService } from '@/features/games/services/game-service';
import GamePage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/lib/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/games/services/game-service', () => ({
  GameService: {
    getGame: jest.fn(),
    submitRound: jest.fn(),
  },
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    form: 'form',
    button: 'button',
  },
  AnimatePresence: ({ children }) => children,
}));

describe('GamePage', () => {
  const mockGame = {
    id: 'game-1',
    title: 'Test Game',
    currentRound: 1,
    isClosed: false,
    playerIds: ['user-1', 'user-2'],
    players: [
      { id: 'user-1', displayName: 'Player 1' },
      { id: 'user-2', displayName: 'Player 2' },
    ],
    scores: {
      'user-1': { total: 0, rounds: {} },
      'user-2': { total: 0, rounds: {} },
    },
  };

  const mockUser = {
    uid: 'user-1',
    displayName: 'Player 1',
  };

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'game-1' });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('loads and displays game information', async () => {
    let resolveGamePromise: (value: any) => void;
    const gamePromise = new Promise((resolve) => {
      resolveGamePromise = resolve;
    });
    (GameService.getGame as jest.Mock).mockReturnValue(gamePromise);

    render(<GamePage />);

    // Check loading skeleton
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve game loading
    await act(async () => {
      resolveGamePromise!(mockGame);
      await gamePromise;
    });

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    });

    // Check player information is displayed
    expect(screen.getByText(/Player 1.*You/)).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('allows score submission for current user', async () => {
    (GameService.getGame as jest.Mock).mockResolvedValue(mockGame);

    await act(async () => {
      render(<GamePage />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    });

    // Find score inputs
    const inputs = screen.getAllByRole('spinbutton');
    await act(async () => {
      fireEvent.change(inputs[0], { target: { value: '2' } });
      fireEvent.change(inputs[1], { target: { value: '3' } });
      fireEvent.change(inputs[2], { target: { value: '1' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });
    });

    // Submit scores
    const submitButton = screen.getByRole('button', { name: /submit scores/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(GameService.submitRound).toHaveBeenCalledWith(
      'game-1',
      'user-1',
      1,
      [2, 3, 1, 4]
    );
  });

  it('shows error message when game fails to load', async () => {
    const error = new Error('Failed to load game');
    (GameService.getGame as jest.Mock).mockRejectedValue(error);

    await act(async () => {
      render(<GamePage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load game/i)).toBeInTheDocument();
    });
  });

  it('shows game complete message when game is closed', async () => {
    const closedGame = { ...mockGame, isClosed: true };
    (GameService.getGame as jest.Mock).mockResolvedValue(closedGame);

    await act(async () => {
      render(<GamePage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/game complete/i)).toBeInTheDocument();
    });
  });

  it('updates UI after successful score submission', async () => {
    const initialGame = {
      ...mockGame,
      isClosed: false
    };

    const updatedGame = {
      ...mockGame,
      scores: {
        'user-1': { 
          total: 21,
          rounds: { 1: 21 }
        },
        'user-2': { total: 0, rounds: {} },
      },
    };

    (GameService.getGame as jest.Mock)
      .mockResolvedValueOnce(initialGame)
      .mockResolvedValueOnce(updatedGame);

    (GameService.submitRound as jest.Mock).mockResolvedValueOnce(undefined);

    await act(async () => {
      render(<GamePage />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockGame.title)).toBeInTheDocument();
    });

    // Submit scores
    const inputs = screen.getAllByRole('spinbutton');
    await act(async () => {
      fireEvent.change(inputs[0], { target: { value: '2' } });
      fireEvent.change(inputs[1], { target: { value: '3' } });
      fireEvent.change(inputs[2], { target: { value: '1' } });
      fireEvent.change(inputs[3], { target: { value: '4' } });

      const submitButton = screen.getByRole('button', { name: /submit scores/i });
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Total: 21/)).toBeInTheDocument();
    });
  });
}); 