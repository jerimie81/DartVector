'use client';

import React, { useRef, useState, useMemo } from 'react';
import {
  DARTBOARD_SECTORS,
  REGULATION_DIMENSIONS_MM,
  getSectorCentralAngle,
  describeArc,
  coordinatesToDart,
  polarToCartesian,
} from '@/lib/dartboard-geometry';
import { DartThrow } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveDartboardProps {
  onThrowDart?: (dart: DartThrow) => void;
  currentTurnDarts?: DartThrow[];
  highlightTarget?: string; // e.g. "T20", "D16", "D-BULL"
  historicalThrows?: DartThrow[];
  showHeatmap?: boolean;
  interactive?: boolean;
  className?: string;
  zoomTarget?: string;
}

export const InteractiveDartboard: React.FC<InteractiveDartboardProps> = ({
  onThrowDart,
  currentTurnDarts = [],
  highlightTarget,
  historicalThrows = [],
  showHeatmap = false,
  interactive = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverSegment, setHoverSegment] = useState<string | null>(null);
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);

  const dims = REGULATION_DIMENSIONS_MM;
  const viewBoxSize = dims.BOARD_TOTAL_RADIUS * 2 + 10; // ~460
  const center = viewBoxSize / 2; // ~230

  // Handle board click and translate to board mm coordinates
  const handleBoardClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onThrowDart || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scale = viewBoxSize / rect.width;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgX = clientX * scale;
    const svgY = clientY * scale;

    // Convert SVG coords to Board mm (center is 0,0)
    const boardX = svgX - center;
    const boardY = svgY - center;

    const result = coordinatesToDart(boardX, boardY);
    setLastClickPos({ x: svgX, y: svgY });

    onThrowDart({
      segment: result.segment,
      multiplier: result.multiplier,
      score: result.score,
      label: result.label,
      x: Math.round(boardX * 10) / 10,
      y: Math.round(boardY * 10) / 10,
      radius: Math.round(result.radius * 10) / 10,
      angleDeg: Math.round(result.angleDeg * 10) / 10,
    });
  };

  // Convert board (x, y) in mm to SVG pixel coordinates
  const boardToSvg = (x: number, y: number) => ({
    x: center + x,
    y: center + y,
  });

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Target Recommendation Badge */}
      {highlightTarget && (
        <div className="absolute top-2 z-20 px-3 py-1 bg-amber-500 text-black text-xs font-black uppercase tracking-wider rounded-full shadow-lg border border-amber-300 animate-pulse">
          Aim: {highlightTarget}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className={`w-full max-w-[460px] h-auto drop-shadow-2xl transition-transform ${
          interactive ? 'cursor-crosshair active:scale-[0.99]' : ''
        }`}
        onClick={handleBoardClick}
      >
        <defs>
          {/* Gradients for board depth */}
          <radialGradient id="boardDepthGrad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#121316" />
            <stop offset="95%" stopColor="#0a0a0c" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Wire metallic shadow */}
          <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.8" />
          </filter>

          {/* Target highlight pulse */}
          <filter id="targetPulse" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 1   0 1 0 0 0.8   0 0 1 0 0   0 0 0 2 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Number Ring Background */}
        <circle
          cx={center}
          cy={center}
          r={dims.BOARD_TOTAL_RADIUS}
          fill="url(#boardDepthGrad)"
          stroke="#33373B"
          strokeWidth="3"
        />

        {/* Double Bed Outer Wire Boundary */}
        <circle
          cx={center}
          cy={center}
          r={dims.DOUBLE_OUTER_RADIUS}
          fill="#16181B"
          stroke="#8E9297"
          strokeWidth="1.5"
        />

        {/* Sector Segments */}
        {DARTBOARD_SECTORS.map((seg, idx) => {
          const startAngle = -90 + idx * 18 - 9;
          const endAngle = -90 + idx * 18 + 9;
          const isEvenSector = idx % 2 === 0;

          const singleColor = isEvenSector ? '#1E2022' : '#F4EAD4';
          const singleTextColor = isEvenSector ? '#F4EAD4' : '#1E2022';
          const doubleTrebleColor = isEvenSector ? '#E51837' : '#00843D';

          const isTargetTreble = highlightTarget === `T${seg}`;
          const isTargetDouble = highlightTarget === `D${seg}`;
          const isTargetSingle = highlightTarget === `S${seg}` || highlightTarget === `${seg}`;

          // Paths for 4 segments in sector
          const outerSinglePath = describeArc(
            center,
            center,
            dims.TRIPLE_OUTER_RADIUS,
            dims.DOUBLE_INNER_RADIUS,
            startAngle,
            endAngle
          );
          const innerSinglePath = describeArc(
            center,
            center,
            dims.SINGLE_BULL_RADIUS,
            dims.TRIPLE_INNER_RADIUS,
            startAngle,
            endAngle
          );
          const treblePath = describeArc(
            center,
            center,
            dims.TRIPLE_INNER_RADIUS,
            dims.TRIPLE_OUTER_RADIUS,
            startAngle,
            endAngle
          );
          const doublePath = describeArc(
            center,
            center,
            dims.DOUBLE_INNER_RADIUS,
            dims.DOUBLE_OUTER_RADIUS,
            startAngle,
            endAngle
          );

          // Number Position on outer ring
          const numberAngle = -90 + idx * 18;
          const numberPos = polarToCartesian(198, numberAngle);

          return (
            <g key={`sector-${seg}`}>
              {/* Outer Single Bed */}
              <path
                d={outerSinglePath}
                fill={singleColor}
                stroke="#6B7280"
                strokeWidth="0.8"
                className={`transition-colors duration-150 ${
                  isTargetSingle ? 'fill-amber-400/80 animate-pulse' : ''
                } hover:opacity-90`}
              />

              {/* Inner Single Bed */}
              <path
                d={innerSinglePath}
                fill={singleColor}
                stroke="#6B7280"
                strokeWidth="0.8"
                className={`transition-colors duration-150 ${
                  isTargetSingle ? 'fill-amber-400/80 animate-pulse' : ''
                } hover:opacity-90`}
              />

              {/* Treble Ring Bed */}
              <path
                d={treblePath}
                fill={doubleTrebleColor}
                stroke="#D1D5DB"
                strokeWidth="1.2"
                filter={isTargetTreble ? 'url(#targetPulse)' : undefined}
                className={`transition-all duration-200 ${
                  isTargetTreble
                    ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
                    : 'hover:brightness-125'
                }`}
              />

              {/* Double Ring Bed */}
              <path
                d={doublePath}
                fill={doubleTrebleColor}
                stroke="#D1D5DB"
                strokeWidth="1.2"
                filter={isTargetDouble ? 'url(#targetPulse)' : undefined}
                className={`transition-all duration-200 ${
                  isTargetDouble
                    ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
                    : 'hover:brightness-125'
                }`}
              />

              {/* Number on Ring */}
              <text
                x={Math.round((center + numberPos.x) * 100) / 100}
                y={Math.round((center + numberPos.y + 7) * 100) / 100}
                fill="#FAFAFA"
                fontSize="20"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                className="select-none pointer-events-none drop-shadow-md"
              >
                {seg}
              </text>
            </g>
          );
        })}

        {/* Outer Bull (25 - Green) */}
        <circle
          cx={center}
          cy={center}
          r={dims.SINGLE_BULL_RADIUS}
          fill="#00843D"
          stroke="#E5E7EB"
          strokeWidth="1.2"
          className={`transition-all duration-200 ${
            highlightTarget === 'BULL' || highlightTarget === '25'
              ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
              : 'hover:brightness-125'
          }`}
        />

        {/* Double Bull (50 - Red) */}
        <circle
          cx={center}
          cy={center}
          r={dims.DOUBLE_BULL_RADIUS}
          fill="#E51837"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          className={`transition-all duration-200 ${
            highlightTarget === 'D-BULL' || highlightTarget === '50'
              ? 'fill-amber-400 stroke-amber-200 stroke-2 animate-pulse'
              : 'hover:brightness-125'
          }`}
        />

        {/* Central Spider Hub Wire */}
        <circle
          cx={center}
          cy={center}
          r="1.5"
          fill="#D1D5DB"
        />

        {/* Historical Heatmap Layer */}
        {showHeatmap && historicalThrows.length > 0 && (
          <g className="pointer-events-none opacity-75">
            {historicalThrows.map((t, idx) => {
              if (t.x === undefined || t.y === undefined) return null;
              const pos = boardToSvg(t.x, t.y);
              return (
                <circle
                  key={`heat-${idx}`}
                  cx={pos.x}
                  cy={pos.y}
                  r="8"
                  fill="rgba(239, 68, 68, 0.45)"
                  filter="blur(3px)"
                />
              );
            })}
          </g>
        )}

        {/* Real-time Visual Darts Thrown in Current Turn */}
        {currentTurnDarts.map((dart, idx) => {
          if (dart.x === undefined || dart.y === undefined) return null;
          const pos = boardToSvg(dart.x, dart.y);
          const dartColors = ['#EF4444', '#3B82F6', '#10B981'];
          const color = dartColors[idx % dartColors.length];

          return (
            <g key={`dart-${idx}`} className="pointer-events-none">
              {/* Drop shadow of dart flight */}
              <ellipse
                cx={pos.x + 3}
                cy={pos.y + 4}
                rx="6"
                ry="3"
                fill="rgba(0, 0, 0, 0.5)"
              />

              {/* Dart Tip Pinpoint */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="3"
                fill="#FFFFFF"
                stroke="#111827"
                strokeWidth="1"
              />

              {/* Dart Flight Badge */}
              <g transform={`translate(${pos.x + 4}, ${pos.y - 14})`}>
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="14"
                  rx="3"
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  className="drop-shadow-md"
                />
                <text
                  x="9"
                  y="10.5"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {idx + 1}
                </text>
              </g>

              {/* Score Label callout */}
              <text
                x={pos.x}
                y={pos.y - 18}
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
                textAnchor="middle"
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              >
                {dart.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
