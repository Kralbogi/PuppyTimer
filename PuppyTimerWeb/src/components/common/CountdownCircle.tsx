import React from "react";

interface CountdownCircleProps {
  remaining: number;
  total: number;
  color: string;
  size?: number;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const CountdownCircle: React.FC<CountdownCircleProps> = ({
  remaining,
  total,
  color,
  size = 120,
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.max(0, 1 - remaining / total) : 0;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;
  const isExpired = remaining <= 0;
  const fontSize = size * 0.16;

  return (
    <div
      className="relative inline-flex items-center justify-center soft-shadow glow-primary"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
        {/* Foreground progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="smooth-transition"
        />
      </svg>
      {/* Center time text */}
      <span
        className="absolute font-semibold font-mono text-gradient"
        style={{
          fontSize,
          color: isExpired ? 'var(--color-error)' : 'currentColor',
        }}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
};

export default CountdownCircle;
