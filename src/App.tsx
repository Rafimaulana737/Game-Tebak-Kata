/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Play, 
  Lightbulb, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Volume2,
  Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QUESTIONS, Question } from './constants';

type GameState = 'START' | 'PLAYING' | 'FINISHED';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [useTimer, setUseTimer] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [shuffledLetters, setShuffledLetters] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  // Filter and shuffle questions
  const startGame = () => {
    let filtered = selectedCategory === 'Semua' 
      ? [...QUESTIONS] 
      : QUESTIONS.filter(q => q.category === selectedCategory);
    
    // Shuffle
    filtered = filtered.sort(() => Math.random() - 0.5);
    
    // Limit based on selection
    if (questionCount < filtered.length) {
      filtered = filtered.slice(0, questionCount);
    }
    
    setCurrentQuestions(filtered);
    setCurrentIndex(0);
    setScore(0);
    setGameState('PLAYING');
    prepareLevel(filtered[0]);
  };

  const prepareLevel = (question: Question) => {
    setUserAnswer([]);
    setShowHint(false);
    setIsWrong(false);
    setTimeLeft(60); // Reset timer to 60s
    
    const word = question.word.replace(/[- ]/g, ''); // Remove hyphens/spaces for tiles
    const letters = word.split('');
    
    // Difficulty: Add 5 random decoy letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const decoys = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]);
    
    const combined = [...letters, ...decoys].sort(() => Math.random() - 0.5);
    setShuffledLetters(combined);
  };

  const handleLetterClick = (letter: string, index: number) => {
    if (isWrong) return;

    // Check if we still need more letters
    const targetWord = currentQuestion.word.replace(/[- ]/g, '');
    if (userAnswer.length >= targetWord.length) return;

    setUserAnswer(prev => [...prev, letter]);
    const newShuffled = [...shuffledLetters];
    newShuffled.splice(index, 1);
    setShuffledLetters(newShuffled);
  };

  const handleUndo = () => {
    if (userAnswer.length === 0 || isWrong) return;
    const lastLetter = userAnswer[userAnswer.length - 1];
    setUserAnswer(prev => prev.slice(0, -1));
    setShuffledLetters(prev => [...prev, lastLetter]);
  };

  const currentQuestion = currentQuestions[currentIndex];

  // Timer Logic
  useEffect(() => {
    if (gameState !== 'PLAYING' || !useTimer) return;

    if (timeLeft <= 0) {
      // Time is up! 
      setIsWrong(true);
      setTimeout(() => {
        if (currentIndex + 1 < currentQuestions.length) {
          setCurrentIndex(prev => prev + 1);
          prepareLevel(currentQuestions[currentIndex + 1]);
        } else {
          setGameState('FINISHED');
        }
      }, 1500);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameState, useTimer, currentIndex, currentQuestions]);

  // Check answer when userAnswer matches word length
  useEffect(() => {
    if (!currentQuestion) return;
    
    const targetWord = currentQuestion.word.replace(/[- ]/g, '');
    
    if (userAnswer.length === targetWord.length) {
      if (userAnswer.join('') === targetWord) {
        // Correct!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4ADE80', '#22C55E', '#16A34A']
        });
        
        setScore(prev => prev + 10);
        
        setTimeout(() => {
          if (currentIndex + 1 < currentQuestions.length) {
            setCurrentIndex(prev => prev + 1);
            prepareLevel(currentQuestions[currentIndex + 1]);
          } else {
            setGameState('FINISHED');
          }
        }, 1000);
      } else {
        // Wrong
        setIsWrong(true);
        setTimeout(() => {
          // Reset current level input
          const combined = [...userAnswer, ...shuffledLetters];
          setShuffledLetters(combined.sort(() => Math.random() - 0.5));
          setUserAnswer([]);
          setIsWrong(false);
        }, 800);
      }
    }
  }, [userAnswer, currentQuestion, currentIndex, currentQuestions]);

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#2D2D2D] font-sans selection:bg-[#FFD93D] selection:text-black">
      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen text-center"
          >
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="bg-[#FFD93D] p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black mb-8"
            >
              <Trophy size={64} className="text-black" />
            </motion.div>
            
            <h1 className="text-5xl font-black mb-4 tracking-tight leading-none uppercase italic">
              Tebak Kata <br/> <span className="text-[#FF6B6B]">Pintar!</span>
            </h1>
            <p className="text-lg font-medium opacity-70 mb-8">
              Pilih kategori dan jumlah soal untuk memulai tantanganmu!
            </p>

            <div className="w-full space-y-8 bg-white border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-black uppercase opacity-40 mb-3 tracking-widest">Pilih Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Hewan', 'Buah', 'Tubuh Manusia', 'Semua'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-xl border-2 border-black font-bold text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                        ${selectedCategory === cat ? 'bg-[#FFD93D]' : 'bg-white hover:bg-gray-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Selection */}
              <div>
                <label className="block text-xs font-black uppercase opacity-40 mb-3 tracking-widest">Jumlah Pertanyaan</label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 20, 50, 100].map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`p-2 rounded-xl border-2 border-black font-bold text-xs sm:text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                        ${questionCount === count ? 'bg-[#FF6B6B] text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Selection */}
              <div>
                <label className="block text-xs font-black uppercase opacity-40 mb-3 tracking-widest">Mode Waktu (60s)</label>
                <button
                  onClick={() => setUseTimer(!useTimer)}
                  className={`w-full p-4 rounded-xl border-4 border-black font-bold uppercase flex items-center justify-between transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                    ${useTimer ? 'bg-[#4ADE80]' : 'bg-gray-100 opacity-60'}`}
                >
                  <span>Timer: {useTimer ? 'ON' : 'OFF'}</span>
                  <div className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${useTimer ? 'bg-white' : 'bg-gray-400'}`}>
                    <motion.div 
                      animate={{ x: useTimer ? 24 : 0 }}
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-black rounded-full" 
                    />
                  </div>
                </button>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-black text-white p-5 rounded-2xl font-black text-2xl uppercase tracking-wider hover:bg-[#2D2D2D] transition-colors flex items-center justify-center gap-3"
              >
                <Play size={24} fill="white" /> MULAI GAME
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-2 text-sm font-bold uppercase opacity-40">
              <Settings size={16} /> Dev By Rafi Maulana
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && currentQuestion && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-screen"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button 
                onClick={() => setGameState('START')}
                className="p-2 hover:bg-[#FDFCF0] rounded-xl transition-colors"
                title="Keluar"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase opacity-50 tracking-widest leading-none">Timer</span>
                <span className={`font-black text-xl ${timeLeft < 10 ? 'text-[#FF6B6B] animate-pulse' : ''}`}>
                  {useTimer ? `${timeLeft}s` : '∞'}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase opacity-50 tracking-widest leading-none">Score</span>
                <span className="font-bold text-xl text-[#4ADE80]">{score}</span>
              </div>
            </div>

            {/* Progress Bar (Overall) */}
            <div className="w-full bg-black h-2 rounded-full overflow-hidden mb-8 border border-black">
              <motion.div 
                className="h-full bg-[#FFD93D]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
              />
            </div>

            {/* Game Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="mb-6 w-full flex flex-col items-center">
                <span className="inline-block bg-[#FF6B6B] text-white text-xs font-black uppercase px-3 py-1 rounded-full mb-2">
                  Soal {currentIndex + 1} / {currentQuestions.length}
                </span>
                
                {/* Visual Clue (Hidden until shown) */}
                <div className="relative mb-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={`img-container-${currentQuestion.id}`}
                    className="w-48 h-48 sm:w-64 sm:h-64 bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative"
                  >
                    <AnimatePresence mode="wait">
                      {showHint ? (
                        <motion.img 
                          key="image"
                          initial={{ opacity: 0, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          src={`https://loremflickr.com/400/400/${currentQuestion.category.toLowerCase().replace(' ', '')},${currentQuestion.word.toLowerCase()}?lock=${currentQuestion.id}`}
                          alt="Visual Clue"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.div 
                          key="mystery"
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center text-gray-300"
                        >
                          <HelpCircle size={80} className="mb-2 opacity-20" />
                          <p className="text-xs font-black uppercase tracking-tighter opacity-20">Gambar Terkunci</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                  </motion.div>
                  
                  {/* Timer Progress Ring (Optional) */}
                  {useTimer && (
                    <div className="absolute -bottom-2 -right-2 bg-black text-white w-12 h-12 rounded-full border-4 border-[#FFD93D] flex items-center justify-center font-black text-sm z-10">
                      {timeLeft}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                   <HelpCircle className="w-6 h-6 text-[#4D96FF]" /> Petunjuk:
                </h2>
                <p className="text-xl font-medium mt-2 max-w-md mx-auto italic">
                  "{currentQuestion.hint}"
                </p>
              </div>

              {/* Answer Area */}
              <div className="flex flex-wrap justify-center gap-2 my-8 min-h-[64px]">
                {currentQuestion.word.replace(/[- ]/g, '').split('').map((_, i) => (
                  <motion.div
                    key={`answer-${i}`}
                    className={`w-10 h-12 sm:w-14 sm:h-18 flex items-center justify-center text-2xl sm:text-3xl font-black border-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors
                      ${isWrong ? 'bg-[#FF6B6B] text-white border-black animate-shake' : 
                        userAnswer[i] ? 'bg-[#FFD93D] border-black text-black' : 'bg-white border-gray-200'}`}
                    animate={{ 
                      scale: isWrong ? [1, 1.1, 1] : 1,
                      x: isWrong ? [0, -5, 5, -5, 5, 0] : 0
                    }}
                  >
                    {userAnswer[i] || ''}
                  </motion.div>
                ))}
              </div>

              {/* Options Area (Decoy Letters Included Here) */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
                <AnimatePresence>
                  {shuffledLetters.map((letter, i) => (
                    <motion.button
                      key={`letter-${i}-${letter}`}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={() => handleLetterClick(letter, i)}
                      className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-black bg-white border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FDFCF0] hover:-translate-y-1 active:translate-y-0 transition-transform"
                    >
                      {letter}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleUndo}
                  disabled={userAnswer.length === 0 || isWrong}
                  className="flex items-center gap-2 bg-white border-4 border-black px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold uppercase text-xs sm:text-sm"
                >
                  <RotateCcw size={18} /> Hapus
                </button>
                <button
                  onClick={() => setShowHint(true)}
                  disabled={showHint}
                  className={`flex items-center gap-2 border-4 border-black px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold uppercase text-xs sm:text-sm
                    ${showHint ? 'bg-gray-100 opacity-50' : 'bg-[#FFD93D] text-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none'}`}
                >
                  <Lightbulb size={18} /> Lihat Clue
                </button>
              </div>

              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-[#FFD93D] border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm"
                >
                  <p className="font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Jawaban: {currentQuestion.word}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div 
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-screen text-center"
          >
            <div className="bg-[#4ADE80] p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black mb-8 relative">
              <Trophy size={80} className="text-black" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-4 -right-4 bg-[#FFD93D] border-4 border-black p-2 rounded-full"
              >
                <CheckCircle2 size={32} />
              </motion.div>
            </div>

            <h1 className="text-5xl font-black mb-4 uppercase italic">Mantap!</h1>
            <p className="text-xl font-medium opacity-70 mb-2">Kamu berhasil menyelesaikan kategory!</p>
            <div className="text-6xl font-black text-[#FF6B6B] mb-10 tracking-widest">
              {score} XP
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button
                onClick={() => setGameState('START')}
                className="bg-[#FFD93D] border-4 border-black p-5 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
              >
                <Play size={24} className="fill-current" />
                <span className="text-2xl font-black uppercase">Main Lagi</span>
              </button>
              
              <button
                onClick={() => setGameState('START')}
                className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <span className="text-lg font-bold uppercase">Menu Utama</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
        }
      `}} />
    </div>
  );
}
