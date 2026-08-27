'use client';

import React, { useState, useEffect } from 'react';
import { MatchRecord } from '@/lib/types';
import { storageEngine } from '@/lib/storage';
import { Trophy, Flame, Target, Award, Users, RefreshCw, X, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface HouseLeagueNightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickRematch?: () => void;
}

interface PlayerNightStat {
  name: string;
  avatar: string;
  matchesPlayed: number;
  matchesWon: number;
  legsWon: number;
  highTurn: number;
  totalPoints: number;
  totalDarts: number;
  avg: number;
  ton80s: number;
}

export const HouseLeagueNightModal: React.FC<HouseLeagueNightModalProps> = ({
  isOpen,
  onClose,
  onQuickRematch,
}) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      storageEngine.getMatches().then((all) => {
        if (!isMounted) return;
        // Filter for matches today
        const todayStr = new Date().toDateString();
        const todaysMatches = all.filter((m) => {
          const matchDate = new Date(m.startTime).toDateString();
          return matchDate === todayStr;
        });
        setMatches(todaysMatches.length > 0 ? todaysMatches : all.slice(0, 10));
        setLoading(false);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Aggregate stats per player
  const playerStatsMap: Record<string, PlayerNightStat> = {};

  matches.forEach((m) => {
    m.players.forEach((p) => {
      if (!playerStatsMap[p.name]) {
        playerStatsMap[p.name] = {
          name: p.name,
          avatar: p.avatar,
          matchesPlayed: 0,
          matchesWon: 0,
          legsWon: 0,
          highTurn: 0,
          totalPoints: 0,
          totalDarts: 0,
          avg: 0,
          ton80s: 0,
        };
      }

      const stat = playerStatsMap[p.name];
      stat.matchesPlayed += 1;

      // Check match win
      if (m.winnerPlayerId === p.id) {
        stat.matchesWon += 1;
      } else if (m.isTeamMatch && m.winnerTeamId && p.teamId === m.winnerTeamId) {
        stat.matchesWon += 1;
      }

      // Check player score stats
      const pStats = m.scores[p.id];
      if (pStats) {
        stat.legsWon += pStats.legsWon || 0;
      }
    });

    // Check legs & turns for high turn, 180s, total points
    m.legs.forEach((leg) => {
      leg.turns.forEach((turn) => {
        const playerObj = m.players.find((pl) => pl.id === turn.playerId);
        if (playerObj && playerStatsMap[playerObj.name]) {
          const pStat = playerStatsMap[playerObj.name];
          if (!turn.isBust) {
            pStat.totalPoints += turn.turnTotal;
            pStat.totalDarts += turn.darts.length || 3;
            if (turn.turnTotal > pStat.highTurn) {
              pStat.highTurn = turn.turnTotal;
            }
            if (turn.turnTotal === 180) {
              pStat.ton80s += 1;
            }
          }
        }
      });
    });
  });

  // Calculate final averages and sort by matches won
  const standings = Object.values(playerStatsMap).map((st) => ({
    ...st,
    avg: st.totalDarts > 0 ? Math.round(((st.totalPoints / st.totalDarts) * 3) * 10) / 10 : 0,
    winRate: st.matchesPlayed > 0 ? Math.round((st.matchesWon / st.matchesPlayed) * 100) : 0,
  })).sort((a, b) => b.matchesWon - a.matchesWon || b.winRate - a.winRate || b.avg - a.avg);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Tonight&apos;s House League Standings</h3>
              <p className="text-xs text-zinc-400">Match results, win rates &amp; bragging rights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-zinc-500 text-sm">Loading league stats...</div>
          ) : standings.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col items-center gap-2">
              <Target className="w-8 h-8 text-zinc-600" />
              <div className="text-sm font-bold text-zinc-300">No matches completed yet tonight</div>
              <div className="text-xs text-zinc-500">Play a match to start building tonight&apos;s leaderboard!</div>
            </div>
          ) : (
            <>
              {/* Leaderboard Table */}
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-center">Matches</div>
                  <div className="col-span-2 text-center">Win Rate</div>
                  <div className="col-span-3 text-right">3-Dart Avg / High</div>
                </div>

                <div className="divide-y divide-zinc-850">
                  {standings.map((p, idx) => (
                    <div
                      key={p.name}
                      className={`grid grid-cols-12 gap-2 p-3 items-center text-xs ${
                        idx === 0 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="col-span-1 text-center font-bold font-mono">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <span className="text-base">{p.avatar}</span>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white">{p.name}</span>
                          {p.ton80s > 0 && (
                            <span className="text-[9px] font-black text-amber-400">
                              🔥 {p.ton80s}x 180!
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-center font-mono">
                        <span className="text-emerald-400 font-bold">{p.matchesWon}W</span>
                        <span className="text-zinc-600"> / </span>
                        <span className="text-zinc-400">{p.matchesPlayed - p.matchesWon}L</span>
                      </div>
                      <div className="col-span-2 text-center font-mono font-bold text-amber-400">
                        {p.winRate}%
                      </div>
                      <div className="col-span-3 text-right font-mono">
                        <span className="text-white font-black">{p.avg > 0 ? p.avg : '-'}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          High: {p.highTurn > 0 ? p.highTurn : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">
            Matches recorded: <strong className="text-zinc-300">{matches.length}</strong>
          </div>
          <div className="flex gap-2">
            {onQuickRematch && (
              <button
                onClick={() => {
                  onClose();
                  onQuickRematch();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs rounded-xl border border-zinc-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Quick Rematch</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
