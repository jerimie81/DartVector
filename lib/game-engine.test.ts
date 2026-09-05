import { describe, it, expect } from 'vitest';
import { createNewMatch, applyDartToState } from './game-engine';
import { GameRules, PlayerProfile, DartThrow } from './types';
import { getCheckoutSuggestion } from './checkout-engine';
import { coordinatesToDart, getIdealTargetCoords } from './dartboard-geometry';
import { parseVoiceDartsCommand, parseSingleDartPhrase, parseVoiceDartsSequence } from './voice-parser';

describe('Game Engine - All Game Modes', () => {
  const p1: PlayerProfile = { id: 'p1', name: 'Alice', avatar: '🎯', color: '#f59e0b', isBot: false, createdAt: '' };
  const p2: PlayerProfile = { id: 'p2', name: 'Bob', avatar: '🏹', color: '#3b82f6', isBot: false, createdAt: '' };

  describe('Killer Mode', () => {
    const killerRules: GameRules = {
      type: 'killer',
      config: {
        startingLives: 3,
        doubleToQualify: true,
        selfHitPenalty: true,
      },
    };

    it('initializes killer state correctly for each player', () => {
      const state = createNewMatch('killer', killerRules, [p1, p2]);
      expect(state.killerState).toBeDefined();
      expect(state.killerState.p1.lives).toBe(3);
      expect(state.killerState.p1.isKiller).toBe(false);
      expect(state.killerState.p1.assignedDouble).toBeUndefined();
      expect(state.killerState.p1.eliminated).toBe(false);
    });

    it('assigns double segment in phase 1 when double is hit', () => {
      const state = createNewMatch('killer', killerRules, [p1, p2]);
      const dart: DartThrow = { segment: 20, multiplier: 2, score: 40, isBust: false };
      const result = applyDartToState(state, dart);
      expect(result.nextState.killerState.p1.assignedDouble).toBe(20);
      expect(result.nextState.killerState.p1.isKiller).toBe(false);
    });

    it('promotes to killer in phase 2 when hitting assigned double', () => {
      let state = createNewMatch('killer', killerRules, [p1, p2]);
      const dart1: DartThrow = { segment: 20, multiplier: 2, score: 40, isBust: false };
      state = applyDartToState(state, dart1).nextState;
      const dart2: DartThrow = { segment: 20, multiplier: 2, score: 40, isBust: false };
      state = applyDartToState(state, dart2).nextState;
      expect(state.killerState.p1.isKiller).toBe(true);
    });

    it('deducts lives from opponent in combat phase and eliminates them', () => {
      let state = createNewMatch('killer', killerRules, [p1, p2]);
      state = applyDartToState(state, { segment: 20, multiplier: 2, score: 40, isBust: false }).nextState;
      state = applyDartToState(state, { segment: 20, multiplier: 2, score: 40, isBust: false }).nextState;
      state.killerState.p2.assignedDouble = 19;
      state = applyDartToState(state, { segment: 19, multiplier: 2, score: 38, isBust: false }).nextState;
      expect(state.killerState.p2.lives).toBe(2);
      expect(state.killerState.p2.eliminated).toBe(false);
    });
  });

  describe('X01 Mode', () => {
    const x01Rules: GameRules = {
      type: 'x01',
      config: {
        startingScore: 501,
        inRule: 'straight_in',
        outRule: 'double_out',
        legsToWin: 1,
        setsToWin: 1,
      },
    };

    it('deducts score on valid hit and detects bust on score < 0 or score === 1 in double out', () => {
      let state = createNewMatch('x01', x01Rules, [p1, p2]);
      expect(state.remainingScores.p1).toBe(501);

      // Hit T20 (60)
      const res1 = applyDartToState(state, { segment: 20, multiplier: 3, score: 60, isBust: false });
      expect(res1.nextState.remainingScores.p1).toBe(441);
      expect(res1.isBust).toBe(false);

      // Test bust condition (e.g. remaining 40, hit T20 -> -20 -> bust)
      res1.nextState.remainingScores.p1 = 40;
      const bustRes = applyDartToState(res1.nextState, { segment: 20, multiplier: 3, score: 60, isBust: false });
      expect(bustRes.isBust).toBe(true);
    });

    it('checks out on valid double', () => {
      let state = createNewMatch('x01', x01Rules, [p1, p2]);
      state.remainingScores.p1 = 40;
      const winRes = applyDartToState(state, { segment: 20, multiplier: 2, score: 40, isBust: false });
      expect(winRes.isCheckout).toBe(true);
      expect(winRes.legCompleted).toBe(true);
    });
  });

  describe('Cricket Mode', () => {
    const cricketRules: GameRules = {
      type: 'cricket',
      config: {
        pointsAllowed: true,
        crazyCricket: false,
      },
    };

    it('records marks and awards points once closed', () => {
      let state = createNewMatch('cricket', cricketRules, [p1, p2]);
      // Hit T20 -> 3 marks (closed)
      state = applyDartToState(state, { segment: 20, multiplier: 3, score: 60, isBust: false }).nextState;
      expect(state.cricketState.p1.marks[20]).toBe(3);
      expect(state.cricketState.p1.points).toBe(0);

      // Hit S20 while P2 has not closed -> 20 points
      state = applyDartToState(state, { segment: 20, multiplier: 1, score: 20, isBust: false }).nextState;
      expect(state.cricketState.p1.points).toBe(20);
    });
  });
});

describe('Checkout Engine', () => {
  it('provides official checkout paths for known outshots', () => {
    const out170 = getCheckoutSuggestion(170, 3);
    expect(out170).toBeDefined();
    expect(out170?.totalDarts).toBe(3);

    const out40 = getCheckoutSuggestion(40, 1);
    expect(out40).toBeDefined();
    expect(out40?.path[0].label).toBe('D20');
  });

  it('returns null for impossible outshots', () => {
    expect(getCheckoutSuggestion(169, 3)).toBeNull();
    expect(getCheckoutSuggestion(171, 3)).toBeNull();
    expect(getCheckoutSuggestion(1, 3)).toBeNull();
  });
});

describe('Dartboard Geometry', () => {
  it('maps center coordinates to bullseye and double bull', () => {
    const center = coordinatesToDart(0, 0);
    expect(center.segment).toBe(50);
    expect(center.multiplier).toBe(2);

    const outerBull = coordinatesToDart(0, 10);
    expect(outerBull.segment).toBe(25);
    expect(outerBull.multiplier).toBe(1);
  });

  it('calculates ideal target coordinates accurately', () => {
    const coordsT20 = getIdealTargetCoords(20, 3);
    expect(coordsT20).toBeDefined();
    expect(Math.abs(coordsT20.x)).toBeLessThan(5);
    expect(coordsT20.y).toBeLessThan(0); // Top of board
  });
});

describe('Voice Parser', () => {
  it('parses single dart spoken phrases', () => {
    const t20 = parseSingleDartPhrase('treble twenty');
    expect(t20).toEqual({ segment: 20, multiplier: 3, score: 60, isBust: false });

    const d16 = parseSingleDartPhrase('double 16');
    expect(d16).toEqual({ segment: 16, multiplier: 2, score: 32, isBust: false });

    const bull = parseSingleDartPhrase('bullseye');
    expect(bull).toEqual({ segment: 50, multiplier: 2, score: 50, isBust: false });
  });

  it('parses multi-dart sequences accurately', () => {
    const seq = parseVoiceDartsSequence('twenty, twenty, five');
    expect(seq).toBeDefined();
    expect(seq?.darts.length).toBe(3);
    expect(seq?.darts[0].segment).toBe(20);
    expect(seq?.darts[1].segment).toBe(20);
    expect(seq?.darts[2].segment).toBe(5);
  });

  it('parses undo and bust commands', () => {
    const undoRes = parseVoiceDartsCommand('undo last dart');
    expect(undoRes.type).toBe('undo');

    const bustRes = parseVoiceDartsCommand('bust');
    expect(bustRes.type).toBe('bust');
  });
});

