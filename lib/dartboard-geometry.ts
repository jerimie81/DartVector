// DartMaster Pro - Dartboard Geometry & Physics Engine

export const DARTBOARD_SECTORS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5
] as const;

export const REGULATION_DIMENSIONS_MM = {
  DOUBLE_BULL_RADIUS: 6.35,
  SINGLE_BULL_RADIUS: 15.9,
  TRIPLE_INNER_RADIUS: 97.0,
  TRIPLE_OUTER_RADIUS: 107.0,
  DOUBLE_INNER_RADIUS: 162.0,
  DOUBLE_OUTER_RADIUS: 170.0,
  BOARD_TOTAL_RADIUS: 225.0, // includes number ring
  WIRE_WIDTH: 1.2,
};

// Map each sector number to its central angle in degrees (-90 deg is straight UP at 12 o'clock)
export function getSectorCentralAngle(segment: number): number {
  const index = DARTBOARD_SECTORS.indexOf(segment as any);
  if (index === -1) return 0;
  // 20 is at index 0 -> angle -90 deg
  // angle steps by +18 deg per sector clockwise
  let angle = -90 + index * 18;
  if (angle > 180) angle -= 360;
  return angle;
}

// Convert Polar (radius mm, angle degrees) to Cartesian (x, y mm)
export function polarToCartesian(radiusMm: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(radiusMm * Math.cos(angleRad) * 100) / 100,
    y: Math.round(radiusMm * Math.sin(angleRad) * 100) / 100,
  };
}

// Convert Cartesian (x, y mm) to Polar (radius mm, angle degrees)
export function cartesianToPolar(x: number, y: number): { radius: number; angleDeg: number } {
  const radius = Math.sqrt(x * x + y * y);
  let angleDeg = (Math.atan2(y, x) * 180) / Math.PI; // -180 to 180
  return { radius, angleDeg };
}

// Determine Segment from angle
export function getSegmentFromAngle(angleDeg: number): number {
  // Normalize angle relative to 20's center (-90 deg)
  // 20 is from -99 to -81 deg
  let normalized = angleDeg + 90; // now 20's center is at 0 deg
  while (normalized < -9) normalized += 360;
  while (normalized >= 351) normalized -= 360;

  // Sector index (0 = 20, 1 = 1, 2 = 18...)
  const sectorIndex = Math.floor((normalized + 9) / 18) % 20;
  return DARTBOARD_SECTORS[sectorIndex];
}

// Parse (x,y) coordinates to exact Dart Throw Result
export function coordinatesToDart(x: number, y: number): {
  segment: number;
  multiplier: 0 | 1 | 2 | 3;
  score: number;
  label: string;
  isWireHit: boolean;
  radius: number;
  angleDeg: number;
} {
  const { radius, angleDeg } = cartesianToPolar(x, y);
  const dims = REGULATION_DIMENSIONS_MM;

  // Check double bull (50)
  if (radius <= dims.DOUBLE_BULL_RADIUS) {
    const isWireHit = Math.abs(radius - dims.DOUBLE_BULL_RADIUS) < 0.6;
    return {
      segment: 50,
      multiplier: 2,
      score: 50,
      label: 'D-BULL',
      isWireHit,
      radius,
      angleDeg,
    };
  }

  // Check single bull (25)
  if (radius <= dims.SINGLE_BULL_RADIUS) {
    const isWireHit = Math.abs(radius - dims.SINGLE_BULL_RADIUS) < 0.6;
    return {
      segment: 25,
      multiplier: 1,
      score: 25,
      label: 'BULL',
      isWireHit,
      radius,
      angleDeg,
    };
  }

  // Check out of bounds (Miss)
  if (radius > dims.DOUBLE_OUTER_RADIUS) {
    return {
      segment: 0,
      multiplier: 0,
      score: 0,
      label: 'MISS',
      isWireHit: false,
      radius,
      angleDeg,
    };
  }

  const segment = getSegmentFromAngle(angleDeg);

  // Check Triple Ring (97mm to 107mm)
  if (radius >= dims.TRIPLE_INNER_RADIUS && radius <= dims.TRIPLE_OUTER_RADIUS) {
    const isWireHit = Math.min(
      Math.abs(radius - dims.TRIPLE_INNER_RADIUS),
      Math.abs(radius - dims.TRIPLE_OUTER_RADIUS)
    ) < 0.7;
    return {
      segment,
      multiplier: 3,
      score: segment * 3,
      label: `T${segment}`,
      isWireHit,
      radius,
      angleDeg,
    };
  }

  // Check Double Ring (162mm to 170mm)
  if (radius >= dims.DOUBLE_INNER_RADIUS && radius <= dims.DOUBLE_OUTER_RADIUS) {
    const isWireHit = Math.min(
      Math.abs(radius - dims.DOUBLE_INNER_RADIUS),
      Math.abs(radius - dims.DOUBLE_OUTER_RADIUS)
    ) < 0.7;
    return {
      segment,
      multiplier: 2,
      score: segment * 2,
      label: `D${segment}`,
      isWireHit,
      radius,
      angleDeg,
    };
  }

  // Single Ring (Inner single or Outer single)
  return {
    segment,
    multiplier: 1,
    score: segment,
    label: `S${segment}`,
    isWireHit: false,
    radius,
    angleDeg,
  };
}

// Get the ideal physical target coordinates (x, y in mm) for a target string or segment/multiplier
export function getIdealTargetCoords(
  target: string | { segment: number; multiplier: number } | number,
  multArg?: number
): { x: number; y: number } {
  let seg = 20;
  let mult = 1;

  if (typeof target === 'number') {
    seg = target;
    mult = multArg || 1;
  } else if (typeof target === 'string') {
    const upper = target.toUpperCase().trim();
    if (upper === 'BULL' || upper === '25' || upper === 'S25') {
      seg = 25;
      mult = 1;
    } else if (upper === 'D-BULL' || upper === 'DBULL' || upper === '50' || upper === 'D25') {
      seg = 50;
      mult = 2;
    } else if (upper.startsWith('T')) {
      mult = 3;
      seg = parseInt(upper.slice(1), 10) || 20;
    } else if (upper.startsWith('D')) {
      mult = 2;
      seg = parseInt(upper.slice(1), 10) || 20;
    } else if (upper.startsWith('S')) {
      mult = 1;
      seg = parseInt(upper.slice(1), 10) || 20;
    } else {
      seg = parseInt(upper, 10) || 20;
      mult = 1;
    }
  } else {
    seg = target.segment;
    mult = target.multiplier;
  }

  if (seg === 50 || (seg === 25 && mult === 2)) {
    return { x: 0, y: 0 };
  }
  if (seg === 25 && mult === 1) {
    return polarToCartesian(11.0, 0); // slightly off center in single bull
  }

  const angle = getSectorCentralAngle(seg);
  let radius = 135; // default outer single

  if (mult === 3) {
    radius = 102.0; // center of treble ring (97 to 107)
  } else if (mult === 2) {
    radius = 166.0; // center of double ring (162 to 170)
  } else if (mult === 1) {
    radius = 135.0; // wide sweet spot of outer single
  }

  return polarToCartesian(radius, angle);
}

// Generate SVG arc path for segments
export function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  const round = (num: number) => Math.round(num * 100) / 100;

  const outerStartX = round(x + outerRadius * Math.cos(startRad));
  const outerStartY = round(y + outerRadius * Math.sin(startRad));
  const outerEndX = round(x + outerRadius * Math.cos(endRad));
  const outerEndY = round(y + outerRadius * Math.sin(endRad));
  const innerStartX = round(x + innerRadius * Math.cos(endRad));
  const innerStartY = round(y + innerRadius * Math.sin(endRad));
  const innerEndX = round(x + innerRadius * Math.cos(startRad));
  const innerEndY = round(y + innerRadius * Math.sin(startRad));

  const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? 0 : 1;

  return [
    'M', outerStartX, outerStartY,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, outerEndX, outerEndY,
    'L', innerStartX, innerStartY,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, innerEndX, innerEndY,
    'Z'
  ].join(' ');
}
