import React from "react";

interface SpeedometerProps {
  speed: number; // km/h
  isAcquiring?: boolean;
}

const MAX_SPEED = 200;
const START_ANGLE = -225; // degrees from top
const SWEEP = 270; // total sweep degrees

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function Speedometer({ speed, isAcquiring = false }: SpeedometerProps) {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const trackR = 82;

  // Clamp speed
  const clampedSpeed = Math.max(0, Math.min(MAX_SPEED, speed));
  const fraction = clampedSpeed / MAX_SPEED;

  // Angle math
  const arcStart = START_ANGLE; // -225
  const arcEnd = arcStart + SWEEP; // 45

  const needleAngle = arcStart + fraction * SWEEP;

  // Needle endpoint
  const needleTip = polarToXY(cx, cy, r - 14, needleAngle);
  const needleBase1 = polarToXY(cx, cy, 8, needleAngle + 90);
  const needleBase2 = polarToXY(cx, cy, 8, needleAngle - 90);

  // Color based on speed
  const speedColor =
    clampedSpeed < 60
      ? "oklch(0.72 0.2 145)"
      : clampedSpeed < 120
        ? "oklch(0.78 0.18 75)"
        : "oklch(0.65 0.24 25)";

  // Tick marks
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const val = i * 10;
    const angle = arcStart + (val / MAX_SPEED) * SWEEP;
    const inner = i % 5 === 0 ? r - 14 : r - 8;
    const outer = r - 2;
    const p1 = polarToXY(cx, cy, inner, angle);
    const p2 = polarToXY(cx, cy, outer, angle);
    return { p1, p2, isMajor: i % 5 === 0, val, angle };
  });

  // Speed segments (colored arc)
  const progressEnd = arcStart + fraction * SWEEP;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 200 200"
        width="200"
        height="200"
        className="overflow-visible"
        aria-label={`Speedometer showing ${Math.round(clampedSpeed)} km/h`}
        role="img"
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="oklch(0.09 0.012 265)"
          stroke="oklch(0.25 0.03 250 / 0.5)"
          strokeWidth="1"
        />

        {/* Track arc */}
        <path
          d={describeArc(cx, cy, trackR, arcStart, arcEnd)}
          fill="none"
          stroke="oklch(0.2 0.02 255)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        {!isAcquiring && fraction > 0 && (
          <path
            d={describeArc(cx, cy, trackR, arcStart, progressEnd)}
            fill="none"
            stroke={speedColor}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${speedColor})`,
              transition: "d 0.5s ease",
            }}
          />
        )}

        {/* Tick marks */}
        {ticks.map((tick) => (
          <g key={tick.val}>
            <line
              x1={tick.p1.x}
              y1={tick.p1.y}
              x2={tick.p2.x}
              y2={tick.p2.y}
              stroke={
                tick.isMajor ? "oklch(0.6 0.02 240)" : "oklch(0.35 0.02 250)"
              }
              strokeWidth={tick.isMajor ? 2 : 1}
            />
            {tick.isMajor && tick.val % 40 === 0 && (
              <text
                x={polarToXY(cx, cy, r - 24, tick.angle).x}
                y={polarToXY(cx, cy, r - 24, tick.angle).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="oklch(0.5 0.02 240)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {tick.val}
              </text>
            )}
          </g>
        ))}

        {/* Needle */}
        {!isAcquiring && (
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
            fill={speedColor}
            opacity={0.9}
            style={{
              filter: `drop-shadow(0 0 4px ${speedColor})`,
              transition: "all 0.5s ease",
            }}
          />
        )}

        {/* Center cap */}
        <circle cx={cx} cy={cy} r={8} fill="oklch(0.25 0.03 250)" />
        <circle cx={cx} cy={cy} r={4} fill={speedColor} />

        {/* Speed text */}
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isAcquiring ? "oklch(0.5 0.02 240)" : "oklch(0.95 0.01 220)"}
          fontSize="22"
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
          style={{
            filter: isAcquiring ? "none" : `drop-shadow(0 0 6px ${speedColor})`,
          }}
        >
          {isAcquiring ? "---" : Math.round(clampedSpeed)}
        </text>
        <text
          x={cx}
          y={cy + 36}
          textAnchor="middle"
          fill="oklch(0.5 0.02 240)"
          fontSize="7.5"
          fontFamily="Rajdhani, sans-serif"
          letterSpacing="2"
        >
          {isAcquiring ? "GPS ACQUIRING" : "KM/H"}
        </text>
      </svg>
    </div>
  );
}
