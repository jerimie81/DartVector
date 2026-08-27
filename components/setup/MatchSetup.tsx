'use client';

import React, { useState, useEffect } from 'react';
import {
  GameType,
  GameRules,
  PlayerProfile,
  TeamProfile,
  X01StartingScore,
  InOutRule,
  OutRule,
} from '@/lib/types';
import { BOT_LEVELS } from '@/lib/dartbot';
import { storageEngine } from '@/lib/storage';
import {
  Target,
  Users,
  Bot,
  Play,
  Settings,
  Sparkles,
  Trophy,
  Flame,
  Volume2,
  Clock,
  Shield,
  Layers,
  Plus,
  Trash2,
  ArrowRightLeft,
  UserPlus,
  Crown,
  Shuffle,
  Info,
} from 'lucide-react';

interface MatchSetupProps {
  onStartMatch: (
    gameType: GameType,
    rules: GameRules,
    selectedPlayers: PlayerProfile[],
    isTeamMatch?: boolean,
    teams?: { team_1: TeamProfile; team_2: TeamProfile }
  ) => void;
}

const TEAM_AVATARS_1 = ['🔴', '🎯', '🦅', '⚡', '👑', '🔥', '🦁', '🐉'];
const TEAM_AVATARS_2 = ['🔵', '⚡', '🦁', '🛡️', '🚀', '❄️', '🐺', '🎯'];
const TEAM_COLORS_1 = ['#EF4444', '#F97316', '#F59E0B', '#EC4899', '#8B5CF6'];
const TEAM_COLORS_2 = ['#3B82F6', '#06B6D4', '#10B981', '#6366F1', '#14B8A6'];

export const MatchSetup: React.FC<MatchSetupProps> = ({ onStartMatch }) => {
  // Mode Category: 'teams' (Two Teams Mode) or 'singles' (Individual / FFA / Bot)
  const [competitionType, setCompetitionType] = useState<'teams' | 'singles'>('teams');

  // Game rules
  const [gameType, setGameType] = useState<GameType>('x01');
  const [x01Score, setX01Score] = useState<X01StartingScore>(501);
  const [inRule, setInRule] = useState<InOutRule>('straight_in');
  const [outRule, setOutRule] = useState<OutRule>('double_out');
  const [legsToWin, setLegsToWin] = useState<number>(3);
  const [setsToWin, setSetsToWin] = useState<number>(1);
  const [legsPerSet, setLegsPerSet] = useState<number>(3);

  // Cricket settings
  const [cricketPoints, setCricketPoints] = useState<boolean>(true);
  const [cricketLegs, setCricketLegs] = useState<number>(1);

  // Around the clock settings
  const [clockTargetType, setClockTargetType] = useState<'singles' | 'doubles' | 'trebles'>('singles');
  const [clockIncludeBull, setClockIncludeBull] = useState<boolean>(true);

  // Killer settings
  const [killerLives, setKillerLives] = useState<number>(5);

  // Shanghai settings
  const [shanghaiRounds, setShanghaiRounds] = useState<7 | 20>(7);

  // Singles Mode state
  const [singlesOpponentMode, setSinglesOpponentMode] = useState<'bot' | 'pvp' | 'solo'>('bot');
  const [selectedBotLevel, setSelectedBotLevel] = useState<number>(12);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerProfile[]>([]);
  const [selectedHuman1, setSelectedHuman1] = useState<string>('p1');
  const [selectedHuman2, setSelectedHuman2] = useState<string>('');

  // --- TWO-TEAMS STATE (Max 6 players total) ---
  const [team1Name, setTeam1Name] = useState<string>('Red Dragons');
  const [team1Color, setTeam1Color] = useState<string>('#EF4444');
  const [team1Avatar, setTeam1Avatar] = useState<string>('🔴');
  const [team1Roster, setTeam1Roster] = useState<PlayerProfile[]>([
    {
      id: 't1_p1',
      name: 'Player 1',
      avatar: '🎯',
      color: '#EF4444',
      isBot: false,
      teamId: 'team_1',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 't1_p2',
      name: 'Player 2',
      avatar: '🔥',
      color: '#F97316',
      isBot: false,
      teamId: 'team_1',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ]);

  const [team2Name, setTeam2Name] = useState<string>('Blue Knights');
  const [team2Color, setTeam2Color] = useState<string>('#3B82F6');
  const [team2Avatar, setTeam2Avatar] = useState<string>('🔵');
  const [team2Roster, setTeam2Roster] = useState<PlayerProfile[]>([
    {
      id: 't2_p1',
      name: 'Player 3',
      avatar: '⚡',
      color: '#3B82F6',
      isBot: false,
      teamId: 'team_2',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 't2_p2',
      name: 'DartBot (Lvl 12)',
      avatar: '🤖',
      color: '#6366F1',
      isBot: true,
      botLevel: 12,
      teamId: 'team_2',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ]);

  // Modal / Inline Add Player State
  const [addingToTeam, setAddingToTeam] = useState<'team_1' | 'team_2' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerIsBot, setNewPlayerIsBot] = useState<boolean>(false);
  const [newPlayerBotLevel, setNewPlayerBotLevel] = useState<number>(12);
  const [newPlayerAvatar, setNewPlayerAvatar] = useState<string>('🎯');

  const totalTeamPlayers = team1Roster.length + team2Roster.length;
  const isMaxPlayersReached = totalTeamPlayers >= 6;

  useEffect(() => {
    storageEngine.getPlayers().then((players) => {
      setAvailablePlayers(players);
      const humanPlayers = players.filter((p) => !p.isBot);
      if (humanPlayers.length > 0) {
        setSelectedHuman1(humanPlayers[0].id);
        if (humanPlayers.length > 1) {
          setSelectedHuman2(humanPlayers[1].id);
        }
      }
    });
  }, []);

  // Quick Preset Handlers
  const applyPreset = (preset: '1v1' | '2v2' | '3v3' | 'humans_vs_bots') => {
    if (preset === '1v1') {
      setTeam1Roster([
        {
          id: 't1_p1',
          name: 'Player 1',
          avatar: '🎯',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
      setTeam2Roster([
        {
          id: 't2_p1',
          name: 'Player 2',
          avatar: '⚡',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
    } else if (preset === '2v2') {
      setTeam1Roster([
        {
          id: 't1_p1',
          name: 'Player 1',
          avatar: '🎯',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't1_p2',
          name: 'Player 2',
          avatar: '🔥',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
      setTeam2Roster([
        {
          id: 't2_p1',
          name: 'Player 3',
          avatar: '⚡',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't2_p2',
          name: 'Player 4',
          avatar: '🛡️',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
    } else if (preset === '3v3') {
      setTeam1Roster([
        {
          id: 't1_p1',
          name: 'Player 1',
          avatar: '🎯',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't1_p2',
          name: 'Player 2',
          avatar: '🔥',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't1_p3',
          name: 'Player 3',
          avatar: '🦅',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
      setTeam2Roster([
        {
          id: 't2_p1',
          name: 'Player 4',
          avatar: '⚡',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't2_p2',
          name: 'Player 5',
          avatar: '🦁',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't2_p3',
          name: 'Player 6',
          avatar: '🛡️',
          color: team2Color,
          isBot: false,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
    } else if (preset === 'humans_vs_bots') {
      setTeam1Roster([
        {
          id: 't1_p1',
          name: 'Human 1',
          avatar: '🎯',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't1_p2',
          name: 'Human 2',
          avatar: '👑',
          color: team1Color,
          isBot: false,
          teamId: 'team_1',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
      setTeam2Roster([
        {
          id: 't2_p1',
          name: 'DartBot (Lvl 12)',
          avatar: '🤖',
          color: team2Color,
          isBot: true,
          botLevel: 12,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 't2_p2',
          name: 'DartBot (Lvl 18)',
          avatar: '🤖',
          color: team2Color,
          isBot: true,
          botLevel: 18,
          teamId: 'team_2',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ]);
    }
  };

  // Move player between teams
  const movePlayerToOtherTeam = (player: PlayerProfile, fromTeam: 'team_1' | 'team_2') => {
    if (fromTeam === 'team_1') {
      setTeam1Roster((prev) => prev.filter((p) => p.id !== player.id));
      setTeam2Roster((prev) => [...prev, { ...player, teamId: 'team_2' }]);
    } else {
      setTeam2Roster((prev) => prev.filter((p) => p.id !== player.id));
      setTeam1Roster((prev) => [...prev, { ...player, teamId: 'team_1' }]);
    }
  };

  // Remove player from roster
  const removePlayer = (playerId: string, team: 'team_1' | 'team_2') => {
    if (team === 'team_1') {
      setTeam1Roster((prev) => prev.filter((p) => p.id !== playerId));
    } else {
      setTeam2Roster((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  // Add player to roster
  const handleAddPlayerSubmit = () => {
    if (!addingToTeam || isMaxPlayersReached) return;

    const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let player: PlayerProfile;

    if (newPlayerIsBot) {
      const botConfig = BOT_LEVELS[newPlayerBotLevel - 1];
      player = {
        id,
        name: `DartBot (Lvl ${botConfig.level})`,
        avatar: '🤖',
        color: addingToTeam === 'team_1' ? team1Color : team2Color,
        isBot: true,
        botLevel: botConfig.level,
        teamId: addingToTeam,
        createdAt: '2025-01-01T00:00:00.000Z',
      };
    } else {
      const name = newPlayerName.trim() || `Player ${totalTeamPlayers + 1}`;
      player = {
        id,
        name,
        avatar: newPlayerAvatar,
        color: addingToTeam === 'team_1' ? team1Color : team2Color,
        isBot: false,
        teamId: addingToTeam,
        createdAt: '2025-01-01T00:00:00.000Z',
      };
    }

    if (addingToTeam === 'team_1') {
      setTeam1Roster((prev) => [...prev, player]);
    } else {
      setTeam2Roster((prev) => [...prev, player]);
    }

    // Reset inline form
    setAddingToTeam(null);
    setNewPlayerName('');
    setNewPlayerIsBot(false);
  };

  // Compute interleaved throwing order for visual preview
  const interleavedThrowOrder: PlayerProfile[] = React.useMemo(() => {
    const list: PlayerProfile[] = [];
    const maxLen = Math.max(team1Roster.length, team2Roster.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < team1Roster.length) list.push({ ...team1Roster[i], teamId: 'team_1' });
      if (i < team2Roster.length) list.push({ ...team2Roster[i], teamId: 'team_2' });
    }
    return list;
  }, [team1Roster, team2Roster]);

  const handleStart = () => {
    // Build GameRules
    let rules: GameRules;

    if (gameType === 'x01') {
      rules = {
        type: 'x01',
        config: {
          startingScore: x01Score,
          inRule,
          outRule,
          legsToWin,
          setsToWin,
          legsPerSet,
        },
      };
    } else if (gameType === 'cricket') {
      rules = {
        type: 'cricket',
        config: {
          includePoints: cricketPoints,
          legsToWin: cricketLegs,
        },
      };
    } else if (gameType === 'around_the_clock') {
      rules = {
        type: 'around_the_clock',
        config: {
          targetType: clockTargetType,
          includeBull: clockIncludeBull,
        },
      };
    } else if (gameType === 'killer') {
      rules = {
        type: 'killer',
        config: {
          startingLives: killerLives,
          doubleToQualify: true,
        },
      };
    } else if (gameType === 'shanghai') {
      rules = {
        type: 'shanghai',
        config: {
          rounds: shanghaiRounds,
        },
      };
    } else if (gameType === 'bobs_27') {
      rules = {
        type: 'bobs_27',
        config: {},
      };
    } else if (gameType === 'checkout_121') {
      rules = {
        type: 'checkout_121',
        config: { target: 121 },
      };
    } else {
      rules = {
        type: 'scoring_100',
        config: { targetSegment: 20 },
      };
    }

    if (competitionType === 'teams') {
      // Build Team Profiles
      const team1: TeamProfile = {
        id: 'team_1',
        name: team1Name.trim() || 'Team 1',
        color: team1Color,
        avatar: team1Avatar,
        playerIds: team1Roster.map((p) => p.id),
      };

      const team2: TeamProfile = {
        id: 'team_2',
        name: team2Name.trim() || 'Team 2',
        color: team2Color,
        avatar: team2Avatar,
        playerIds: team2Roster.map((p) => p.id),
      };

      const finalPlayers = interleavedThrowOrder;
      if (finalPlayers.length === 0) return;

      onStartMatch(gameType, rules, finalPlayers, true, { team_1: team1, team_2: team2 });
    } else {
      // Singles / Individual Mode
      const human1 = availablePlayers.find((p) => p.id === selectedHuman1) || {
        id: 'p1',
        name: 'Player 1',
        avatar: '🎯',
        color: '#3B82F6',
        isBot: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      let matchPlayers: PlayerProfile[] = [human1];

      if (singlesOpponentMode === 'bot') {
        const botConfig = BOT_LEVELS[selectedBotLevel - 1];
        const botPlayer: PlayerProfile = {
          id: `bot_lvl_${botConfig.level}`,
          name: `DartBot (Lvl ${botConfig.level})`,
          avatar: '🤖',
          color: '#EF4444',
          isBot: true,
          botLevel: botConfig.level,
          createdAt: '2025-01-01T00:00:00.000Z',
        };
        matchPlayers.push(botPlayer);
      } else if (singlesOpponentMode === 'pvp') {
        const human2 = availablePlayers.find((p) => p.id === selectedHuman2) || {
          id: 'p2',
          name: 'Player 2',
          avatar: '⚡',
          color: '#10B981',
          isBot: false,
          createdAt: '2025-01-01T00:00:00.000Z',
        };
        matchPlayers.push(human2);
      }

      onStartMatch(gameType, rules, matchPlayers, false);
    }
  };

  const selectedBot = BOT_LEVELS[selectedBotLevel - 1];

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">New Match Setup</h1>
            <p className="text-xs text-zinc-400">
              Pick a 1-click House League preset below or customize your match rules
            </p>
          </div>
        </div>
      </div>

      {/* 0. HOUSE LEAGUE 1-CLICK QUICK START PRESETS */}
      <div className="bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-5 rounded-3xl border border-amber-500/30 flex flex-col gap-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍺</span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                House League 1-Click Quick Presets
              </span>
              <span className="text-[11px] text-zinc-400">
                Click any preset to instantly configure and start your match
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-zinc-950">
            Fast Start
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCompetitionType('teams');
              setGameType('x01');
              setX01Score(501);
              setOutRule('double_out');
              setLegsToWin(3);
              applyPreset('1v1');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                🎯 501 Double Out
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded">
                Best of 3
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Standard pub league match, double out to finish
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCompetitionType('teams');
              setGameType('x01');
              setX01Score(301);
              setInRule('straight_in');
              setOutRule('straight_out');
              setLegsToWin(3);
              applyPreset('1v1');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                🍻 Casual 301
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded">
                Any Out
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Fast, beginner-friendly games (finish on any single/double)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCompetitionType('teams');
              setGameType('x01');
              setX01Score(501);
              setOutRule('double_out');
              setLegsToWin(3);
              applyPreset('2v2');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                👥 Friday 2v2 Pairs
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded">
                2 vs 2
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Two teams, 2 players each with alternating turns
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCompetitionType('teams');
              setGameType('x01');
              setX01Score(501);
              setOutRule('double_out');
              setLegsToWin(3);
              applyPreset('3v3');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                🛡️ House 3v3 Triples
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-950 text-blue-300 rounded">
                3 vs 3
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Full 6-player team clash with 3 players per squad
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCompetitionType('teams');
              setGameType('cricket');
              setCricketPoints(true);
              setCricketLegs(1);
              applyPreset('1v1');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                ⚔️ Pub Cricket
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-950 text-red-300 rounded">
                15-20 + Bull
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Close out segments 15 to 20 & Bull with score accumulation
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCompetitionType('singles');
              setGameType('around_the_clock');
              setClockTargetType('singles');
              setClockIncludeBull(true);
              setSinglesOpponentMode('bot');
            }}
            className="p-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-start gap-1 text-left transition-all active:scale-95 group shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-white group-hover:text-amber-400">
                🔄 Around the Clock
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-950 text-purple-300 rounded">
                1 to 20
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Hit each number sequentially from 1 to 20 plus Bull
            </span>
          </button>
        </div>
      </div>

      {/* 1. COMPETITION FORMAT SELECTOR (TWO TEAMS vs SINGLES) */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>1. Choose Competition Structure</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="format-teams-btn"
            onClick={() => setCompetitionType('teams')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
              competitionType === 'teams'
                ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Two Teams Mode</span>
                  <span className="text-[10px] font-black uppercase bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded">
                    Max 6 Players
                  </span>
                </div>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  Team 1 vs Team 2 (Pairs, Triples, 1v1, or Custom Rosters with alternating throw turns)
                </span>
              </div>
            </div>
            {competitionType === 'teams' && (
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] mt-1" />
            )}
          </button>

          <button
            id="format-singles-btn"
            onClick={() => setCompetitionType('singles')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
              competitionType === 'singles'
                ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30 text-white'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center font-black">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">Singles / Individual</span>
                </div>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  1v1 vs DartBot AI, Pass & Play Local PvP, or Solo Training Drills
                </span>
              </div>
            </div>
            {competitionType === 'singles' && (
              <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] mt-1" />
            )}
          </button>
        </div>
      </div>

      {/* 2. TWO-TEAMS ROSTER MANAGER (WHEN TEAMS MODE ACTIVE) */}
      {competitionType === 'teams' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col gap-6 shadow-xl">
          {/* Quick Presets & Player Count Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                <span>Team Rosters & Throw Sequence</span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Total Players: <span className="font-mono font-bold text-white">{totalTeamPlayers} / 6 Maximum</span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-500 font-bold uppercase mr-1">Presets:</span>
              <button
                id="preset-2v2-btn"
                onClick={() => applyPreset('2v2')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold border border-zinc-800 transition-colors"
              >
                2v2 Doubles (4p)
              </button>
              <button
                id="preset-3v3-btn"
                onClick={() => applyPreset('3v3')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold border border-zinc-800 transition-colors"
              >
                3v3 Triples (6p)
              </button>
              <button
                id="preset-1v1-btn"
                onClick={() => applyPreset('1v1')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold border border-zinc-800 transition-colors"
              >
                1v1 Team (2p)
              </button>
              <button
                id="preset-hvb-btn"
                onClick={() => applyPreset('humans_vs_bots')}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold border border-zinc-800 transition-colors"
              >
                Humans vs DartBots
              </button>
            </div>
          </div>

          {/* TWO TEAMS COLUMNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- TEAM 1 PANEL --- */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
              {/* Team 1 Header & Customizer */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl cursor-pointer" title="Team Avatar">{team1Avatar}</span>
                  <input
                    type="text"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    placeholder="Team 1 Name"
                    className="bg-zinc-950 border border-zinc-800 text-white font-black text-sm px-2.5 py-1.5 rounded-xl w-full focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {TEAM_COLORS_1.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTeam1Color(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        team1Color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Team 1 Roster List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase">
                  <span>Roster ({team1Roster.length} Players)</span>
                  <span className="text-zinc-500">Throwing Order</span>
                </div>

                {team1Roster.length === 0 ? (
                  <div className="text-xs text-zinc-600 italic py-4 text-center border border-dashed border-zinc-800 rounded-xl">
                    No players in Team 1. Add a player below!
                  </div>
                ) : (
                  team1Roster.map((player, idx) => (
                    <div
                      key={player.id}
                      className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-500">#{idx + 1}</span>
                        <span className="text-base">{player.avatar}</span>
                        <div>
                          <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.isBot && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded font-bold">
                                BOT Lvl {player.botLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePlayerToOtherTeam(player, 'team_1')}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs"
                          title="Move to Team 2"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removePlayer(player.id, 'team_1')}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg text-xs"
                          title="Remove player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Player to Team 1 Button */}
              {!isMaxPlayersReached ? (
                <button
                  id="add-team1-player-btn"
                  onClick={() => setAddingToTeam('team_1')}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Player to {team1Name || 'Team 1'}</span>
                </button>
              ) : (
                <div className="text-[10px] text-zinc-500 text-center font-bold italic py-1">
                  Maximum 6 players reached
                </div>
              )}
            </div>

            {/* --- TEAM 2 PANEL --- */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
              {/* Team 2 Header & Customizer */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl cursor-pointer" title="Team Avatar">{team2Avatar}</span>
                  <input
                    type="text"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    placeholder="Team 2 Name"
                    className="bg-zinc-950 border border-zinc-800 text-white font-black text-sm px-2.5 py-1.5 rounded-xl w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {TEAM_COLORS_2.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTeam2Color(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        team2Color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Team 2 Roster List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase">
                  <span>Roster ({team2Roster.length} Players)</span>
                  <span className="text-zinc-500">Throwing Order</span>
                </div>

                {team2Roster.length === 0 ? (
                  <div className="text-xs text-zinc-600 italic py-4 text-center border border-dashed border-zinc-800 rounded-xl">
                    No players in Team 2. Add a player below!
                  </div>
                ) : (
                  team2Roster.map((player, idx) => (
                    <div
                      key={player.id}
                      className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-500">#{idx + 1}</span>
                        <span className="text-base">{player.avatar}</span>
                        <div>
                          <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.isBot && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded font-bold">
                                BOT Lvl {player.botLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePlayerToOtherTeam(player, 'team_2')}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs"
                          title="Move to Team 1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removePlayer(player.id, 'team_2')}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg text-xs"
                          title="Remove player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Player to Team 2 Button */}
              {!isMaxPlayersReached ? (
                <button
                  id="add-team2-player-btn"
                  onClick={() => setAddingToTeam('team_2')}
                  className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Player to {team2Name || 'Team 2'}</span>
                </button>
              ) : (
                <div className="text-[10px] text-zinc-500 text-center font-bold italic py-1">
                  Maximum 6 players reached
                </div>
              )}
            </div>
          </div>

          {/* INLINE ADD PLAYER MODAL / DRAWER */}
          {addingToTeam && (
            <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Add Member to {addingToTeam === 'team_1' ? team1Name : team2Name}
                </span>
                <button
                  onClick={() => setAddingToTeam(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-zinc-400">Player Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewPlayerIsBot(false)}
                      className={`py-2 text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        !newPlayerIsBot
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Human Player</span>
                    </button>
                    <button
                      onClick={() => setNewPlayerIsBot(true)}
                      className={`py-2 text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        newPlayerIsBot
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>DartBot AI</span>
                    </button>
                  </div>
                </div>

                {!newPlayerIsBot ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-zinc-400">Player Name</label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder={`Player ${totalTeamPlayers + 1}`}
                      className="bg-zinc-950 border border-zinc-800 text-white font-bold text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-zinc-400">
                      DartBot AI Level ({newPlayerBotLevel})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={newPlayerBotLevel}
                      onChange={(e) => setNewPlayerBotLevel(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleAddPlayerSubmit}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Confirm Add Player
              </button>
            </div>
          )}

          {/* Alternating Throw Order Preview Timeline */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Alternating Match Throw Rotation</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Rotates turn-by-turn between teams
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {interleavedThrowOrder.map((player, idx) => {
                const isT1 = player.teamId === 'team_1';
                return (
                  <div
                    key={`turn-${idx}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 ${
                      isT1
                        ? 'bg-red-950/40 border-red-800/60 text-red-300'
                        : 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                    <span>{player.avatar}</span>
                    <span>{player.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({isT1 ? team1Name : team2Name})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. GAME MODE SELECTION */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>2. Select Game Mode</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { type: 'x01', label: 'X01 (501 / 301)', desc: 'Regulation Match' },
            { type: 'cricket', label: 'Cricket & Tactics', desc: '15-20 + Bull Race' },
            { type: 'around_the_clock', label: 'Around The Clock', desc: '1 to 20 Sequence' },
            { type: 'killer', label: 'Killer Darts', desc: 'Elimination Battle' },
            { type: 'shanghai', label: 'Shanghai', desc: 'Round 1-7 Sprint' },
            { type: 'bobs_27', label: "Bob's 27", desc: 'Doubles Training Drill' },
            { type: 'checkout_121', label: '121 Challenge', desc: '9-Dart Checkout Drill' },
            { type: 'scoring_100', label: '100 Darts at T20', desc: 'Grouping Benchmark' },
          ].map((mode) => (
            <button
              key={mode.type}
              id={`mode-select-${mode.type}-btn`}
              onClick={() => setGameType(mode.type as GameType)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                gameType === mode.type
                  ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <span className="font-extrabold text-sm text-white">{mode.label}</span>
              <span className="text-[11px] text-zinc-400">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. MODE SPECIFIC RULES CONFIG */}
      {gameType === 'x01' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="text-xs font-black uppercase tracking-wider text-amber-400">X01 Match Rules</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Starting Score */}
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Starting Score</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[301, 501, 701, 1001].map((s) => (
                  <button
                    key={s}
                    id={`x01-score-${s}-btn`}
                    onClick={() => setX01Score(s as X01StartingScore)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      x01Score === s
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Out Rule */}
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Out Rule</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { rule: 'double_out', label: 'Double Out' },
                  { rule: 'master_out', label: 'Master Out' },
                  { rule: 'straight_out', label: 'Straight Out' },
                ].map((r) => (
                  <button
                    key={r.rule}
                    id={`out-rule-${r.rule}-btn`}
                    onClick={() => setOutRule(r.rule as OutRule)}
                    className={`py-2 text-[11px] font-black rounded-xl border transition-all ${
                      outRule === r.rule
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legs to Win */}
            <div>
              <label className="text-xs font-bold text-zinc-400 mb-1.5 block">Match Length (First to)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 5, 7].map((l) => (
                  <button
                    key={l}
                    id={`legs-to-win-${l}-btn`}
                    onClick={() => setLegsToWin(l)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      legsToWin === l
                        ? 'bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {l} Leg{l > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SINGLES / INDIVIDUAL OPPONENT SELECTION (WHEN SINGLES ACTIVE) */}
      {competitionType === 'singles' && (
        <div className="flex flex-col gap-4">
          <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>3. Choose Opponent</span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <button
              id="opp-mode-bot-btn"
              onClick={() => setSinglesOpponentMode('bot')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                singlesOpponentMode === 'bot'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Bot className="w-6 h-6" />
              <span className="font-extrabold text-sm text-white">DartBot AI (25 Levels)</span>
              <span className="text-[11px] text-zinc-400">Play against calibrated AI</span>
            </button>

            <button
              id="opp-mode-pvp-btn"
              onClick={() => setSinglesOpponentMode('pvp')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                singlesOpponentMode === 'pvp'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Users className="w-6 h-6" />
              <span className="font-extrabold text-sm text-white">2 Players (Pass & Play)</span>
              <span className="text-[11px] text-zinc-400">Local multiplayer</span>
            </button>

            <button
              id="opp-mode-solo-btn"
              onClick={() => setSinglesOpponentMode('solo')}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                singlesOpponentMode === 'solo'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Target className="w-6 h-6" />
              <span className="font-extrabold text-sm text-white">Solo Practice</span>
              <span className="text-[11px] text-zinc-400">Solo drill & training</span>
            </button>
          </div>

          {/* 25-LEVEL DARTBOT SLIDER & DETAIL CARD */}
          {singlesOpponentMode === 'bot' && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    DartBot AI Difficulty
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{selectedBot.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-zinc-500">Target 3DA</div>
                    <div className="text-xl font-mono font-black text-amber-400">~{selectedBot.target3DA}</div>
                  </div>
                  <div className="text-right border-l border-zinc-800 pl-3">
                    <div className="text-[10px] uppercase font-bold text-zinc-500">Gaussian σ</div>
                    <div className="text-xl font-mono font-black text-emerald-400">{selectedBot.sigmaMm} mm</div>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={selectedBotLevel}
                  onChange={(e) => setSelectedBotLevel(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>Lvl 1 (15 avg)</span>
                  <span>Lvl 12 (60 avg)</span>
                  <span>Lvl 18 (84 avg)</span>
                  <span>Lvl 25 (114 avg)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* START MATCH CTA */}
      <button
        id="start-match-cta-btn"
        onClick={handleStart}
        className="w-full h-14 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
      >
        <Play className="w-6 h-6 fill-zinc-950" />
        <span>
          {competitionType === 'teams'
            ? `Start Team Match (${team1Name} vs ${team2Name})`
            : 'Start Darts Match'}
        </span>
      </button>
    </div>
  );
};
