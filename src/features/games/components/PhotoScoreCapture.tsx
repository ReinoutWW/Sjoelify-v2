'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon, PhotoIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/context/auth-context';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { fadeIn } from '@/shared/styles/animations';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import app from '@/lib/firebase/config';

interface PhotoScoreCaptureProps {
  onScoresConfirmed: (scores: number[]) => void;
  onCancel: () => void;
}

interface DetectionResult {
  scores: number[];
  totalScore: number;
  confidence: number;
  totalDiscs: number;
  details: Array<{
    position: number;
    points: number;
    count: number;
  }>;
}

// Helper function to convert File to base64
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { 
      data: await base64EncodedDataPromise, 
      mimeType: file.type 
    },
  };
}

export function PhotoScoreCapture({ onScoresConfirmed, onCancel }: PhotoScoreCaptureProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [adjustedScores, setAdjustedScores] = useState<number[]>([0, 0, 0, 0]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  const gates = [
    { points: '2', dots: 2 },
    { points: '3', dots: 3 },
    { points: '4', dots: 4 },
    { points: '1', dots: 1 },
  ];

  // Automatically start analysis when image is loaded
  useEffect(() => {
    if (imageFile && imagePreview && !isAnalyzing && !detectionResult) {
      handleAnalyze();
    }
  }, [imageFile, imagePreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !user || !app) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Initialize Firebase AI
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      const model = getGenerativeModel(ai, { model: "gemini-2.5-pro-preview-05-06" });

      // Convert image to the required format
      const imagePart = await fileToGenerativePart(imageFile);

      // Prepare the prompt
      const prompt = `Analyze this Sjoelen (Dutch shuffleboard) board image and count the wooden discs in each gate.

CRITICAL INSTRUCTIONS:
1. You will ALWAYS be given a photo of the end score.
2. Look at the END of the board where there are 4 vertical gates/slots
3. Gates are numbered 1-4 from LEFT to RIGHT with point values: 2, 3, 4, 1

COUNTING METHOD:
- Start with gate 1 (leftmost): Count all visible discs inside
- Move to gate 2: Count all visible discs inside  
- Move to gate 3: Count all visible discs inside
- End with gate 4 (rightmost): Count all visible discs inside

IMPORTANT DETAILS:
- Discs can be stacked vertically - count each disc in the stack
- Common stack heights: 1-5 discs (stacks of 4 reach near the top)
- Maximum 30 total discs in the entire game
- Gate 4 (1-point) often contains more discs than others
- Some gates may have 0 discs - that's normal
- Most gates have between 0-10 discs

ACCURACY TIPS:
- Look for shadows that might hide discs
- Check edges carefully - partial discs don't count
- If unsure about a disc, look for the complete circular shape
- Zoom in mentally on each gate to avoid missing stacked discs

CONFIDENCE LEVELS:
- 90-100%: Crystal clear view, all discs easily countable
- 70-89%: Good view but some shadows or minor stacking
- 50-69%: Difficult lighting or significant stacking
- Below 50%: Poor image quality or obstructed view

Analyze carefully and return ONLY this JSON format:
{
  "gates": [
    {"position": 1, "points": 2, "count": <actual count, can be 0>},
    {"position": 2, "points": 3, "count": <actual count, can be 0>},
    {"position": 3, "points": 4, "count": <actual count, can be 0>},
    {"position": 4, "points": 1, "count": <actual count, can be 0>}
  ],
  "confidence": <0-100>,
  "totalDiscs": <sum of all counts>,
  "notes": "<any difficulties encountered>"
}`;

      // Generate content with the image
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();
      
      // Parse the JSON response
      let detectionResult;
      try {
        // Extract JSON from the response (sometimes wrapped in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        detectionResult = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse AI response:', text);
        setError('Failed to parse detection results');
        return;
      }

      // Validate the result
      if (!detectionResult.gates || detectionResult.gates.length !== 4) {
        setError('Invalid detection format');
        return;
      }

      // Calculate total score
      const totalScore = detectionResult.gates.reduce((sum: number, gate: any) => {
        return sum + (gate.count * gate.points);
      }, 0);

      // Format for our app (array of counts in gate order 2-3-4-1)
      const scores = detectionResult.gates.map((gate: any) => gate.count);

      // Additional validation
      const totalFromGates = detectionResult.gates.reduce((sum: number, gate: any) => sum + gate.count, 0);
      if (totalFromGates !== detectionResult.totalDiscs) {
        console.warn('Total discs mismatch:', { calculated: totalFromGates, reported: detectionResult.totalDiscs });
        detectionResult.totalDiscs = totalFromGates; // Use calculated total
      }

      if (detectionResult.totalDiscs > 30) {
        console.warn('Total discs exceeds maximum of 30, capping at 30');
        // Scale down proportionally if over 30
        const scale = 30 / detectionResult.totalDiscs;
        detectionResult.gates.forEach((gate: any) => {
          gate.count = Math.floor(gate.count * scale);
        });
        detectionResult.totalDiscs = 30;
      }

      // Log notes if present for debugging
      if (detectionResult.notes) {
        console.log('Detection notes:', detectionResult.notes);
      }

      const formattedResult: DetectionResult = {
        scores,
        totalScore,
        confidence: detectionResult.confidence || 0,
        totalDiscs: detectionResult.totalDiscs,
        details: detectionResult.gates
      };

      setDetectionResult(formattedResult);
      setAdjustedScores(scores);
    } catch (err) {
      console.error('Detection error:', err);
      if (err instanceof Error) {
        if (err.message.includes('billing')) {
          setError('Gemini API requires billing to be enabled in Firebase Console');
        } else if (err.message.includes('API key')) {
          setError('Gemini API not properly configured. Enable it in Firebase Console → AI Logic');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to analyze image');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScoreAdjustment = (index: number, delta: number) => {
    const newScores = [...adjustedScores];
    newScores[index] = Math.max(0, Math.min(30, newScores[index] + delta));
    setAdjustedScores(newScores);
  };

  const calculateTotalScore = (scores: number[]) => {
    // Calculate complete sets
    const minDiscs = Math.min(...scores);
    const completeSetPoints = minDiscs * 20;
    
    // Calculate leftover points
    const leftoverPoints = scores.reduce((total, score, index) => {
      const pointValue = parseInt(gates[index].points);
      return total + ((score - minDiscs) * pointValue);
    }, 0);
    
    return completeSetPoints + leftoverPoints;
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {t.games.photoScoreDetection}
            </h3>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Image Upload */}
            {!detectionResult && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      {t.games.takePhoto}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      {t.games.choosePhoto}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Board preview"
                        className="w-full h-auto"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="bg-white rounded-lg p-4">
                            <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
                            <p className="mt-2 text-sm text-gray-600">{t.games.analyzingBoard}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review and Adjust */}
            {detectionResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Confidence indicator */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{t.games.detectionConfidence}</span>
                    <span className={`text-sm font-semibold ${confidenceColor(detectionResult.confidence)}`}>
                      {detectionResult.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        detectionResult.confidence >= 80 ? 'bg-green-600' :
                        detectionResult.confidence >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${detectionResult.confidence}%` }}
                    />
                  </div>
                  {detectionResult.confidence < 80 && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-start gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {t.games.lowConfidenceWarning}
                    </p>
                  )}
                </div>

                {/* Detected scores with adjustment */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    {t.games.detectedDiscCounts}
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {gates.map((gate, index) => (
                      <div key={index} className="text-center">
                        <div className="flex items-center justify-center gap-0.5 mb-2">
                          {Array.from({ length: gate.dots }).map((_, i) => (
                            <div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-blue-500"
                            />
                          ))}
                        </div>
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-2">
                          <div className="text-xs text-gray-500 mb-1">{gate.points} {t.games.pts}</div>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleScoreAdjustment(index, -1)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-xl font-semibold text-gray-900 w-8 text-center">
                              {adjustedScores[index]}
                            </span>
                            <button
                              onClick={() => handleScoreAdjustment(index, 1)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          {adjustedScores[index] !== detectionResult.scores[index] && (
                            <div className="text-xs text-orange-600 mt-1">
                              {t.games.changedFrom} {detectionResult.scores[index]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total score preview */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{t.games.totalScore}</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {calculateTotalScore(adjustedScores)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {t.games.total} {t.games.discs}: {adjustedScores.reduce((a, b) => a + b, 0)} / 30
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDetectionResult(null);
                      setImagePreview(null);
                      setImageFile(null);
                      setError(null);
                      setAdjustedScores([0, 0, 0, 0]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <CameraIcon className="h-4 w-4 inline mr-2" />
                    {t.games.retakePhoto}
                  </button>
                  <button
                    onClick={() => onScoresConfirmed(adjustedScores)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {t.games.confirmScores}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error display */}
            {error && (
              <div className="space-y-4">
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{t.games.detectionError}</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setImagePreview(null);
                    setImageFile(null);
                    setDetectionResult(null);
                    setAdjustedScores([0, 0, 0, 0]);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <CameraIcon className="h-4 w-4 inline mr-2" />
                  {t.games.retakePhoto}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 