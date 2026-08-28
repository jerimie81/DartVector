'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameType,
  GameRules,
  PlayerProfile,
  DartThrow,
  MatchRecord,
} from '@/lib/types';
import {
  GameState,
  createNewMatch,
  applyDartToState,
  applyTotalScoreToState,
} from '@/lib/game-engine';
import { simulateBotThrow, selectModeBotTarget } from '@/lib/dartbot';
import { soundEngine } from '@/lib/sound-system';
import { storageEngine, DEFAULT_PLAYERS } from '@/lib/storage';
import { getCheckoutSuggestion } from '@/lib/checkout-engine';

// Components
import { InteractiveDartboard } from '@/components/dartboard/InteractiveDartboard';
import { MatchScoreboard } from '@/components/scoreboard/MatchScoreboard';
import { InputPad } from '@/components/scoreboard/InputPad';
import { MatchSetup } from '@/components/setup/MatchSetup';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';
import { AudioSettingsModal } from '@/components/audio/AudioSettingsModal';
import { MatchWinModal } from '@/components/scoreboard/MatchWinModal';
import { AICoachPanel } from '@/components/ai/AICoachPanel';
import { ThrowLogPanel } from '@/components/scoreboard/ThrowLogPanel';
import { HouseLeagueGuideModal } from '@/components/league/HouseLeagueGuideModal';
import { HouseLeagueNightModal } from '@/components/league/HouseLeagueNightModal';
import { UserAuthButton } from '@/components/auth/UserAuthButton';
import { AuthProvider } from '@/lib/auth-context';

import {
  Target,
  Trophy,
  BarChart3,
  Bot,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  Sliders,
  Play,
  Flame,
  Zap,
  HelpCircle,
  Award,
} from 'lucide-react';

const createInitialDefaultGame = (): GameState => {
  const defaultRules: GameRules = {
    type: 'x01',
    config: {
      startingScore: 501,
      inRule: 'straight_in',
      outRule: 'double_out',
      legsToWin: 3,
      setsToWin: 1,
      legsPerSet: 3,
    },
  };

  const initialPlayers: PlayerProfile[] = [
    {
      id: 'p1',
      name: 'Player 1',
      avatar: '🎯',
      color: '#3B82F6',
      isBot: false,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'bot_lvl12',
      name: 'DartBot (Lvl 12)',
      avatar: '🤖',
      color: '#EF4444',
      isBot: true,
      botLevel: 12,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  return createNewMatch('x01', defaultRules, initialPlayers);
};

export default function DartVectorApp() {
  const [activeScreen, setActiveScreen] = useState<'match' | 'setup' | 'analytics' | 'multiplayer'>('match');
  const [gameState, setGameState] = useState<GameState>(createInitialDefaultGame);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isLeagueNightOpen, setIsLeagueNightOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  // Undo history stack
  const historyStackRef = useRef<GameState[]>([]);

  // Open walkthrough guide on initial visit after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('dartvector_walkthrough_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsGuideOpen(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Save match to IndexedDB on completion
  useEffect(() => {
    if (gameState.isMatchOver) {
      storageEngine.saveMatch(gameState.match);
      if (gameState.match.isTeamMatch && gameState.match.winnerTeamId && gameState.match.teams) {
        const winningTeam = gameState.match.teams[gameState.match.winnerTeamId];
        soundEngine.callGameShot(true, winningTeam.name);
      } else {
        const winner = gameState.match.players.find((p) => p.id === gameState.winnerPlayerId);
        soundEngine.callGameShot(true, winner?.name || 'Player');
      }
    }
  }, [gameState.isMatchOver, gameState.winnerPlayerId, gameState.match]);

  // Handle DartBot Turn Automation
  useEffect(() => {
    if (gameState.isMatchOver || isBotThinking) return;

    const activePlayer = gameState.match.players[gameState.activePlayerIndex];
    if (activePlayer && activePlayer.isBot && activePlayer.botLevel) {
      const timerStart = setTimeout(() => {
        setIsBotThinking(true);
      }, 50);

      // Execute DartBot throw sequence with realistic pacing
      const botLevel = activePlayer.botLevel;
      const dartsToThrow = 3 - gameState.currentTurnDarts.length;

      let timer: NodeJS.Timeout;
      const throwNextDart = (index: number) => {
        if (index >= dartsToThrow) {
          setIsBotThinking(false);
          return;
        }

        timer = setTimeout(() => {
          setGameState((currentState) => {
            if (!currentState || currentState.isMatchOver) {
              setIsBotThinking(false);
              return currentState;
            }

            const currentActive = currentState.match.players[currentState.activePlayerIndex];
            if (!currentActive || !currentActive.isBot) {
              setIsBotThinking(false);
              return currentState;
            }

            // Determine target for this dart
            const scoreRemaining = currentState.remainingScores[currentActive.id];
            const dartsInHand = 3 - currentState.currentTurnDarts.length;

            const target = selectModeBotTarget(currentState.match.rules, {
              scoreRemaining,
              dartsInHand,
              cricketMarks: currentState.cricketState[currentActive.id]?.marks,
              aroundClockTarget: currentState.aroundClockState[currentActive.id]?.currentTarget,
              shanghaiRound: Math.floor(currentState.currentLeg.turns.length / currentState.match.players.length) + 1,
              bobs27Round: currentState.bobs27State[currentActive.id]?.currentRound,
            });

            const dart = simulateBotThrow(botLevel, target);
            soundEngine.playDartHit(dart.segment === 50 || dart.segment === 25, false);

            const result = applyDartToState(currentState, dart);

            if (result.turnCompleted) {
              const turnScore = result.nextState.currentLeg.turns[result.nextState.currentLeg.turns.length - 1]?.turnTotal || 0;
              soundEngine.callScore(turnScore, result.isBust);

              if (result.legCompleted) {
                if (!result.matchCompleted) {
                  soundEngine.callGameShot(false, currentActive.name);
                }
              }
              setIsBotThinking(false);
            } else {
              throwNextDart(index + 1);
            }

            return result.nextState;
          });
        }, 700);
      };

      throwNextDart(0);

      return () => {
        clearTimeout(timerStart);
        if (timer) clearTimeout(timer);
      };
    }
  }, [gameState.activePlayerIndex, gameState.currentTurnDarts.length, gameState.isMatchOver, isBotThinking, gameState.match.players]);

  // Throw 1 Dart Handler (from SVG Board or Dart Selector)
  const handleThrowDart = useCallback((dart: DartThrow) => {
    if (!gameState || gameState.isMatchOver || isBotThinking) return;

    soundEngine.playDartHit(dart.segment === 50 || dart.segment === 25, false);

    // Save previous state for undo
    historyStackRef.current.push(JSON.parse(JSON.stringify(gameState)));

    const activePlayer = gameState.match.players[gameState.activePlayerIndex];
    const result = applyDartToState(gameState, dart);

    if (result.turnCompleted) {
      const turnScore = result.nextState.currentLeg.turns[result.nextState.currentLeg.turns.length - 1]?.turnTotal || 0;
      soundEngine.callScore(turnScore, result.isBust);

      if (result.legCompleted && !result.matchCompleted) {
        soundEngine.callGameShot(false, activePlayer.name);
      }
    }

    setGameState(result.nextState);
  }, [gameState, isBotThinking]);

  // Apply Turn Total Score (from Keypad NumPad or Voice Entry)
  const handleApplyTurnTotal = useCallback((score: number) => {
    if (!gameState || gameState.isMatchOver || isBotThinking) return;

    // Save previous state for undo
    historyStackRef.current.push(JSON.parse(JSON.stringify(gameState)));

    const activePlayer = gameState.match.players[gameState.activePlayerIndex];
    const result = applyTotalScoreToState(gameState, score);

    soundEngine.callScore(score, result.isBust);

    if (result.legCompleted && !result.matchCompleted) {
      soundEngine.callGameShot(false, activePlayer.name);
    }

    setGameState(result.nextState);
  }, [gameState, isBotThinking]);

  // Undo Last Dart
  const handleUndoDart = useCallback(() => {
    if (historyStackRef.current.length > 0) {
      const prev = historyStackRef.current.pop();
      if (prev) setGameState(prev);
    }
  }, []);

  // Undo Last Turn
  const handleUndoTurn = useCallback(() => {
    if (historyStackRef.current.length > 0) {
      const prev = historyStackRef.current.pop();
      if (prev) setGameState(prev);
    }
  }, []);

  // Start New Match from Setup or Rematch
  const handleStartNewMatch = (
    gameType: GameType,
    rules: GameRules,
    players: PlayerProfile[],
    isTeamMatch?: boolean,
    teams?: { team_1: import('@/lib/types').TeamProfile; team_2: import('@/lib/types').TeamProfile }
  ) => {
    const newGame = createNewMatch(gameType, rules, players, isTeamMatch, teams);
    setGameState(newGame);
    historyStackRef.current = [];
    setActiveScreen('match');
    if (isTeamMatch && teams) {
      soundEngine.speak(`New ${teams.team_1.name} versus ${teams.team_2.name} team match started.`);
    } else {
      soundEngine.speak(`New ${gameType.toUpperCase()} match started.`);
    }
  };

  const handleRematch = () => {
    if (!gameState) return;
    const newGame = createNewMatch(
      gameState.match.gameType,
      gameState.match.rules,
      gameState.match.players,
      gameState.match.isTeamMatch,
      gameState.match.teams
    );
    setGameState(newGame);
    historyStackRef.current = [];
    setActiveScreen('match');
  };

  // Collect historical throws for heatmap
  const allHistoricalThrows: DartThrow[] = React.useMemo(() => {
    if (!gameState) return [];
    const list: DartThrow[] = [];
    gameState.match.legs.forEach((leg) => {
      leg.turns.forEach((turn) => {
        turn.darts.forEach((d) => {
          if (d.x !== undefined && d.y !== undefined) {
            list.push(d);
          }
        });
      });
    });
    return list;
  }, [gameState]);

  // Active target recommendation for HUD
  const activePlayer = gameState ? gameState.match.players[gameState.activePlayerIndex] : null;
  const activeScore = (gameState && activePlayer) ? (gameState.remainingScores[activePlayer.id] ?? 0) : 0;
  const dartsInHand = gameState ? 3 - (gameState.currentTurnDarts.length || 0) : 3;

  const highlightTarget = (gameState?.match.rules.type === 'x01' && activeScore <= 170 && activeScore > 1)
    ? getCheckoutSuggestion(activeScore, dartsInHand)?.preferredTarget
    : undefined;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
        {/* TOP BROADCAST NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Logo & Brand */}
        <div
          onClick={() => setActiveScreen('match')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Target className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">DARTVECTOR</span>
              <span className="text-[10px] font-black uppercase bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded shadow-sm">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase block">
              PDC Precision Match Engine
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800">
          <button
            id="nav-scoreboard-btn"
            onClick={() => setActiveScreen('match')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeScreen === 'match'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Scoreboard</span>
          </button>
          <button
            id="nav-setup-btn"
            onClick={() => setActiveScreen('setup')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeScreen === 'setup'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>New Match</span>
          </button>
          <button
            id="nav-analytics-btn"
            onClick={() => setActiveScreen('analytics')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeScreen === 'analytics'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Match Vault</span>
          </button>
          <button
            id="nav-multiplayer-btn"
            onClick={() => setActiveScreen('multiplayer')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeScreen === 'multiplayer'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Online Hub</span>
          </button>
        </div>

        {/* House League Utilities & Sound */}
        <div className="flex items-center gap-2">
          <button
            id="nav-league-night-btn"
            onClick={() => setIsLeagueNightOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="House League Night Leaderboard & Stats"
          >
            <span>🍺</span>
            <span className="hidden sm:inline">League Night</span>
          </button>

          <button
            id="nav-guide-btn"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors"
            title="How To Play & Scoring Quick Guide"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Guide</span>
          </button>

          <button
            id="audio-settings-toggle-btn"
            onClick={() => setIsAudioModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors"
            title="Referee & Audio Settings"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Caller FX</span>
          </button>

          {/* User Sign In / Profile / Cloud Sync Component */}
          <UserAuthButton />

          <button
            id="mobile-new-match-btn"
            onClick={() => setActiveScreen('setup')}
            className="md:hidden p-2 bg-amber-500 text-zinc-950 rounded-xl"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* VIEW 1: MATCH SCOREBOARD & DARTBOARD HUD */}
        {activeScreen === 'match' && gameState && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Scoreboard & Input Pad */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <MatchScoreboard
                  gameState={gameState}
                  onSelectPlayer={(idx) => {
                    setGameState((prev) => ({ ...prev, activePlayerIndex: idx }));
                  }}
                />

                {/* Input Pad (NumPad, Dart-by-Dart, Voice) */}
                <InputPad
                  rules={gameState.match.rules}
                  activePlayerScore={activeScore}
                  currentTurnDarts={gameState.currentTurnDarts}
                  onThrowDart={handleThrowDart}
                  onApplyTurnTotal={handleApplyTurnTotal}
                  onUndoDart={handleUndoDart}
                  onUndoTurn={handleUndoTurn}
                  canUndoDart={gameState.currentTurnDarts.length > 0}
                  canUndoTurn={gameState.currentLeg.turns.length > 0}
                  disabled={isBotThinking || gameState.isMatchOver}
                />
              </div>

              {/* Right Column: Interactive Regulation Dartboard & Visual Controls */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
                  {/* Dartboard Status Ribbon */}
                  <div className="w-full flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Regulation Sisal Board
                      </span>
                      {isBotThinking && (
                        <span className="text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          <span>DartBot Aiming...</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="toggle-heatmap-btn"
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          showHeatmap
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {showHeatmap ? '🔥 Heatmap ON' : 'Heatmap'}
                      </button>
                    </div>
                  </div>

                  {/* SVG Regulation Dartboard */}
                  <InteractiveDartboard
                    onThrowDart={handleThrowDart}
                    currentTurnDarts={gameState.currentTurnDarts}
                    highlightTarget={highlightTarget}
                    historicalThrows={allHistoricalThrows}
                    showHeatmap={showHeatmap}
                    interactive={!isBotThinking && !gameState.isMatchOver}
                    className="w-full"
                  />

                  <div className="text-[11px] text-zinc-500 text-center font-medium">
                    Click or touch the board to throw pinpoint darts into double, treble, or single beds.
                  </div>
                </div>

                {/* AI Match Coach Expandable Panel */}
                <div className="flex flex-col gap-3">
                  <button
                    id="toggle-ai-coach-btn"
                    onClick={() => setShowCoach(!showCoach)}
                    className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between transition-colors shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>PDC AI Match Coach & Commentary</span>
                    </div>
                    <span className="text-zinc-500">{showCoach ? '▲ Collapse' : '▼ Expand'}</span>
                  </button>

                  {showCoach && <AICoachPanel match={gameState.match} />}
                </div>
              </div>
            </div>

            {/* Throw-by-Throw Live Feed Log Panel */}
            <ThrowLogPanel gameState={gameState} />
          </div>
        )}

        {/* VIEW 2: NEW MATCH SETUP */}
        {activeScreen === 'setup' && (
          <MatchSetup
            onStartMatch={handleStartNewMatch}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {/* VIEW 3: MATCH HISTORY & ANALYTICS VAULT */}
        {activeScreen === 'analytics' && (
          <AnalyticsDashboard
            currentMatch={gameState?.match}
            onNewMatch={() => setActiveScreen('setup')}
          />
        )}

        {/* VIEW 4: ONLINE MULTIPLAYER LOBBY */}
        {activeScreen === 'multiplayer' && (
          <MultiplayerLobby onStartOnlineMatch={handleStartNewMatch} />
        )}
      </main>

      {/* WINNER MODAL ON MATCH COMPLETION */}
      {gameState?.isMatchOver && (
        <MatchWinModal
          match={gameState.match}
          onRematch={handleRematch}
          onViewAnalytics={() => {
            setActiveScreen('analytics');
          }}
          onNewMatch={() => setActiveScreen('setup')}
        />
      )}

      {/* AUDIO SETTINGS MODAL */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* HOUSE LEAGUE NIGHT LEADERBOARD MODAL */}
      <HouseLeagueNightModal
        isOpen={isLeagueNightOpen}
        onClose={() => setIsLeagueNightOpen(false)}
      />

      {/* HOUSE LEAGUE HOW-TO QUICK GUIDE MODAL */}
      <HouseLeagueGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  </AuthProvider>
  );
}
