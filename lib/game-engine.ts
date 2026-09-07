// DartMaster Pro - Complete Game Rules State Machine & Match Coordinator
import {
  GameType,
  GameRules,
  MatchRecord,
  PlayerProfile,
  TeamProfile,
  DartThrow,
  TurnRecord,
  LegRecord,
  CricketPlayerState,
  AroundClockPlayerState,
  KillerPlayerState,
  ShanghaiPlayerState,
  Bobs27PlayerState,
} from './types';

export interface GameState {
  match: MatchRecord;
  currentLeg: LegRecord;
  activePlayerIndex: number;
  currentTurnDarts: DartThrow[];
  isMatchOver: boolean;
  winnerPlayerId?: string;
  winnerTeamId?: 'team_1' | 'team_2';
  // Specific mode states keyed by playerId
  cricketState: Record<string, CricketPlayerState>;
  aroundClockState: Record<string, AroundClockPlayerState>;
  killerState: Record<string, KillerPlayerState>;
  shanghaiState: Record<string, ShanghaiPlayerState>;
  bobs27State: Record<string, Bobs27PlayerState>;
  // For X01: current remaining score for each player in active leg
  remainingScores: Record<string, number>;
  // Starter index for current leg
  legStarterIndex: number;
}

export function createNewMatch(
  gameType: GameType,
  rules: GameRules,
  players: PlayerProfile[],
  isTeamMatch: boolean = false,
  teams?: { team_1: TeamProfile; team_2: TeamProfile }
): GameState {
  const matchId = 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const startingScore = rules.type === 'x01' ? rules.config.startingScore : 0;

  const initialScores: Record<string, { legsWon: number; setsWon: number }> = {};
  const teamScores: Record<'team_1' | 'team_2', { legsWon: number; setsWon: number }> = {
    team_1: { legsWon: 0, setsWon: 0 },
    team_2: { legsWon: 0, setsWon: 0 },
  };
  const remainingScores: Record<string, number> = {};
  const cricketState: Record<string, CricketPlayerState> = {};
  const aroundClockState: Record<string, AroundClockPlayerState> = {};
  const killerState: Record<string, KillerPlayerState> = {};
  const shanghaiState: Record<string, ShanghaiPlayerState> = {};
  const bobs27State: Record<string, Bobs27PlayerState> = {};

  // Auto-detect team match if players have teamIds assigned
  const hasTeams = isTeamMatch || Boolean(teams) || players.some((p) => Boolean(p.teamId));

  players.forEach((p) => {
    initialScores[p.id] = { legsWon: 0, setsWon: 0 };
    remainingScores[p.id] = startingScore;

    cricketState[p.id] = {
      marks: { 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 25: 0 },
      score: 0,
      points: 0,
    };

    aroundClockState[p.id] = {
      currentTarget: 1,
      completed: false,
    };

    killerState[p.id] = {
      assignedDouble: undefined,
      isKiller: false,
      lives: rules.type === 'killer' ? rules.config.startingLives : 5,
      eliminated: false,
    };

    shanghaiState[p.id] = {
      roundScores: [],
      totalScore: 0,
      hasShanghaiWon: false,
    };

    bobs27State[p.id] = {
      currentRound: 1, // Round 1 = D1
      score: 27,
      isEliminated: false,
      hitsPerRound: [],
    };
  });

  const firstLeg: LegRecord = {
    legNumber: 1,
    setNumber: 1,
    startingScore,
    turns: [],
    startTime: Date.now(),
  };

  const match: MatchRecord = {
    id: matchId,
    gameType,
    rules,
    isTeamMatch: hasTeams,
    teams: hasTeams ? teams : undefined,
    players,
    legs: [firstLeg],
    scores: initialScores,
    teamScores: hasTeams ? teamScores : undefined,
    startTime: Date.now(),
    status: 'in_progress',
  };

  return {
    match,
    currentLeg: firstLeg,
    activePlayerIndex: 0,
    currentTurnDarts: [],
    isMatchOver: false,
    cricketState,
    aroundClockState,
    killerState,
    shanghaiState,
    bobs27State,
    remainingScores,
    legStarterIndex: 0,
  };
}

// Check if a throw in X01 is a winning dart or bust
export function evaluateX01Dart(
  currentScore: number,
  dart: DartThrow,
  rules: GameRules
): {
  newScore: number;
  isBust: boolean;
  isWin: boolean;
} {
  if (rules.type !== 'x01') {
    return { newScore: currentScore, isBust: false, isWin: false };
  }

  const outRule = rules.config.outRule;
  const inRule = rules.config.inRule;
  const dartScore = dart.score;
  const rem = currentScore - dartScore;

  // Double In check (if player is still at starting score)
  if (inRule === 'double_in' && currentScore === rules.config.startingScore) {
    if (dart.multiplier !== 2) {
      return { newScore: currentScore, isBust: false, isWin: false }; // no score until double hit
    }
  }

  // Exactly 0 remaining
  if (rem === 0) {
    if (outRule === 'double_out') {
      const isDouble = dart.multiplier === 2 || dart.segment === 50;
      if (isDouble) {
        return { newScore: 0, isBust: false, isWin: true };
      } else {
        return { newScore: currentScore, isBust: true, isWin: false };
      }
    } else if (outRule === 'master_out') {
      const isMaster = dart.multiplier === 2 || dart.multiplier === 3 || dart.segment === 50;
      if (isMaster) {
        return { newScore: 0, isBust: false, isWin: true };
      } else {
        return { newScore: currentScore, isBust: true, isWin: false };
      }
    } else {
      // straight out
      return { newScore: 0, isBust: false, isWin: true };
    }
  }

  // Remainder < 0 is always Bust
  if (rem < 0) {
    return { newScore: currentScore, isBust: true, isWin: false };
  }

  // Remainder === 1 in double_out or master_out is Bust (cannot finish on 1)
  if (rem === 1 && (outRule === 'double_out' || outRule === 'master_out')) {
    return { newScore: currentScore, isBust: true, isWin: false };
  }

  return { newScore: rem, isBust: false, isWin: false };
}

// Process 1 Dart in the Game Engine
export function applyDartToState(
  state: GameState,
  dart: DartThrow
): {
  nextState: GameState;
  turnCompleted: boolean;
  legCompleted: boolean;
  matchCompleted: boolean;
  isBust: boolean;
  isWinDart: boolean;
  isCheckout?: boolean;
} {
  const activePlayer = state.match.players[state.activePlayerIndex];
  const stampedDart: DartThrow = {
    ...dart,
    timestamp: dart.timestamp || Date.now(),
  };
  const newDarts = [...state.currentTurnDarts, stampedDart];
  const rules = state.match.rules;
  const isTeamMatch = Boolean(state.match.isTeamMatch && activePlayer.teamId);

  let isBust = false;
  let isWinDart = false;
  let turnFinished = newDarts.length >= 3;

  // Deep clone relevant state
  const nextState: GameState = {
    ...state,
    currentTurnDarts: newDarts,
    remainingScores: { ...state.remainingScores },
    cricketState: { ...state.cricketState },
    aroundClockState: { ...state.aroundClockState },
    killerState: { ...state.killerState },
    shanghaiState: { ...state.shanghaiState },
    bobs27State: { ...state.bobs27State },
  };

  // Helper to sync state across teammates in team mode
  const syncTeammateScores = (score: number) => {
    if (isTeamMatch && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          nextState.remainingScores[p.id] = score;
        }
      });
    } else {
      nextState.remainingScores[activePlayer.id] = score;
    }
  };

  // --- MODE SPECIFIC LOGIC ---
  if (rules.type === 'x01') {
    const currentScore = state.remainingScores[activePlayer.id];
    const evalResult = evaluateX01Dart(currentScore, dart, rules);

    if (evalResult.isBust) {
      isBust = true;
      turnFinished = true;
      // Score resets back to what it was at start of turn
      const turns = state.currentLeg.turns;
      // If team match, find last turn of this team
      const relevantTurns = isTeamMatch && activePlayer.teamId
        ? turns.filter((t) => {
            const p = state.match.players.find((pl) => pl.id === t.playerId);
            return p?.teamId === activePlayer.teamId;
          })
        : turns.filter((t) => t.playerId === activePlayer.id);

      const scoreBeforeTurn = relevantTurns.length > 0
        ? relevantTurns[relevantTurns.length - 1].scoreAfter
        : state.currentLeg.startingScore;

      syncTeammateScores(scoreBeforeTurn);
    } else if (evalResult.isWin) {
      isWinDart = true;
      turnFinished = true;
      syncTeammateScores(0);
    } else {
      syncTeammateScores(evalResult.newScore);
    }
  } else if (rules.type === 'cricket') {
    const playerCrick = { ...nextState.cricketState[activePlayer.id] };
    playerCrick.marks = { ...playerCrick.marks };

    const seg = dart.segment === 50 ? 25 : dart.segment;
    if ([15, 16, 17, 18, 19, 20, 25].includes(seg)) {
      const mult = dart.segment === 50 ? 2 : dart.multiplier;
      const currentMarks = playerCrick.marks[seg] || 0;
      const newMarks = currentMarks + mult;
      playerCrick.marks[seg] = Math.min(3, newMarks);

      // Check if opponents have NOT closed this number, then score points
      const pointsEnabled = rules.config.includePoints !== undefined ? rules.config.includePoints : (rules.config as any).pointsAllowed;
      if (newMarks > 3 && pointsEnabled) {
        const excess = currentMarks >= 3 ? mult : newMarks - 3;
        const allOpponentsClosed = state.match.players
          .filter((p) => (isTeamMatch ? p.teamId !== activePlayer.teamId : p.id !== activePlayer.id))
          .every((p) => (nextState.cricketState[p.id]?.marks[seg] || 0) >= 3);

        if (!allOpponentsClosed) {
          playerCrick.score += seg * excess;
          playerCrick.points = playerCrick.score;
        }
      }
    }

    playerCrick.points = playerCrick.score;

    // Sync cricket state across teammates if team match
    if (isTeamMatch && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          nextState.cricketState[p.id] = playerCrick;
        }
      });
    } else {
      nextState.cricketState[activePlayer.id] = playerCrick;
    }

    // Check Cricket Win Condition: All 7 closed AND score >= all opponents
    const allClosed = [15, 16, 17, 18, 19, 20, 25].every((s) => playerCrick.marks[s] >= 3);
    const highestScore = state.match.players.every(
      (p) => playerCrick.score >= (nextState.cricketState[p.id]?.score || 0)
    );

    if (allClosed && highestScore) {
      isWinDart = true;
      turnFinished = true;
    }
  } else if (rules.type === 'around_the_clock') {
    const pClock = { ...nextState.aroundClockState[activePlayer.id] };
    const target = pClock.currentTarget;
    let hit = false;

    if (target === 25 && (dart.segment === 25 || dart.segment === 50)) {
      hit = true;
    } else if (dart.segment === target) {
      if (rules.config.targetType === 'trebles' && dart.multiplier === 3) hit = true;
      else if (rules.config.targetType === 'doubles' && dart.multiplier === 2) hit = true;
      else if (rules.config.targetType === 'singles') hit = true;
    }

    if (hit) {
      if (target === 20 && rules.config.includeBull) {
        pClock.currentTarget = 25;
      } else if ((target === 20 && !rules.config.includeBull) || target === 25) {
        pClock.completed = true;
        isWinDart = true;
        turnFinished = true;
      } else {
        pClock.currentTarget = target + 1;
      }
    }

    if (isTeamMatch && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          nextState.aroundClockState[p.id] = pClock;
        }
      });
    } else {
      nextState.aroundClockState[activePlayer.id] = pClock;
    }
  } else if (rules.type === 'shanghai') {
    const currentRound = Math.floor(state.currentLeg.turns.length / state.match.players.length) + 1;
    const pShang = { ...nextState.shanghaiState[activePlayer.id] };
    if (dart.segment === currentRound) {
      pShang.totalScore += dart.score;
    }

    if (isTeamMatch && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          nextState.shanghaiState[p.id] = pShang;
        }
      });
    } else {
      nextState.shanghaiState[activePlayer.id] = pShang;
    }

    if (newDarts.length === 3) {
      const hits = newDarts.filter((d) => d.segment === currentRound);
      const hasSingle = hits.some((d) => d.multiplier === 1);
      const hasDouble = hits.some((d) => d.multiplier === 2);
      const hasTreble = hits.some((d) => d.multiplier === 3);
      if (hasSingle && hasDouble && hasTreble) {
        pShang.hasShanghaiWon = true;
        isWinDart = true;
      }
    }
  } else if (rules.type === 'bobs_27') {
    const pBob = { ...nextState.bobs27State[activePlayer.id] };
    const roundDouble = pBob.currentRound === 21 ? 50 : pBob.currentRound;
    if ((roundDouble === 50 && dart.segment === 50) || (dart.segment === roundDouble && dart.multiplier === 2)) {
      pBob.score += roundDouble * 2;
    }
    nextState.bobs27State[activePlayer.id] = pBob;
  } else if (rules.type === 'killer') {
    const pKiller = { ...nextState.killerState[activePlayer.id] };
    const doubleToQualify = rules.config.doubleToQualify;
    const selfHitPenalty = rules.config.selfHitPenalty !== false;

    if (!pKiller.eliminated) {
      // Phase 1: Assignment
      if (pKiller.assignedDouble === undefined) {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        const qualifies = doubleToQualify ? isDouble : dart.segment > 0;
        if (qualifies && dart.segment > 0) {
          const alreadyClaimed = state.match.players.some(
            (p) => p.id !== activePlayer.id && nextState.killerState[p.id]?.assignedDouble === dart.segment
          );
          if (!alreadyClaimed) {
            pKiller.assignedDouble = dart.segment;
          }
        }
      }
      // Phase 2: Becoming a Killer
      else if (!pKiller.isKiller) {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        const isHitOwn = dart.segment === pKiller.assignedDouble && (doubleToQualify ? isDouble : true);
        if (isHitOwn) {
          pKiller.isKiller = true;
        }
      }
      // Phase 3: Combat (Active Killer attacking opponents or self-hit)
      else if (pKiller.isKiller) {
        const isDouble = dart.multiplier === 2 || dart.segment === 50;
        const validAttack = doubleToQualify ? isDouble : dart.segment > 0;

        if (validAttack && dart.segment > 0) {
          if (dart.segment === pKiller.assignedDouble) {
            if (selfHitPenalty) {
              pKiller.lives = Math.max(0, pKiller.lives - 1);
              if (pKiller.lives <= 0) {
                pKiller.eliminated = true;
              }
            }
          } else {
            state.match.players.forEach((otherP) => {
              if (otherP.id !== activePlayer.id) {
                const targetState = { ...nextState.killerState[otherP.id] };
                if (targetState.assignedDouble === dart.segment && !targetState.eliminated) {
                  const damage = doubleToQualify ? 1 : Math.max(1, dart.multiplier);
                  targetState.lives = Math.max(0, targetState.lives - damage);
                  if (targetState.lives <= 0) {
                    targetState.eliminated = true;
                  }
                  nextState.killerState[otherP.id] = targetState;
                }
              }
            });
          }
        }
      }
      nextState.killerState[activePlayer.id] = pKiller;
    }

    // Win condition check: Last non-eliminated player standing
    const activePlayersAlive = state.match.players.filter(
      (p) => !nextState.killerState[p.id]?.eliminated
    );

    if (state.match.players.length > 1) {
      if (activePlayersAlive.length <= 1) {
        isWinDart = true;
        turnFinished = true;
      }
    } else if (state.match.players.length === 1 && pKiller.isKiller) {
      isWinDart = true;
      turnFinished = true;
    }
  }

  // --- IF TURN IS FINISHED ---
  if (turnFinished) {
    const turnTotal = isBust ? 0 : newDarts.reduce((acc, d) => acc + d.score, 0);
    const scoreBefore = state.remainingScores[activePlayer.id] + (isBust ? 0 : turnTotal);
    const scoreAfter = isBust ? scoreBefore : nextState.remainingScores[activePlayer.id];

    const turnRecord: TurnRecord = {
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      legNumber: state.currentLeg.legNumber,
      setNumber: state.currentLeg.setNumber,
      playerId: activePlayer.id,
      darts: newDarts,
      turnTotal,
      isBust,
      scoreBefore,
      scoreAfter,
      createdAt: Date.now(),
    };

    const updatedLeg: LegRecord = {
      ...state.currentLeg,
      turns: [...state.currentLeg.turns, turnRecord],
    };

    // Bob's 27 round check
    if (rules.type === 'bobs_27') {
      const pBob = { ...nextState.bobs27State[activePlayer.id] };
      const roundDouble = pBob.currentRound === 21 ? 50 : pBob.currentRound;
      const hits = newDarts.filter(
        (d) => (roundDouble === 50 && d.segment === 50) || (d.segment === roundDouble && d.multiplier === 2)
      );
      if (hits.length === 0) {
        pBob.score -= roundDouble * 2;
        if (pBob.score <= 0) {
          pBob.isEliminated = true;
        }
      }
      pBob.currentRound++;
      pBob.hitsPerRound.push(hits.length);
      nextState.bobs27State[activePlayer.id] = pBob;

      if (pBob.currentRound > 21 || pBob.isEliminated) {
        isWinDart = true;
      }
    }

    // Check Leg Win
    if (isWinDart) {
      updatedLeg.winnerPlayerId = activePlayer.id;
      updatedLeg.endTime = Date.now();

      const newScores = { ...state.match.scores };
      const newTeamScores = state.match.teamScores
        ? {
            team_1: { ...state.match.teamScores.team_1 },
            team_2: { ...state.match.teamScores.team_2 },
          }
        : undefined;

      if (isTeamMatch && activePlayer.teamId && newTeamScores) {
        const teamId = activePlayer.teamId;
        newTeamScores[teamId].legsWon += 1;
        // Credit all teammates
        state.match.players.forEach((p) => {
          if (p.teamId === teamId) {
            newScores[p.id] = {
              ...newScores[p.id],
              legsWon: (newScores[p.id]?.legsWon || 0) + 1,
            };
          }
        });
      } else {
        newScores[activePlayer.id] = {
          ...newScores[activePlayer.id],
          legsWon: (newScores[activePlayer.id]?.legsWon || 0) + 1,
        };
      }

      // Check Set Win / Match Win
      let isMatchOver = false;
      let winnerPlayerId: string | undefined = undefined;
      let winnerTeamId: 'team_1' | 'team_2' | undefined = undefined;

      if (rules.type === 'x01') {
        const x01Config = rules.config;
        const currentLegsWon = isTeamMatch && activePlayer.teamId && newTeamScores
          ? newTeamScores[activePlayer.teamId].legsWon
          : newScores[activePlayer.id].legsWon;

        if (currentLegsWon >= x01Config.legsToWin) {
          if (x01Config.setsToWin > 1) {
            if (isTeamMatch && activePlayer.teamId && newTeamScores) {
              newTeamScores[activePlayer.teamId].setsWon += 1;
              newTeamScores[activePlayer.teamId].legsWon = 0;
              if (newTeamScores[activePlayer.teamId].setsWon >= x01Config.setsToWin) {
                isMatchOver = true;
                winnerTeamId = activePlayer.teamId;
                winnerPlayerId = activePlayer.id;
              }
            } else {
              newScores[activePlayer.id].setsWon += 1;
              newScores[activePlayer.id].legsWon = 0;
              if (newScores[activePlayer.id].setsWon >= x01Config.setsToWin) {
                isMatchOver = true;
                winnerPlayerId = activePlayer.id;
              }
            }
          } else {
            isMatchOver = true;
            winnerPlayerId = activePlayer.id;
            winnerTeamId = activePlayer.teamId;
          }
        }
      } else {
        isMatchOver = true;
        winnerPlayerId = activePlayer.id;
        winnerTeamId = activePlayer.teamId;
      }

      if (isMatchOver) {
        nextState.match = {
          ...state.match,
          legs: [...state.match.legs.slice(0, -1), updatedLeg],
          scores: newScores,
          teamScores: newTeamScores,
          winnerPlayerId,
          winnerTeamId,
          endTime: Date.now(),
          status: 'completed',
        };
        nextState.currentLeg = updatedLeg;
        nextState.isMatchOver = true;
        nextState.winnerPlayerId = winnerPlayerId;
        nextState.winnerTeamId = winnerTeamId;
        nextState.currentTurnDarts = [];

        return {
          nextState,
          turnCompleted: true,
          legCompleted: true,
          matchCompleted: true,
          isBust,
          isWinDart,
          isCheckout: isWinDart,
        };
      } else {
        // Start Next Leg
        const nextLegStarter = (state.legStarterIndex + 1) % state.match.players.length;
        const newLeg: LegRecord = {
          legNumber: state.currentLeg.legNumber + 1,
          setNumber: state.currentLeg.setNumber,
          startingScore: rules.type === 'x01' ? rules.config.startingScore : 0,
          turns: [],
          startTime: Date.now(),
        };

        // Reset remaining scores for new leg
        state.match.players.forEach((p) => {
          nextState.remainingScores[p.id] = rules.type === 'x01' ? rules.config.startingScore : 0;
        });

        nextState.match = {
          ...state.match,
          legs: [...state.match.legs.slice(0, -1), updatedLeg, newLeg],
          scores: newScores,
          teamScores: newTeamScores,
        };
        nextState.currentLeg = newLeg;
        nextState.activePlayerIndex = nextLegStarter;
        nextState.legStarterIndex = nextLegStarter;
        nextState.currentTurnDarts = [];

        return {
          nextState,
          turnCompleted: true,
          legCompleted: true,
          matchCompleted: false,
          isBust,
          isWinDart,
          isCheckout: isWinDart,
        };
      }
    }

    // Normal Turn Transition: Move to next player (skipping eliminated players in killer mode)
    let nextPlayerIndex = (state.activePlayerIndex + 1) % state.match.players.length;
    if (rules.type === 'killer') {
      let attempts = 0;
      while (
        nextState.killerState[state.match.players[nextPlayerIndex].id]?.eliminated &&
        attempts < state.match.players.length
      ) {
        nextPlayerIndex = (nextPlayerIndex + 1) % state.match.players.length;
        attempts++;
      }
    }
    nextState.match = {
      ...state.match,
      legs: [...state.match.legs.slice(0, -1), updatedLeg],
    };
    nextState.currentLeg = updatedLeg;
    nextState.activePlayerIndex = nextPlayerIndex;
    nextState.currentTurnDarts = [];

    return {
      nextState,
      turnCompleted: true,
      legCompleted: false,
      matchCompleted: false,
      isBust,
      isWinDart: false,
    };
  }

  return {
    nextState,
    turnCompleted: false,
    legCompleted: false,
    matchCompleted: false,
    isBust,
    isWinDart: false,
  };
}

// Apply Full Turn Total (e.g. from Keypad entry like "140")
export function applyTotalScoreToState(
  state: GameState,
  score: number,
  dartsCount: number = 3
): {
  nextState: GameState;
  legCompleted: boolean;
  matchCompleted: boolean;
  isBust: boolean;
} {
  const activePlayer = state.match.players[state.activePlayerIndex];
  const rules = state.match.rules;
  const isTeamMatch = Boolean(state.match.isTeamMatch && activePlayer.teamId);

  if (rules.type !== 'x01') {
    return { nextState: state, legCompleted: false, matchCompleted: false, isBust: false };
  }

  const currentScore = state.remainingScores[activePlayer.id];
  const rem = currentScore - score;
  let isBust = false;
  let isWin = false;

  if (rem < 0) {
    isBust = true;
  } else if (rem === 1 && rules.config.outRule === 'double_out') {
    isBust = true;
  } else if (rem === 0) {
    isWin = true;
  }

  // Synthesize dummy darts for the record
  const now = Date.now();
  const darts: DartThrow[] = [];
  if (score === 180) {
    darts.push(
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now - 2000 },
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now - 1000 },
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now }
    );
  } else if (score === 140) {
    darts.push(
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now - 2000 },
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now - 1000 },
      { segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: now }
    );
  } else if (score === 100) {
    darts.push(
      { segment: 20, multiplier: 3, score: 60, label: 'T20', timestamp: now - 2000 },
      { segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: now - 1000 },
      { segment: 20, multiplier: 1, score: 20, label: 'S20', timestamp: now }
    );
  } else {
    darts.push({
      segment: score,
      multiplier: 1,
      score: isBust ? 0 : score,
      label: isBust ? 'BUST' : `${score}`,
      timestamp: now,
    });
  }

  const newScores = { ...state.remainingScores };
  if (!isBust) {
    if (isTeamMatch && activePlayer.teamId) {
      state.match.players.forEach((p) => {
        if (p.teamId === activePlayer.teamId) {
          newScores[p.id] = rem;
        }
      });
    } else {
      newScores[activePlayer.id] = rem;
    }
  }

  const turnRecord: TurnRecord = {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    legNumber: state.currentLeg.legNumber,
    setNumber: state.currentLeg.setNumber,
    playerId: activePlayer.id,
    darts,
    turnTotal: isBust ? 0 : score,
    isBust,
    scoreBefore: currentScore,
    scoreAfter: isBust ? currentScore : rem,
    createdAt: Date.now(),
  };

  const updatedLeg: LegRecord = {
    ...state.currentLeg,
    turns: [...state.currentLeg.turns, turnRecord],
  };

  if (isWin) {
    updatedLeg.winnerPlayerId = activePlayer.id;
    updatedLeg.endTime = Date.now();

    const matchScores = { ...state.match.scores };
    const newTeamScores = state.match.teamScores
      ? {
          team_1: { ...state.match.teamScores.team_1 },
          team_2: { ...state.match.teamScores.team_2 },
        }
      : undefined;

    if (isTeamMatch && activePlayer.teamId && newTeamScores) {
      const teamId = activePlayer.teamId;
      newTeamScores[teamId].legsWon += 1;
      state.match.players.forEach((p) => {
        if (p.teamId === teamId) {
          matchScores[p.id] = {
            ...matchScores[p.id],
            legsWon: (matchScores[p.id]?.legsWon || 0) + 1,
          };
        }
      });
    } else {
      matchScores[activePlayer.id] = {
        ...matchScores[activePlayer.id],
        legsWon: (matchScores[activePlayer.id]?.legsWon || 0) + 1,
      };
    }

    const currentLegsWon = isTeamMatch && activePlayer.teamId && newTeamScores
      ? newTeamScores[activePlayer.teamId].legsWon
      : matchScores[activePlayer.id].legsWon;

    const isMatchOver = currentLegsWon >= rules.config.legsToWin;

    if (isMatchOver) {
      const nextState: GameState = {
        ...state,
        remainingScores: newScores,
        match: {
          ...state.match,
          legs: [...state.match.legs.slice(0, -1), updatedLeg],
          scores: matchScores,
          teamScores: newTeamScores,
          winnerPlayerId: activePlayer.id,
          winnerTeamId: activePlayer.teamId,
          status: 'completed',
          endTime: Date.now(),
        },
        currentLeg: updatedLeg,
        isMatchOver: true,
        winnerPlayerId: activePlayer.id,
        winnerTeamId: activePlayer.teamId,
        currentTurnDarts: [],
      };

      return {
        nextState,
        legCompleted: true,
        matchCompleted: true,
        isBust: false,
      };
    } else {
      // Start Next Leg
      const nextLegStarter = (state.legStarterIndex + 1) % state.match.players.length;
      const newLeg: LegRecord = {
        legNumber: state.currentLeg.legNumber + 1,
        setNumber: state.currentLeg.setNumber,
        startingScore: rules.type === 'x01' ? rules.config.startingScore : 0,
        turns: [],
        startTime: Date.now(),
      };

      const resetScores: Record<string, number> = {};
      state.match.players.forEach((p) => {
        resetScores[p.id] = rules.type === 'x01' ? rules.config.startingScore : 0;
      });

      const nextState: GameState = {
        ...state,
        remainingScores: resetScores,
        match: {
          ...state.match,
          legs: [...state.match.legs.slice(0, -1), updatedLeg, newLeg],
          scores: matchScores,
          teamScores: newTeamScores,
        },
        currentLeg: newLeg,
        activePlayerIndex: nextLegStarter,
        legStarterIndex: nextLegStarter,
        currentTurnDarts: [],
        isMatchOver: false,
      };

      return {
        nextState,
        legCompleted: true,
        matchCompleted: false,
        isBust: false,
      };
    }
  }

  const nextPlayerIndex = (state.activePlayerIndex + 1) % state.match.players.length;
  const nextState: GameState = {
    ...state,
    remainingScores: newScores,
    match: {
      ...state.match,
      legs: [...state.match.legs.slice(0, -1), updatedLeg],
    },
    currentLeg: updatedLeg,
    activePlayerIndex: nextPlayerIndex,
    currentTurnDarts: [],
  };

  return {
    nextState,
    legCompleted: false,
    matchCompleted: false,
    isBust,
  };
}

/**
 * Manually ends the active player's turn (e.g. via "End Turn" button or voice command)
 * Finalizes current turn darts, records turn log, and cleanly rotates activePlayerIndex to next player.
 */
export function endCurrentTurn(state: GameState): {
  nextState: GameState;
  turnCompleted: boolean;
  legCompleted: boolean;
  matchCompleted: boolean;
  isBust: boolean;
  turnScore: number;
} {
  if (state.isMatchOver) {
    return {
      nextState: state,
      turnCompleted: false,
      legCompleted: false,
      matchCompleted: true,
      isBust: false,
      turnScore: 0,
    };
  }

  const activePlayer = state.match.players[state.activePlayerIndex];
  const darts = state.currentTurnDarts;
  const rules = state.match.rules;

  // Recorded darts in this turn: if 0 darts thrown, create a pass/no-score dart
  const recordedDarts: DartThrow[] = darts.length > 0
    ? [...darts]
    : [
        {
          segment: 0,
          multiplier: 0,
          score: 0,
          label: 'PASS',
          isBust: false,
          timestamp: Date.now(),
        },
      ];

  const isBust = darts.some((d) => d.isBust);
  const turnTotal = isBust ? 0 : darts.reduce((acc, d) => acc + d.score, 0);

  // In X01, remaining score has already been updated per dart in applyDartToState
  const currentRemaining = state.remainingScores[activePlayer.id] ?? 0;
  const scoreBefore = rules.type === 'x01'
    ? currentRemaining + (isBust ? 0 : turnTotal)
    : 0;
  const scoreAfter = currentRemaining;

  const turnRecord: TurnRecord = {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    legNumber: state.currentLeg.legNumber,
    setNumber: state.currentLeg.setNumber,
    playerId: activePlayer.id,
    darts: recordedDarts,
    turnTotal,
    isBust,
    scoreBefore,
    scoreAfter,
    createdAt: Date.now(),
  };

  const updatedLeg: LegRecord = {
    ...state.currentLeg,
    turns: [...state.currentLeg.turns, turnRecord],
  };

  // Next player calculation (skipping eliminated players in killer mode)
  let nextPlayerIndex = (state.activePlayerIndex + 1) % state.match.players.length;
  if (rules.type === 'killer') {
    let attempts = 0;
    while (
      state.killerState[state.match.players[nextPlayerIndex].id]?.eliminated &&
      attempts < state.match.players.length
    ) {
      nextPlayerIndex = (nextPlayerIndex + 1) % state.match.players.length;
      attempts++;
    }
  }

  const nextState: GameState = {
    ...state,
    match: {
      ...state.match,
      legs: [...state.match.legs.slice(0, -1), updatedLeg],
    },
    currentLeg: updatedLeg,
    activePlayerIndex: nextPlayerIndex,
    currentTurnDarts: [],
  };

  return {
    nextState,
    turnCompleted: true,
    legCompleted: false,
    matchCompleted: false,
    isBust,
    turnScore: turnTotal,
  };
}
