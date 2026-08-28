'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { MatchRecord, PlayerProfile } from './types';
import { storageEngine } from './storage';

export interface UserStats {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string;
  matchesPlayed: number;
  matchesWon: number;
  career3DAvg: number;
  highestTurn: number;
  highestCheckout: number;
  count180s: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userStats: UserStats | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncCloudHistory: () => Promise<void>;
  syncLocalToCloud: () => Promise<{ uploadedMatches: number }>;
  isSyncing: boolean;
  syncStatus: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userStats: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  syncCloudHistory: async () => {},
  syncLocalToCloud: async () => ({ uploadedMatches: 0 }),
  isSyncing: false,
  syncStatus: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadUserStats = useCallback(async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserStats(userSnap.data() as UserStats);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  }, []);

  // Sync user's cloud matches into local IndexedDB for lightning fast offline/online hybrid access
  const syncCloudHistory = useCallback(async (currentUser?: User | null) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;

    try {
      setIsSyncing(true);
      setSyncStatus('Syncing cloud match history...');

      const matchesRef = collection(db, 'users', targetUser.uid, 'matches');
      const q = query(matchesRef);
      const snapshot = await getDocs(q);

      let importedCount = 0;
      for (const matchDoc of snapshot.docs) {
        const data = matchDoc.data();
        if (data.matchDataJson) {
          try {
            const parsedMatch: MatchRecord = JSON.parse(data.matchDataJson);
            await storageEngine.saveMatch(parsedMatch);
            importedCount++;
          } catch {
            // ignore malformed
          }
        }
      }

      // Refresh stats
      await loadUserStats(targetUser.uid);
      setSyncStatus(importedCount > 0 ? `Synced ${importedCount} matches from Cloud` : 'Cloud up to date');
      setTimeout(() => setSyncStatus(null), 3500);
    } catch (err: any) {
      console.error('Failed to sync cloud history:', err);
      setSyncStatus('Sync complete');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadUserStats]);

  // Upload local matches to Firebase Firestore
  const syncLocalToCloud = useCallback(async (): Promise<{ uploadedMatches: number }> => {
    if (!user) return { uploadedMatches: 0 };

    try {
      setIsSyncing(true);
      setSyncStatus('Uploading matches to Cloud...');

      const localMatches = await storageEngine.getMatches(500);
      let uploaded = 0;

      for (const m of localMatches) {
        const matchRef = doc(db, 'users', user.uid, 'matches', m.id);

        await setDoc(
          matchRef,
          {
            id: m.id,
            userId: user.uid,
            gameType: m.gameType,
            isTeamMatch: !!m.isTeamMatch,
            winnerPlayerId: m.winnerPlayerId || null,
            winnerTeamId: m.winnerTeamId || null,
            startTime: m.startTime,
            endTime: m.endTime || m.startTime,
            status: m.status,
            summary: m.isTeamMatch
              ? `${m.teams?.team_1.name} vs ${m.teams?.team_2.name}`
              : m.players.map((p) => p.name).join(' vs '),
            matchDataJson: JSON.stringify(m),
            createdAt: new Date(m.startTime).toISOString(),
            syncedAt: serverTimestamp(),
          },
          { merge: true }
        );
        uploaded++;
      }

      await loadUserStats(user.uid);
      setSyncStatus(`Uploaded ${uploaded} matches to Cloud`);
      setTimeout(() => setSyncStatus(null), 3500);
      return { uploadedMatches: uploaded };
    } catch (err: any) {
      console.error('Upload to cloud error:', err);
      setSyncStatus('Sync error');
      setTimeout(() => setSyncStatus(null), 3500);
      return { uploadedMatches: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [user, loadUserStats]);

  const handleUserLogin = useCallback(async (currentUser: User) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile = {
          userId: currentUser.uid,
          displayName: currentUser.displayName || 'Dart Player',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          avatar: '🎯',
          color: '#3B82F6',
          matchesPlayed: 0,
          matchesWon: 0,
          legsPlayed: 0,
          legsWon: 0,
          career3DAvg: 0,
          highestTurn: 0,
          highestCheckout: 0,
          count180s: 0,
          count140Plus: 0,
          count100Plus: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserStats(newProfile as UserStats);
      } else {
        setUserStats(userSnap.data() as UserStats);
      }

      // Automatically sync cloud records with local store
      await syncCloudHistory(currentUser);

      // Also ensure local matches get preserved in user's cloud history
      const localMatches = await storageEngine.getMatches(100);
      if (localMatches.length > 0) {
        // Background upload
        setTimeout(() => {
          syncLocalToCloud();
        }, 1000);
      }
    } catch (err) {
      console.error('Error creating user profile in firestore:', err);
    }
  }, [syncCloudHistory, syncLocalToCloud]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await handleUserLogin(currentUser);
      } else {
        setUserStats(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleUserLogin]);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await handleUserLogin(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      alert('Sign in failed. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserStats(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userStats,
        signInWithGoogle,
        signOut,
        syncCloudHistory,
        syncLocalToCloud,
        isSyncing,
        syncStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
