'use client';

import React, { useState } from 'react';
import { MatchRecord } from '@/lib/types';
import { storageEngine } from '@/lib/storage';
import { Sparkles, Bot, RefreshCw, MessageSquare } from 'lucide-react';

interface AICoachPanelProps {
  match: MatchRecord;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ match }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const stats = storageEngine.calculateMatchStats(match);
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchData: {
            gameType: match.gameType,
            legsCount: match.legs.length,
            scores: match.scores,
          },
          playerStats: stats,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalysis('PDC Coach: Keep working on your grouping at Treble 20 and stay confident on outer doubles!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">AI Darts Coach & Match Analyst</h3>
            <p className="text-xs text-zinc-400">PDC broadcast analysis and personalized training drills</p>
          </div>
        </div>

        <button
          id="get-ai-coach-analysis-btn"
          onClick={fetchAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{loading ? 'Analyzing...' : analysis ? 'Refresh Analysis' : 'Analyze Match'}</span>
        </button>
      </div>

      {analysis ? (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 text-sm text-zinc-200 leading-relaxed whitespace-pre-line space-y-2">
          {analysis}
        </div>
      ) : (
        <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-2xl p-6 text-center text-xs text-zinc-500">
          Click &quot;Analyze Match&quot; to receive televised match commentary and bespoke training routines based on your checkout efficiency and 3-dart averages.
        </div>
      )}
    </div>
  );
};
