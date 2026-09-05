// DartMaster Pro - Core Type Definitions

export type GameType = 
  | 'x01'
  | 'cricket'
  | 'around_the_clock'
  | 'killer'
  | 'shanghai'
  | 'bobs_27'
  | 'checkout_121'
  | 'scoring_100';

export type X01StartingScore = 101 | 301 | 501 | 701 | 1001;
export type InOutRule = 'straight_in' | 'double_in' | 'triple_in' | 'master_in';
export type OutRule = 'straight_out' | 'double_out' | 'triple_out' | 'master_out';

export interface X01Rules {
  startingScore: X01StartingScore;
  inRule: InOutRule;
  outRule: OutRule;
  legsToWin: number;
  setsToWin: number;
  legsPerSet: number;
}

export interface CricketRules {
  includePoints: boolean; // standard cricket vs no-score cricket
  legsToWin: number;
}

export interface AroundTheClockRules {
  targetType: 'singles' | 'doubles' | 'trebles';
  includeBull: boolean;
}

export interface KillerRules {
  startingLives: number;
  doubleToQualify: boolean;
  selfHitPenalty?: boolean;
}

export interface ShanghaiRules {
  rounds: 7 | 20; // 1-7 or 1-20
}

export type GameRules = 
  | { type: 'x01'; config: X01Rules }
  | { type: 'cricket'; config: CricketRules }
  | { type: 'around_the_clock'; config: AroundTheClockRules }
  | { type: 'killer'; config: KillerRules }
  | { type: 'shanghai'; config: ShanghaiRules }
  | { type: 'bobs_27'; config: Record<string, never> }
  | { type: 'checkout_121'; config: { target: number } }
  | { type: 'scoring_100'; config: { targetSegment: number } };

export interface DartThrow {
  segment: number; // 0 (miss), 1-20, 25 (outer bull), 50 (double bull)
  multiplier: 0 | 1 | 2 | 3;
  score: number; // segment * multiplier (or 25/50)
  label: string; // "T20", "D16", "S20", "BULL", "D-BULL", "MISS"
  x?: number; // Board coordinate X in mm (-170 to 170)
  y?: number; // Board coordinate Y in mm (-170 to 170)
  radius?: number; // distance from center in mm
  angleDeg?: number; // angle in degrees (0 = right, 90 = bottom, -90 = top)
  isBust?: boolean;
  isWinningDart?: boolean;
  timestamp?: number; // epoch ms when the dart was thrown
}

export interface TeamProfile {
  id: 'team_1' | 'team_2';
  name: string;
  color: string;
  avatar: string;
  playerIds: string[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isBot: boolean;
  botLevel?: number; // 1 to 25
  teamId?: 'team_1' | 'team_2';
  createdAt: string;
}

export interface TurnRecord {
  id: string;
  legNumber: number;
  setNumber: number;
  playerId: string;
  darts: DartThrow[];
  turnTotal: number;
  isBust: boolean;
  scoreBefore: number;
  scoreAfter: number;
  dartsRemainingInTurn?: number;
  createdAt: number;
}

export interface CricketPlayerState {
  marks: Record<number, number>; // 15, 16, 17, 18, 19, 20, 25 (Bull) -> marks count (0-3+)
  score: number;
}

export interface KillerPlayerState {
  assignedDouble?: number;
  isKiller: boolean;
  lives: number;
  eliminated: boolean;
}

export interface AroundClockPlayerState {
  currentTarget: number; // 1..20, 25
  completed: boolean;
}

export interface ShanghaiPlayerState {
  roundScores: number[];
  totalScore: number;
  hasShanghaiWon: boolean;
}

export interface Bobs27PlayerState {
  currentRound: number; // 1 to 21 (D1 to D20 + DBull)
  score: number;
  isEliminated: boolean;
  hitsPerRound: number[];
}

export interface LegRecord {
  legNumber: number;
  setNumber: number;
  winnerPlayerId?: string;
  startingScore: number;
  turns: TurnRecord[];
  startTime: number;
  endTime?: number;
}

export interface MatchRecord {
  id: string;
  gameType: GameType;
  rules: GameRules;
  isTeamMatch?: boolean;
  teams?: {
    team_1: TeamProfile;
    team_2: TeamProfile;
  };
  players: PlayerProfile[];
  legs: LegRecord[];
  winnerPlayerId?: string;
  winnerTeamId?: 'team_1' | 'team_2';
  startTime: number;
  endTime?: number;
  status: 'in_progress' | 'completed' | 'paused';
  scores: Record<string, { legsWon: number; setsWon: number }>;
  teamScores?: Record<'team_1' | 'team_2', { legsWon: number; setsWon: number }>;
}

export interface PlayerMatchStats {
  playerId: string;
  name: string;
  teamId?: 'team_1' | 'team_2';
  threeDartAvg: number;
  first9Avg: number;
  highestTurn: number;
  highestCheckout: number;
  checkoutsAttempted: number;
  checkoutsHit: number;
  checkoutPct: number;
  dartsThrown: number;
  scores60Plus: number;
  scores100Plus: number;
  scores140Plus: number;
  scores180: number;
  legsWon: number;
  setsWon: number;
}

export interface TeamMatchStats {
  teamId: 'team_1' | 'team_2';
  name: string;
  avatar: string;
  color: string;
  playerIds: string[];
  threeDartAvg: number;
  first9Avg: number;
  highestTurn: number;
  highestCheckout: number;
  checkoutsAttempted: number;
  checkoutsHit: number;
  checkoutPct: number;
  dartsThrown: number;
  scores60Plus: number;
  scores100Plus: number;
  scores140Plus: number;
  scores180: number;
  legsWon: number;
  setsWon: number;
}

export interface CheckoutRoute {
  score: number;
  darts: string[]; // e.g. ["T20", "T20", "D20"]
  description: string;
  difficulty: 'optimal' | 'alternative' | 'safe';
}

export type DartSoundPack = 'pro_tournament' | 'pub_style' | 'heavy_steel' | 'electronic_soft_tip';

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  soundPack?: DartSoundPack;
  refereeCaller: boolean;
  callTotals: boolean;
  callRemaining: boolean;
  speechRate: number; // 0.8 to 1.3
  selectedVoiceURI?: string;
}

export interface BotConfig {
  level: number; // 1-25
  name: string;
  sigmaMm: number;
  target3DA: number;
  reactionDelayMs: number;
}
