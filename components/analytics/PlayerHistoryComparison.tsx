'use client';

import React, { useState, useMemo } from 'react';
import { PlayerProfile, MatchRecord } from '@/lib/types';
import { calculateAllTimePlayerStats, calculateHeadToHead, PlayerCareerStats } from '@/lib/career-stats';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
} from 'recharts';
import {
  Trophy,
  Users,
  Swords,
  TrendingUp,
  Target,
  Crown,
  Flame,
  Award,
  BarChart3,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
  ArrowUpDown,
  Filter,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

interface PlayerHistoryComparisonProps {
  players: PlayerProfile[];
  matches: MatchRecord[];
  onSelectPlayerForMatch?: (player: PlayerProfile) => void;
}

const PLAYER_COLORS = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Violet
];

export const PlayerHistoryComparison: React.FC<PlayerHistoryComparisonProps> = ({
  players,
  matches,
  onSelectPlayerForMatch,
}) => {
  // All computed career stats
  const allCareerStats = useMemo(() => {
    return calculateAllTimePlayerStats(players, matches);
  }, [players, matches]);

  // Selected player IDs to compare (up to 10)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    // Default select the top 4 players by matches played or all if <= 4
    const sorted = [...allCareerStats].sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    return sorted.slice(0, 4).map((s) => s.player.id);
  });

  // Active view subtab
  const [subTab, setSubTab] = useState<'matrix' | 'charts' | 'head_to_head' | 'career_deep_dive'>('matrix');

  // Search filter for player roster selector
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting state for table
  const [sortField, setSortField] = useState<keyof PlayerCareerStats | 'name'>('overall3DartAvg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Head to head player selections
  const [h2hPlayer1Id, setH2hPlayer1Id] = useState<string>(players[0]?.id || '');
  const [h2hPlayer2Id, setH2hPlayer2Id] = useState<string>(players[1]?.id || '');

  // Deep dive selected player
  const [deepDivePlayerId, setDeepDivePlayerId] = useState<string>(players[0]?.id || '');

  // Filtered roster for selection bar
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    return players.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [players, searchQuery]);

  // Selected players career stats subset (up to 10)
  const selectedStats = useMemo(() => {
    return allCareerStats.filter((cs) => selectedPlayerIds.includes(cs.player.id));
  }, [allCareerStats, selectedPlayerIds]);

  // Handle toggling player selection (up to 10)
  const togglePlayerSelection = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      // Don't allow deselecting everything, keep at least 1
      if (selectedPlayerIds.length > 1) {
        setSelectedPlayerIds(selectedPlayerIds.filter((pid) => pid !== id));
      }
    } else {
      if (selectedPlayerIds.length < 10) {
        setSelectedPlayerIds([...selectedPlayerIds, id]);
      }
    }
  };

  const selectAllTop10 = () => {
    const sorted = [...allCareerStats].sort((a, b) => b.matchesPlayed - a.matchesPlayed);
    setSelectedPlayerIds(sorted.slice(0, 10).map((s) => s.player.id));
  };

  const clearSelection = () => {
    if (players.length > 0) {
      setSelectedPlayerIds([players[0].id]);
    }
  };

  // Sort function
  const sortedStats = useMemo(() => {
    return [...selectedStats].sort((a, b) => {
      let valA: any = sortField === 'name' ? a.player.name : a[sortField];
      let valB: any = sortField === 'name' ? b.player.name : b[sortField];

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [selectedStats, sortField, sortOrder]);

  const handleSort = (field: keyof PlayerCareerStats | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Recharts Data Sets
  // 1. Scoring & Averages Bar Chart
  const averagesChartData = useMemo(() => {
    return selectedStats.map((s) => ({
      name: s.player.name,
      '3-Dart Avg': s.overall3DartAvg,
      'First 9 Avg': s.overallFirst9Avg,
      'Best Match 3DA': s.bestMatch3DA,
    }));
  }, [selectedStats]);

  // 2. Win Rates & Checkouts Bar Chart
  const efficiencyChartData = useMemo(() => {
    return selectedStats.map((s) => ({
      name: s.player.name,
      'Match Win %': s.winRate,
      'Leg Win %': s.legWinRate,
      'Checkout %': s.checkoutPct,
    }));
  }, [selectedStats]);

  // 3. Power Scoring Milestones Chart (180s, 140s, 100s)
  const powerScoringData = useMemo(() => {
    return selectedStats.map((s) => ({
      name: s.player.name,
      '180s (Max)': s.scores180,
      '140+ Scores': s.scores140Plus,
      '100+ Tons': s.scores100Plus,
      '60+ Trebles': s.scores60Plus,
    }));
  }, [selectedStats]);

  // 4. Radar Chart for Multi-Attribute Comparison (Normalized 0-100)
  const radarChartData = useMemo(() => {
    if (selectedStats.length === 0) return [];
    
    // Find max in each category for normalization
    const max3DA = Math.max(...selectedStats.map((s) => s.overall3DartAvg), 80);
    const maxF9 = Math.max(...selectedStats.map((s) => s.overallFirst9Avg), 85);
    const max180s = Math.max(...selectedStats.map((s) => s.scores180), 5);
    const maxHighTurn = 180;
    const maxHighCO = 170;

    const attributes = [
      { key: '3DA', label: '3-Dart Avg', extract: (s: PlayerCareerStats) => Math.min(100, Math.round((s.overall3DartAvg / max3DA) * 100)) },
      { key: 'F9', label: 'First 9 Avg', extract: (s: PlayerCareerStats) => Math.min(100, Math.round((s.overallFirst9Avg / maxF9) * 100)) },
      { key: 'WR', label: 'Match Win %', extract: (s: PlayerCareerStats) => s.winRate },
      { key: 'CO', label: 'Checkout %', extract: (s: PlayerCareerStats) => s.checkoutPct },
      { key: 'PWR', label: 'Power (180s)', extract: (s: PlayerCareerStats) => Math.min(100, Math.round((s.scores180 / max180s) * 100)) },
      { key: 'CLUTCH', label: 'High Finish', extract: (s: PlayerCareerStats) => Math.min(100, Math.round((s.highestCheckout / maxHighCO) * 100)) },
    ];

    return attributes.map((attr) => {
      const row: any = { attribute: attr.label };
      selectedStats.forEach((s) => {
        row[s.player.name] = attr.extract(s);
      });
      return row;
    });
  }, [selectedStats]);

  // Head to Head Computation
  const h2hRecord = useMemo(() => {
    const p1 = players.find((p) => p.id === h2hPlayer1Id) || players[0];
    const p2 = players.find((p) => p.id === h2hPlayer2Id) || players[1] || players[0];
    if (!p1 || !p2) return null;
    return calculateHeadToHead(p1, p2, matches);
  }, [players, h2hPlayer1Id, h2hPlayer2Id, matches]);

  // Deep Dive Player
  const deepDiveStats = useMemo(() => {
    return allCareerStats.find((s) => s.player.id === deepDivePlayerId) || allCareerStats[0];
  }, [allCareerStats, deepDivePlayerId]);

  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                All-Time Career Analytics
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950">
                Up to 10 Players
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Player History & Head-to-Head Comparison
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comprehensive performance vault comparing 3-dart averages, clutch checkouts, win rates, and 180s across {matches.length} all-time matches
            </p>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-zinc-950/90 px-4 py-2.5 rounded-2xl border border-zinc-800/90">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Comparing</span>
            <span className="text-sm font-black text-amber-400">
              {selectedPlayerIds.length} / 10 Players
            </span>
          </div>
          <div className="h-7 w-px bg-zinc-800" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Total Matches</span>
            <span className="text-sm font-black text-white">{matches.length}</span>
          </div>
        </div>
      </div>

      {/* 1. PLAYER MULTI-SELECT ROSTER (UP TO 10 PLAYERS) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Select Players to Compare ({selectedPlayerIds.length} / 10 Selected)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 h-8 pl-8 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={selectAllTop10}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 rounded-xl text-[11px] font-bold transition-all"
            >
              Select Top 10
            </button>
            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-[11px] font-bold transition-all"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Player Selection Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {filteredPlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const index = selectedPlayerIds.indexOf(player.id);
            const color = isSelected ? PLAYER_COLORS[index % PLAYER_COLORS.length] : undefined;
            const stats = allCareerStats.find((s) => s.player.id === player.id);

            return (
              <button
                key={`select-player-${player.id}`}
                onClick={() => togglePlayerSelection(player.id)}
                className={`p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-zinc-900 shadow-md border-amber-500/80 ring-1 ring-amber-500/30'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                    style={{
                      borderColor: isSelected ? color : '#3f3f46',
                      backgroundColor: isSelected ? `${color}20` : '#18181b',
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{player.name}</span>
                      {player.isBot && (
                        <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-normal">
                          Bot
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {stats ? `${stats.overall3DartAvg} 3DA • ${stats.winRate}% WR` : 'No matches'}
                    </div>
                  </div>
                </div>

                <div className="ml-2 flex-shrink-0">
                  {isSelected ? (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-zinc-950 shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      ✓
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUBTABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-2 rounded-2xl">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setSubTab('matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'matrix'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Comparison Matrix</span>
          </button>
          <button
            onClick={() => setSubTab('charts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'charts'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Visual Charts & Radar</span>
          </button>
          <button
            onClick={() => setSubTab('head_to_head')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'head_to_head'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Head-to-Head Duel</span>
          </button>
          <button
            onClick={() => setSubTab('career_deep_dive')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'career_deep_dive'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Career Deep Dive</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-semibold px-2">
          Comparing <strong className="text-amber-400">{selectedStats.length}</strong> selected profiles
        </div>
      </div>

      {/* VIEW 1: COMPARISON MATRIX TABLE */}
      {subTab === 'matrix' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Full Career Matrix Table</h3>
              <p className="text-xs text-zinc-400">
                Click any column header to sort in ascending/descending order
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Highest values in gold</span>
            </div>
          </div>

          {/* Leaders Podium (Top 3 in 3DA, Win Rate, 180s) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Best 3DA */}
            {(() => {
              const best3da = [...selectedStats].sort((a, b) => b.overall3DartAvg - a.overall3DartAvg)[0];
              return best3da ? (
                <div className="bg-gradient-to-br from-amber-500/10 to-zinc-900 p-3.5 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">
                      🎯
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-400">All-Time 3DA Leader</span>
                      <div className="text-sm font-black text-white">{best3da.player.name}</div>
                    </div>
                  </div>
                  <div className="text-xl font-mono font-black text-amber-400">{best3da.overall3DartAvg}</div>
                </div>
              ) : null;
            })()}

            {/* Best Win Rate */}
            {(() => {
              const bestWR = [...selectedStats].sort((a, b) => b.winRate - a.winRate)[0];
              return bestWR ? (
                <div className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400">Win Rate Champion</span>
                      <div className="text-sm font-black text-white">{bestWR.player.name}</div>
                    </div>
                  </div>
                  <div className="text-xl font-mono font-black text-emerald-400">{bestWR.winRate}%</div>
                </div>
              ) : null;
            })()}

            {/* Maximum 180s King */}
            {(() => {
              const max180s = [...selectedStats].sort((a, b) => b.scores180 - a.scores180)[0];
              return max180s ? (
                <div className="bg-gradient-to-br from-red-500/10 to-zinc-900 p-3.5 rounded-2xl border border-red-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl">
                      🔥
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-red-400">180s Maximum King</span>
                      <div className="text-sm font-black text-white">{max180s.player.name}</div>
                    </div>
                  </div>
                  <div className="text-xl font-mono font-black text-red-400">{max180s.scores180} Max</div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Interactive Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-800">
                <tr>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Player</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('matchesPlayed')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Matches</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white text-emerald-400"
                    onClick={() => handleSort('winRate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Win %</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white text-amber-400"
                    onClick={() => handleSort('overall3DartAvg')}
                  >
                    <div className="flex items-center gap-1">
                      <span>3-Dart Avg</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('overallFirst9Avg')}
                  >
                    <div className="flex items-center gap-1">
                      <span>First 9</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('bestMatch3DA')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Best 3DA</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white text-cyan-400"
                    onClick={() => handleSort('checkoutPct')}
                  >
                    <div className="flex items-center gap-1">
                      <span>CO %</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('highestCheckout')}
                  >
                    <div className="flex items-center gap-1">
                      <span>High CO</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white text-red-400"
                    onClick={() => handleSort('scores180')}
                  >
                    <div className="flex items-center gap-1">
                      <span>180s</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('scores140Plus')}
                  >
                    <div className="flex items-center gap-1">
                      <span>140+</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('scores100Plus')}
                  >
                    <div className="flex items-center gap-1">
                      <span>100+</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-white"
                    onClick={() => handleSort('totalDartsThrown')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Darts</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {sortedStats.map((stat, idx) => {
                  const pColor = PLAYER_COLORS[selectedPlayerIds.indexOf(stat.player.id) % PLAYER_COLORS.length];
                  return (
                    <tr
                      key={`matrix-row-${stat.player.id}`}
                      className="hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="p-3.5 font-sans">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{stat.player.avatar}</span>
                          <div>
                            <div className="font-extrabold text-white text-sm flex items-center gap-1.5">
                              <span style={{ color: pColor }}>{stat.player.name}</span>
                              {stat.player.isBot && (
                                <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-normal">
                                  Bot
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              W: {stat.matchesWon} / L: {stat.matchesLost}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-zinc-300 font-bold">{stat.matchesPlayed}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                            stat.winRate >= 60
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : stat.winRate >= 40
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {stat.winRate}%
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-amber-400 text-sm">
                        {stat.overall3DartAvg}
                      </td>
                      <td className="p-3.5 text-zinc-300">{stat.overallFirst9Avg}</td>
                      <td className="p-3.5 text-zinc-300 font-semibold">{stat.bestMatch3DA}</td>
                      <td className="p-3.5 text-cyan-300">
                        {stat.checkoutPct}%
                        <span className="text-[10px] text-zinc-500 block">
                          ({stat.checkoutsHit}/{stat.checkoutsAttempted})
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {stat.highestCheckout || '—'}
                      </td>
                      <td className="p-3.5 font-black text-red-400 text-sm">{stat.scores180}</td>
                      <td className="p-3.5 text-zinc-300">{stat.scores140Plus}</td>
                      <td className="p-3.5 text-zinc-300">{stat.scores100Plus}</td>
                      <td className="p-3.5 text-zinc-400">{stat.totalDartsThrown}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL CHARTS & MULTI-PLAYER RADAR */}
      {subTab === 'charts' && (
        <div className="flex flex-col gap-6">
          {/* Top Row: Radar Attributes + 3DA Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-Attribute Skill Radar (Comparing Selected Players) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span>Skillset Radar Overlay (Normalized)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Comparing 3DA, First 9, Win %, Checkout %, Power, and Clutch
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="attribute" stroke="#a1a1aa" tick={{ fill: '#d4d4d8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3f3f46" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Legend />
                    {selectedStats.map((s, i) => {
                      const color = PLAYER_COLORS[selectedPlayerIds.indexOf(s.player.id) % PLAYER_COLORS.length];
                      return (
                        <Radar
                          key={s.player.name}
                          name={s.player.name}
                          dataKey={s.player.name}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.2}
                        />
                      );
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3-Dart & First 9 Averages Chart */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>3-Dart & First 9 Averages</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Comparison of overall scoring pace vs. first 9 darts
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={averagesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="3-Dart Avg" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="First 9 Avg" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Best Match 3DA" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Win & Checkout Efficiency + Power Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win Rates & Checkouts */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Win Rates & Checkout Precision (%)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Match win percentage vs. double checkout accuracy
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Match Win %" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Leg Win %" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Checkout %" fill="#EC4899" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Power Milestones (180s, 140s, 100s) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    <span>Heavy Scoring Brackets (180s & Tons)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Total count of career power scoring turns
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={powerScoringData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="180s (Max)" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="140+ Scores" fill="#F97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="100+ Tons" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="60+ Trebles" fill="#71717a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DIRECT HEAD-TO-HEAD DUEL */}
      {subTab === 'head_to_head' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span>Head-to-Head Rivalry Breakdown</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Direct historic encounters and head-to-head records between any two players
              </p>
            </div>

            {/* Select 2 Players to Duel */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
                <select
                  value={h2hPlayer1Id}
                  onChange={(e) => setH2hPlayer1Id(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  {players.map((p) => (
                    <option key={`h2h-p1-${p.id}`} value={p.id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-black text-amber-400">VS</span>

                <select
                  value={h2hPlayer2Id}
                  onChange={(e) => setH2hPlayer2Id(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  {players.map((p) => (
                    <option key={`h2h-p2-${p.id}`} value={p.id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {h2hRecord && (
            <div className="flex flex-col gap-6">
              {/* Massive Head to Head Tale of the Tape */}
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <div className="grid grid-cols-3 items-center text-center">
                  {/* Player 1 Banner */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-inner">
                      {h2hRecord.player1.avatar}
                    </div>
                    <div className="text-lg font-black text-white">{h2hRecord.player1.name}</div>
                    <div className="text-4xl font-mono font-black text-amber-400">
                      {h2hRecord.player1Wins}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Wins</span>
                  </div>

                  {/* VS Emblem in Center */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {h2hRecord.totalMatches} Matches Played
                    </span>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-black text-amber-400 shadow-md my-1">
                      VS
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">
                      Legs: {h2hRecord.player1Legs} - {h2hRecord.player2Legs}
                    </span>
                  </div>

                  {/* Player 2 Banner */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center text-4xl shadow-inner">
                      {h2hRecord.player2.avatar}
                    </div>
                    <div className="text-lg font-black text-white">{h2hRecord.player2.name}</div>
                    <div className="text-4xl font-mono font-black text-blue-400">
                      {h2hRecord.player2Wins}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Wins</span>
                  </div>
                </div>

                {/* Tale of the Tape Stat Rows */}
                <div className="mt-8 border-t border-zinc-800/80 pt-6 space-y-3">
                  {[
                    { label: 'H2H 3-Dart Avg', val1: h2hRecord.player1Avg, val2: h2hRecord.player2Avg, unit: '' },
                    { label: 'Highest Turn', val1: h2hRecord.player1HighTurn, val2: h2hRecord.player2HighTurn, unit: '' },
                    { label: 'Highest Checkout', val1: h2hRecord.player1HighCheckout || '—', val2: h2hRecord.player2HighCheckout || '—', unit: '' },
                    { label: '180s Scored', val1: h2hRecord.player1180s, val2: h2hRecord.player2180s, unit: '' },
                  ].map((row, rIdx) => {
                    const is1Better = typeof row.val1 === 'number' && typeof row.val2 === 'number' && row.val1 > row.val2;
                    const is2Better = typeof row.val1 === 'number' && typeof row.val2 === 'number' && row.val2 > row.val1;

                    return (
                      <div
                        key={`tape-row-${rIdx}`}
                        className="grid grid-cols-3 items-center py-2 px-4 rounded-xl bg-zinc-950/60 border border-zinc-800/50"
                      >
                        <div className={`text-left font-mono text-sm font-black ${is1Better ? 'text-amber-400' : 'text-zinc-300'}`}>
                          {row.val1} {row.unit}
                        </div>
                        <div className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                          {row.label}
                        </div>
                        <div className={`text-right font-mono text-sm font-black ${is2Better ? 'text-blue-400' : 'text-zinc-300'}`}>
                          {row.val2} {row.unit}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Encounters Log */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Recent Head-to-Head Encounters</span>
                </h4>

                {h2hRecord.recentMatches.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-6 text-center">
                    No recorded matches between {h2hRecord.player1.name} and {h2hRecord.player2.name} yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {h2hRecord.recentMatches.map((m, mIdx) => {
                      const isP1Winner = m.winnerId === h2hRecord.player1.id;
                      return (
                        <div
                          key={`h2h-match-${mIdx}`}
                          className="flex items-center justify-between p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500">{m.date}</span>
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded font-sans font-bold text-[10px]">
                              {m.gameType}
                            </span>
                            <span className="font-bold text-white font-sans">
                              {m.scoreSummary}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={isP1Winner ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                              {h2hRecord.player1.name}: {m.p1Avg}
                            </span>
                            <span className="text-zinc-700">|</span>
                            <span className={!isP1Winner ? 'text-blue-400 font-bold' : 'text-zinc-500'}>
                              {h2hRecord.player2.name}: {m.p2Avg}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: CAREER DEEP DIVE */}
      {subTab === 'career_deep_dive' && deepDiveStats && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
                {deepDiveStats.player.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{deepDiveStats.player.name}</h3>
                  {deepDiveStats.player.isBot && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      BOT Lvl {deepDiveStats.player.botLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Career dossier • Member since {new Date(deepDiveStats.player.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Select Player Dropdown */}
            <select
              value={deepDivePlayerId}
              onChange={(e) => setDeepDivePlayerId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              {players.map((p) => (
                <option key={`dd-select-${p.id}`} value={p.id}>
                  {p.avatar} {p.name} Dossier
                </option>
              ))}
            </select>
          </div>

          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Career 3-Dart Avg</span>
              <span className="text-2xl font-mono font-black text-amber-400 mt-1 block">
                {deepDiveStats.overall3DartAvg}
              </span>
              <span className="text-[10px] text-zinc-500">First 9: {deepDiveStats.overallFirst9Avg}</span>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Matches Record</span>
              <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                {deepDiveStats.matchesWon}W - {deepDiveStats.matchesLost}L
              </span>
              <span className="text-[10px] text-zinc-500">{deepDiveStats.winRate}% Win Rate</span>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Checkout Accuracy</span>
              <span className="text-2xl font-mono font-black text-cyan-400 mt-1 block">
                {deepDiveStats.checkoutPct}%
              </span>
              <span className="text-[10px] text-zinc-500">High: {deepDiveStats.highestCheckout || '—'}</span>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Power Maximums</span>
              <span className="text-2xl font-mono font-black text-red-400 mt-1 block">
                {deepDiveStats.scores180} 180s
              </span>
              <span className="text-[10px] text-zinc-500">140+: {deepDiveStats.scores140Plus}</span>
            </div>
          </div>

          {/* Form Trend Line Chart (Last 10 Matches) */}
          {deepDiveStats.recentMatchAverages.length > 1 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Form Curve (3-Dart Average Across Last Matches)</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deepDiveStats.recentMatchAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" />
                    <YAxis stroke="#71717a" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      name="3-Dart Avg"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#F59E0B' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
