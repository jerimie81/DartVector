// Cloud Sync bridge for automatic persistent score history
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { MatchRecord, PlayerProfile } from './types';

export async function syncMatchToCloud(match: MatchRecord): Promise<boolean> {
  if (!db || !auth) return false;

  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const matchRef = doc(db, 'users', currentUser.uid, 'matches', match.id);
    await setDoc(
      matchRef,
      {
        id: match.id,
        userId: currentUser.uid,
        gameType: match.gameType,
        isTeamMatch: !!match.isTeamMatch,
        winnerPlayerId: match.winnerPlayerId || null,
        winnerTeamId: match.winnerTeamId || null,
        startTime: match.startTime,
        endTime: match.endTime || match.startTime,
        status: match.status,
        summary: match.isTeamMatch
          ? `${match.teams?.team_1.name} vs ${match.teams?.team_2.name}`
          : match.players.map((p) => p.name).join(' vs '),
        matchDataJson: JSON.stringify(match),
        createdAt: new Date(match.startTime).toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error syncing match to Firestore cloud:', err);
    return false;
  }
}

export async function deleteMatchFromCloud(matchId: string): Promise<boolean> {
  if (!db || !auth) return false;

  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const matchRef = doc(db, 'users', currentUser.uid, 'matches', matchId);
    await deleteDoc(matchRef);
    return true;
  } catch (err) {
    console.error('Error deleting match from Firestore cloud:', err);
    return false;
  }
}

export async function syncPlayerToCloud(player: PlayerProfile): Promise<boolean> {
  if (!db || !auth) return false;

  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const playerRef = doc(db, 'users', currentUser.uid, 'custom_players', player.id);
    await setDoc(
      playerRef,
      {
        id: player.id,
        userId: currentUser.uid,
        name: player.name,
        avatar: player.avatar,
        color: player.color,
        isBot: !!player.isBot,
        botLevel: player.botLevel || null,
        createdAt: player.createdAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error syncing player to Firestore cloud:', err);
    return false;
  }
}

export async function syncLeagueToCloud(league: any): Promise<boolean> {
  if (!db || !auth) return false;

  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const leagueRef = doc(db, 'users', currentUser.uid, 'leagues', league.id);
    await setDoc(
      leagueRef,
      {
        id: league.id,
        userId: currentUser.uid,
        name: league.name || 'House League',
        format: league.format || 'round_robin',
        status: league.status || 'active',
        createdAt: league.createdAt || new Date().toISOString(),
        leagueDataJson: JSON.stringify(league),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Error syncing league to Firestore cloud:', err);
    return false;
  }
}

export async function deleteLeagueFromCloud(leagueId: string): Promise<boolean> {
  if (!db || !auth) return false;

  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const leagueRef = doc(db, 'users', currentUser.uid, 'leagues', leagueId);
    await deleteDoc(leagueRef);
    return true;
  } catch (err) {
    console.error('Error deleting league from Firestore cloud:', err);
    return false;
  }
}

