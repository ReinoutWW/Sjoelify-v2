'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/auth-context';
import { AchievementsService } from '@/features/achievements/services/achievements-service';
import { PlayerAchievement } from '@/features/achievements/types';
import { fadeIn, staggerChildren } from '@/shared/styles/animations';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      if (!user) return;
      try {
        const playerAchievements = await AchievementsService.getPlayerAchievements(user.uid);
        setAchievements(playerAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex items-center justify-center min-h-[200px]"
      >
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary-200"></div>
          <div className="space-y-3">
            <div className="h-4 w-[200px] rounded bg-primary-200"></div>
            <div className="h-4 w-[150px] rounded bg-primary-200"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  const rarityColors = {
    common: 'from-gray-100 to-gray-50 text-gray-600 border-gray-200',
    rare: 'from-blue-100 to-blue-50 text-blue-600 border-blue-200',
    epic: 'from-purple-100 to-purple-50 text-purple-600 border-purple-200',
    legendary: 'from-amber-100 to-amber-50 text-amber-600 border-amber-200'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeIn} className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
            <p className="mt-2 text-gray-600">Track your progress and unlock special achievements!</p>
          </motion.div>

          {/* Achievement Grid */}
          <motion.div
            variants={fadeIn}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${
                  rarityColors[achievement.rarity]
                } p-6 border shadow-sm`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {/* Progress Arc */}
                <div className="absolute top-0 right-0 p-4">
                  <div className="relative h-12 w-12">
                    <svg className="h-12 w-12 transform -rotate-90">
                      <circle
                        className="text-gray-200"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                      />
                      <circle
                        className={`${
                          achievement.unlockedAt ? 'text-green-500' : 'text-primary-500'
                        }`}
                        strokeWidth="2"
                        strokeDasharray={125.6}
                        strokeDashoffset={125.6 * (1 - (achievement.progress || 0) / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="20"
                        cx="24"
                        cy="24"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {achievement.unlockedAt ? '✓' : `${achievement.progress}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Achievement Content */}
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <h3 className="text-lg font-semibold">{achievement.title}</h3>
                  </div>
                  <p className="text-sm opacity-90 mb-4">{achievement.description}</p>
                  
                  {/* Rarity Badge */}
                  <div className="mt-auto">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      rarityColors[achievement.rarity]
                    }`}>
                      {achievement.rarity}
                    </span>
                    {achievement.unlockedAt && (
                      <span className="ml-2 text-xs text-gray-500">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Locked Overlay */}
                {!achievement.unlockedAt && achievement.progress < 100 && (
                  <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[1px]" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 