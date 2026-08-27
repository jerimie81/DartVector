// Detailed All-Time Player Career & Head-to-Head Statistics
import { MatchRecord, PlayerProfile } from './types';

export interface PlayerCareerStats {
  player: PlayerProfile;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number; // percentage 0 - 100
  legsPlayed: number;
  legsWon: number;
  legsLost: number;
  legWinRate: number; // percentage
  setsPlayed: number;
  setsWon: number;
  
  // Scoring
  totalDartsThrown: number;
  totalPointsScored: number;
  overall3DartAvg: number;
  overallFirst9Avg: number;
  bestMatch3DA: number;
  highestTurn: number;
  
  // Milestones
  scores180: number;
  scores140Plus: number;
  scores100Plus: number;
  scores60Plus: number;
  
  // Checkouts
  checkoutsAttempted: number;
  checkoutsHit: number;
  checkoutPct: number;
  highestCheckout: number;
  
  // Game-specific breakdown
  x01Matches: number;
  x01Wins: number;
  cricketMatches: number;
  cricketWins: number;
  otherGameMatches: number;
  otherGameWins: number;
  
  // Team stats
  teamMatchesPlayed: number;
  teamMatchesWon: number;
  
  // Historical trend (last 10 matches 3DAs)
  recentMatchAverages: { matchId: string; date: string; avg: number; opponent: string; result: 'W' | 'L' }[];
}

export interface HeadToHeadRecord {
  player1: PlayerProfile;
  player2: PlayerProfile;
  totalMatches: number;
  player1Wins: number;
  player2Wins: number;
  player1Legs: number;
  player2Legs: number;
  player1Avg: number;
  player2Avg: number;
  player1HighTurn: number;
  player2HighTurn: number;
  player1HighCheckout: number;
  player2HighCheckout: number;
  player1180s: number;
  player2180s: number;
  recentMatches: {
    matchId: string;
    date: string;
    gameType: string;
    winnerId: string;
    scoreSummary: string;
    p1Avg: number;
    p2Avg: number;
  }[];
}

/**
 * Computes all-time career statistics for any list of players across stored matches.
 */
export function calculateAllTimePlayerStats(
  players: PlayerProfile[],
  matches: MatchRecord[]
): PlayerCareerStats[] {
  return players.map((player) => {
    let matchesPlayed = 0;
    let matchesWon = 0;
    let matchesLost = 0;
    let legsPlayed = 0;
    let legsWon = 0;
    let legsLost = 0;
    let setsPlayed = 0;
    let setsWon = 0;

    let totalDartsThrown = 0;
    let totalPointsScored = 0;
    let totalFirst9Darts = 0;
    let totalFirst9Scored = 0;
    let bestMatch3DA = 0;
    let highestTurn = 0;

    let scores180 = 0;
    let scores140Plus = 0;
    let scores100Plus = 0;
    let scores60Plus = 0;

    let checkoutsAttempted = 0;
    let checkoutsHit = 0;
    let highestCheckout = 0;

    let x01Matches = 0;
    let x01Wins = 0;
    let cricketMatches = 0;
    let cricketWins = 0;
    let otherGameMatches = 0;
    let otherGameWins = 0;

    let teamMatchesPlayed = 0;
    let teamMatchesWon = 0;

    const recentMatchAverages: {
      matchId: string;
      date: string;
      avg: number;
      opponent: string;
      result: 'W' | 'L';
    }[] = [];

    // Filter matches involving this player (sorted chronologically)
    const playerMatches = matches.filter((m) =>
      m.players.some((p) => p.id === player.id || p.name.toLowerCase() === player.name.toLowerCase())
    );

    playerMatches.forEach((match) => {
      const isTeam = !!match.isTeamMatch;
      const matchedPlayer = match.players.find(
        (p) => p.id === player.id || p.name.toLowerCase() === player.name.toLowerCase()
      );
      if (!matchedPlayer) return;

      matchesPlayed++;

      const isWon = isTeam
        ? match.winnerTeamId && matchedPlayer.teamId === match.winnerTeamId
        : match.winnerPlayerId === matchedPlayer.id;

      if (isWon) {
        matchesWon++;
      } else if (match.status === 'completed') {
        matchesLost++;
      }

      if (isTeam) {
        teamMatchesPlayed++;
        if (isWon) teamMatchesWon++;
      }

      if (match.gameType === 'x01') {
        x01Matches++;
        if (isWon) x01Wins++;
      } else if (match.gameType === 'cricket') {
        cricketMatches++;
        if (isWon) cricketWins++;
      } else {
        otherGameMatches++;
        if (isWon) otherGameWins++;
      }

      // Legs / Sets
      const mLegsWon = isTeam && matchedPlayer.teamId && match.teamScores
        ? match.teamScores[matchedPlayer.teamId]?.legsWon || 0
        : match.scores?.[matchedPlayer.id]?.legsWon ||
          match.legs.filter((l) => l.winnerPlayerId === matchedPlayer.id).length;

      const mLegsTotal = match.legs.length;
      legsWon += mLegsWon;
      legsLost += Math.max(0, mLegsTotal - mLegsWon);
      legsPlayed += mLegsTotal;

      const mSetsWon = isTeam && matchedPlayer.teamId && match.teamScores
        ? match.teamScores[matchedPlayer.teamId]?.setsWon || 0
        : match.scores?.[matchedPlayer.id]?.setsWon || 0;
      setsWon += mSetsWon;
      setsPlayed += mSetsWon;

      // Turns and Darts for this match
      let matchDarts = 0;
      let matchScored = 0;

      match.legs.forEach((leg) => {
        let dartsInThisLeg = 0;
        const playerTurns = leg.turns.filter((t) => t.playerId === matchedPlayer.id);

        playerTurns.forEach((turn) => {
          const count = turn.darts.length || 3;
          matchDarts += count;
          dartsInThisLeg += count;
          totalDartsThrown += count;

          if (!turn.isBust) {
            matchScored += turn.turnTotal;
            totalPointsScored += turn.turnTotal;

            if (turn.turnTotal > highestTurn) highestTurn = turn.turnTotal;
            if (turn.turnTotal === 180) scores180++;
            else if (turn.turnTotal >= 140) scores140Plus++;
            else if (turn.turnTotal >= 100) scores100Plus++;
            else if (turn.turnTotal >= 60) scores60Plus++;

            if (turn.scoreAfter === 0) {
              checkoutsHit++;
              if (turn.turnTotal > highestCheckout) {
                highestCheckout = turn.turnTotal;
              }
            }
          }

          if (dartsInThisLeg <= 9) {
            totalFirst9Darts += count;
            if (!turn.isBust) totalFirst9Scored += turn.turnTotal;
          }

          if (turn.scoreBefore <= 170 && turn.scoreBefore > 1) {
            checkoutsAttempted++;
          }
        });
      });

      const match3DA = matchDarts > 0 ? (matchScored / matchDarts) * 3 : 0;
      if (match3DA > bestMatch3DA) bestMatch3DA = match3DA;

      // Find opponent(s) name
      const opponents = match.players
        .filter((p) => p.id !== matchedPlayer.id && (!isTeam || p.teamId !== matchedPlayer.teamId))
        .map((p) => p.name)
        .join(', ');

      recentMatchAverages.push({
        matchId: match.id,
        date: new Date(match.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        avg: Math.round(match3DA * 10) / 10,
        opponent: opponents || 'Solo Practice',
        result: isWon ? 'W' : 'L',
      });
    });

    const overall3DartAvg = totalDartsThrown > 0 ? (totalPointsScored / totalDartsThrown) * 3 : 0;
    const overallFirst9Avg = totalFirst9Darts > 0 ? (totalFirst9Scored / totalFirst9Darts) * 3 : overall3DartAvg;
    const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
    const legWinRate = legsPlayed > 0 ? (legsWon / legsPlayed) * 100 : 0;
    const checkoutPct = checkoutsAttempted > 0 ? (checkoutsHit / checkoutsAttempted) * 100 : 0;

    return {
      player,
      matchesPlayed,
      matchesWon,
      matchesLost,
      winRate: Math.round(winRate * 10) / 10,
      legsPlayed,
      legsWon,
      legsLost,
      legWinRate: Math.round(legWinRate * 10) / 10,
      setsPlayed,
      setsWon,
      totalDartsThrown,
      totalPointsScored,
      overall3DartAvg: Math.round(overall3DartAvg * 100) / 100,
      overallFirst9Avg: Math.round(overallFirst9Avg * 100) / 100,
      bestMatch3DA: Math.round(bestMatch3DA * 100) / 100,
      highestTurn,
      scores180,
      scores140Plus,
      scores100Plus,
      scores60Plus,
      checkoutsAttempted,
      checkoutsHit,
      checkoutPct: Math.round(checkoutPct * 10) / 10,
      highestCheckout,
      x01Matches,
      x01Wins,
      cricketMatches,
      cricketWins,
      otherGameMatches,
      otherGameWins,
      teamMatchesPlayed,
      teamMatchesWon,
      recentMatchAverages: recentMatchAverages.slice(-10),
    };
  });
}

/**
 * Calculates direct Head-to-Head confrontation statistics between two players.
 */
export function calculateHeadToHead(
  p1: PlayerProfile,
  p2: PlayerProfile,
  matches: MatchRecord[]
): HeadToHeadRecord {
  let totalMatches = 0;
  let player1Wins = 0;
  let player2Wins = 0;
  let player1Legs = 0;
  let player2Legs = 0;
  let p1Darts = 0;
  let p1Scored = 0;
  let p2Darts = 0;
  let p2Scored = 0;
  let player1HighTurn = 0;
  let player2HighTurn = 0;
  let player1HighCheckout = 0;
  let player2HighCheckout = 0;
  let player1180s = 0;
  let player2180s = 0;

  const recentMatches: HeadToHeadRecord['recentMatches'] = [];

  matches.forEach((match) => {
    const hasP1 = match.players.some((p) => p.id === p1.id || p.name.toLowerCase() === p1.name.toLowerCase());
    const hasP2 = match.players.some((p) => p.id === p2.id || p.name.toLowerCase() === p2.name.toLowerCase());

    if (!hasP1 || !hasP2) return;

    totalMatches++;

    const p1Obj = match.players.find((p) => p.id === p1.id || p.name.toLowerCase() === p1.name.toLowerCase())!;
    const p2Obj = match.players.find((p) => p.id === p2.id || p.name.toLowerCase() === p2.name.toLowerCase())!;

    const isP1Win = match.isTeamMatch
      ? match.winnerTeamId && p1Obj.teamId === match.winnerTeamId
      : match.winnerPlayerId === p1Obj.id;

    const isP2Win = match.isTeamMatch
      ? match.winnerTeamId && p2Obj.teamId === match.winnerTeamId
      : match.winnerPlayerId === p2Obj.id;

    if (isP1Win) player1Wins++;
    if (isP2Win) player2Wins++;

    let mP1Darts = 0;
    let mP1Scored = 0;
    let mP2Darts = 0;
    let mP2Scored = 0;

    let p1LegCount = 0;
    let p2LegCount = 0;

    match.legs.forEach((leg) => {
      if (leg.winnerPlayerId === p1Obj.id) {
        player1Legs++;
        p1LegCount++;
      } else if (leg.winnerPlayerId === p2Obj.id) {
        player2Legs++;
        p2LegCount++;
      }

      leg.turns.forEach((turn) => {
        const count = turn.darts.length || 3;
        if (turn.playerId === p1Obj.id) {
          p1Darts += count;
          mP1Darts += count;
          if (!turn.isBust) {
            p1Scored += turn.turnTotal;
            mP1Scored += turn.turnTotal;
            if (turn.turnTotal > player1HighTurn) player1HighTurn = turn.turnTotal;
            if (turn.turnTotal === 180) player1180s++;
            if (turn.scoreAfter === 0 && turn.turnTotal > player1HighCheckout) {
              player1HighCheckout = turn.turnTotal;
            }
          }
        } else if (turn.playerId === p2Obj.id) {
          p2Darts += count;
          mP2Darts += count;
          if (!turn.isBust) {
            p2Scored += turn.turnTotal;
            mP2Scored += turn.turnTotal;
            if (turn.turnTotal > player2HighTurn) player2HighTurn = turn.turnTotal;
            if (turn.turnTotal === 180) player2180s++;
            if (turn.scoreAfter === 0 && turn.turnTotal > player2HighCheckout) {
              player2HighCheckout = turn.turnTotal;
            }
          }
        }
      });
    });

    const mP1Avg = mP1Darts > 0 ? (mP1Scored / mP1Darts) * 3 : 0;
    const mP2Avg = mP2Darts > 0 ? (mP2Scored / mP2Darts) * 3 : 0;

    recentMatches.push({
      matchId: match.id,
      date: new Date(match.startTime).toLocaleDateString(),
      gameType: match.gameType.toUpperCase(),
      winnerId: isP1Win ? p1.id : isP2Win ? p2.id : '',
      scoreSummary: `${p1LegCount} - ${p2LegCount}`,
      p1Avg: Math.round(mP1Avg * 10) / 10,
      p2Avg: Math.round(mP2Avg * 10) / 10,
    });
  });

  const player1Avg = p1Darts > 0 ? (p1Scored / p1Darts) * 3 : 0;
  const player2Avg = p2Darts > 0 ? (p2Scored / p2Darts) * 3 : 0;

  return {
    player1: p1,
    player2: p2,
    totalMatches,
    player1Wins,
    player2Wins,
    player1Legs,
    player2Legs,
    player1Avg: Math.round(player1Avg * 100) / 100,
    player2Avg: Math.round(player2Avg * 100) / 100,
    player1HighTurn,
    player2HighTurn,
    player1HighCheckout,
    player2HighCheckout,
    player1180s,
    player2180s,
    recentMatches: recentMatches.slice(-8),
  };
}
