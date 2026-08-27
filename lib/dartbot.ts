// DartMaster Pro - 25-Level Gaussian DartBot AI Engine
import { DartThrow, GameRules, BotConfig } from './types';
import { getIdealTargetCoords, coordinatesToDart } from './dartboard-geometry';
import { getCheckoutSuggestion } from './checkout-engine';

// 25 Level Configuration Matrix with finely calibrated Sigma (mm) and Target 3DA
export const BOT_LEVELS: BotConfig[] = [
  { level: 1, name: 'Rookie (Lvl 1)', sigmaMm: 80.0, target3DA: 15, reactionDelayMs: 650 },
  { level: 2, name: 'Pub Novice (Lvl 2)', sigmaMm: 72.0, target3DA: 20, reactionDelayMs: 650 },
  { level: 3, name: 'Casual Thrower (Lvl 3)', sigmaMm: 65.0, target3DA: 24, reactionDelayMs: 600 },
  { level: 4, name: 'Social Player (Lvl 4)', sigmaMm: 58.0, target3DA: 28, reactionDelayMs: 600 },
  { level: 5, name: 'League Div 5 (Lvl 5)', sigmaMm: 52.0, target3DA: 32, reactionDelayMs: 550 },
  { level: 6, name: 'League Div 4 (Lvl 6)', sigmaMm: 46.0, target3DA: 36, reactionDelayMs: 550 },
  { level: 7, name: 'League Div 3 (Lvl 7)', sigmaMm: 41.0, target3DA: 40, reactionDelayMs: 500 },
  { level: 8, name: 'League Div 2 (Lvl 8)', sigmaMm: 37.0, target3DA: 44, reactionDelayMs: 500 },
  { level: 9, name: 'League Div 1 (Lvl 9)', sigmaMm: 33.0, target3DA: 48, reactionDelayMs: 500 },
  { level: 10, name: 'County Reserve (Lvl 10)', sigmaMm: 29.5, target3DA: 52, reactionDelayMs: 450 },
  { level: 11, name: 'County Player (Lvl 11)', sigmaMm: 26.5, target3DA: 56, reactionDelayMs: 450 },
  { level: 12, name: 'Super League (Lvl 12)', sigmaMm: 24.0, target3DA: 60, reactionDelayMs: 450 },
  { level: 13, name: 'Regional Semi-Pro (Lvl 13)', sigmaMm: 21.5, target3DA: 64, reactionDelayMs: 400 },
  { level: 14, name: 'Q-School Hopeful (Lvl 14)', sigmaMm: 19.0, target3DA: 68, reactionDelayMs: 400 },
  { level: 15, name: 'Challenge Tour (Lvl 15)', sigmaMm: 17.0, target3DA: 72, reactionDelayMs: 400 },
  { level: 16, name: 'Development Tour (Lvl 16)', sigmaMm: 15.0, target3DA: 76, reactionDelayMs: 380 },
  { level: 17, name: 'Pro Tour Qualifier (Lvl 17)', sigmaMm: 13.2, target3DA: 80, reactionDelayMs: 380 },
  { level: 18, name: 'PDC Tour Card (Lvl 18)', sigmaMm: 11.5, target3DA: 84, reactionDelayMs: 350 },
  { level: 19, name: 'PDC Top 64 (Lvl 19)', sigmaMm: 9.8, target3DA: 88, reactionDelayMs: 350 },
  { level: 20, name: 'PDC Top 32 (Lvl 20)', sigmaMm: 8.2, target3DA: 92, reactionDelayMs: 320 },
  { level: 21, name: 'Major Finalist (Lvl 21)', sigmaMm: 6.8, target3DA: 96, reactionDelayMs: 300 },
  { level: 22, name: 'Premier League Contender (Lvl 22)', sigmaMm: 5.5, target3DA: 100, reactionDelayMs: 280 },
  { level: 23, name: 'World Matchplay Champ (Lvl 23)', sigmaMm: 4.6, target3DA: 104, reactionDelayMs: 260 },
  { level: 24, name: 'PDC World No. 1 (Lvl 24)', sigmaMm: 3.8, target3DA: 108, reactionDelayMs: 240 },
  { level: 25, name: 'The Darting God (Lvl 25)', sigmaMm: 3.2, target3DA: 114, reactionDelayMs: 220 },
];

export function getBotConfig(level: number): BotConfig {
  const clamped = Math.max(1, Math.min(25, Math.round(level)));
  return BOT_LEVELS[clamped - 1];
}

// Bivariate Normal Gaussian Random using Box-Muller transform
function generateGaussian(mean: number, stdDev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

// Determine next target for X01
export function selectX01BotTarget(
  scoreRemaining: number,
  dartsInHand: number,
  outRule: string = 'double_out'
): string {
  // If in checkout range
  if (scoreRemaining <= 170 && outRule === 'double_out') {
    const suggestion = getCheckoutSuggestion(scoreRemaining, dartsInHand);
    if (suggestion && suggestion.preferredTarget) {
      return suggestion.preferredTarget;
    }
  }

  // Setup shots if under 200
  if (scoreRemaining <= 200) {
    if (scoreRemaining === 170) return 'T20';
    if (scoreRemaining === 167) return 'T20';
    if (scoreRemaining === 164) return 'T20';
    if (scoreRemaining === 161) return 'T20';
    if (scoreRemaining === 160) return 'T20';
    // If bogey score like 169, 168, 166, 165, 163, 162, 159 -> aim at T20 or T19 to leave a finish
    if ([169, 168, 166, 165, 163, 162, 159].includes(scoreRemaining)) {
      return 'T20';
    }
    // Setup for D20 / D16
    if (scoreRemaining <= 130) {
      const suggestion = getCheckoutSuggestion(scoreRemaining, dartsInHand);
      if (suggestion) return suggestion.preferredTarget;
    }
  }

  // Standard scoring target: T20, or switch to T19 if T20 is blocked or for tactical variety
  if (scoreRemaining >= 60 && Math.random() < 0.92) {
    return 'T20';
  }
  return 'T19';
}

// Determine target for other game modes
export function selectModeBotTarget(
  rules: GameRules,
  context: {
    scoreRemaining?: number;
    dartsInHand?: number;
    cricketMarks?: Record<number, number>;
    opponentMarks?: Record<number, number>;
    aroundClockTarget?: number;
    shanghaiRound?: number;
    bobs27Round?: number;
  }
): string {
  if (rules.type === 'x01') {
    return selectX01BotTarget(
      context.scoreRemaining || 501,
      context.dartsInHand || 3,
      rules.config.outRule
    );
  }

  if (rules.type === 'cricket') {
    const cricketNumbers = [20, 19, 18, 17, 16, 15, 25];
    const myMarks = context.cricketMarks || {};
    const oppMarks = context.opponentMarks || {};

    // Aim for highest open scoring number first
    for (const num of cricketNumbers) {
      const myCount = myMarks[num] || 0;
      const oppCount = oppMarks[num] || 0;
      // If we haven't closed it yet
      if (myCount < 3) {
        return num === 25 ? 'D-BULL' : `T${num}`;
      }
      // If we closed it but opponent hasn't closed it, score heavily on it
      if (myCount >= 3 && oppCount < 3) {
        return num === 25 ? 'D-BULL' : `T${num}`;
      }
    }
    return 'D-BULL';
  }

  if (rules.type === 'around_the_clock') {
    const target = context.aroundClockTarget || 1;
    if (target === 25) return 'BULL';
    if (rules.config.targetType === 'trebles') return `T${target}`;
    if (rules.config.targetType === 'doubles') return `D${target}`;
    return `S${target}`;
  }

  if (rules.type === 'shanghai') {
    const round = context.shanghaiRound || 1;
    // In Shanghai, aim for T[round], S[round], D[round]
    return `T${round}`;
  }

  if (rules.type === 'bobs_27') {
    const round = context.bobs27Round || 1;
    if (round === 21) return 'D-BULL';
    return `D${round}`;
  }

  return 'T20';
}

// Simulate a physical dart throw by DartBot
export function simulateBotThrow(botLevel: number, target: string): DartThrow {
  const config = getBotConfig(botLevel);
  const idealCoords = getIdealTargetCoords(target);

  // Apply Bivariate Normal Gaussian Offset (sigma in mm)
  const offsetX = generateGaussian(0, config.sigmaMm);
  const offsetY = generateGaussian(0, config.sigmaMm);

  const actualX = idealCoords.x + offsetX;
  const actualY = idealCoords.y + offsetY;

  const result = coordinatesToDart(actualX, actualY);

  return {
    segment: result.segment,
    multiplier: result.multiplier,
    score: result.score,
    label: result.label,
    x: Math.round(actualX * 10) / 10,
    y: Math.round(actualY * 10) / 10,
    radius: Math.round(result.radius * 10) / 10,
    angleDeg: Math.round(result.angleDeg * 10) / 10,
    timestamp: Date.now(),
  };
}
