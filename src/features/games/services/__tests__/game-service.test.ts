import { collection, addDoc, doc, getDoc, getDocs, query, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GameService } from '../game-service';
import { Game, Round } from '../../types';

jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');

describe('GameService', () => {
  const mockGame: Partial<Game> = {
    id: 'game-1',
    title: 'Test Game',
    createdBy: 'user-1',
    playerIds: ['user-1', 'user-2'],
    currentRound: 1,
    isClosed: false,
    scores: {
      'user-1': { total: 0, rounds: {} },
      'user-2': { total: 0, rounds: {} }
    }
  };

  const mockPlayers = [
    { id: 'user-1', displayName: 'Player 1' },
    { id: 'user-2', displayName: 'Player 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue('games-collection');
    (doc as jest.Mock).mockReturnValue({ id: 'game-1' });
    (query as jest.Mock).mockReturnValue('mock-query');
  });

  describe('createGame', () => {
    it('creates a new game with initial state', async () => {
      const mockDocRef = { id: 'new-game-id' };
      (addDoc as jest.Mock).mockResolvedValueOnce(mockDocRef);

      const gameId = await GameService.createGame('Test Game', 'user-1', ['user-1', 'user-2']);

      expect(collection).toHaveBeenCalledWith(db, 'games');
      expect(addDoc).toHaveBeenCalledWith(
        'games-collection',
        expect.objectContaining({
          title: 'Test Game',
          createdBy: 'user-1',
          playerIds: ['user-1', 'user-2'],
          currentRound: 1,
          isClosed: false,
          scores: {
            'user-1': { total: 0, rounds: {} },
            'user-2': { total: 0, rounds: {} }
          }
        })
      );
      expect(gameId).toBe('new-game-id');
    });
  });

  describe('getGame', () => {
    it('returns game with player details', async () => {
      const mockGameDoc = {
        exists: () => true,
        data: () => ({ 
          title: mockGame.title,
          createdBy: mockGame.createdBy,
          playerIds: mockGame.playerIds,
          currentRound: mockGame.currentRound,
          isClosed: mockGame.isClosed,
          scores: mockGame.scores
        }),
        id: 'game-1'
      };

      const mockPlayersSnapshot = {
        docs: mockPlayers.map(player => ({
          data: () => player,
          id: player.id
        }))
      };

      const mockRoundsSnapshot = {
        docs: []
      };

      (getDoc as jest.Mock).mockResolvedValueOnce(mockGameDoc);
      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockPlayersSnapshot)
        .mockResolvedValueOnce(mockRoundsSnapshot);

      const game = await GameService.getGame('game-1');

      expect(game).toEqual({
        title: mockGame.title,
        createdBy: mockGame.createdBy,
        playerIds: mockGame.playerIds,
        currentRound: mockGame.currentRound,
        isClosed: mockGame.isClosed,
        scores: mockGame.scores,
        id: 'game-1',
        players: mockPlayers,
        rounds: []
      });
    });

    it('returns null for non-existent game', async () => {
      const mockGameDoc = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValueOnce(mockGameDoc);

      const game = await GameService.getGame('non-existent');
      expect(game).toBeNull();
    });
  });

  describe('submitRound', () => {
    it('submits a round and updates game state', async () => {
      const mockGameDoc = {
        exists: () => true,
        data: () => mockGame,
      };

      const mockRoundDocs = {
        docs: []
      };

      (getDoc as jest.Mock).mockResolvedValueOnce(mockGameDoc);
      (getDocs as jest.Mock).mockResolvedValueOnce(mockRoundDocs);
      (runTransaction as jest.Mock).mockImplementationOnce(async (db, callback) => {
        await callback({ get: () => mockGameDoc, set: jest.fn(), update: jest.fn() });
      });

      await GameService.submitRound('game-1', 'user-1', 1, [2, 3, 1, 4]);

      expect(doc).toHaveBeenCalledWith(db, 'games', 'game-1');
      expect(runTransaction).toHaveBeenCalled();
    });

    it('throws error if game is closed', async () => {
      const mockClosedGame = { ...mockGame, isClosed: true };
      const mockGameDoc = {
        exists: () => true,
        data: () => mockClosedGame,
      };

      (getDoc as jest.Mock).mockResolvedValueOnce(mockGameDoc);
      (runTransaction as jest.Mock).mockImplementationOnce(async (db, callback) => {
        await callback({ get: () => mockGameDoc });
      });

      await expect(
        GameService.submitRound('game-1', 'user-1', 1, [2, 3, 1, 4])
      ).rejects.toThrow('Game is already closed');
    });
  });
}); 