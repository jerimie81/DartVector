'use client';

import React from 'react';
import { Target, CheckCircle2, RotateCcw, Zap, Sparkles, Users, Mic, X, Award, HelpCircle } from 'lucide-react';

interface HouseLeagueGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HouseLeagueGuideModal: React.FC<HouseLeagueGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">House League Quick Guide</h3>
              <p className="text-xs text-zinc-400">Simple 4-step guide for easy scoring on dart night</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Step 1 */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              1
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Check Whose Turn It Is</span>
              <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                The top banner clearly highlights the active player or team with their avatar, name, and 3 darts in hand.
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              2
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Throw Your 3 Darts</span>
              <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Step up to the oche and throw your 3 darts at your real sisal or electronic board.
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              3
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Enter Your Turn Score in 1 Tap</span>
              <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Choose what works best for you:
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                  <strong className="text-amber-400 block mb-0.5">Quick Buttons</strong>
                  Tap 60, 100, 140, 26, 45, or 180 directly.
                </div>
                <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                  <strong className="text-amber-400 block mb-0.5">Keypad / Darts</strong>
                  Type the total score or tap 3 darts on the screen.
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              4
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Made a Mistake? Tap &quot;Undo&quot; Anytime!</span>
              <span className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Never worry about clicking the wrong number. Tap the yellow <strong className="text-amber-400">&quot;Undo Dart&quot;</strong> or <strong className="text-amber-400">&quot;Undo Turn&quot;</strong> button to instantly revert to the previous score.
              </span>
            </div>
          </div>

          {/* Checkout Tip */}
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 p-4 rounded-2xl border border-amber-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs text-zinc-300">
              <strong className="text-white block font-bold">Automatic Checkout Helper</strong>
              Whenever a score can be finished (170 or below), the board shows the exact recommended double/treble combo to win the leg!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            Got it, Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
