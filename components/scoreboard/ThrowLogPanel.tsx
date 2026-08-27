'use client';

import React, { useState, useMemo } from 'react';
import { DartThrow, PlayerProfile } from '@/lib/types';
import { GameState } from '@/lib/game-engine';
import {
  Clock,
  Target,
  Flame,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
  ArrowUpDown,
  History,
  AlertCircle,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LoggedThrow {
  id: string;
  globalThrowIndex: number;
  chronologicalIndex: number; // 1 to 10 within the last 10 window
  timestamp: number;
  formattedTime: string;
  dart: DartThrow;
  player: PlayerProfile;
  legNumber: number;
  setNumber: number;
  turnIndex: number;
  dartIndexInTurn: number; // 1, 2, or 3
  isCurrentTurn: boolean;
  segmentDescription: string;
  multiplierName: string;
  score: number;
  isBust: boolean;
  isWinningDart: boolean;
}

function formatTimestamp(ms: number): string {
  try {
    const d = new Date(ms);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return '--:--:--';
  }
}

export function extractMatchThrows(gameState: GameState): LoggedThrow[] {
  const list: LoggedThrow[] = [];
  const players = gameState.match.players;
  let globalCount = 0;

  // 1. Process all completed turns across legs
  gameState.match.legs.forEach((leg) => {
    leg.turns.forEach((turn, turnIdx) => {
      const player = players.find((p) => p.id === turn.playerId) || players[0];
      turn.darts.forEach((dart, dartIdx) => {
        globalCount++;
        const ts = dart.timestamp || (turn.createdAt ? turn.createdAt + dartIdx * 800 : Date.now());
        const mult = dart.multiplier ?? 1;
        const seg = dart.segment ?? 0;
        
        let multName = 'Single';
        if (seg === 50) multName = 'Double Bull';
        else if (seg === 25) multName = 'Outer Bull';
        else if (mult === 3) multName = 'Treble';
        else if (mult === 2) multName = 'Double';
        else if (mult === 1) multName = 'Single';
        else multName = 'Miss';

        let segDesc = dart.label || (seg === 0 ? 'MISS' : `S${seg}`);
        if (seg === 50) segDesc = 'Bullseye (D-BULL)';
        else if (seg === 25) segDesc = 'Outer Bull (BULL)';
        else if (mult === 0 || seg === 0) segDesc = 'Missed Bed (0)';
        else segDesc = `${multName} ${seg}`;

        const score = dart.score !== undefined ? dart.score : (seg * mult);

        list.push({
          id: `leg_${leg.legNumber}_t_${turn.id}_d_${dartIdx}_${globalCount}`,
          globalThrowIndex: globalCount,
          chronologicalIndex: 0,
          timestamp: ts,
          formattedTime: formatTimestamp(ts),
          dart,
          player,
          legNumber: leg.legNumber,
          setNumber: leg.setNumber,
          turnIndex: turnIdx + 1,
          dartIndexInTurn: dartIdx + 1,
          isCurrentTurn: false,
          segmentDescription: segDesc,
          multiplierName: multName,
          score,
          isBust: Boolean(dart.isBust || (turn.isBust && dartIdx === turn.darts.length - 1)),
          isWinningDart: Boolean(dart.isWinningDart),
        });
      });
    });
  });

  // 2. Process in-progress current turn darts
  if (gameState.currentTurnDarts && gameState.currentTurnDarts.length > 0) {
    const activePlayer = players[gameState.activePlayerIndex] || players[0];
    const currentLegNum = gameState.currentLeg.legNumber;
    const currentSetNum = gameState.currentLeg.setNumber;
    const currentTurnNum = gameState.currentLeg.turns.length + 1;

    gameState.currentTurnDarts.forEach((dart, dartIdx) => {
      globalCount++;
      const ts = dart.timestamp || Date.now();
      const mult = dart.multiplier ?? 1;
      const seg = dart.segment ?? 0;

      let multName = 'Single';
      if (seg === 50) multName = 'Double Bull';
      else if (seg === 25) multName = 'Outer Bull';
      else if (mult === 3) multName = 'Treble';
      else if (mult === 2) multName = 'Double';
      else if (mult === 1) multName = 'Single';
      else multName = 'Miss';

      let segDesc = dart.label || (seg === 0 ? 'MISS' : `S${seg}`);
      if (seg === 50) segDesc = 'Bullseye (D-BULL)';
      else if (seg === 25) segDesc = 'Outer Bull (BULL)';
      else if (mult === 0 || seg === 0) segDesc = 'Missed Bed (0)';
      else segDesc = `${multName} ${seg}`;

      const score = dart.score !== undefined ? dart.score : (seg * mult);

      list.push({
        id: `current_d_${dartIdx}_${globalCount}`,
        globalThrowIndex: globalCount,
        chronologicalIndex: 0,
        timestamp: ts,
        formattedTime: formatTimestamp(ts),
        dart,
        player: activePlayer,
        legNumber: currentLegNum,
        setNumber: currentSetNum,
        turnIndex: currentTurnNum,
        dartIndexInTurn: dartIdx + 1,
        isCurrentTurn: true,
        segmentDescription: segDesc,
        multiplierName: multName,
        score,
        isBust: Boolean(dart.isBust),
        isWinningDart: Boolean(dart.isWinningDart),
      });
    });
  }

  return list;
}

interface ThrowLogPanelProps {
  gameState: GameState;
  className?: string;
}

export const ThrowLogPanel: React.FC<ThrowLogPanelProps> = ({ gameState, className = '' }) => {
  const [orderDirection, setOrderDirection] = useState<'chronological' | 'reverse'>('chronological');

  // Extract all match throws and slice the last 10
  const { last10Throws, totalThrowsCount, summaryStats } = useMemo(() => {
    const all = extractMatchThrows(gameState);
    const totalCount = all.length;
    const rawLast10 = all.slice(-10);

    // Number them chronologically 1 to N within the window
    const indexed = rawLast10.map((item, idx) => ({
      ...item,
      chronologicalIndex: idx + 1,
    }));

    // Calculate summary statistics for these 10 darts
    let totalScore = 0;
    let treblesCount = 0;
    let doublesCount = 0;
    let hitsCount = 0;

    indexed.forEach((t) => {
      totalScore += t.score;
      if (t.dart.multiplier === 3) treblesCount++;
      if (t.dart.multiplier === 2 || t.dart.segment === 50) doublesCount++;
      if (t.score > 0) hitsCount++;
    });

    const averagePerDart = indexed.length > 0 ? (totalScore / indexed.length).toFixed(1) : '0.0';
    const threeDartAvgEquiv = indexed.length > 0 ? ((totalScore / indexed.length) * 3).toFixed(1) : '0.0';

    return {
      last10Throws: indexed,
      totalThrowsCount: totalCount,
      summaryStats: {
        totalScore,
        averagePerDart,
        threeDartAvgEquiv,
        treblesCount,
        doublesCount,
        hitsCount,
        count: indexed.length,
      },
    };
  }, [gameState]);

  // Handle display order (defaulting strictly to chronological order: 1st thrown to 10th thrown)
  const displayedThrows = useMemo(() => {
    if (orderDirection === 'reverse') {
      return [...last10Throws].reverse();
    }
    return last10Throws;
  }, [last10Throws, orderDirection]);

  // Multiplier badge styling helper
  const getMultiplierBadge = (t: LoggedThrow) => {
    const seg = t.dart.segment;
    const mult = t.dart.multiplier;

    if (t.isBust) {
      return {
        text: 'BUST',
        className: 'bg-red-500/20 text-red-400 border-red-500/40',
      };
    }
    if (seg === 50) {
      return {
        text: 'D-BULL (50)',
        className: 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-400 font-black shadow-sm',
      };
    }
    if (seg === 25) {
      return {
        text: 'BULL (25)',
        className: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50',
      };
    }
    if (mult === 3) {
      return {
        text: `TREBLE (${mult}x)`,
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-black',
      };
    }
    if (mult === 2) {
      return {
        text: `DOUBLE (${mult}x)`,
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
      };
    }
    if (mult === 1) {
      return {
        text: `SINGLE (1x)`,
        className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      };
    }
    return {
      text: 'MISS (0x)',
      className: 'bg-zinc-900 text-zinc-500 border-zinc-800',
    };
  };

  return (
    <div
      id="throw-by-throw-log-panel"
      className={`w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 ${className}`}
    >
      {/* PANEL HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <History className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-wide uppercase">
                Throw-by-Throw Log
              </h2>
              <span className="text-[10px] font-black uppercase bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-full border border-zinc-700">
                Last {last10Throws.length} / {totalThrowsCount} Darts
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>Chronological sequence with timestamps & segment values</span>
            </p>
          </div>
        </div>

        {/* View Toggle (Chronological vs Recent First) */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-throw-order-btn"
            onClick={() =>
              setOrderDirection((prev) =>
                prev === 'chronological' ? 'reverse' : 'chronological'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800 text-xs font-bold transition-colors shadow-sm"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {orderDirection === 'chronological' ? 'Oldest → Newest' : 'Newest → Oldest'}
            </span>
          </button>
        </div>
      </div>

      {/* SUMMARY BANNER FOR LAST 10 DARTS */}
      {last10Throws.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/80">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Total Points (10)
            </span>
            <span className="text-lg font-black font-mono text-amber-400">
              {summaryStats.totalScore}{' '}
              <span className="text-[11px] text-zinc-500 font-normal">pts</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              3-Dart Avg (10)
            </span>
            <span className="text-lg font-black font-mono text-white">
              {summaryStats.threeDartAvgEquiv}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Trebles Hit
            </span>
            <span className="text-lg font-black font-mono text-red-400">
              {summaryStats.treblesCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Doubles & Bulls
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {summaryStats.doublesCount}
            </span>
          </div>
        </div>
      )}

      {/* THROWS LIST */}
      {displayedThrows.length === 0 ? (
        <div className="p-8 text-center bg-zinc-950/50 border border-zinc-800/60 rounded-2xl flex flex-col items-center gap-2 text-zinc-500">
          <Target className="w-8 h-8 stroke-1 text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400">No darts recorded in this match yet.</p>
          <p className="text-[11px] text-zinc-600 max-w-sm">
            Throw darts on the board, enter scores via keypad, or play against DartBot to view the live chronological throw stream.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1 select-none">
          <AnimatePresence initial={false}>
            {displayedThrows.map((t, index) => {
              const badge = getMultiplierBadge(t);
              const isMostRecent = t.globalThrowIndex === totalThrowsCount;
              const isT1 = t.player.teamId === 'team_1';
              const isT2 = t.player.teamId === 'team_2';

              return (
                <motion.div
                  key={t.id}
                  id={`throw-log-item-${t.globalThrowIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMostRecent
                      ? 'bg-zinc-800/90 border-amber-500/60 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Left Section: Sequence #, Timestamp, Player */}
                  <div className="flex items-center gap-3">
                    {/* Chronological Step Counter */}
                    <div className="flex flex-col items-center justify-center min-w-[36px] h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase leading-none">
                        #{t.chronologicalIndex}
                      </span>
                      <span className="text-xs font-black text-amber-400 font-mono leading-none mt-0.5">
                        D{t.dartIndexInTurn}
                      </span>
                    </div>

                    {/* Player Info & Context */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{t.player.avatar}</span>
                          <span>{t.player.name}</span>
                        </span>

                        {/* Team Indicator */}
                        {t.player.teamId && (
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              isT1
                                ? 'bg-red-950 text-red-400 border border-red-800/60'
                                : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                            }`}
                          >
                            {isT1 ? 'Team 1' : 'Team 2'}
                          </span>
                        )}

                        {/* Current in-progress tag */}
                        {t.isCurrentTurn && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full animate-pulse">
                            Active Turn
                          </span>
                        )}

                        {/* Winning Dart tag */}
                        {t.isWinningDart && (
                          <span className="text-[9px] font-black uppercase bg-emerald-500 text-zinc-950 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            Game Shot
                          </span>
                        )}
                      </div>

                      {/* Timestamp and Match Coordinates */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span className="text-zinc-300 font-semibold">{t.formattedTime}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          Leg {t.legNumber} • Turn {t.turnIndex}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Segment Bed Details & Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                    {/* Multiplier / Bed Category Pill */}
                    <div className="flex flex-col items-start sm:items-end">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg border ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-medium mt-0.5">
                        {t.segmentDescription}
                      </span>
                    </div>

                    {/* Segment Value / Score Display Box */}
                    <div className="min-w-[64px] h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center px-2 shadow-inner">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase leading-none">
                        Value
                      </span>
                      <span
                        className={`text-sm font-black font-mono leading-none mt-0.5 ${
                          t.isBust
                            ? 'text-red-400 line-through'
                            : t.dart.multiplier === 3
                            ? 'text-amber-400'
                            : t.dart.multiplier === 2 || t.dart.segment === 50
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        {t.isBust ? '0' : `+${t.score}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
