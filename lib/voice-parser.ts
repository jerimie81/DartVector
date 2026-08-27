/**
 * Voice Input Parser for Darts Scoring
 * Supports spoken numbers, natural words, pub slang, dartboard segments, and commands.
 */

export interface VoiceParseResult {
  type: 'score' | 'undo' | 'bust' | 'unknown';
  score?: number;
  label?: string;
  originalTranscript: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  ton: 100,
};

function wordsToNumber(text: string): number | null {
  const clean = text
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/ and /g, ' ')
    .trim();

  const words = clean.split(/\s+/);
  let total = 0;
  let current = 0;
  let hasValidWord = false;

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      hasValidWord = true;
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current === 0 ? 1 : current) * 100;
      } else {
        current += val;
      }
    }
  }

  total += current;
  return hasValidWord ? total : null;
}

export function parseVoiceDartsCommand(rawTranscript: string): VoiceParseResult {
  const transcript = rawTranscript.toLowerCase().trim();

  // 1. Undo Commands
  if (
    transcript === 'undo' ||
    transcript.includes('undo dart') ||
    transcript.includes('undo turn') ||
    transcript.includes('go back') ||
    transcript.includes('revert') ||
    transcript.includes('cancel last')
  ) {
    return {
      type: 'undo',
      label: 'Undo Previous Throw',
      originalTranscript: rawTranscript,
    };
  }

  // 2. Bust / Miss / Zero Commands
  if (
    transcript.includes('bust') ||
    transcript.includes('busted') ||
    transcript.includes('no score') ||
    transcript.includes('miss') ||
    transcript === 'zero' ||
    transcript === 'nil' ||
    transcript === 'nothing' ||
    transcript === '0'
  ) {
    return {
      type: 'bust',
      score: 0,
      label: 'Bust / No Score (0)',
      originalTranscript: rawTranscript,
    };
  }

  // 3. Special Slang & Dart Terms
  const slangScores: Record<string, { score: number; label: string }> = {
    'one eighty': { score: 180, label: 'MAXIMUM! 180' },
    'one hundred and eighty': { score: 180, label: 'MAXIMUM! 180' },
    'one hundred eighty': { score: 180, label: 'MAXIMUM! 180' },
    'ton eighty': { score: 180, label: 'MAXIMUM! 180' },
    'ton 80': { score: 180, label: 'MAXIMUM! 180' },
    '180': { score: 180, label: 'MAXIMUM! 180' },
    'one forty': { score: 140, label: 'Ton 40 (140)' },
    'one hundred and forty': { score: 140, label: 'Ton 40 (140)' },
    'one hundred forty': { score: 140, label: 'Ton 40 (140)' },
    'ton forty': { score: 140, label: 'Ton 40 (140)' },
    'ton 40': { score: 140, label: 'Ton 40 (140)' },
    '140': { score: 140, label: 'Ton 40 (140)' },
    'one hundred': { score: 100, label: 'Ton (100)' },
    'one ton': { score: 100, label: 'Ton (100)' },
    'ton': { score: 100, label: 'Ton (100)' },
    '100': { score: 100, label: 'Ton (100)' },
    'one twenty': { score: 120, label: 'Shanghai 20s (120)' },
    'ton twenty': { score: 120, label: 'Ton 20 (120)' },
    'ton 20': { score: 120, label: 'Ton 20 (120)' },
    'breakfast': { score: 26, label: 'Breakfast (26)' },
    'bed and breakfast': { score: 26, label: 'Bed & Breakfast (26)' },
    'bag of nails': { score: 26, label: 'Bag of Nails (26)' },
    'twenty six': { score: 26, label: '26 (Single 20, 1, 5)' },
    '26': { score: 26, label: '26' },
    'bullseye': { score: 50, label: 'Double Bullseye (50)' },
    'double bull': { score: 50, label: 'Double Bullseye (50)' },
    'outer bull': { score: 25, label: 'Outer Bull (25)' },
    'single bull': { score: 25, label: 'Single Bull (25)' },
    'triple twenty': { score: 60, label: 'Treble 20 (60)' },
    'treble twenty': { score: 60, label: 'Treble 20 (60)' },
    'triple nineteen': { score: 57, label: 'Treble 19 (57)' },
    'treble nineteen': { score: 57, label: 'Treble 19 (57)' },
    'triple eighteen': { score: 54, label: 'Treble 18 (54)' },
    'treble eighteen': { score: 54, label: 'Treble 18 (54)' },
  };

  for (const [key, val] of Object.entries(slangScores)) {
    if (transcript === key || transcript.includes(key)) {
      return {
        type: 'score',
        score: val.score,
        label: val.label,
        originalTranscript: rawTranscript,
      };
    }
  }

  // 4. Try Direct Digit Extraction
  const digitsMatch = transcript.match(/\b([0-9]{1,3})\b/);
  if (digitsMatch) {
    const num = parseInt(digitsMatch[1], 10);
    if (!isNaN(num) && num >= 0 && num <= 180) {
      return {
        type: 'score',
        score: num,
        label: `Score: ${num}`,
        originalTranscript: rawTranscript,
      };
    }
  }

  // 5. Try Spoken Word Number Conversion
  const converted = wordsToNumber(transcript);
  if (converted !== null && converted >= 0 && converted <= 180) {
    return {
      type: 'score',
      score: converted,
      label: `Score: ${converted}`,
      originalTranscript: rawTranscript,
    };
  }

  return {
    type: 'unknown',
    originalTranscript: rawTranscript,
  };
}
