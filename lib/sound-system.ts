// DartMaster Pro - Professional Audio, Sound FX & Referee Caller Engine
import { AudioSettings, DartSoundPack } from './types';

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 0.85,
  voiceVolume: 1.0,
  sfxVolume: 0.8,
  soundPack: 'pro_tournament',
  refereeCaller: true,
  callTotals: true,
  callRemaining: true,
  speechRate: 1.05,
};

class SoundSystem {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSettings();
      this.initVoices();
    }
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('dartmaster_audio_settings');
      if (saved) {
        this.settings = { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('dartmaster_audio_settings', JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        this.voices = window.speechSynthesis.getVoices();
        // Prefer UK English referee voices (en-GB, Google UK English Male/Female, Daniel, Oliver)
        const ukMale = this.voices.find(
          (v) => (v.lang.startsWith('en-GB') || v.lang.startsWith('en-UK')) && (v.name.includes('Male') || v.name.includes('George') || v.name.includes('Daniel') || v.name.includes('Natural'))
        );
        const ukAny = this.voices.find((v) => v.lang.startsWith('en-GB') || v.lang.startsWith('en-UK'));
        const english = this.voices.find((v) => v.lang.startsWith('en'));
        this.selectedVoice = ukMale || ukAny || english || this.voices[0] || null;
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setVoice(voiceURI: string) {
    const voice = this.voices.find((v) => v.voiceURI === voiceURI);
    if (voice) {
      this.selectedVoice = voice;
      this.saveSettings({ selectedVoiceURI: voiceURI });
    }
  }

  public setSoundPack(pack: DartSoundPack) {
    this.saveSettings({ soundPack: pack });
  }

  public getSoundPack(): DartSoundPack {
    return this.settings.soundPack || 'pro_tournament';
  }

  // Synthesize realistic Dart Hit Impact with specific sound packs
  public playDartHit(isBull: boolean = false, isWire: boolean = false, overridePack?: DartSoundPack) {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const pack = overridePack || this.settings.soundPack || 'pro_tournament';

    try {
      const t = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * this.settings.sfxVolume, t);
      masterGain.connect(this.ctx.destination);

      if (pack === 'pub_style') {
        // --- PUB STYLE SOUND PACK (Warm resonant wooden cabinet & classic looser sisal) ---
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(isBull ? 140 : 105, t);
        thudOsc.frequency.exponentialRampToValueAtTime(26, t + 0.14);

        thudGain.gain.setValueAtTime(0.75, t);
        thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        thudOsc.connect(thudGain);
        thudGain.connect(masterGain);
        thudOsc.start(t);
        thudOsc.stop(t + 0.15);

        // Resonant cabinet hollow body note
        const woodOsc = this.ctx.createOscillator();
        const woodGain = this.ctx.createGain();
        woodOsc.type = 'triangle';
        woodOsc.frequency.setValueAtTime(isBull ? 190 : 150, t);
        woodOsc.frequency.exponentialRampToValueAtTime(45, t + 0.11);
        woodGain.gain.setValueAtTime(0.3, t);
        woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        woodOsc.connect(woodGain);
        woodGain.connect(masterGain);
        woodOsc.start(t);
        woodOsc.stop(t + 0.12);

        // Looser sisal crunch friction noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isWire ? 2200 : 680, t);
        filter.Q.setValueAtTime(1.8, t);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(isWire ? 0.6 : 0.45, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.07);

        // Classic rounded wire ring
        if (isWire) {
          const wireOsc = this.ctx.createOscillator();
          const wireGain = this.ctx.createGain();
          wireOsc.type = 'triangle';
          wireOsc.frequency.setValueAtTime(1600, t);
          wireOsc.frequency.exponentialRampToValueAtTime(1100, t + 0.11);
          wireGain.gain.setValueAtTime(0.4, t);
          wireGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          wireOsc.connect(wireGain);
          wireGain.connect(masterGain);
          wireOsc.start(t);
          wireOsc.stop(t + 0.12);
        }
      } else if (pack === 'heavy_steel') {
        // --- HEAVY STEEL-TIP SOUND PACK (26g+ heavy tungsten & solid backboard punch) ---
        const punchOsc = this.ctx.createOscillator();
        const punchGain = this.ctx.createGain();
        punchOsc.type = 'sawtooth';
        punchOsc.frequency.setValueAtTime(isBull ? 240 : 180, t);
        punchOsc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

        punchGain.gain.setValueAtTime(0.65, t);
        punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        const punchFilter = this.ctx.createBiquadFilter();
        punchFilter.type = 'lowpass';
        punchFilter.frequency.setValueAtTime(400, t);

        punchOsc.connect(punchFilter);
        punchFilter.connect(punchGain);
        punchGain.connect(masterGain);
        punchOsc.start(t);
        punchOsc.stop(t + 0.09);

        // Sub bass thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(isBull ? 130 : 95, t);
        subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.12);
        subGain.gain.setValueAtTime(0.7, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(t);
        subOsc.stop(t + 0.13);

        // Steel friction snap
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.18));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isWire ? 3800 : 1200, t);
        filter.Q.setValueAtTime(2.5, t);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.04);

        // Hard steel wire harmonic clank
        if (isWire) {
          [2400, 4600].forEach((freq) => {
            const wireOsc = this.ctx!.createOscillator();
            const wireGain = this.ctx!.createGain();
            wireOsc.type = 'triangle';
            wireOsc.frequency.setValueAtTime(freq, t);
            wireOsc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.09);
            wireGain.gain.setValueAtTime(0.3, t);
            wireGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            wireOsc.connect(wireGain);
            wireGain.connect(masterGain);
            wireOsc.start(t);
            wireOsc.stop(t + 0.1);
          });
        }
      } else if (pack === 'electronic_soft_tip') {
        // --- ELECTRONIC SOFT-TIP (Arcade segment matrix snap + digital scoring beep) ---
        // Plastic segment snap
        const snapOsc = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(isBull ? 880 : 640, t);
        snapOsc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

        snapGain.gain.setValueAtTime(0.6, t);
        snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        snapOsc.connect(snapGain);
        snapGain.connect(masterGain);
        snapOsc.start(t);
        snapOsc.stop(t + 0.04);

        // Digital micro chirp
        const beepOsc = this.ctx.createOscillator();
        const beepGain = this.ctx.createGain();
        beepOsc.type = 'sine';
        const startFreq = isBull ? 1560 : 1100;
        const endFreq = isBull ? 2080 : 1480;
        beepOsc.frequency.setValueAtTime(startFreq, t + 0.01);
        beepOsc.frequency.linearRampToValueAtTime(endFreq, t + 0.05);

        beepGain.gain.setValueAtTime(0.001, t);
        beepGain.gain.setValueAtTime(0.35, t + 0.01);
        beepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        beepOsc.connect(beepGain);
        beepGain.connect(masterGain);
        beepOsc.start(t + 0.01);
        beepOsc.stop(t + 0.08);

        // Wire / divider click
        if (isWire) {
          const wireOsc = this.ctx.createOscillator();
          const wireGain = this.ctx.createGain();
          wireOsc.type = 'sawtooth';
          wireOsc.frequency.setValueAtTime(3200, t);
          wireGain.gain.setValueAtTime(0.3, t);
          wireGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          wireOsc.connect(wireGain);
          wireGain.connect(masterGain);
          wireOsc.start(t);
          wireOsc.stop(t + 0.06);
        }
      } else {
        // --- PRO TOURNAMENT (PDC Blade 6 / High-Density Sisal Core) ---
        // Tight, crisp low frequency thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isBull ? 180 : 130, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.09);

        oscGain.gain.setValueAtTime(0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.1);

        // High-density sisal friction burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isWire ? 3200 : 900, t);
        filter.Q.setValueAtTime(isWire ? 4 : 1.5, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(isWire ? 0.6 : 0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.05);

        // Ultra-thin razor wire ping
        if (isWire) {
          const wireOsc = this.ctx.createOscillator();
          const wireGain = this.ctx.createGain();
          wireOsc.type = 'triangle';
          wireOsc.frequency.setValueAtTime(2400, t);
          wireOsc.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
          wireGain.gain.setValueAtTime(0.35, t);
          wireGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          wireOsc.connect(wireGain);
          wireGain.connect(masterGain);
          wireOsc.start(t);
          wireOsc.stop(t + 0.09);
        }
      }
    } catch {
      // AudioContext error catch
    }
  }

  // Preview a specific sound pack
  public previewSoundPack(pack: DartSoundPack, isBull: boolean = false, isWire: boolean = false) {
    this.playDartHit(isBull, isWire, pack);
  }

  // Synthesize celebratory Crowd Cheers & Horn for 180 or Match Win
  public play180Fanfare() {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * this.settings.sfxVolume * 0.8, t);
      masterGain.connect(this.ctx.destination);

      // Multi-tone triumphant fanfare chords (C - E - G - C)
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const noteOsc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, t + idx * 0.06);

        noteGain.gain.setValueAtTime(0.001, t + idx * 0.06);
        noteGain.gain.linearRampToValueAtTime(0.25, t + idx * 0.06 + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.9);

        noteOsc.connect(noteGain);
        noteGain.connect(masterGain);
        noteOsc.start(t + idx * 0.06);
        noteOsc.stop(t + idx * 0.06 + 1.0);
      });
    } catch {
      // ignore
    }
  }

  // Bust / Miss sound
  public playBustSound() {
    if (!this.settings.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(75, t + 0.25);
      gain.gain.setValueAtTime(0.4 * this.settings.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {
      // ignore
    }
  }

  // Synthesize acoustic referee fallback cues when TTS voices are unavailable
  public playFallbackRefereeCue(type: 'bust' | 'gameshot' | 'score' | 'requirement', param?: number) {
    this.initContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.settings.volume * this.settings.sfxVolume, t);
      gain.connect(this.ctx.destination);

      if (type === 'bust') {
        this.playBustSound();
      } else if (type === 'gameshot') {
        this.play180Fanfare();
      } else if (type === 'score') {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + (param || 20) * 2, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);
      } else if (type === 'requirement') {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.frequency.setValueAtTime(523.25, t);
        osc2.frequency.setValueAtTime(659.25, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start(t);
        osc1.stop(t + 0.1);
        osc2.start(t + 0.08);
        osc2.stop(t + 0.26);
      }
    } catch {
      // AudioContext catch
    }
  }

  // Official Referee Speech Announcement
  public speak(text: string, priority: 'high' | 'normal' = 'normal', pitch: number = 1.0) {
    if (!this.settings.enabled || !this.settings.refereeCaller) return;
    if (typeof window === 'undefined') return;

    const hasSpeech = 'speechSynthesis' in window && window.speechSynthesis;
    const hasVoices = this.voices.length > 0;

    if (!hasSpeech || !hasVoices) {
      // Fallback to synthesized acoustic cue
      if (text.toLowerCase().includes('bust')) {
        this.playFallbackRefereeCue('bust');
      } else if (text.toLowerCase().includes('game shot')) {
        this.playFallbackRefereeCue('gameshot');
      } else if (text.toLowerCase().includes('require')) {
        this.playFallbackRefereeCue('requirement');
      } else {
        this.playFallbackRefereeCue('score');
      }
      return;
    }

    try {
      if (priority === 'high') {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.volume = this.settings.volume * this.settings.voiceVolume;
      utterance.rate = this.settings.speechRate;
      utterance.pitch = pitch;

      window.speechSynthesis.speak(utterance);
    } catch {
      this.playFallbackRefereeCue('score');
    }
  }

  // Announce Turn Total Score (e.g., "ONE HUNDRED AND EIGHTY!")
  public callScore(score: number, isBust: boolean = false) {
    if (isBust) {
      this.playBustSound();
      this.speak('Bust!', 'high', 0.9);
      return;
    }

    if (score === 180) {
      this.play180Fanfare();
      // Famous dramatic referee scream
      this.speak('ONE HUNDRED AND EIGHTY!', 'high', 1.25);
    } else if (score === 140) {
      this.speak('One hundred and forty!', 'high', 1.1);
    } else if (score === 100) {
      this.speak('Ton!', 'normal', 1.05);
    } else if (score === 0) {
      this.speak('No score', 'normal', 0.95);
    } else if (score === 26) {
      this.speak('Twenty-six', 'normal', 0.95);
    } else if (score >= 100) {
      this.speak(`One hundred and ${score - 100}`, 'normal', 1.05);
    } else {
      this.speak(`${score}`, 'normal', 1.0);
    }
  }

  // Announce Checkout Requirement (e.g., "You require 40")
  public callRequirement(playerName: string, scoreRemaining: number, dartsRemaining: number = 3) {
    if (!this.settings.callRemaining) return;
    if (scoreRemaining <= 170 && scoreRemaining > 1) {
      this.speak(`${playerName}, you require ${scoreRemaining}`, 'normal', 1.0);
    }
  }

  // Announce Game Shot (Leg or Match win)
  public callGameShot(isMatchWon: boolean, winnerName: string, legOrSetText?: string) {
    this.play180Fanfare();
    if (isMatchWon) {
      this.speak(`Game shot, and the match! Congratulations ${winnerName}!`, 'high', 1.2);
    } else {
      this.speak(`Game shot ${legOrSetText || 'and the leg'} to ${winnerName}!`, 'high', 1.15);
    }
  }
}

export const soundEngine = new SoundSystem();
