'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon, XMarkIcon, ChartBarIcon, TrophyIcon, ClipboardDocumentIcon, ArrowPathIcon, HandThumbUpIcon, HandThumbDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { UserSettingsService } from '@/features/account/services/user-settings-service';
import { useAuth } from '@/lib/context/auth-context';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/vertexai';
import app from '@/lib/firebase/config';

interface PlayerStatistics {
  gamesPlayed: number;
  averageScore: number;
  personalBest: number;
  bestAverage: number;
  scoreHistory: { date: Date; score: number; relativeScore: number }[];
  averageScoreHistory: { date: Date; average: number }[];
  lastPlayed: Date | null;
  timePeriod: 'week' | 'month' | 'year' | 'all';
  gateStats?: {
    gate1: { average: number; recent: number[]; trend: 'improving' | 'declining' | 'stable' };
    gate2: { average: number; recent: number[]; trend: 'improving' | 'declining' | 'stable' };
    gate3: { average: number; recent: number[]; trend: 'improving' | 'declining' | 'stable' };
    gate4: { average: number; recent: number[]; trend: 'improving' | 'declining' | 'stable' };
  };
}

interface AIProfileCoachProps {
  playerName: string;
  stats: PlayerStatistics;
}

export function AIProfileCoach({ playerName, stats }: AIProfileCoachProps) {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const [coachPreference, setCoachPreference] = useState<'supportive' | 'balanced' | 'super-competitive'>('balanced');
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Load coach preference
  useEffect(() => {
    const loadSettings = async () => {
      if (user?.uid) {
        try {
          const settings = await UserSettingsService.getUserSettings(user.uid);
          setCoachPreference(settings?.coachPreference || 'balanced');
        } catch (error) {
          console.error('Error loading coach preference:', error);
        }
      }
    };
    loadSettings();
  }, [user?.uid]);

  const handleCoachButtonClick = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // Generate analysis when user opens the coach
    if (!hasGenerated) {
      generateAnalysis();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReaction = (type: 'up' | 'down') => {
    setReaction(type);
    // Could send this feedback to analytics
    console.log(`User reacted with: ${type}`);
  };

  const handleRegenerate = () => {
    setHasGenerated(false);
    setAnalysis('');
    setReaction(null);
    generateAnalysis();
  };

  // Parse analysis and replace stat references with formatted badges
  const parseAnalysisWithIcons = (text: string) => {
    if (!text) return null;

    // Define stat patterns and their corresponding icons
    const statPatterns = [
      {
        pattern: /<games_played>(\d+)<\/games_played>/,
        globalPattern: /<games_played>(\d+)<\/games_played>/g,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-purple-500 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        ),
        color: 'text-purple-600'
      },
      {
        pattern: /<average>(\d+)<\/average>/,
        globalPattern: /<average>(\d+)<\/average>/g,
        icon: <ChartBarIcon className="w-3.5 h-3.5 text-blue-500 inline" />,
        color: 'text-blue-600'
      },
      {
        pattern: /<personal_best>(\d+)<\/personal_best>/,
        globalPattern: /<personal_best>(\d+)<\/personal_best>/g,
        icon: <TrophyIcon className="w-3.5 h-3.5 text-amber-500 inline" />,
        color: 'text-amber-600'
      },
      {
        pattern: /<best_avg>(\d+)<\/best_avg>/,
        globalPattern: /<best_avg>(\d+)<\/best_avg>/g,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-emerald-500 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
          </svg>
        ),
        color: 'text-emerald-600'
      },
      {
        pattern: /<gate(\d)>(\d+(?:\.\d+)?)<\/gate\d>/,
        globalPattern: /<gate(\d)>(\d+(?:\.\d+)?)<\/gate\d>/g,
        icon: null, // Will be handled specially for gate numbers
        color: 'text-indigo-600'
      }
    ];

    // Split text into parts and process
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Create a combined pattern to find all stat references
    const allPatterns = statPatterns.map(sp => sp.globalPattern.source).join('|');
    const combinedPattern = new RegExp(allPatterns, 'g');
    
    const matches = Array.from(text.matchAll(combinedPattern));
    
    matches.forEach((match) => {
      // Add text before the match
      if (match.index! > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      // Determine which pattern matched
      const fullMatch = match[0];
      
      // Handle gate pattern specially
      if (fullMatch.match(/<gate(\d)>(\d+(?:\.\d+)?)<\/gate\d>/)) {
        const gateMatch = fullMatch.match(/<gate(\d)>(\d+(?:\.\d+)?)<\/gate\d>/);
        if (gateMatch) {
          const gateNumber = gateMatch[1];
          const value = gateMatch[2];
          elements.push(
            <span key={`stat-${keyCounter++}`} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-md text-xs font-semibold text-indigo-600">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-indigo-200 rounded-full text-[10px]">
                {gateNumber}
              </span>
              {value}
            </span>
          );
        }
      } else {
        // Handle other patterns
        for (const statPattern of statPatterns) {
          // Use non-global pattern for capturing groups
          const statMatch = fullMatch.match(statPattern.pattern);
          if (statMatch && statPattern.icon) {
            const value = statMatch[1];
            elements.push(
              <span key={`stat-${keyCounter++}`} className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md text-xs font-semibold ${statPattern.color}`}>
                {statPattern.icon}
                {value}
              </span>
            );
            break;
          }
        }
      }

      lastIndex = match.index! + match[0].length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : [text];
  };

  const generateAnalysis = async () => {
    if (hasGenerated || isLoading) return;
    
    setIsLoading(true);
    setIsMinimized(false);
    setAnalysis(''); // Clear any previous analysis
    setShowSparkles(false);
    
    // Calculate additional insights
    const recentGames = stats.scoreHistory.slice(-10);
    const isImproving = recentGames.length >= 5 && 
      recentGames.slice(-5).reduce((sum, g) => sum + g.score, 0) / 5 >
      recentGames.slice(0, 5).reduce((sum, g) => sum + g.score, 0) / 5;
    
    const consistency = stats.scoreHistory.length > 0 ? 
      Math.round(Math.sqrt(stats.scoreHistory.reduce((sum, g) => sum + Math.pow(g.score - stats.averageScore, 2), 0) / stats.scoreHistory.length)) : 0;
    
    const weeksSinceLastGame = stats.lastPlayed ? 
      Math.floor((new Date().getTime() - stats.lastPlayed.getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0;

    const promptText = `You are Sjef Sjoelbaas, an expert AI sjoelen coach analyzing ${playerName}'s profile statistics.

Coach personality: ${coachPreference}
${coachPreference === 'supportive' ? 'Be encouraging, positive, and focus on strengths while gently suggesting improvements.' :
  coachPreference === 'balanced' ? 'Provide honest, constructive feedback with a mix of praise and actionable improvement tips.' :
  'Be direct, factual, and demanding. Focus on what needs improvement with high standards.'}

PLAYER STATISTICS (${stats.timePeriod === 'all' ? 'All Time' : 
  stats.timePeriod === 'year' ? 'Last Year' : 
  stats.timePeriod === 'month' ? 'Last 30 Days' : 'Last 7 Days'}):
- Games Played: ${stats.gamesPlayed}
- Average Score: ${stats.averageScore}
- Personal Best: ${stats.personalBest}
- Best Game Average: ${stats.bestAverage}
- Score Consistency (StdDev): ±${consistency}
- Recent Trend: ${isImproving ? 'Improving' : 'Needs attention'}
- Last Played: ${weeksSinceLastGame === 0 ? 'This week' : `${weeksSinceLastGame} weeks ago`}

${stats.gateStats ? `
GATE PERFORMANCE (MUST REFERENCE THESE):
- Gate 1 (1pt): Average ${stats.gateStats.gate1.average} discs, trend: ${stats.gateStats.gate1.trend}
- Gate 2 (2pt): Average ${stats.gateStats.gate2.average} discs, trend: ${stats.gateStats.gate2.trend}
- Gate 3 (3pt): Average ${stats.gateStats.gate3.average} discs, trend: ${stats.gateStats.gate3.trend}
- Gate 4 (4pt): Average ${stats.gateStats.gate4.average} discs, trend: ${stats.gateStats.gate4.trend}
` : ''}

Language: ${locale === 'nl' ? 'Dutch' : 'English'}

IMPORTANT: When referencing specific statistics in your response, you MUST use these exact XML-style tags:
- For games played: <games_played>NUMBER</games_played>
- For average score: <average>NUMBER</average>
- For personal best: <personal_best>NUMBER</personal_best>
- For best average: <best_avg>NUMBER</best_avg>
- For gate statistics: <gate1>NUMBER</gate1>, <gate2>NUMBER</gate2>, <gate3>NUMBER</gate3>, <gate4>NUMBER</gate4>

Example: "With <games_played>${stats.gamesPlayed}</games_played> games played and an average of <average>${stats.averageScore}</average> points..."
${stats.gateStats ? `
Gate example: "Your gate distribution shows <gate1>${stats.gateStats.gate1.average}</gate1> discs in gate 1, <gate2>${stats.gateStats.gate2.average}</gate2> in gate 2, <gate3>${stats.gateStats.gate3.average}</gate3> in gate 3, and <gate4>${stats.gateStats.gate4.average}</gate4> in the valuable gate 4."` : ''}

Provide a comprehensive analysis in ${stats.gateStats ? '3' : '2-3'} paragraphs:
1. Overall performance assessment based on the statistics
${stats.gateStats ? `2. MANDATORY Gate Analysis: You MUST discuss ALL four gates using the XML tags. Reference the exact averages:
   - Gate 1: <gate1>${stats.gateStats.gate1.average}</gate1> discs (${stats.gateStats.gate1.trend} trend)
   - Gate 2: <gate2>${stats.gateStats.gate2.average}</gate2> discs (${stats.gateStats.gate2.trend} trend)
   - Gate 3: <gate3>${stats.gateStats.gate3.average}</gate3> discs (${stats.gateStats.gate3.trend} trend)  
   - Gate 4: <gate4>${stats.gateStats.gate4.average}</gate4> discs (${stats.gateStats.gate4.trend} trend)
   Analyze which gates are strongest/weakest and what the trends indicate.` : '2. Specific strengths and areas for improvement'}
3. ${stats.gateStats ? 'Concrete improvement tips based on gate performance and overall play' : 'Concrete tips for improvement based on the data'}

Be specific and reference the actual statistics using the XML tags. ${stats.gateStats ? 'YOU MUST USE ALL FOUR GATE TAGS WITH THEIR EXACT AVERAGES IN YOUR RESPONSE!' : ''}
Keep it concise but insightful. Maximum ${stats.gateStats ? '200' : '150'} words.`;
    
    try {
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, {
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: coachPreference === 'supportive' ? 0.9 : 
                      coachPreference === 'balanced' ? 0.75 : 0.5,
          maxOutputTokens: 300,
        }
      });
      
      // Use streaming for better UX
      const result = await model.generateContentStream(promptText);
      
      let fullText = '';
      setIsLoading(false); // Stop loading spinner as soon as streaming starts
      setIsStreaming(true); // Start streaming indicator
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          // Update analysis with animation effect
          setAnalysis(fullText);
          
          // Scroll to bottom if needed
          if (messageRef.current) {
            messageRef.current.scrollTop = messageRef.current.scrollHeight;
          }
          
          // Small delay for word-by-word effect
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      }
      
      setIsStreaming(false);
      setHasGenerated(true);
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 3000);
    } catch (error) {
      console.error('Error generating analysis:', error);
      setIsLoading(false);
      setIsStreaming(false);
      setAnalysis(locale === 'nl' ? 
        "Ik kon je statistieken nu niet analyseren. Probeer het later opnieuw." :
        "I couldn't analyze your statistics right now. Please try again later.");
    }
  };

  // Calculate data badges with proper icons
  const badges = [
    {
      label: t.statistics.gamesPlayed,
      value: stats.gamesPlayed,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-purple-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      )
    },
    {
      label: t.games.average,
      value: stats.averageScore,
      icon: <ChartBarIcon className="w-3.5 h-3.5 text-blue-500" />,
      trend: stats.scoreHistory.length > 10 ? 
        (stats.scoreHistory.slice(-5).reduce((sum, g) => sum + g.score, 0) / 5 > stats.averageScore ? '↗️' : '↘️') : null
    },
    {
      label: t.statistics.best,
      value: stats.personalBest,
      icon: <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
    },
    ...(stats.bestAverage > 0 ? [{
      label: t.profile.bestAvg,
      value: stats.bestAverage,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-emerald-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
        </svg>
      )
    }] : [])
  ];

  // Get mood color based on coach preference
  const getMoodColor = () => {
    switch (coachPreference) {
      case 'supportive': return 'from-green-400 to-emerald-400';
      case 'balanced': return 'from-blue-400 to-indigo-400';
      case 'super-competitive': return 'from-red-400 to-orange-400';
      default: return 'from-purple-400 to-indigo-400';
    }
  };

  return (
    <>
      {/* Floating Coach Button/Window */}
      <AnimatePresence>
        {!isOpen ? (
          // Initial floating button - always visible
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={handleCoachButtonClick}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SparklesIcon className="w-6 h-6" />
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm rounded-lg py-1 px-3 whitespace-nowrap">
                {locale === 'nl' ? 'AI Statistiek Coach' : 'AI Statistics Coach'}
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-6 ${
              isMinimized ? 'right-6' : 'left-4 right-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm'
            } z-50`}
          >
            {isMinimized ? (
              // Minimized state - floating button with mood indicator
              <motion.button
                onClick={() => setIsMinimized(false)}
                className={`bg-gradient-to-r ${getMoodColor()} text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SparklesIcon className="w-6 h-6" />
                {hasGenerated && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </motion.button>
            ) : (
              // Expanded state - full chat window
              <motion.div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
              >
                {/* Header - Updated with mood indicator */}
                <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 p-4 border-b border-gray-200 relative overflow-hidden">
                  {/* Animated mood gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${getMoodColor()} opacity-5`} />
                  
                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getMoodColor()} rounded-full flex items-center justify-center relative`}>
                        <SparklesIcon className="w-6 h-6 text-white" />
                        {/* Mood indicator ring */}
                        <motion.div
                          className={`absolute inset-0 rounded-full bg-gradient-to-r ${getMoodColor()} opacity-30`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Sjef Sjoelbaas</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          {isStreaming ? (
                            <>
                              <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                {locale === 'nl' ? 'Aan het analyseren' : 'Analyzing'}
                              </motion.span>
                              <motion.span className="flex gap-0.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.span
                                    key={i}
                                    className="w-1 h-1 bg-gray-400 rounded-full"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                  />
                                ))}
                              </motion.span>
                            </>
                          ) : (
                            (t.settings.aiCoachDescription || 'Your AI Statistics Coach')
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 relative">
                  {/* Sparkle effects */}
                  <AnimatePresence>
                    {showSparkles && (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            initial={{ 
                              opacity: 0,
                              x: `${20 + (i * 15)}%`,
                              y: `${10 + (i * 12)}%`,
                              scale: 0
                            }}
                            animate={{ 
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              rotate: 360
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ 
                              duration: 2,
                              delay: i * 0.1,
                              ease: "easeOut"
                            }}
                          >
                            <SparklesIcon className="w-4 h-4 text-purple-400" />
                          </motion.div>
                        ))}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Data Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {badges.map((badge, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                      >
                        {badge.icon}
                        <span>{badge.label}:</span>
                        <span className="font-bold">{badge.value}</span>
                        {badge.trend && <span className="ml-0.5">{badge.trend}</span>}
                      </motion.div>
                    ))}
                  </div>

                  {/* Analysis Message */}
                  <div 
                    ref={messageRef}
                    className="prose prose-sm max-w-none text-gray-700 max-h-64 overflow-y-auto custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#e5e7eb #f3f4f6'
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        <span className="text-gray-500">
                          {locale === 'nl' ? 'Je statistieken analyseren...' : 'Analyzing your statistics...'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis ? (
                          analysis.split('\n\n').map((paragraph, index) => (
                            <motion.p 
                              key={index} 
                              className="text-sm leading-relaxed relative"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              {parseAnalysisWithIcons(paragraph)}
                              {isStreaming && index === analysis.split('\n\n').length - 1 && (
                                <span className="inline-block w-1 h-4 bg-purple-600 animate-pulse ml-0.5 align-middle" />
                              )}
                            </motion.p>
                          ))
                        ) : (
                          <div className="h-20" /> // Placeholder to prevent layout shift
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <AnimatePresence>
                    {!isLoading && !isStreaming && analysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 flex items-center justify-between gap-2"
                      >
                        {/* Reaction buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleReaction('up')}
                            className={`p-1.5 rounded-lg transition-all ${
                              reaction === 'up' 
                                ? 'bg-green-100 text-green-600' 
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <HandThumbUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReaction('down')}
                            className={`p-1.5 rounded-lg transition-all ${
                              reaction === 'down' 
                                ? 'bg-red-100 text-red-600' 
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <HandThumbDownIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Utility buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all relative"
                            title={locale === 'nl' ? 'Kopieer' : 'Copy'}
                          >
                            {copied ? (
                              <CheckIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={handleRegenerate}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                            title={locale === 'nl' ? 'Opnieuw genereren' : 'Regenerate'}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Period indicator */}
                  <AnimatePresence>
                    {!isLoading && !isStreaming && analysis && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="mt-3 pt-3 border-t border-gray-200"
                      >
                        <p className="text-xs text-gray-500 text-center">
                          {locale === 'nl' ? 'Analyse gebaseerd op' : 'Analysis based on'} {
                            stats.timePeriod === 'all' ? (t.statistics.allTime || 'all time') :
                            stats.timePeriod === 'year' ? (t.profile.lastYear || 'last year') :
                            stats.timePeriod === 'month' ? (t.statistics.last30Days || 'last 30 days') :
                            (t.statistics.last7Days || 'last 7 days')
                          } {locale === 'nl' ? 'gegevens' : 'data'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
} 