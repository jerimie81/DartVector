'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HelpCircle,
  X,
  Mic,
  MicOff,
  Sparkles,
  Zap,
  RotateCcw,
  Volume2,
  Users,
  Target,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Award,
  Radio,
  Play,
} from 'lucide-react';
import { parseVoiceDartsCommand, VoiceParseResult } from '@/lib/voice-parser';

interface HouseLeagueGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'walkthrough' | 'voice_masterclass' | 'input_modes' | 'team_and_bots';

export const HouseLeagueGuideModal: React.FC<HouseLeagueGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('walkthrough');
  const [isListeningTest, setIsListeningTest] = useState<boolean>(false);
  const [testTranscript, setTestTranscript] = useState<string>('');
  const [testParseResult, setTestParseResult] = useState<VoiceParseResult | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

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
          setTestTranscript(transcript);
          const parsed = parseVoiceDartsCommand(transcript);
          setTestParseResult(parsed);
        };

        recognition.onend = () => {
          setIsListeningTest(false);
        };

        recognition.onerror = () => {
          setIsListeningTest(false);
        };

        recognitionRef.current = recognition;
      } else {
        const timer = setTimeout(() => {
          setSpeechSupported(false);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const toggleTestListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is supported in Chrome, Edge, Safari, and modern mobile browsers.');
      return;
    }

    if (isListeningTest) {
      recognitionRef.current.stop();
      setIsListeningTest(false);
    } else {
      try {
        setTestTranscript('');
        setTestParseResult(null);
        recognitionRef.current.start();
        setIsListeningTest(true);
      } catch {
        setIsListeningTest(false);
      }
    }
  }, [isListeningTest]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && dontShowAgain) {
      localStorage.setItem('dartvector_walkthrough_seen', 'true');
    }
    if (isListeningTest && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  DartVector Interactive Guide
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-zinc-950">
                  Pro Tour Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Master hands-free voice scoring, 5v5 team matches, and interactive input
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('walkthrough')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'walkthrough'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>⚡ 60-Sec Quick Start</span>
          </button>

          <button
            onClick={() => setActiveTab('voice_masterclass')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'voice_masterclass'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-amber-400/90 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>🎙️ Hands-Free Voice Entry (Spotlight)</span>
          </button>

          <button
            onClick={() => setActiveTab('input_modes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'input_modes'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 Touch & Dartboard</span>
          </button>

          <button
            onClick={() => setActiveTab('team_and_bots')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'team_and_bots'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 5v5 Teams & AI Bots</span>
          </button>
        </div>

        {/* TAB BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: 60-SEC QUICK START */}
          {activeTab === 'walkthrough' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-amber-300 font-bold block text-sm mb-0.5">
                    How Scoring Works on Dart Night
                  </strong>
                  DartVector lets you stand at the throw line and score without walking back and forth to your screen! Check out the 4 basic steps below:
                </div>
              </div>

              {/* Step 1 */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  1
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Check the Active Player / Team Banner</span>
                  <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    The top scoreboard banner highlights who is currently throwing with their avatar, team badge, and legs/sets won.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  2
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Throw Your 3 Darts at Your Physical Board</span>
                  <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Step up to the oche and throw your 3 darts. Count your turn total or remember the segments hit.
                  </span>
                </div>
              </div>

              {/* Step 3 (Voice Spotlight Callout) */}
              <div className="bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-900 p-4 rounded-2xl border-2 border-amber-500/60 flex items-start gap-3.5 shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  3
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-amber-400" />
                      Score Hands-Free with Voice or 1-Tap
                    </span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-500 text-zinc-950 rounded">
                      Featured
                    </span>
                  </div>
                  <span className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Just tap the red <strong className="text-amber-300">&quot;Voice Entry&quot;</strong> button once and speak your score:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">🗣️ Voice Dictation</strong>
                      Say <em className="text-white">&quot;140&quot;</em>, <em className="text-white">&quot;Ton 80&quot;</em>, or <em className="text-white">&quot;Bust&quot;</em>.
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">⚡ 1-Tap Quick House</strong>
                      Tap <span className="text-amber-300 font-mono font-bold">60, 100, 140, 180, 26</span> directly.
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                      <strong className="text-amber-400 block mb-0.5">🔢 Keypad / SVG Board</strong>
                      Type any total score or tap 3 darts on the SVG board.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  4
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Made a Mistake? Hands-Free Undo Anytime!</span>
                  <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Never worry about mistyping. Tap the yellow <strong className="text-amber-400">&quot;Undo Dart&quot;</strong> or <strong className="text-amber-400">&quot;Undo Turn&quot;</strong> button, or simply say <strong className="text-amber-400">&quot;Undo&quot;</strong> with voice entry to revert instantly.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOICE MASTERCLASS (SPOTLIGHT) */}
          {activeTab === 'voice_masterclass' && (
            <div className="space-y-5">
              {/* Voice Intro Card */}
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-zinc-900 p-4 sm:p-5 rounded-3xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-lg">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Hands-Free Voice Caller Engine
                    </h3>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                      Stay at the oche! Tap the mic icon on the scoreboard or your phone and speak your score naturally.
                    </p>
                  </div>
                </div>
              </div>

              {/* LIVE INTERACTIVE VOICE TEST TOOL */}
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Interactive Microphone Test
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Try speaking a score below
                  </span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={toggleTestListening}
                      className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                        isListeningTest
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                      }`}
                    >
                      {isListeningTest ? (
                        <>
                          <Mic className="w-4 h-4 animate-bounce" />
                          <span>Listening... Speak Now</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Test Voice Mic</span>
                        </>
                      )}
                    </button>

                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">
                        {isListeningTest ? 'Say "140", "Ton 80", or "Bust"' : 'Click to test your microphone'}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {speechSupported ? 'Native Web Speech API active' : 'Speech API not detected'}
                      </span>
                    </div>
                  </div>

                  {/* Recognition Result Badge */}
                  <div className="w-full sm:w-auto min-w-[200px] bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-center sm:text-right">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Heard & Parsed:</div>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      {testTranscript ? `"${testTranscript}"` : 'Awaiting speech input...'}
                    </div>
                    {testParseResult && (
                      <div className="text-[11px] font-bold text-emerald-400 mt-1">
                        👉 Recognized: {testParseResult.label || testParseResult.score || testParseResult.type}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SPOKEN PHRASES CHEAT-SHEET */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Supported Spoken Phrases & Pub Slang Dictionary
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* High Scores */}
                  <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                    <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>High Score Calls</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-zinc-300">
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;One Eighty&quot; / &quot;Ton 80&quot;</span>
                        <strong className="text-white">180 (Maximum)</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;One Forty&quot; / &quot;Ton 40&quot;</span>
                        <strong className="text-white">140</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;One Ton&quot; / &quot;Ton&quot; / &quot;100&quot;</span>
                        <strong className="text-white">100</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-mono text-zinc-400">&quot;One Twenty&quot; / &quot;Ton 20&quot;</span>
                        <strong className="text-white">120</strong>
                      </div>
                    </div>
                  </div>

                  {/* Pub Slang & Specials */}
                  <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                    <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Pub Slang & Segments</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-zinc-300">
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;Breakfast&quot; / &quot;26&quot;</span>
                        <strong className="text-white">26 (T20, 1, 5 miss)</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;Bullseye&quot; / &quot;Double Bull&quot;</span>
                        <strong className="text-white">50</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-800/60">
                        <span className="font-mono text-zinc-400">&quot;Triple Twenty&quot; / &quot;Treble 20&quot;</span>
                        <strong className="text-white">60</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-mono text-zinc-400">&quot;Outer Bull&quot; / &quot;Single Bull&quot;</span>
                        <strong className="text-white">25</strong>
                      </div>
                    </div>
                  </div>

                  {/* Any Number */}
                  <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                    <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>Any Number (0 - 180)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Simply speak any score clearly, such as <strong className="text-white">&quot;Sixty&quot;</strong>, <strong className="text-white">&quot;Eighty Five&quot;</strong>, <strong className="text-white">&quot;Forty One&quot;</strong>, or <strong className="text-white">&quot;95&quot;</strong>.
                    </p>
                  </div>

                  {/* Corrections & Undo */}
                  <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                    <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      <span>Voice Undo & Busts</span>
                    </div>
                    <div className="space-y-1 text-xs text-zinc-300">
                      <div className="flex justify-between py-0.5">
                        <span className="font-mono text-zinc-400">&quot;Undo&quot; / &quot;Go Back&quot;</span>
                        <strong className="text-amber-400">Reverts Last Throw</strong>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-mono text-zinc-400">&quot;Bust&quot; / &quot;No Score&quot;</span>
                        <strong className="text-red-400">Records 0 (Bust)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOUCH & DARTBOARD INPUT */}
          {activeTab === 'input_modes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    🏠
                  </div>
                  <h4 className="text-sm font-bold text-white">1-Tap House Quick Buttons</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Instantly enter standard turn totals with single taps on <strong>60, 100, 140, 180, 26, 41, 45, 85</strong>.
                  </p>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    🔢
                  </div>
                  <h4 className="text-sm font-bold text-white">Full Turn NumPad</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Type any turn score between 0 and 180 on a large responsive keypad and tap Enter.
                  </p>
                </div>

                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <h4 className="text-sm font-bold text-white">Interactive SVG Dartboard</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tap directly on the regulation dartboard segments on screen for pinpoint dart-by-dart tracking and heatmaps.
                  </p>
                </div>
              </div>

              {/* Checkout helper callout */}
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 p-4 rounded-2xl border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white block font-bold text-sm mb-0.5">
                    Pro Checkout Pathfinder
                  </strong>
                  Whenever you or your team reach a checkout score ($\le 170$), DartVector displays the optimal double/triple path (e.g. <strong>170 $\rightarrow$ T20, T20, Bull</strong>).
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 5v5 TEAMS & AI BOTS */}
          {activeTab === 'team_and_bots' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Two Teams Squad Matches (Up to 5v5 / 10 Players)</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  DartVector supports team battles for <strong>5v5 (10 players)</strong>, <strong>4v4 (8 players)</strong>, <strong>3v3 (6 players)</strong>, and <strong>2v2 Doubles (4 players)</strong>.
                </p>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 text-xs text-zinc-400">
                  <strong className="text-amber-400 block mb-1">Automatic Turn Rotation:</strong>
                  The engine automatically alternates throws between squads:
                  <span className="font-mono text-zinc-300 block mt-1">
                    Team 1 (P1) → Team 2 (P1) → Team 1 (P2) → Team 2 (P2) ...
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-400" />
                  <h4 className="text-sm font-bold text-white">25-Level Gaussian DartBot AI</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Practice solo or play Humans vs Bots! DartBot uses authentic 2D Gaussian scatter modeling tuned from casual pub beginner (Lvl 1) all the way up to PDC World Champion 105+ 3-dart averages (Lvl 25).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500/20"
            />
            <span>Don&apos;t show automatically next time</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (activeTab === 'walkthrough') setActiveTab('voice_masterclass');
                else if (activeTab === 'voice_masterclass') setActiveTab('input_modes');
                else if (activeTab === 'input_modes') setActiveTab('team_and_bots');
                else handleClose();
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>{activeTab === 'team_and_bots' ? 'Finish' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              Start Playing!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
