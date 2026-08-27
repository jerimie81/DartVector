'use client';

import React, { useEffect } from 'react';
import { MatchRecord } from '@/lib/types';
import { storageEngine } from '@/lib/storage';
import { Trophy, Award, Zap, RotateCcw, BarChart3, Sparkles, Users, Crown } from 'lucide-react';
import { motion } from 'motion/react';

interface MatchWinModalProps {
  match: MatchRecord;
  onRematch: () => void;
  onViewAnalytics: () => void;
  onNewMatch: () => void;
}

export const MatchWinModal: React.FC<MatchWinModalProps> = ({
  match,
  onRematch,
  onViewAnalytics,
  onNewMatch,
}) => {
  const isTeamMatch = Boolean(match.isTeamMatch && match.teams);
  const winningTeam = isTeamMatch && match.winnerTeamId && match.teams
    ? match.teams[match.winnerTeamId]
    : null;

  const winner = match.players.find((p) => p.id === match.winnerPlayerId);
  const playerStats = storageEngine.calculateMatchStats(match);
  const teamStats = isTeamMatch ? storageEngine.calculateTeamStats(match) : [];

  useEffect(() => {
    // Launch celebratory fireworks confetti safely on client
    let isMounted = true;
    import('canvas-confetti')
      .then((mod) => {
        if (!isMounted) return;
        const confettiFunc = (mod && mod.default) ? mod.default : mod;
        if (typeof confettiFunc === 'function') {
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999,
          };

          const fire = (particleRatio: number, opts: Record<string, unknown>) => {
            confettiFunc({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio),
            });
          };

          fire(0.25, { spread: 26, startVelocity: 55 });
          fire(0.2, { spread: 60 });
          fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
          fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
          fire(0.1, { spread: 120, startVelocity: 45 });
        }
      })
      .catch(() => {
        // ignore if canvas-confetti cannot be loaded
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-6 text-center my-auto"
      >
        {/* Trophy Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center shadow-xl shadow-amber-500/30">
          {isTeamMatch ? <Crown className="w-11 h-11" /> : <Trophy className="w-11 h-11" />}
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Game Shot & The Match</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            {isTeamMatch && winningTeam
              ? `${winningTeam.avatar} ${winningTeam.name} Wins!`
              : `${winner?.name || 'Player'} Wins!`}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isTeamMatch ? 'Two-Team Championship Match' : match.gameType.toUpperCase() + ' Match'} •{' '}
            {match.legs.length} Legs Completed
          </p>
        </div>

        {/* TEAM STATS COMPARISON (WHEN TEAM MATCH) */}
        {isTeamMatch && teamStats.length === 2 ? (
          <div className="flex flex-col gap-4">
            {/* Team Totals Row */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left">
              {teamStats.map((ts) => {
                const isWinner = ts.teamId === match.winnerTeamId;
                return (
                  <div
                    key={ts.teamId}
                    className={`flex flex-col gap-2 p-3 rounded-xl border ${
                      isWinner
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-zinc-900/60 border-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-sm text-white">
                        <span>{ts.avatar}</span>
                        <span>{ts.name}</span>
                        {isWinner && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {ts.legsWon} Legs
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-800/80">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block">3-Dart Avg</span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          {ts.threeDartAvg}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block">High Turn</span>
                        <span className="font-mono font-black text-white text-sm">
                          {ts.highestTurn}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold block">Checkout %</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {ts.checkoutPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Individual Contributors Breakdown */}
            <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Individual Player Contributions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {playerStats.map((ps) => {
                  const isT1 = ps.teamId === 'team_1';
                  return (
                    <div
                      key={ps.playerId}
                      className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isT1 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-bold text-white">{ps.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-zinc-400">
                          Avg: <b className="text-amber-400">{ps.threeDartAvg}</b>
                        </span>
                        <span className="text-zinc-500">
                          High: <b className="text-zinc-200">{ps.highestTurn}</b>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* SINGLES STATS SUMMARY */
          <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left">
            {playerStats.map((s) => (
              <div
                key={s.playerId}
                className="flex flex-col gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">{s.name}</span>
                  <span className="text-xs font-bold text-amber-400">{s.legsWon} Legs</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block">3-Dart Avg</span>
                    <span className="font-mono font-black text-amber-400 text-base">
                      {s.threeDartAvg}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block">Checkout %</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      {s.checkoutPct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            id="modal-view-analytics-btn"
            onClick={onViewAnalytics}
            className="h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Full Match Vault</span>
          </button>
          <button
            id="modal-rematch-btn"
            onClick={onRematch}
            className="h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
          <button
            id="modal-new-match-btn"
            onClick={onNewMatch}
            className="h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg border border-amber-300 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 stroke-[3]" />
            <span>New Match</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
