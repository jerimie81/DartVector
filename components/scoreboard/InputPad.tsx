'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DartThrow, GameRules } from '@/lib/types';
import { coordinatesToDart, getIdealTargetCoords } from '@/lib/dartboard-geometry';
import { Mic, MicOff, Delete, RotateCcw, Check, Sparkles } from 'lucide-react';

interface InputPadProps {
  rules: GameRules;
  activePlayerScore: number;
  currentTurnDarts: DartThrow[];
  onThrowDart: (dart: DartThrow) => void;
  onApplyTurnTotal: (score: number) => void;
  onUndoDart: () => void;
  onUndoTurn: () => void;
  canUndoDart: boolean;
  canUndoTurn: boolean;
  disabled?: boolean;
}

type InputTab = 'house_quick' | 'keypad' | 'dart_selector';

export const InputPad: React.FC<InputPadProps> = ({
  rules,
  activePlayerScore,
  currentTurnDarts,
  onThrowDart,
  onApplyTurnTotal,
  onUndoDart,
  onUndoTurn,
  canUndoDart,
  canUndoTurn,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<InputTab>('house_quick');
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 2 | 3>(1);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  const handleVoiceCommand = useCallback((transcript: string) => {
    // Check bust
    if (transcript.includes('bust')) {
      onApplyTurnTotal(0);
      return;
    }

    // Common phrase scores
    const spokenScores: Record<string, number> = {
      'one hundred and eighty': 180,
      'one eighty': 180,
      'one hundred eighty': 180,
      'ton eighty': 180,
      'one hundred and forty': 140,
      'one forty': 140,
      'ton forty': 140,
      'one hundred': 100,
      'ton': 100,
      'eighty five': 85,
      'sixty': 60,
      'forty five': 45,
      'twenty six': 26,
      'zero': 0,
      'no score': 0,
    };

    if (spokenScores[transcript] !== undefined) {
      onApplyTurnTotal(spokenScores[transcript]);
      return;
    }

    // Parse number
    const num = parseInt(transcript.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num) && num >= 0 && num <= 180) {
      onApplyTurnTotal(num);
    }
  }, [onApplyTurnTotal]);

  // Initialize Speech Recognition for Voice Caller Input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          setVoiceFeedback(`Heard: "${transcript}"`);
          handleVoiceCommand(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [handleVoiceCommand]);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceFeedback('Listening for score (e.g., "140", "Triple 20", "Bust")...');
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  // Keypad Handlers
  const handleKeypadDigit = (digit: string) => {
    if (keypadInput.length >= 3) return;
    const newVal = keypadInput + digit;
    const num = parseInt(newVal, 10);
    if (num <= 180) {
      setKeypadInput(newVal);
    }
  };

  const handleKeypadBackspace = () => {
    setKeypadInput((prev) => prev.slice(0, -1));
  };

  const handleKeypadSubmit = () => {
    if (!keypadInput) return;
    const score = parseInt(keypadInput, 10);
    if (!isNaN(score) && score >= 0 && score <= 180) {
      onApplyTurnTotal(score);
      setKeypadInput('');
    }
  };

  // Dart Selector button click (S20, T20, D16, etc.)
  const handleSelectDart = useCallback((segment: number, multiplier: 1 | 2 | 3) => {
    const coords = getIdealTargetCoords({ segment, multiplier });
    const result = coordinatesToDart(coords.x, coords.y);
    onThrowDart({
      segment: result.segment,
      multiplier: result.multiplier,
      score: result.score,
      label: result.label,
      x: coords.x,
      y: coords.y,
    });
  }, [onThrowDart]);

  const popularDarts = [
    { label: 'T20', seg: 20, mult: 3 as const, color: 'bg-red-600/90 text-white hover:bg-red-500' },
    { label: 'T19', seg: 19, mult: 3 as const, color: 'bg-red-600/90 text-white hover:bg-red-500' },
    { label: 'T18', seg: 18, mult: 3 as const, color: 'bg-red-600/90 text-white hover:bg-red-500' },
    { label: 'D20', seg: 20, mult: 2 as const, color: 'bg-emerald-600/90 text-white hover:bg-emerald-500' },
    { label: 'D16', seg: 16, mult: 2 as const, color: 'bg-emerald-600/90 text-white hover:bg-emerald-500' },
    { label: 'D10', seg: 10, mult: 2 as const, color: 'bg-emerald-600/90 text-white hover:bg-emerald-500' },
    { label: 'D8', seg: 8, mult: 2 as const, color: 'bg-emerald-600/90 text-white hover:bg-emerald-500' },
    { label: 'BULL', seg: 25, mult: 1 as const, color: 'bg-emerald-700 text-white hover:bg-emerald-600' },
    { label: 'D-BULL', seg: 50, mult: 2 as const, color: 'bg-red-700 text-white hover:bg-red-600' },
    { label: 'MISS', seg: 0, mult: 1 as const, color: 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' },
  ];

  const quickScores = [180, 140, 100, 85, 60, 45, 26, 0];

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Input Mode Navigation Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            id="tab-house-quick-btn"
            onClick={() => setActiveTab('house_quick')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'house_quick'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🏠 Quick Scores
          </button>
          <button
            id="tab-keypad-btn"
            onClick={() => setActiveTab('keypad')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'keypad'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔢 Turn NumPad
          </button>
          <button
            id="tab-dart-btn"
            onClick={() => setActiveTab('dart_selector')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'dart_selector'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🎯 Dart Picker
          </button>
        </div>

        {/* Voice Dictation Button */}
        <div className="flex items-center gap-2">
          <button
            id="voice-mic-btn"
            onClick={toggleVoiceRecognition}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isListening
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
            }`}
            title="Voice Caller Entry"
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{isListening ? 'Listening...' : 'Voice Entry'}</span>
          </button>
        </div>
      </div>

      {voiceFeedback && (
        <div className="text-xs font-medium text-amber-400/90 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
          {voiceFeedback}
        </div>
      )}

      {/* Current Turn Darts Status Chips & Large Undo Bar */}
      <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">Current Turn:</span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((idx) => {
              const dart = currentTurnDarts[idx];
              return (
                <div
                  key={`turn-dart-${idx}`}
                  className={`min-w-[42px] h-7 px-2 flex items-center justify-center rounded-md text-xs font-black border transition-all ${
                    dart
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {dart ? dart.label : `D${idx + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Undo controls */}
        <div className="flex items-center gap-1.5">
          {canUndoDart && (
            <button
              id="undo-dart-btn"
              onClick={onUndoDart}
              disabled={disabled}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/30 active:scale-95"
              title="Undo last thrown dart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Dart</span>
            </button>
          )}
          {canUndoTurn && (
            <button
              id="undo-turn-btn"
              onClick={onUndoTurn}
              disabled={disabled}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30 active:scale-95"
              title="Undo entire previous turn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Turn</span>
            </button>
          )}
        </div>
      </div>

      {/* HOUSE QUICK SCORES TAB (Uncle / House League Mode) */}
      {activeTab === 'house_quick' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              1-Tap Common House Scores
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">Tap once to score instantly</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[
              { score: 60, label: '60', desc: 'Single 20 x3', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 100, label: '100 (Ton)', desc: 'Ton', highlight: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
              { score: 140, label: '140', desc: 'Ton 40', highlight: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
              { score: 180, label: '180!', desc: 'Maximum', highlight: 'border-red-500/50 bg-red-500/20 text-red-300 font-black' },
              { score: 26, label: '26', desc: 'Breakfast (20-1-5)', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 41, label: '41', desc: 'Single 20-20-1', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 45, label: '45', desc: 'Triple 15 / 20-20-5', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 81, label: '81', desc: 'T19 + S12 x2', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 85, label: '85', desc: 'T15 + D20', highlight: 'border-zinc-700 bg-zinc-800' },
              { score: 0, label: '0 (Miss)', desc: 'No score', highlight: 'border-zinc-800 bg-zinc-950 text-zinc-400' },
              { score: -1, label: 'BUST', desc: 'Over score', highlight: 'border-red-500/40 bg-red-950/40 text-red-400' },
            ].map((item) => (
              <button
                key={`house-quick-${item.score}-${item.label}`}
                id={`house-quick-${item.score}-btn`}
                onClick={() => {
                  if (item.score === -1) {
                    onApplyTurnTotal(0); // bust
                  } else {
                    onApplyTurnTotal(item.score);
                  }
                }}
                disabled={disabled}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-sm ${item.highlight} hover:brightness-110`}
              >
                <span className="text-base font-black leading-none">{item.label}</span>
                <span className="text-[9px] text-zinc-400 leading-tight truncate">{item.desc}</span>
              </button>
            ))}

            {/* Quick Switch to Custom Keypad */}
            <button
              onClick={() => setActiveTab('keypad')}
              className="p-2.5 rounded-xl border border-amber-500/30 bg-zinc-900 hover:bg-zinc-800 text-amber-400 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
            >
              <span className="text-sm font-black leading-none">Other...</span>
              <span className="text-[9px] text-zinc-400 leading-tight">Type custom</span>
            </button>
          </div>
        </div>
      )}

      {/* KEYPAD (NUMPAD) TAB */}
      {activeTab === 'keypad' && (
        <div className="flex flex-col gap-3">
          {/* Quick Score Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {quickScores.map((score) => (
              <button
                key={`quick-${score}`}
                id={`quick-score-${score}-btn`}
                onClick={() => onApplyTurnTotal(score)}
                disabled={disabled}
                className="h-10 text-xs font-extrabold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-700 active:scale-95 flex items-center justify-center shadow-sm"
              >
                {score === 0 ? '0 (Bust)' : score}
              </button>
            ))}
          </div>

          {/* Keypad Display & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-14 bg-zinc-950 rounded-xl border-2 border-zinc-800 flex items-center justify-between px-4">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Score:</span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {keypadInput || '0'}
              </span>
            </div>
            <button
              id="numpad-clear-btn"
              onClick={() => setKeypadInput('')}
              className="h-14 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-xs border border-zinc-700 active:scale-95 transition-all"
            >
              CLEAR
            </button>
            <button
              id="numpad-backspace-btn"
              onClick={handleKeypadBackspace}
              className="h-14 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold border border-zinc-700 active:scale-95 transition-all flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* NumPad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={`digit-${digit}`}
                id={`numpad-digit-${digit}-btn`}
                onClick={() => handleKeypadDigit(digit)}
                disabled={disabled}
                className="h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-lg rounded-xl border border-zinc-700 active:scale-95 transition-all shadow-sm flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <button
              id="numpad-digit-0-btn"
              onClick={() => handleKeypadDigit('0')}
              disabled={disabled}
              className="col-span-1 h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-lg rounded-xl border border-zinc-700 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              0
            </button>
            <button
              id="numpad-submit-btn"
              onClick={handleKeypadSubmit}
              disabled={disabled || !keypadInput}
              className="col-span-2 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg border border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Enter Score {keypadInput ? `(${keypadInput})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* DART SELECTOR TAB */}
      {activeTab === 'dart_selector' && (
        <div className="flex flex-col gap-3">
          {/* Quick Popular Darts Row */}
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Fast Bed Selector</div>
          <div className="grid grid-cols-5 gap-1.5">
            {popularDarts.map((item) => (
              <button
                key={`popular-${item.label}`}
                id={`pop-dart-${item.label}-btn`}
                onClick={() => handleSelectDart(item.seg, item.mult)}
                disabled={disabled}
                className={`h-9 text-xs font-black rounded-lg border border-zinc-700/60 shadow-sm active:scale-95 transition-all flex items-center justify-center ${item.color}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Multiplier Modifier Selector */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
            <span className="text-xs font-bold text-zinc-400">Multiplier:</span>
            <div className="flex gap-1.5">
              <button
                id="mult-single-btn"
                onClick={() => setSelectedMultiplier(1)}
                className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                  selectedMultiplier === 1
                    ? 'bg-zinc-200 text-zinc-950 border-white'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Single (1x)
              </button>
              <button
                id="mult-double-btn"
                onClick={() => setSelectedMultiplier(2)}
                className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                  selectedMultiplier === 2
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-300'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Double (2x)
              </button>
              <button
                id="mult-treble-btn"
                onClick={() => setSelectedMultiplier(3)}
                className={`px-4 py-1.5 text-xs font-black rounded-lg border transition-all ${
                  selectedMultiplier === 3
                    ? 'bg-red-500 text-white border-red-300'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Treble (3x)
              </button>
            </div>
          </div>

          {/* All 20 Segments Matrix */}
          <div className="grid grid-cols-5 gap-1.5">
            {[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((seg) => {
              const prefix = selectedMultiplier === 3 ? 'T' : selectedMultiplier === 2 ? 'D' : 'S';
              return (
                <button
                  key={`seg-${seg}`}
                  id={`seg-${seg}-btn`}
                  onClick={() => handleSelectDart(seg, selectedMultiplier)}
                  disabled={disabled}
                  className="h-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-xs rounded-lg border border-zinc-700 active:scale-95 transition-all flex items-center justify-center"
                >
                  {prefix}{seg}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
