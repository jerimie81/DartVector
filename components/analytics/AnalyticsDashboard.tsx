'use client';

import React, { useState, useEffect } from 'react';
import { MatchRecord, PlayerProfile, PlayerMatchStats, TeamMatchStats } from '@/lib/types';
import { storageEngine } from '@/lib/storage';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Trophy,
  TrendingUp,
  Award,
  Zap,
  Target,
  Download,
  Upload,
  Trash2,
  Calendar,
  UserCheck,
  Plus,
  BarChart3,
  Flame,
  Users,
  Crown,
} from 'lucide-react';

import { PlayerHistoryComparison } from './PlayerHistoryComparison';

interface AnalyticsDashboardProps {
  currentMatch?: MatchRecord | null;
  onNewMatch?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  currentMatch,
  onNewMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'current_match' | 'player_comparison' | 'match_history' | 'players'>('player_comparison');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(() => currentMatch || null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerAvatar, setNewPlayerAvatar] = useState('🎯');

  const loadData = React.useCallback(async () => {
    const fetchedMatches = await storageEngine.getMatches(100);
    const fetchedPlayers = await storageEngine.getPlayers();
    setMatches(fetchedMatches);
    setPlayers(fetchedPlayers);
    if (!selectedMatch && fetchedMatches.length > 0) {
      setSelectedMatch(fetchedMatches[0]);
    }
  }, [selectedMatch]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const fetchedMatches = await storageEngine.getMatches(100);
      const fetchedPlayers = await storageEngine.getPlayers();
      if (isMounted) {
        setMatches(fetchedMatches);
        setPlayers(fetchedPlayers);
        if (!selectedMatch && fetchedMatches.length > 0) {
          setSelectedMatch(fetchedMatches[0]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedMatch]);

  const handleExportJSON = async () => {
    const jsonStr = await storageEngine.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dartmaster_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const res = await storageEngine.importData(text);
        alert(`Imported ${res.importedMatches} matches and ${res.importedPlayers} players.`);
        loadData();
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm('Delete this match record?')) {
      await storageEngine.deleteMatch(id);
      loadData();
      if (selectedMatch?.id === id) {
        setSelectedMatch(null);
      }
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: PlayerProfile = {
      id: 'p_' + Date.now(),
      name: newPlayerName.trim(),
      avatar: newPlayerAvatar,
      color: '#3B82F6',
      isBot: false,
      createdAt: new Date().toISOString(),
    };
    await storageEngine.savePlayer(newPlayer);
    setNewPlayerName('');
    loadData();
  };

  // Compute stats for selected match
  const selectedMatchStats: PlayerMatchStats[] = React.useMemo(() => {
    return selectedMatch ? storageEngine.calculateMatchStats(selectedMatch) : [];
  }, [selectedMatch]);

  // Compute team stats if team match
  const selectedTeamStats: TeamMatchStats[] = React.useMemo(() => {
    return selectedMatch && selectedMatch.isTeamMatch
      ? storageEngine.calculateTeamStats(selectedMatch)
      : [];
  }, [selectedMatch]);

  // Generate 3DA progression over turns for charts
  const avgProgressionData = React.useMemo(() => {
    if (!selectedMatch) return [];
    const data: any[] = [];
    const playerRunningTotals: Record<string, { totalDarts: number; totalScored: number }> = {};

    selectedMatch.players.forEach((p) => {
      playerRunningTotals[p.id] = { totalDarts: 0, totalScored: 0 };
    });

    let turnIndex = 1;
    selectedMatch.legs.forEach((leg) => {
      leg.turns.forEach((turn) => {
        const count = turn.darts.length || 3;
        const playerRec = playerRunningTotals[turn.playerId];
        if (playerRec) {
          playerRec.totalDarts += count;
          if (!turn.isBust) {
            playerRec.totalScored += turn.turnTotal;
          }
        }

        const point: any = { turn: `T${turnIndex++}` };
        selectedMatch.players.forEach((p) => {
          const rec = playerRunningTotals[p.id];
          point[p.name] = rec.totalDarts > 0 ? Math.round((rec.totalScored / rec.totalDarts) * 3 * 10) / 10 : 0;
        });
        data.push(point);
      });
    });

    return data;
  }, [selectedMatch]);

  // Scoring Distribution Data for Chart
  const scoringDistData = React.useMemo(() => {
    if (!selectedMatchStats.length) return [];
    return [
      {
        category: '180s',
        ...Object.fromEntries(selectedMatchStats.map((s) => [s.name, s.scores180])),
      },
      {
        category: '140+',
        ...Object.fromEntries(selectedMatchStats.map((s) => [s.name, s.scores140Plus])),
      },
      {
        category: '100+',
        ...Object.fromEntries(selectedMatchStats.map((s) => [s.name, s.scores100Plus])),
      },
      {
        category: '60+',
        ...Object.fromEntries(selectedMatchStats.map((s) => [s.name, s.scores60Plus])),
      },
    ];
  }, [selectedMatchStats]);

  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">
      {/* Analytics Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-2xl">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            id="analytics-tab-comparison-btn"
            onClick={() => setActiveTab('player_comparison')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'player_comparison'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>All-Time Player Comparison</span>
          </button>
          <button
            id="analytics-tab-current-btn"
            onClick={() => setActiveTab('current_match')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'current_match'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Match Report</span>
          </button>
          <button
            id="analytics-tab-history-btn"
            onClick={() => setActiveTab('match_history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'match_history'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Match Vault ({matches.length})</span>
          </button>
          <button
            id="analytics-tab-players-btn"
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'players'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Roster & Bots ({players.length})</span>
          </button>
        </div>

        {/* Global Action Tools: Export / Import */}
        <div className="flex items-center gap-2">
          <button
            id="export-db-btn"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-colors"
            title="Export full match vault backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* TAB 0: ALL-TIME PLAYER CAREER & COMPARISON (UP TO 10 PLAYERS) */}
      {activeTab === 'player_comparison' && (
        <PlayerHistoryComparison
          players={players}
          matches={matches}
        />
      )}

      {/* TAB 1: CURRENT MATCH DETAILED REPORT */}
      {activeTab === 'current_match' && (
        <div className="flex flex-col gap-6">
          {!selectedMatch ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              No match selected. Play a match or select one from the Match Vault.
            </div>
          ) : (
            <>
              {/* Match Header Badge */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span>Match Breakdown</span>
                    {selectedMatch.isTeamMatch && (
                      <span className="text-[10px] bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded font-black">
                        Two Teams Mode
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-white flex items-center gap-3 mt-1">
                    <span>
                      {selectedMatch.isTeamMatch && selectedMatch.teams
                        ? `${selectedMatch.teams.team_1.name} vs ${selectedMatch.teams.team_2.name}`
                        : `${selectedMatch.gameType.toUpperCase()} Match`}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                      {new Date(selectedMatch.startTime).toLocaleString()}
                    </span>
                  </h2>
                </div>

                {selectedMatch.isTeamMatch && selectedMatch.winnerTeamId && selectedMatch.teams ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-400">Winning Team</div>
                      <div className="text-sm font-black">
                        {selectedMatch.teams[selectedMatch.winnerTeamId]?.name}
                      </div>
                    </div>
                  </div>
                ) : selectedMatch.winnerPlayerId ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-400">Winner</div>
                      <div className="text-sm font-black">
                        {selectedMatch.players.find((p) => p.id === selectedMatch.winnerPlayerId)?.name}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* TEAM STATS OVERVIEW (IF TEAM MATCH) */}
              {selectedMatch.isTeamMatch && selectedTeamStats.length === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeamStats.map((ts) => {
                    const isWinner = ts.teamId === selectedMatch.winnerTeamId;
                    const isT1 = ts.teamId === 'team_1';
                    return (
                      <div
                        key={ts.teamId}
                        className={`bg-zinc-900 border rounded-2xl p-5 shadow-xl flex flex-col gap-4 ${
                          isWinner ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{ts.avatar}</span>
                            <div>
                              <div className="font-extrabold text-base text-white flex items-center gap-2">
                                <span>{ts.name}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                    isT1
                                      ? 'bg-red-950 text-red-400 border border-red-800'
                                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                                  }`}
                                >
                                  {isT1 ? 'Team 1' : 'Team 2'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400">
                                {ts.playerIds.length} Players:{' '}
                                {selectedMatch.players
                                  .filter((p) => ts.playerIds.includes(p.id))
                                  .map((p) => p.name)
                                  .join(', ')}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-amber-400 font-mono">
                            {ts.legsWon} Legs Won
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Team 3-Dart Avg</span>
                            </div>
                            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                              {ts.threeDartAvg}
                            </div>
                          </div>

                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span>Team First 9 Avg</span>
                            </div>
                            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                              {ts.first9Avg}
                            </div>
                          </div>

                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <div className="text-[10px] font-bold uppercase text-zinc-500">Checkout %</div>
                            <div className="text-xl font-black font-mono text-white mt-1">
                              {ts.checkoutPct}%
                              <span className="text-[10px] font-normal text-zinc-500 ml-1">
                                ({ts.checkoutsHit}/{ts.checkoutsAttempted})
                              </span>
                            </div>
                          </div>

                          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <div className="text-[10px] font-bold uppercase text-zinc-500">High Turn</div>
                            <div className="text-xl font-black font-mono text-white mt-1">
                              {ts.highestTurn}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800 text-xs">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 font-bold">180s</span>
                            <span className="font-black font-mono text-amber-400 text-sm">{ts.scores180}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 font-bold">140+</span>
                            <span className="font-black font-mono text-zinc-200 text-sm">{ts.scores140Plus}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 font-bold">100+</span>
                            <span className="font-black font-mono text-zinc-200 text-sm">{ts.scores100Plus}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 font-bold">60+</span>
                            <span className="font-black font-mono text-zinc-200 text-sm">{ts.scores60Plus}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Head-to-Head Statistics Table Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedMatchStats.map((stat) => (
                  <div
                    key={stat.playerId}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎯</span>
                        <span className="font-extrabold text-base text-white">{stat.name}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {stat.legsWon} Legs Won
                      </span>
                    </div>

                    {/* Stat Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>3-Dart Avg</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                          {stat.threeDartAvg}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>First 9 Avg</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                          {stat.first9Avg}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="text-[10px] font-bold uppercase text-zinc-500">Checkout %</div>
                        <div className="text-xl font-black font-mono text-white mt-1">
                          {stat.checkoutPct}%
                          <span className="text-[10px] font-normal text-zinc-500 ml-1">
                            ({stat.checkoutsHit}/{stat.checkoutsAttempted})
                          </span>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="text-[10px] font-bold uppercase text-zinc-500">High Checkout</div>
                        <div className="text-xl font-black font-mono text-white mt-1">
                          {stat.highestCheckout || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Power Scoring Badges */}
                    <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-zinc-800 text-xs">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-bold">180s</span>
                        <span className="font-black font-mono text-amber-400 text-sm">{stat.scores180}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-bold">140+</span>
                        <span className="font-black font-mono text-zinc-200 text-sm">{stat.scores140Plus}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-bold">100+</span>
                        <span className="font-black font-mono text-zinc-200 text-sm">{stat.scores100Plus}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 font-bold">60+</span>
                        <span className="font-black font-mono text-zinc-200 text-sm">{stat.scores60Plus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3DA Progression Chart */}
              {avgProgressionData.length > 1 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>3-Dart Average Progression (Turn by Turn)</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={avgProgressionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="turn" stroke="#71717a" textAnchor="end" />
                        <YAxis stroke="#71717a" domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderRadius: '0.75rem',
                          }}
                        />
                        <Legend />
                        {selectedMatch.players.map((p, i) => {
                          const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899'];
                          return (
                            <Line
                              key={p.name}
                              type="monotone"
                              dataKey={p.name}
                              stroke={colors[i % colors.length]}
                              strokeWidth={3}
                              dot={{ r: 3 }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Scoring Distribution Chart */}
              {scoringDistData.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Scoring Bracket Distribution</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoringDistData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="category" stroke="#71717a" />
                        <YAxis stroke="#71717a" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderRadius: '0.75rem',
                          }}
                        />
                        <Legend />
                        {selectedMatch.players.map((p, i) => {
                          const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899'];
                          return (
                            <Bar
                              key={p.name}
                              dataKey={p.name}
                              fill={colors[i % colors.length]}
                              radius={[6, 6, 0, 0]}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: MATCH VAULT (HISTORY) */}
      {activeTab === 'match_history' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white">Stored Matches History</h3>
            <span className="text-xs text-zinc-400">{matches.length} Matches in database</span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              No historical matches recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const stats = storageEngine.calculateMatchStats(m);
                const tStats = m.isTeamMatch ? storageEngine.calculateTeamStats(m) : [];
                const winner = m.players.find((p) => p.id === m.winnerPlayerId);
                const winnerTeam = m.isTeamMatch && m.winnerTeamId && m.teams ? m.teams[m.winnerTeamId] : null;
                const isSelected = selectedMatch?.id === m.id;

                return (
                  <div
                    key={m.id}
                    className={`bg-zinc-900 border rounded-2xl p-4 transition-all flex flex-wrap items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => {
                      setSelectedMatch(m);
                      setActiveTab('current_match');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl">
                        {m.isTeamMatch ? '👥' : '🎯'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-base">
                            {m.isTeamMatch && m.teams
                              ? `${m.teams.team_1.name} vs ${m.teams.team_2.name}`
                              : `${m.gameType.toUpperCase()} (${m.players.map((p) => p.name).join(' vs ')})`}
                          </span>
                          {m.isTeamMatch && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                              Two Teams ({m.players.length}P)
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              m.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {m.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3">
                          <span>{new Date(m.startTime).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{m.legs.length} Legs</span>
                          {winnerTeam ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" />
                                <span>Winner: {winnerTeam.name}</span>
                              </span>
                            </>
                          ) : winner ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-bold">Winner: {winner.name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        {m.isTeamMatch && tStats.length === 2
                          ? tStats.map((ts) => (
                              <div key={ts.teamId} className="text-right">
                                <div className="text-zinc-500 text-[10px] font-bold">{ts.name}</div>
                                <div className="text-amber-400 font-black">{ts.threeDartAvg} avg</div>
                              </div>
                            ))
                          : stats.map((s) => (
                              <div key={s.playerId} className="text-right">
                                <div className="text-zinc-500 text-[10px] font-bold">{s.name}</div>
                                <div className="text-amber-400 font-black">{s.threeDartAvg} avg</div>
                              </div>
                            ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMatch(m.id);
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Delete Match"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLAYERS & BOTS MANAGEMENT */}
      {activeTab === 'players' && (
        <div className="flex flex-col gap-6">
          {/* Create Player Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-3">
              Add New Player Profile
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Player Name (e.g., Phil, Luke, Michael)"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 min-w-[200px] h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={newPlayerAvatar}
                onChange={(e) => setNewPlayerAvatar(e.target.value)}
                className="h-11 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-lg focus:outline-none focus:border-amber-500"
              >
                <option value="🎯">🎯 Darts</option>
                <option value="⚡">⚡ Lightning</option>
                <option value="👑">👑 Crown</option>
                <option value="🔥">🔥 Flame</option>
                <option value="🦅">🦅 Eagle</option>
                <option value="🐺">🐺 Wolf</option>
              </select>
              <button
                id="create-player-btn"
                onClick={handleCreatePlayer}
                className="h-11 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Player</span>
              </button>
            </div>
          </div>

          {/* Existing Players Roster */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => (
              <div
                key={p.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{p.avatar}</span>
                  <div>
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.isBot && (
                        <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                          BOT Lvl {p.botLevel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Created: {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {!p.isBot && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete profile ${p.name}?`)) {
                        await storageEngine.deletePlayer(p.id);
                        loadData();
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
