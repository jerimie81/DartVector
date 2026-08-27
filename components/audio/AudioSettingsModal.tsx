'use client';

import React, { useState, useEffect } from 'react';
import { soundEngine } from '@/lib/sound-system';
import { AudioSettings, DartSoundPack } from '@/lib/types';
import { Volume2, VolumeX, Mic, Play, X, Sliders, Target, Sparkles, Disc } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SoundPackOption {
  id: DartSoundPack;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
}

const SOUND_PACKS: SoundPackOption[] = [
  {
    id: 'pro_tournament',
    title: 'Pro Tournament (Blade 6)',
    subtitle: 'High-density sisal core thud with razor-thin spider wire ping',
    badge: 'PDC Official',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  {
    id: 'pub_style',
    title: 'Pub Style (Classic Brass)',
    subtitle: 'Warm resonant wooden cabinet cavity with classic fibrous thunk',
    badge: 'Classic Pub',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  {
    id: 'heavy_steel',
    title: 'Heavy Steel-Tip (26g+)',
    subtitle: 'Heavy tungsten punch, deep backboard knock and dual wire ring',
    badge: 'Heavy Steel',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  {
    id: 'electronic_soft_tip',
    title: 'Electronic Soft-Tip',
    subtitle: 'Plastic segment matrix click with digital arcade scoring chirp',
    badge: 'Arcade Matrix',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
];

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => soundEngine.getSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => soundEngine.getAvailableVoices());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        setVoices(soundEngine.getAvailableVoices());
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  if (!isOpen) return null;

  const currentPack: DartSoundPack = settings.soundPack || 'pro_tournament';

  const handleUpdate = (partial: Partial<AudioSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    soundEngine.saveSettings(partial);
  };

  const handleSelectSoundPack = (pack: DartSoundPack) => {
    handleUpdate({ soundPack: pack });
    soundEngine.previewSoundPack(pack, false, false);
  };

  const handleTestCall = () => {
    soundEngine.callScore(180);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Audio & Sound FX Settings</h3>
              <p className="text-xs text-zinc-400">Impact sound packs, referee announcer & volume levels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* SECTION 1: DART IMPACT SOUND PACKS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Dart Impact Sound Pack
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">Select board acoustics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SOUND_PACKS.map((pack) => {
                const isSelected = currentPack === pack.id;
                return (
                  <div
                    key={pack.id}
                    id={`sound-pack-${pack.id}`}
                    onClick={() => handleSelectSoundPack(pack.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="soundPack"
                            checked={isSelected}
                            onChange={() => handleSelectSoundPack(pack.id)}
                            className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-white leading-tight">
                            {pack.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1 leading-normal">
                          {pack.subtitle}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${pack.badgeColor}`}
                      >
                        {pack.badge}
                      </span>
                    </div>

                    {/* Preview Buttons */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-800/60" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => soundEngine.previewSoundPack(pack.id, false, false)}
                        className="flex-1 py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Test regular bed hit"
                      >
                        <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                        <span>Bed Hit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => soundEngine.previewSoundPack(pack.id, true, false)}
                        className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Test Bullseye hit"
                      >
                        <Target className="w-2.5 h-2.5 text-red-400" />
                        <span>Bull</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => soundEngine.previewSoundPack(pack.id, false, true)}
                        className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Test Wire clank"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Wire</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: AUDIO ENGINE TOGGLES */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <div className="text-sm font-bold text-white">Master Audio Engine</div>
                <div className="text-xs text-zinc-400">Enable sound FX and speech announcements</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleUpdate({ enabled: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
              <div>
                <div className="text-sm font-bold text-white">Referee Caller (Speech Announcer)</div>
                <div className="text-xs text-zinc-400">PDC-style score calls (&quot;180!&quot;, &quot;Game Shot!&quot;, &quot;Require 40&quot;)</div>
              </div>
              <input
                type="checkbox"
                checked={settings.refereeCaller}
                onChange={(e) => handleUpdate({ refereeCaller: e.target.checked })}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* SECTION 3: VOLUME & SPEED SLIDERS */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1.5">
                <span>Master Volume</span>
                <span className="font-mono text-amber-400">{Math.round(settings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => handleUpdate({ volume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1.5">
                <span>Sound FX (Impacts & Fanfares) Volume</span>
                <span className="font-mono text-amber-400">{Math.round((settings.sfxVolume ?? 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume ?? 0.8}
                onChange={(e) => handleUpdate({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1.5">
                <span>Speech Announcer Speed</span>
                <span className="font-mono text-amber-400">{settings.speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => handleUpdate({ speechRate: parseFloat(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* SECTION 4: VOICE SELECTOR */}
          {voices.length > 0 && (
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-1.5">Referee Speech Voice</label>
              <select
                value={settings.selectedVoiceURI || ''}
                onChange={(e) => {
                  handleUpdate({ selectedVoiceURI: e.target.value });
                  soundEngine.setVoice(e.target.value);
                }}
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            onClick={handleTestCall}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>Test Call: &quot;ONE HUNDRED AND EIGHTY!&quot;</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

