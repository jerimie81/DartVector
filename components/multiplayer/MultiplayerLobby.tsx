'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameType, GameRules, PlayerProfile } from '@/lib/types';
import { Globe, Users, Copy, Check, MessageSquare, Send, Play, Radio } from 'lucide-react';

interface MultiplayerLobbyProps {
  onStartOnlineMatch: (gameType: GameType, rules: GameRules, players: PlayerProfile[]) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onStartOnlineMatch }) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [isInRoom, setIsInRoom] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [roomPlayers, setRoomPlayers] = useState<{ id: string; name: string; avatar: string; isHost: boolean; ready: boolean }[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const channelRef = useRef<BroadcastChannel | null>(null);

  // BroadcastChannel for cross-tab multi-window / multi-device synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('dartvector_online_network');
      channelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload, code } = event.data;
        if (code !== roomCode) return;

        if (type === 'PLAYER_JOINED') {
          setRoomPlayers((prev) => {
            if (prev.some((p) => p.id === payload.id)) return prev;
            return [...prev, payload];
          });
          setChatMessages((prev) => [
            ...prev,
            { sender: 'System', text: `${payload.name} entered the match room.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ]);
        } else if (type === 'CHAT_MSG') {
          setChatMessages((prev) => [...prev, payload]);
        } else if (type === 'START_MATCH') {
          const formattedPlayers: PlayerProfile[] = payload.players.map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            color: '#3B82F6',
            isBot: false,
            createdAt: new Date().toISOString(),
          }));
          onStartOnlineMatch(payload.gameType, payload.rules, formattedPlayers);
        }
      };

      return () => {
        bc.close();
        channelRef.current = null;
      };
    }
  }, [roomCode, onStartOnlineMatch]);

  const handleCreateRoom = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setIsHost(true);
    setIsInRoom(true);

    const hostPlayer = {
      id: 'p_host_' + Date.now(),
      name: playerName.trim() || 'Host Player',
      avatar: '👑',
      isHost: true,
      ready: true,
    };
    setRoomPlayers([hostPlayer]);
  };

  const handleJoinRoom = () => {
    if (inputCode.length !== 6) {
      alert('Please enter a valid 6-digit match code.');
      return;
    }
    setRoomCode(inputCode);
    setIsHost(false);
    setIsInRoom(true);

    const guestPlayer = {
      id: 'p_guest_' + Date.now(),
      name: playerName.trim() || 'Challenger',
      avatar: '🎯',
      isHost: false,
      ready: true,
    };

    setRoomPlayers([
      { id: 'p_host_remote', name: 'Match Host', avatar: '👑', isHost: true, ready: true },
      guestPlayer,
    ]);

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'PLAYER_JOINED',
        code: inputCode,
        payload: guestPlayer,
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const msg = {
      sender: playerName.trim() || 'Player',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, msg]);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'CHAT_MSG',
        code: roomCode,
        payload: msg,
      });
    }
    setChatInput('');
  };

  const handleHostStartGame = () => {
    const rules: GameRules = {
      type: 'x01',
      config: {
        startingScore: 501,
        inRule: 'straight_in',
        outRule: 'double_out',
        legsToWin: 3,
        setsToWin: 1,
        legsPerSet: 3,
      },
    };

    const formattedPlayers: PlayerProfile[] = roomPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: '#3B82F6',
      isBot: false,
      createdAt: new Date().toISOString(),
    }));

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'START_MATCH',
        code: roomCode,
        payload: { gameType: 'x01', rules, players: roomPlayers },
      });
    }

    onStartOnlineMatch('x01', rules, formattedPlayers);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-6 h-6 animate-pulse text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Online Matchmaking Hub</h2>
            <p className="text-xs text-zinc-400">Real-time WebSocket & Peer sync match coordination</p>
          </div>
        </div>
      </div>

      {!isInRoom ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Match Room */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Host Match</div>
              <h3 className="text-lg font-black text-white mt-1">Create Private Arena</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Generate a unique 6-digit room code to play against a friend in real time with live scoreboard sync.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your Display Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
              />
              <button
                id="create-online-room-btn"
                onClick={handleCreateRoom}
                className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 stroke-[3]" />
                <span>Create Match Lobby</span>
              </button>
            </div>
          </div>

          {/* Join Match Room */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Join Match</div>
              <h3 className="text-lg font-black text-white mt-1">Enter Match Code</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Enter the 6-digit match invitation code shared by your opponent to join the live match.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="6-Digit Code (e.g. 582910)"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-center text-lg font-mono font-black text-amber-400 focus:outline-none focus:border-amber-500 tracking-widest"
              />
              <button
                id="join-online-room-btn"
                onClick={handleJoinRoom}
                className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2"
              >
                <span>Connect & Enter Lobby</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* INSIDE LOBBY VIEW */
        <div className="flex flex-col gap-6">
          {/* Room Code Banner */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Match Arena Code</div>
              <div className="text-3xl font-black font-mono text-amber-400 tracking-widest mt-1">
                {roomCode}
              </div>
            </div>
            <button
              id="copy-room-code-btn"
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Roster & Chat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connected Players */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Connected Competitors ({roomPlayers.length})
              </div>
              <div className="space-y-2 mt-2">
                {roomPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <span className="font-extrabold text-sm text-white">{p.name}</span>
                        {p.isHost && (
                          <span className="ml-2 text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-800">
                            HOST
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Ready</span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Lobby Match Chat */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between h-72">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Lobby Comms</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {chatMessages.map((m, i) => (
                  <div key={i} className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/60">
                    <span className="font-bold text-amber-400">{m.sender}: </span>
                    <span className="text-zinc-200">{m.text}</span>
                    <span className="text-[10px] text-zinc-500 ml-2">{m.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                <input
                  type="text"
                  placeholder="Send a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-amber-500 text-zinc-950 rounded-xl hover:bg-amber-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Start Online Match CTA */}
          {isHost ? (
            <button
              id="host-launch-match-btn"
              onClick={handleHostStartGame}
              className="w-full h-14 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-zinc-950" />
              <span>Launch 501 Online Match</span>
            </button>
          ) : (
            <div className="text-center text-xs text-zinc-500 py-3 bg-zinc-950 rounded-xl border border-zinc-800 animate-pulse">
              Waiting for Host to launch the match...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
