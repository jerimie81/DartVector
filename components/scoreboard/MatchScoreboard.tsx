'use client';

import React from 'react';
import { GameState } from '@/lib/game-engine';
import { getCheckoutSuggestion } from '@/lib/checkout-engine';
import { Trophy, Target, Zap, Flame, Award, Heart, Shield, Users, Crown } from 'lucide-react';
import { motion } from 'motion/react';

interface MatchScoreboardProps {
  gameState: GameState;
  onSelectPlayer?: (index: number) => void;
}

export const MatchScoreboard: React.FC<MatchScoreboardProps> = ({
  gameState,
  onSelectPlayer,
}) => {
  const [isChalkboardMode, setIsChalkboardMode] = React.useState<boolean>(false);
  const {
    match,
    currentLeg,
    activePlayerIndex,
    remainingScores,
    cricketState,
    aroundClockState,
    killerState,
    shanghaiState,
    bobs27State,
  } = gameState;

  const isTeamMatch = Boolean(match.isTeamMatch && match.teams);
  const activePlayer = match.players[activePlayerIndex];
  const activeScore = remainingScores[activePlayer.id] ?? 0;
  const dartsInHand = 3 - (gameState.currentTurnDarts.length || 0);

  // Compute stats for each player in active leg
  const getPlayerLegStats = (playerId: string) => {
    const playerTurns = currentLeg.turns.filter((t) => t.playerId === playerId);
    let totalDarts = 0;
    let totalScored = 0;
    let highTurn = 0;

    playerTurns.forEach((t) => {
      const count = t.darts.length || 3;
      totalDarts += count;
      if (!t.isBust) {
        totalScored += t.turnTotal;
        if (t.turnTotal > highTurn) highTurn = t.turnTotal;
      }
    });

    const avg = totalDarts > 0 ? (totalScored / totalDarts) * 3 : 0;
    return {
      avg: Math.round(avg * 10) / 10,
      darts: totalDarts,
      highTurn,
    };
  };

  // Compute aggregate stats for a team in active leg
  const getTeamLegStats = (teamId: 'team_1' | 'team_2') => {
    const teamPlayerIds = match.players.filter((p) => p.teamId === teamId).map((p) => p.id);
    const teamTurns = currentLeg.turns.filter((t) => teamPlayerIds.includes(t.playerId));
    let totalDarts = 0;
    let totalScored = 0;
    let highTurn = 0;

    teamTurns.forEach((t) => {
      const count = t.darts.length || 3;
      totalDarts += count;
      if (!t.isBust) {
        totalScored += t.turnTotal;
        if (t.turnTotal > highTurn) highTurn = t.turnTotal;
      }
    });

    const avg = totalDarts > 0 ? (totalScored / totalDarts) * 3 : 0;
    return {
      avg: Math.round(avg * 10) / 10,
      darts: totalDarts,
      highTurn,
    };
  };

  // Checkout suggestion for active player / team
  const checkout =
    match.rules.type === 'x01' && activeScore <= 170 && activeScore > 1
      ? getCheckoutSuggestion(activeScore, dartsInHand)
      : null;

  // Separate players into teams if team match
  const team1Players = isTeamMatch ? match.players.filter((p) => p.teamId === 'team_1') : [];
  const team2Players = isTeamMatch ? match.players.filter((p) => p.teamId === 'team_2') : [];

  const team1 = match.teams?.team_1;
  const team2 = match.teams?.team_2;

  const team1Scores = match.teamScores?.team_1 || { legsWon: 0, setsWon: 0 };
  const team2Scores = match.teamScores?.team_2 || { legsWon: 0, setsWon: 0 };

  const isTeam1Active = isTeamMatch && activePlayer.teamId === 'team_1';
  const isTeam2Active = isTeamMatch && activePlayer.teamId === 'team_2';

  const team1Representative = team1Players[0];
  const team2Representative = team2Players[0];

  const team1Remaining = team1Representative ? (remainingScores[team1Representative.id] ?? 0) : 0;
  const team2Remaining = team2Representative ? (remainingScores[team2Representative.id] ?? 0) : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Match Header: Format, Sets, Legs & Chalkboard Toggle */}
      <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            {isTeamMatch ? <Users className="w-5 h-5" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span>{match.rules.type === 'x01' ? `${match.rules.config.startingScore} Match` : match.gameType.toUpperCase()}</span>
              {isTeamMatch && (
                <span className="text-[10px] font-black uppercase bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded">
                  Two Teams (Up to 10P / 5v5)
                </span>
              )}
            </div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>Leg {currentLeg.legNumber}</span>
              {match.rules.type === 'x01' && match.rules.config.setsToWin > 1 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>Set {currentLeg.setNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Global Match Leg Scores Preview */}
        {isTeamMatch && team1 && team2 ? (
          <div className="flex items-center gap-4 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-base">{team1.avatar}</span>
              <span className={`text-xs font-black ${isTeam1Active ? 'text-red-400' : 'text-zinc-400'}`}>
                {team1.name}
              </span>
              <span className="px-2.5 py-0.5 bg-red-950/80 text-red-300 font-mono font-black text-sm rounded border border-red-800">
                {team1Scores.legsWon}
              </span>
            </div>
            <span className="text-xs font-black text-zinc-600">VS</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-950/80 text-blue-300 font-mono font-black text-sm rounded border border-blue-800">
                {team2Scores.legsWon}
              </span>
              <span className={`text-xs font-black ${isTeam2Active ? 'text-blue-400' : 'text-zinc-400'}`}>
                {team2.name}
              </span>
              <span className="text-base">{team2.avatar}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
            {match.players.map((p, idx) => {
              const isCurrent = idx === activePlayerIndex;
              const scoreData = match.scores[p.id] || { legsWon: 0, setsWon: 0 };
              return (
                <div key={`head-p-${p.id}`} className="flex items-center gap-2">
                  <span className="text-sm">{p.avatar}</span>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-amber-400 font-black' : 'text-zinc-400'}`}>
                    {p.name}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-950 text-amber-400 font-mono font-black text-xs rounded border border-zinc-800">
                    {scoreData.legsWon}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Chalkboard / Big Pub Display Mode Toggle */}
        <button
          onClick={() => setIsChalkboardMode(!isChalkboardMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isChalkboardMode
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md ring-1 ring-amber-400/40 font-black'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
          title="Toggle Big Chalkboard Display Mode"
        >
          <span>🍻</span>
          <span>{isChalkboardMode ? 'Big Chalkboard ON' : 'Chalkboard Mode'}</span>
        </button>
      </div>

      {/* PROMINENT "WHOSE TURN IS IT?" BANNER */}
      <div
        className={`w-full p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl transition-all ${
          isTeamMatch
            ? isTeam1Active
              ? 'bg-red-950/40 border-red-500/60 text-red-200'
              : 'bg-blue-950/40 border-blue-500/60 text-blue-200'
            : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950/80 border border-zinc-700/80 flex items-center justify-center text-2xl shadow-inner">
            {activePlayer.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-amber-400 border border-zinc-700">
                👉 Current Thrower
              </span>
              {isTeamMatch && (
                <span className="text-[10px] font-bold text-zinc-400">
                  {isTeam1Active ? team1?.name : team2?.name}
                </span>
              )}
            </div>
            <div className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <span>{activePlayer.name}</span>
              {activePlayer.isBot && (
                <span className="text-xs px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-normal">
                  Bot
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Darts in hand indicator */}
        <div className="flex items-center gap-4 bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800/80">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Darts in Hand</span>
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={`hand-dart-${i}`}
                  className={`text-sm ${
                    i < dartsInHand ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-zinc-700'
                  }`}
                >
                  🎯
                </span>
              ))}
            </div>
          </div>

          {match.rules.type === 'x01' && (
            <div className="pl-4 border-l border-zinc-800 flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Score Remaining</span>
              <span className="text-2xl font-mono font-black text-amber-400 leading-none">
                {activeScore}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PLAIN-ENGLISH CHECKOUT ROADMAP BANNER */}
      {checkout && match.rules.type === 'x01' && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 p-4 rounded-2xl border-2 border-emerald-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block">
                🎯 Finish Checkout Guide (Need {activeScore})
              </span>
              <span className="text-sm font-bold text-white">
                Aim for: <strong className="text-emerald-300 font-extrabold">{checkout.description}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {checkout.route.map((dart, dIdx) => (
              <span
                key={`co-dart-${dIdx}`}
                className="px-3 py-1 bg-emerald-500 text-zinc-950 font-mono font-black text-xs rounded-lg shadow-md uppercase"
              >
                {dart}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- TWO-TEAMS BROADCAST SCOREBOARD --- */}
      {isTeamMatch && team1 && team2 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TEAM 1 MAIN SCOREBOARD CARD */}
          <motion.div
            layout
            className={`relative overflow-hidden rounded-2xl border-2 transition-all p-5 shadow-2xl flex flex-col justify-between ${
              isTeam1Active
                ? 'bg-zinc-900 border-red-500 shadow-red-500/10 ring-2 ring-red-500/20'
                : 'bg-zinc-950 border-zinc-800/80 opacity-90'
            }`}
          >
            {/* Active Team Ribbon */}
            {isTeam1Active && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-md">
                <Flame className="w-3 h-3 fill-white" />
                <span>Team Throwing</span>
              </div>
            )}

            {/* Team 1 Header Row */}
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{team1.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">{team1.name}</span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                      Team 1
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-400">
                    Legs Won: <span className="text-white font-bold">{team1Scores.legsWon}</span>
                    {match.rules.type === 'x01' && match.rules.config.setsToWin > 1 && (
                      <span> • Sets: {team1Scores.setsWon}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Team Darts</div>
                <div className="text-sm font-mono font-bold text-zinc-300">
                  {getTeamLegStats('team_1').darts}
                </div>
              </div>
            </div>

            {/* TEAM 1 MAIN SCORE DISPLAY (X01) */}
            {match.rules.type === 'x01' && (
              <div className="my-3 flex flex-col items-center justify-center">
                <div
                  className={`font-mono font-black tracking-tight leading-none transition-all ${
                    isChalkboardMode ? 'text-8xl md:text-9xl py-2' : 'text-6xl md:text-7xl'
                  } ${
                    isTeam1Active ? 'text-red-400 drop-shadow-[0_0_24px_rgba(239,68,68,0.35)]' : 'text-zinc-300'
                  }`}
                >
                  {team1Remaining}
                </div>
                {team1Remaining <= 170 && team1Remaining > 1 && (
                  <div className="mt-3 text-xs sm:text-sm font-black px-3.5 py-1.5 bg-red-500/10 text-red-300 border border-red-500/30 rounded-xl shadow-sm">
                    {getCheckoutSuggestion(team1Remaining, 3)?.description || `Requires ${team1Remaining}`}
                  </div>
                )}
              </div>
            )}

            {/* TEAM 1 CRICKET DISPLAY */}
            {match.rules.type === 'cricket' && team1Representative && (
              <div className="my-2 flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Team Points</span>
                  <span className="text-2xl font-mono font-black text-red-400">
                    {cricketState[team1Representative.id]?.score || 0}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[20, 19, 18, 17, 16, 15, 25].map((seg) => {
                    const marks = cricketState[team1Representative.id]?.marks[seg] || 0;
                    return (
                      <div
                        key={`crick-t1-${seg}`}
                        className={`flex flex-col items-center p-1.5 rounded-lg border text-center ${
                          marks >= 3
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                            : marks > 0
                            ? 'bg-red-950/40 border-red-600/40 text-red-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className="text-[10px] font-black">{seg === 25 ? 'BULL' : seg}</span>
                        <span className="text-sm font-black mt-0.5">
                          {marks === 0 ? '—' : marks === 1 ? '/' : marks === 2 ? 'X' : '⨂'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEAM 1 ROSTER & ACTIVE PLAYER ROTATION */}
            <div className="mt-4 flex flex-col gap-2 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Roster ({team1Players.length} Players)</span>
                <span className="text-zinc-500">Current Leg Stats</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {team1Players.map((player) => {
                  const isThisPlayerActive = activePlayer.id === player.id;
                  const stats = getPlayerLegStats(player.id);
                  const playerIdx = match.players.findIndex((p) => p.id === player.id);

                  return (
                    <div
                      key={player.id}
                      onClick={() => onSelectPlayer && onSelectPlayer(playerIdx)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isThisPlayerActive
                          ? 'bg-red-500/20 border-red-500 text-white font-black shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{player.avatar}</span>
                        <span className="font-bold">{player.name}</span>
                        {player.isBot && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded">
                            BOT L{player.botLevel}
                          </span>
                        )}
                        {isThisPlayerActive && (
                          <span className="text-[9px] font-black uppercase bg-red-500 text-white px-1.5 py-0.2 rounded animate-pulse">
                            🎯 OCHE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-zinc-400">3DA: <b className="text-white">{stats.avg}</b></span>
                        <span className="text-zinc-500">Darts: <b className="text-zinc-300">{stats.darts}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team 1 Footer: Team 3DA & High Turn */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <span className="text-zinc-400 font-semibold">Team 3-Dart Avg:</span>
                <span className="font-mono font-bold text-white">{getTeamLegStats('team_1').avg}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400 font-semibold">Team High Turn:</span>
                <span className="font-mono font-bold text-white">{getTeamLegStats('team_1').highTurn}</span>
              </div>
            </div>
          </motion.div>

          {/* TEAM 2 MAIN SCOREBOARD CARD */}
          <motion.div
            layout
            className={`relative overflow-hidden rounded-2xl border-2 transition-all p-5 shadow-2xl flex flex-col justify-between ${
              isTeam2Active
                ? 'bg-zinc-900 border-blue-500 shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'bg-zinc-950 border-zinc-800/80 opacity-90'
            }`}
          >
            {/* Active Team Ribbon */}
            {isTeam2Active && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-md">
                <Flame className="w-3 h-3 fill-white" />
                <span>Team Throwing</span>
              </div>
            )}

            {/* Team 2 Header Row */}
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{team2.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">{team2.name}</span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      Team 2
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-400">
                    Legs Won: <span className="text-white font-bold">{team2Scores.legsWon}</span>
                    {match.rules.type === 'x01' && match.rules.config.setsToWin > 1 && (
                      <span> • Sets: {team2Scores.setsWon}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Team Darts</div>
                <div className="text-sm font-mono font-bold text-zinc-300">
                  {getTeamLegStats('team_2').darts}
                </div>
              </div>
            </div>

            {/* TEAM 2 MAIN SCORE DISPLAY (X01) */}
            {match.rules.type === 'x01' && (
              <div className="my-3 flex flex-col items-center justify-center">
                <div
                  className={`font-mono font-black tracking-tight leading-none transition-all ${
                    isChalkboardMode ? 'text-8xl md:text-9xl py-2' : 'text-6xl md:text-7xl'
                  } ${
                    isTeam2Active ? 'text-blue-400 drop-shadow-[0_0_24px_rgba(59,130,246,0.35)]' : 'text-zinc-300'
                  }`}
                >
                  {team2Remaining}
                </div>
                {team2Remaining <= 170 && team2Remaining > 1 && (
                  <div className="mt-3 text-xs sm:text-sm font-black px-3.5 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-xl shadow-sm">
                    {getCheckoutSuggestion(team2Remaining, 3)?.description || `Requires ${team2Remaining}`}
                  </div>
                )}
              </div>
            )}

            {/* TEAM 2 CRICKET DISPLAY */}
            {match.rules.type === 'cricket' && team2Representative && (
              <div className="my-2 flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Team Points</span>
                  <span className="text-2xl font-mono font-black text-blue-400">
                    {cricketState[team2Representative.id]?.score || 0}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[20, 19, 18, 17, 16, 15, 25].map((seg) => {
                    const marks = cricketState[team2Representative.id]?.marks[seg] || 0;
                    return (
                      <div
                        key={`crick-t2-${seg}`}
                        className={`flex flex-col items-center p-1.5 rounded-lg border text-center ${
                          marks >= 3
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                            : marks > 0
                            ? 'bg-blue-950/40 border-blue-600/40 text-blue-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className="text-[10px] font-black">{seg === 25 ? 'BULL' : seg}</span>
                        <span className="text-sm font-black mt-0.5">
                          {marks === 0 ? '—' : marks === 1 ? '/' : marks === 2 ? 'X' : '⨂'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TEAM 2 ROSTER & ACTIVE PLAYER ROTATION */}
            <div className="mt-4 flex flex-col gap-2 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Roster ({team2Players.length} Players)</span>
                <span className="text-zinc-500">Current Leg Stats</span>
              </div>

              <div className="flex flex-col gap-1.5">
                {team2Players.map((player) => {
                  const isThisPlayerActive = activePlayer.id === player.id;
                  const stats = getPlayerLegStats(player.id);
                  const playerIdx = match.players.findIndex((p) => p.id === player.id);

                  return (
                    <div
                      key={player.id}
                      onClick={() => onSelectPlayer && onSelectPlayer(playerIdx)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isThisPlayerActive
                          ? 'bg-blue-500/20 border-blue-500 text-white font-black shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{player.avatar}</span>
                        <span className="font-bold">{player.name}</span>
                        {player.isBot && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded">
                            BOT L{player.botLevel}
                          </span>
                        )}
                        {isThisPlayerActive && (
                          <span className="text-[9px] font-black uppercase bg-blue-500 text-white px-1.5 py-0.2 rounded animate-pulse">
                            🎯 OCHE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-zinc-400">3DA: <b className="text-white">{stats.avg}</b></span>
                        <span className="text-zinc-500">Darts: <b className="text-zinc-300">{stats.darts}</b></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team 2 Footer: Team 3DA & High Turn */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-zinc-400 font-semibold">Team 3-Dart Avg:</span>
                <span className="font-mono font-bold text-white">{getTeamLegStats('team_2').avg}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400 font-semibold">Team High Turn:</span>
                <span className="font-mono font-bold text-white">{getTeamLegStats('team_2').highTurn}</span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        /* --- SINGLES / INDIVIDUAL PLAYERS SCOREBOARD --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {match.players.map((player, idx) => {
            const isActive = idx === activePlayerIndex;
            const remaining = remainingScores[player.id] ?? 0;
            const stats = getPlayerLegStats(player.id);
            const scoreRecord = match.scores[player.id] || { legsWon: 0, setsWon: 0 };

            return (
              <motion.div
                key={player.id}
                onClick={() => onSelectPlayer && onSelectPlayer(idx)}
                layout
                className={`relative overflow-hidden rounded-2xl border-2 transition-all p-5 shadow-2xl flex flex-col justify-between ${
                  isActive
                    ? 'bg-zinc-900 border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'bg-zinc-950 border-zinc-800/80 opacity-90'
                }`}
              >
                {/* Active Throwing Ribbon */}
                {isActive && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-md">
                    <Flame className="w-3 h-3 fill-zinc-950" />
                    <span>Throwing</span>
                  </div>
                )}

                {/* Player Info Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{player.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-base">{player.name}</span>
                        {player.isBot && (
                          <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                            BOT Lvl {player.botLevel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-zinc-400">
                        Legs: {scoreRecord.legsWon}
                        {match.rules.type === 'x01' && match.rules.config.setsToWin > 1 && ` • Sets: ${scoreRecord.setsWon}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Darts</div>
                    <div className="text-sm font-mono font-bold text-zinc-300">{stats.darts}</div>
                  </div>
                </div>

                {/* MAIN SCORE DISPLAY (X01) */}
                {match.rules.type === 'x01' && (
                  <div className="my-3 flex flex-col items-center justify-center">
                    <div
                      className={`font-mono font-black tracking-tight leading-none transition-all ${
                        isChalkboardMode ? 'text-8xl md:text-9xl py-2' : 'text-6xl md:text-7xl'
                      } ${
                        isActive ? 'text-amber-400 drop-shadow-[0_0_24px_rgba(245,158,11,0.35)]' : 'text-zinc-300'
                      }`}
                    >
                      {remaining}
                    </div>
                    {remaining <= 170 && remaining > 1 && (
                      <div className="mt-3 text-xs sm:text-sm font-black px-3.5 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl shadow-sm">
                        {getCheckoutSuggestion(remaining, 3)?.description || `Requires ${remaining}`}
                      </div>
                    )}
                  </div>
                )}

                {/* CRICKET PLAYER GRID */}
                {match.rules.type === 'cricket' && (
                  <div className="my-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                      <span className="text-xs text-zinc-400 font-bold uppercase">Points</span>
                      <span className="text-2xl font-mono font-black text-amber-400">
                        {cricketState[player.id]?.score || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[20, 19, 18, 17, 16, 15, 25].map((seg) => {
                        const marks = cricketState[player.id]?.marks[seg] || 0;
                        return (
                          <div
                            key={`crick-${seg}`}
                            className={`flex flex-col items-center p-1.5 rounded-lg border text-center ${
                              marks >= 3
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                                : marks > 0
                                ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                            }`}
                          >
                            <span className="text-[10px] font-black">{seg === 25 ? 'BULL' : seg}</span>
                            <span className="text-sm font-black mt-0.5">
                              {marks === 0 ? '—' : marks === 1 ? '/' : marks === 2 ? 'X' : '⨂'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AROUND THE CLOCK HUD */}
                {match.rules.type === 'around_the_clock' && (
                  <div className="my-2 flex flex-col items-center justify-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Target Number</span>
                    <span className="text-4xl font-black font-mono text-amber-400 mt-1">
                      {aroundClockState[player.id]?.currentTarget === 25
                        ? 'BULL'
                        : aroundClockState[player.id]?.currentTarget || 1}
                    </span>
                    <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (((aroundClockState[player.id]?.currentTarget || 1) - 1) / 21) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* KILLER HUD */}
                {match.rules.type === 'killer' && (
                  <div className="my-2 flex flex-col gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold">Status:</span>
                      <span
                        className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                          killerState[player.id]?.isKiller
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {killerState[player.id]?.isKiller ? '☠️ KILLER' : 'Hunter'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-bold">Lives:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: killerState[player.id]?.lives || 0 }).map((_, i) => (
                          <Heart key={i} className="w-4 h-4 fill-red-500 text-red-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* BOB'S 27 HUD */}
                {match.rules.type === 'bobs_27' && (
                  <div className="my-2 flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold">Round Target</div>
                      <div className="text-xl font-black text-amber-400">
                        {bobs27State[player.id]?.currentRound === 21
                          ? 'D-BULL'
                          : `D${bobs27State[player.id]?.currentRound || 1}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold">Points</div>
                      <div className="text-3xl font-black font-mono text-white">
                        {bobs27State[player.id]?.score || 27}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Card Footer: 3DA & High Turn */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-zinc-400 font-semibold">3-Dart Avg:</span>
                    <span className="font-mono font-bold text-white">{stats.avg}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-400 font-semibold">High Turn:</span>
                    <span className="font-mono font-bold text-white">{stats.highTurn}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Real-Time Checkout Path Banner */}
      {checkout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
              🎯
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Checkout Path ({activeScore} Remaining)
              </div>
              <div className="text-sm font-extrabold text-white">{checkout.description}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {checkout.route.map((dart, i) => (
              <div
                key={`route-${i}`}
                className={`px-3 py-1.5 rounded-xl font-black text-sm border shadow-md flex items-center gap-1 ${
                  i === 0
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 animate-pulse'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                }`}
              >
                <span>{dart}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Turns Live Timeline */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 shadow-lg">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Recent Leg Turns</span>
          <span className="text-[11px] text-zinc-500 font-normal">
            Total Turns: {currentLeg.turns.length}
          </span>
        </div>

        {currentLeg.turns.length === 0 ? (
          <div className="text-xs text-zinc-600 italic py-2 text-center">
            Leg started. Awaiting first turn throws...
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {currentLeg.turns.slice(-5).reverse().map((turn) => {
              const player = match.players.find((p) => p.id === turn.playerId);
              const isT1 = player?.teamId === 'team_1';
              const isT2 = player?.teamId === 'team_2';

              return (
                <div
                  key={turn.id}
                  className="flex items-center justify-between bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-800/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{player?.avatar}</span>
                    <span className="font-bold text-zinc-200">{player?.name}</span>
                    {isTeamMatch && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          isT1
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {isT1 ? team1?.name : team2?.name}
                      </span>
                    )}
                    <div className="flex gap-1 ml-2">
                      {turn.darts.map((d, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-zinc-950 text-zinc-400 rounded text-[10px] font-mono border border-zinc-800"
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black font-mono text-sm ${
                        turn.isBust
                          ? 'text-red-400'
                          : turn.turnTotal === 180
                          ? 'text-amber-400 font-black scale-110'
                          : turn.turnTotal >= 100
                          ? 'text-emerald-400'
                          : 'text-zinc-200'
                      }`}
                    >
                      {turn.isBust ? 'BUST' : turn.turnTotal}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      (Left: {turn.scoreAfter})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
