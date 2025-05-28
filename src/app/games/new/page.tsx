'use client';

import { CreateGameForm } from '@/features/games/components/CreateGameForm';

export default function NewGamePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Game</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up a new Sjoelen game with 1-10 players
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <CreateGameForm />
        </div>
      </div>
    </div>
  );
} 