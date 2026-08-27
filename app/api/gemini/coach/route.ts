// DartMaster Pro - Server-Side Gemini API AI Coach & Match Analyst Route
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { matchData, playerStats } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        analysis: "PDC Coach Analysis: Great match! Focus on steadying your follow-through on Double 16 and maintaining a consistent rhythm when switching between Treble 20 and Treble 19.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a legendary PDC World Darts Championship referee and professional darts coach (like Russ Bray / Wayne Mardle / John Part).
Analyze the following match statistics for the player and provide:
1. 🎙️ **Match Commentary Highlights**: Fast-paced, punchy, authentic UK darts broadcast remarks about their performance, 180s, high checkouts, and 3-dart average.
2. 🎯 **Technical Assessment**: Strengths and weaknesses in their scoring power (T20/T19) vs checkout execution under pressure.
3. ⚡ **Actionable Training Routine**: 2 specific darts drills (e.g. Bob's 27, 121 checkout challenge, round-the-board doubles) tailored to their numbers.

Match Stats Summary:
${JSON.stringify({ matchData, playerStats }, null, 2)}

Keep the tone enthusiastic, authentic, and professional. Output clean markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({
      analysis: response.text || 'Unable to generate analysis at this time.',
    });
  } catch (error: any) {
    console.error('Error generating darts coach commentary:', error);
    return NextResponse.json(
      { analysis: 'Coach tip: Maintain your elbow alignment and commit to the outer wire when aiming at doubles.' },
      { status: 200 }
    );
  }
}
