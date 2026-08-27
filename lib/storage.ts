// DartMaster Pro - High Capacity Match History & Analytics Storage Subsystem (IndexedDB + LocalStorage)
import { MatchRecord, PlayerProfile, PlayerMatchStats, TeamMatchStats, TurnRecord } from './types';

const DB_NAME = 'dartmaster_pro_db';
const DB_VERSION = 1;
const STORE_MATCHES = 'matches';
const STORE_PLAYERS = 'players';

export const DEFAULT_PLAYERS: PlayerProfile[] = [
  {
    id: 'p1',
    name: 'Phil The Power',
    avatar: '⚡',
    color: '#3B82F6',
    isBot: false,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Luke The Nuke',
    avatar: '🎯',
    color: '#F59E0B',
    isBot: false,
    createdAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 'p3',
    name: 'Mighty Mike',
    avatar: '👑',
    color: '#10B981',
    isBot: false,
    createdAt: '2025-01-03T00:00:00.000Z',
  },
  {
    id: 'p4',
    name: 'The Iceman',
    avatar: '❄️',
    color: '#06B6D4',
    isBot: false,
    createdAt: '2025-01-04T00:00:00.000Z',
  },
  {
    id: 'p5',
    name: 'Snakebite Peter',
    avatar: '🐍',
    color: '#EC4899',
    isBot: false,
    createdAt: '2025-01-05T00:00:00.000Z',
  },
  {
    id: 'p6',
    name: 'Flying Scotsman',
    avatar: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    color: '#8B5CF6',
    isBot: false,
    createdAt: '2025-01-06T00:00:00.000Z',
  },
  {
    id: 'p7',
    name: 'Rob Cross Voltage',
    avatar: '🔌',
    color: '#F97316',
    isBot: false,
    createdAt: '2025-01-07T00:00:00.000Z',
  },
  {
    id: 'p8',
    name: 'Bully Boy Michael',
    avatar: '🐂',
    color: '#EF4444',
    isBot: false,
    createdAt: '2025-01-08T00:00:00.000Z',
  },
  {
    id: 'bot_lvl12',
    name: 'DartBot (Club)',
    avatar: '🤖',
    color: '#84CC16',
    isBot: true,
    botLevel: 12,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'bot_lvl18',
    name: 'DartBot (Pro)',
    avatar: '🔥',
    color: '#A855F7',
    isBot: true,
    botLevel: 18,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

class StorageSubsystem {
  private db: IDBDatabase | null = null;
  private isReady = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
    }
  }

  private async initDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_MATCHES)) {
          const matchStore = db.createObjectStore(STORE_MATCHES, { keyPath: 'id' });
          matchStore.createIndex('startTime', 'startTime', { unique: false });
          matchStore.createIndex('gameType', 'gameType', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
          db.createObjectStore(STORE_PLAYERS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.isReady = true;
        this.ensureDefaultPlayers();
        resolve(this.db);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  private async ensureDefaultPlayers() {
    const players = await this.getPlayers();
    if (players.length === 0) {
      for (const p of DEFAULT_PLAYERS) {
        await this.savePlayer(p);
      }
    }
  }

  // --- PLAYERS MANAGEMENT ---
  public async getPlayers(): Promise<PlayerProfile[]> {
    try {
      const db = await this.initDB();
      if (!db) {
        const local = localStorage.getItem('dartmaster_players');
        return local ? JSON.parse(local) : DEFAULT_PLAYERS;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PLAYERS, 'readonly');
        const store = tx.objectStore(STORE_PLAYERS);
        const req = store.getAll();
        req.onsuccess = () => {
          if (req.result && req.result.length > 0) {
            resolve(req.result);
          } else {
            resolve(DEFAULT_PLAYERS);
          }
        };
        req.onerror = () => resolve(DEFAULT_PLAYERS);
      });
    } catch {
      return DEFAULT_PLAYERS;
    }
  }

  public async savePlayer(player: PlayerProfile): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const current = await this.getPlayers();
        const updated = [...current.filter((p) => p.id !== player.id), player];
        localStorage.setItem('dartmaster_players', JSON.stringify(updated));
        return;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PLAYERS, 'readwrite');
        const store = tx.objectStore(STORE_PLAYERS);
        const req = store.put(player);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
  }

  public async deletePlayer(playerId: string): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const current = await this.getPlayers();
        const updated = current.filter((p) => p.id !== playerId);
        localStorage.setItem('dartmaster_players', JSON.stringify(updated));
        return;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PLAYERS, 'readwrite');
        const store = tx.objectStore(STORE_PLAYERS);
        store.delete(playerId);
        tx.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  // --- MATCHES MANAGEMENT (High Capacity) ---
  public async saveMatch(match: MatchRecord): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const local = localStorage.getItem('dartmaster_matches');
        const list: MatchRecord[] = local ? JSON.parse(local) : [];
        const filtered = list.filter((m) => m.id !== match.id);
        filtered.unshift(match);
        // Keep last 100 in localStorage
        localStorage.setItem('dartmaster_matches', JSON.stringify(filtered.slice(0, 100)));
        return;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MATCHES, 'readwrite');
        const store = tx.objectStore(STORE_MATCHES);
        const req = store.put(match);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // fallback
    }
  }

  public async getMatches(limit: number = 100): Promise<MatchRecord[]> {
    try {
      const db = await this.initDB();
      if (!db) {
        const local = localStorage.getItem('dartmaster_matches');
        return local ? JSON.parse(local) : [];
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readonly');
        const store = tx.objectStore(STORE_MATCHES);
        const index = store.index('startTime');
        const req = index.openCursor(null, 'prev'); // newest first
        const results: MatchRecord[] = [];

        req.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async getMatchById(id: string): Promise<MatchRecord | null> {
    try {
      const db = await this.initDB();
      if (!db) {
        const matches = await this.getMatches(200);
        return matches.find((m) => m.id === id) || null;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readonly');
        const store = tx.objectStore(STORE_MATCHES);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async deleteMatch(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const matches = await this.getMatches(200);
        const filtered = matches.filter((m) => m.id !== id);
        localStorage.setItem('dartmaster_matches', JSON.stringify(filtered));
        return;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readwrite');
        const store = tx.objectStore(STORE_MATCHES);
        store.delete(id);
        tx.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  // --- AGGREGATE PLAYER STATS CALCULATION ---
  public calculateMatchStats(match: MatchRecord): PlayerMatchStats[] {
    return match.players.map((player) => {
      const playerTurns: TurnRecord[] = [];
      match.legs.forEach((leg) => {
        leg.turns.forEach((turn) => {
          if (turn.playerId === player.id) {
            playerTurns.push(turn);
          }
        });
      });

      let totalDarts = 0;
      let totalScored = 0;
      let highestTurn = 0;
      let scores60Plus = 0;
      let scores100Plus = 0;
      let scores140Plus = 0;
      let scores180 = 0;
      let checkoutsAttempted = 0;
      let checkoutsHit = 0;
      let highestCheckout = 0;

      // First 9 tracking per leg
      let first9DartsTotal = 0;
      let first9ScoredTotal = 0;

      match.legs.forEach((leg) => {
        const legPlayerTurns = leg.turns.filter((t) => t.playerId === player.id);
        let dartsInThisLeg = 0;

        legPlayerTurns.forEach((turn) => {
          const dartsCount = turn.darts.length || 3;
          totalDarts += dartsCount;
          dartsInThisLeg += dartsCount;

          if (!turn.isBust) {
            totalScored += turn.turnTotal;
            if (turn.turnTotal > highestTurn) highestTurn = turn.turnTotal;

            if (turn.turnTotal === 180) scores180++;
            else if (turn.turnTotal >= 140) scores140Plus++;
            else if (turn.turnTotal >= 100) scores100Plus++;
            else if (turn.turnTotal >= 60) scores60Plus++;

            // Check if this was a winning checkout
            if (turn.scoreAfter === 0) {
              checkoutsHit++;
              if (turn.turnTotal > highestCheckout) {
                highestCheckout = turn.turnTotal;
              }
            }
          }

          // First 9 calculation
          if (dartsInThisLeg <= 9) {
            first9DartsTotal += dartsCount;
            if (!turn.isBust) first9ScoredTotal += turn.turnTotal;
          }

          // Check if player had checkout opportunity (score <= 170)
          if (turn.scoreBefore <= 170 && turn.scoreBefore > 1) {
            checkoutsAttempted++;
          }
        });
      });

      const threeDartAvg = totalDarts > 0 ? (totalScored / totalDarts) * 3 : 0;
      const first9Avg = first9DartsTotal > 0 ? (first9ScoredTotal / first9DartsTotal) * 3 : threeDartAvg;
      const checkoutPct = checkoutsAttempted > 0 ? (checkoutsHit / checkoutsAttempted) * 100 : 0;

      const legsWon = match.isTeamMatch && player.teamId && match.teamScores
        ? match.teamScores[player.teamId]?.legsWon || 0
        : match.legs.filter((l) => l.winnerPlayerId === player.id).length;
      const setsWon = match.isTeamMatch && player.teamId && match.teamScores
        ? match.teamScores[player.teamId]?.setsWon || 0
        : match.scores[player.id]?.setsWon || 0;

      return {
        playerId: player.id,
        name: player.name,
        teamId: player.teamId,
        threeDartAvg: Math.round(threeDartAvg * 100) / 100,
        first9Avg: Math.round(first9Avg * 100) / 100,
        highestTurn,
        highestCheckout,
        checkoutsAttempted,
        checkoutsHit,
        checkoutPct: Math.round(checkoutPct * 10) / 10,
        dartsThrown: totalDarts,
        scores60Plus,
        scores100Plus,
        scores140Plus,
        scores180,
        legsWon,
        setsWon,
      };
    });
  }

  // --- AGGREGATE TEAM STATS CALCULATION ---
  public calculateTeamStats(match: MatchRecord): TeamMatchStats[] {
    if (!match.isTeamMatch || !match.teams) return [];

    const teams = [match.teams.team_1, match.teams.team_2];
    const playerStats = this.calculateMatchStats(match);

    return teams.map((team) => {
      const teamPlayers = match.players.filter((p) => p.teamId === team.id);
      const teamPlayerIds = teamPlayers.map((p) => p.id);
      const teamPlayerStats = playerStats.filter((ps) => teamPlayerIds.includes(ps.playerId));

      let totalDarts = 0;
      let totalScored = 0;
      let highestTurn = 0;
      let highestCheckout = 0;
      let scores60Plus = 0;
      let scores100Plus = 0;
      let scores140Plus = 0;
      let scores180 = 0;
      let checkoutsAttempted = 0;
      let checkoutsHit = 0;

      // Accumulate turns from all players on this team
      match.legs.forEach((leg) => {
        leg.turns.forEach((turn) => {
          if (teamPlayerIds.includes(turn.playerId)) {
            const count = turn.darts.length || 3;
            totalDarts += count;
            if (!turn.isBust) {
              totalScored += turn.turnTotal;
              if (turn.turnTotal > highestTurn) highestTurn = turn.turnTotal;
              if (turn.turnTotal === 180) scores180++;
              else if (turn.turnTotal >= 140) scores140Plus++;
              else if (turn.turnTotal >= 100) scores100Plus++;
              else if (turn.turnTotal >= 60) scores60Plus++;

              if (turn.scoreAfter === 0 && turn.turnTotal > highestCheckout) {
                highestCheckout = turn.turnTotal;
              }
            }
            if (turn.scoreBefore <= 170 && turn.scoreBefore > 1) {
              checkoutsAttempted++;
            }
            if (turn.scoreAfter === 0) {
              checkoutsHit++;
            }
          }
        });
      });

      const threeDartAvg = totalDarts > 0 ? (totalScored / totalDarts) * 3 : 0;
      const first9Avg = teamPlayerStats.length > 0
        ? teamPlayerStats.reduce((acc, s) => acc + s.first9Avg, 0) / teamPlayerStats.length
        : 0;
      const checkoutPct = checkoutsAttempted > 0 ? (checkoutsHit / checkoutsAttempted) * 100 : 0;

      const legsWon = match.teamScores ? match.teamScores[team.id]?.legsWon || 0 : 0;
      const setsWon = match.teamScores ? match.teamScores[team.id]?.setsWon || 0 : 0;

      return {
        teamId: team.id,
        name: team.name,
        avatar: team.avatar,
        color: team.color,
        playerIds: teamPlayerIds,
        threeDartAvg: Math.round(threeDartAvg * 100) / 100,
        first9Avg: Math.round(first9Avg * 100) / 100,
        highestTurn,
        highestCheckout,
        checkoutsAttempted,
        checkoutsHit,
        checkoutPct: Math.round(checkoutPct * 10) / 10,
        dartsThrown: totalDarts,
        scores60Plus,
        scores100Plus,
        scores140Plus,
        scores180,
        legsWon,
        setsWon,
      };
    });
  }

  // Export JSON backup
  public async exportData(): Promise<string> {
    const players = await this.getPlayers();
    const matches = await this.getMatches(5000);
    const data = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      players,
      matches,
    };
    return JSON.stringify(data, null, 2);
  }

  // Import JSON backup
  public async importData(jsonString: string): Promise<{ importedMatches: number; importedPlayers: number }> {
    const data = JSON.parse(jsonString);
    let importedMatches = 0;
    let importedPlayers = 0;

    if (Array.isArray(data.players)) {
      for (const p of data.players) {
        await this.savePlayer(p);
        importedPlayers++;
      }
    }

    if (Array.isArray(data.matches)) {
      for (const m of data.matches) {
        await this.saveMatch(m);
        importedMatches++;
      }
    }

    return { importedMatches, importedPlayers };
  }
}

export const storageEngine = new StorageSubsystem();
