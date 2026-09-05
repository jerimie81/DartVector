// DartMaster Pro - Checkout Engine & Path Finder
// Comprehensive Double-Out & Master-Out lookup table with real-time path adjustments

export interface CheckoutSuggestion {
  score: number;
  dartsInHand: number;
  totalDarts?: number;
  route: string[]; // e.g. ["T20", "T20", "D20"]
  path: Array<{ label: string; segment?: number; multiplier?: number }>;
  preferredTarget: string; // the next dart to throw: e.g. "T20"
  description: string;
  isBogey: boolean;
}

// Bogey numbers (scores under 170 that cannot be checked out with 3 darts in double-out):
// 169, 168, 166, 165, 163, 162, 159
export const BOGEY_SCORES = new Set([169, 168, 166, 165, 163, 162, 159]);

// 3-Dart standard professional checkouts table (170 down to 2)
export const THREE_DART_CHECKOUTS: Record<number, string[]> = {
  170: ['T20', 'T20', 'D-BULL'],
  167: ['T20', 'T19', 'D-BULL'],
  164: ['T20', 'T18', 'D-BULL'],
  161: ['T20', 'T17', 'D-BULL'],
  160: ['T20', 'T20', 'D20'],
  158: ['T20', 'T20', 'D19'],
  157: ['T20', 'T19', 'D20'],
  156: ['T20', 'T20', 'D18'],
  155: ['T20', 'T19', 'D19'],
  154: ['T20', 'T18', 'D20'],
  153: ['T20', 'T19', 'D18'],
  152: ['T20', 'T20', 'D16'],
  151: ['T20', 'T17', 'D20'],
  150: ['T20', 'T18', 'D18'],
  149: ['T20', 'T19', 'D16'],
  148: ['T20', 'T20', 'D14'],
  147: ['T20', 'T17', 'D18'],
  146: ['T20', 'T18', 'D16'],
  145: ['T20', 'T15', 'D20'],
  144: ['T20', 'T20', 'D12'],
  143: ['T20', 'T17', 'D16'],
  142: ['T20', 'T14', 'D20'],
  141: ['T20', 'T19', 'D12'],
  140: ['T20', 'T20', 'D10'],
  139: ['T20', 'T13', 'D20'],
  138: ['T20', 'T18', 'D12'],
  137: ['T19', 'T16', 'D16'],
  136: ['T20', 'T20', 'D8'],
  135: ['T20', 'T15', 'D15'],
  134: ['T20', 'T14', 'D16'],
  133: ['T20', 'T19', 'D8'],
  132: ['T20', 'T16', 'D12'],
  131: ['T20', 'T13', 'D16'],
  130: ['T20', 'T18', 'D8'],
  129: ['T19', 'T16', 'D12'],
  128: ['T18', 'T14', 'D16'],
  127: ['T20', 'T17', 'D8'],
  126: ['T19', 'T19', 'D6'],
  125: ['25', 'T20', 'D20'],
  124: ['T20', 'T16', 'D8'],
  123: ['T19', 'T16', 'D9'],
  122: ['T18', 'T16', 'D10'],
  121: ['T20', 'T15', 'D8'],
  120: ['T20', '20', 'D20'],
  119: ['T19', 'T10', 'D16'],
  118: ['T20', '18', 'D20'],
  117: ['T20', '17', 'D20'],
  116: ['T20', '16', 'D20'],
  115: ['T20', '15', 'D20'],
  114: ['T20', '14', 'D20'],
  113: ['T19', '16', 'D20'],
  112: ['T20', '12', 'D20'],
  111: ['T20', '19', 'D16'],
  110: ['T20', '10', 'D20'],
  109: ['T19', '12', 'D20'],
  108: ['T20', '16', 'D16'],
  107: ['T19', '18', 'D16'],
  106: ['T20', '14', 'D16'],
  105: ['T20', '13', 'D16'],
  104: ['T18', '18', 'D16'],
  103: ['T19', '14', 'D16'],
  102: ['T20', '10', 'D16'],
  101: ['T17', '18', 'D16'],
  100: ['T20', 'D20'],
  99: ['T19', '10', 'D16'],
  98: ['T20', 'D19'],
  97: ['T19', 'D20'],
  96: ['T20', 'D18'],
  95: ['T19', 'D19'],
  94: ['T18', 'D20'],
  93: ['T19', 'D18'],
  92: ['T20', 'D16'],
  91: ['T17', 'D20'],
  90: ['T20', 'D15'],
  89: ['T19', 'D16'],
  88: ['T16', 'D20'],
  87: ['T17', 'D18'],
  86: ['T18', 'D16'],
  85: ['T15', 'D20'],
  84: ['T20', 'D12'],
  83: ['T17', 'D16'],
  82: ['T14', 'D20'],
  81: ['T19', 'D12'],
  80: ['T20', 'D10'],
  79: ['T19', 'D11'],
  78: ['T18', 'D12'],
  77: ['T19', 'D10'],
  76: ['T20', 'D8'],
  75: ['T17', 'D12'],
  74: ['T14', 'D16'],
  73: ['T19', 'D8'],
  72: ['T16', 'D12'],
  71: ['T13', 'D16'],
  70: ['T18', 'D8'],
  69: ['T15', 'D12'],
  68: ['T20', 'D4'],
  67: ['T17', 'D8'],
  66: ['T10', 'D18'],
  65: ['25', 'D20'],
  64: ['T16', 'D8'],
  63: ['T13', 'D12'],
  62: ['T10', 'D16'],
  61: ['T15', 'D8'],
  60: ['20', 'D20'],
  59: ['19', 'D20'],
  58: ['18', 'D20'],
  57: ['17', 'D20'],
  56: ['16', 'D20'],
  55: ['15', 'D20'],
  54: ['14', 'D20'],
  53: ['13', 'D20'],
  52: ['12', 'D20'],
  51: ['19', 'D16'],
  50: ['D-BULL'],
  49: ['17', 'D16'],
  48: ['16', 'D16'],
  47: ['15', 'D16'],
  46: ['14', 'D16'],
  45: ['13', 'D16'],
  44: ['12', 'D16'],
  43: ['11', 'D16'],
  42: ['10', 'D16'],
  41: ['9', 'D16'],
  40: ['D20'],
  39: ['7', 'D16'],
  38: ['D19'],
  37: ['5', 'D16'],
  36: ['D18'],
  35: ['3', 'D16'],
  34: ['D17'],
  33: ['1', 'D16'],
  32: ['D16'],
  31: ['15', 'D8'],
  30: ['D15'],
  29: ['13', 'D8'],
  28: ['D14'],
  27: ['11', 'D8'],
  26: ['D13'],
  25: ['9', 'D8'],
  24: ['D12'],
  23: ['7', 'D8'],
  22: ['D11'],
  21: ['5', 'D8'],
  20: ['D10'],
  19: ['3', 'D8'],
  18: ['D9'],
  17: ['1', 'D8'],
  16: ['D8'],
  15: ['7', 'D4'],
  14: ['D7'],
  13: ['5', 'D4'],
  12: ['D6'],
  11: ['3', 'D4'],
  10: ['D5'],
  9: ['1', 'D4'],
  8: ['D4'],
  7: ['3', 'D2'],
  6: ['D3'],
  5: ['1', 'D2'],
  4: ['D2'],
  3: ['1', 'D1'],
  2: ['D1'],
};

function buildSuggestion(
  score: number,
  dartsInHand: number,
  route: string[],
  description: string,
  isBogey: boolean = false
): CheckoutSuggestion {
  return {
    score,
    dartsInHand,
    totalDarts: route.length,
    route,
    path: route.map((label) => ({ label })),
    preferredTarget: route[0],
    description,
    isBogey,
  };
}

// Calculate exact checkout route based on score and darts remaining in hand (1, 2, or 3)
export function getCheckoutSuggestion(
  score: number,
  dartsRemaining: number = 3,
  allowBogey: boolean = false
): CheckoutSuggestion | null {
  if (score <= 1 || score > 170) return null;
  if (BOGEY_SCORES.has(score)) {
    if (!allowBogey) return null;
    return buildSuggestion(score, dartsRemaining, ['T20', 'T20', 'D16'], 'Bogey Score (Setup dart needed)', true);
  }

  // If 1 dart in hand, can only checkout if score is an even double <= 40 or 50 (Bull)
  if (dartsRemaining === 1) {
    if (score === 50) {
      return buildSuggestion(score, 1, ['D-BULL'], 'Bullseye for the match');
    }
    if (score % 2 === 0 && score <= 40) {
      const doubleNum = score / 2;
      return buildSuggestion(score, 1, [`D${doubleNum}`], `Double ${doubleNum}`);
    }
    return null; // cannot checkout in 1 dart
  }

  // If 2 darts in hand (score must be <= 110, or 25 + 50)
  if (dartsRemaining === 2) {
    if (score > 110 && score !== 120 && score !== 104) {
      // 104 = T18 D25 or T20 D22 is not standard, 110 = T20 D25
      if (score === 110) {
        return buildSuggestion(score, 2, ['T20', 'D-BULL'], 'Treble 20 then Bullseye');
      }
      return null;
    }

    // 2-dart checkouts
    // Direct double
    if (score % 2 === 0 && score <= 40) {
      return buildSuggestion(score, 2, [`D${score / 2}`], `Double ${score / 2}`);
    }
    if (score === 50) {
      return buildSuggestion(score, 2, ['D-BULL'], 'Bullseye');
    }

    // Check Single + Double for scores <= 60
    if (score <= 60) {
      if (score <= 40 && score % 2 === 0) {
        return buildSuggestion(score, 2, [`D${score / 2}`], `Double ${score / 2}`);
      }
      // e.g. 52 -> 12, D20 or 20, D16
      if (score >= 41) {
        const single = score - 40; // leave D20
        if (single >= 1 && single <= 20) {
          return buildSuggestion(score, 2, [`${single}`, 'D20'], `Single ${single}, Double 20`);
        }
      }
      // If odd <= 39 -> single then double
      const single = score % 2 === 1 ? 1 : 2;
      const targetDouble = (score - single) / 2;
      return buildSuggestion(score, 2, [`${single}`, `D${targetDouble}`], `Single ${single}, Double ${targetDouble}`);
    }

    // Scores 61 to 100 with 2 darts
    for (let treble = 20; treble >= 10; treble--) {
      const rem = score - treble * 3;
      if (rem > 0 && rem <= 40 && rem % 2 === 0) {
        return buildSuggestion(score, 2, [`T${treble}`, `D${rem / 2}`], `Treble ${treble}, Double ${rem / 2}`);
      }
      if (rem === 50) {
        return buildSuggestion(score, 2, [`T${treble}`, 'D-BULL'], `Treble ${treble}, Bullseye`);
      }
    }
  }

  // 3 Darts in hand: use lookup table
  const defaultRoute = THREE_DART_CHECKOUTS[score];
  if (defaultRoute && defaultRoute.length > 0) {
    return buildSuggestion(score, 3, defaultRoute, defaultRoute.join(' → '));
  }

  return null;
}
