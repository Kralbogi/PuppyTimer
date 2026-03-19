import React from "react";
import CountdownCircle from "./CountdownCircle";

interface TimerCardProps {
  title: string;
  remaining: number;
  total: number;
  color: string;
  onComplete: () => void;
  subtitle?: string;
}

const TimerCard: React.FC<TimerCardProps> = ({
  title,
  remaining,
  total,
  color,
  onComplete,
  subtitle,
}) => {
  const isExpired = remaining <= 0;

  return (
    <div
      className="flex flex-col items-center gap-3 p-5 bg-white/75 rounded-2xl soft-shadow-lg border smooth-transition card-hover-lift"
      style={{ borderColor: `${color}32` }}
    >
      <CountdownCircle
        remaining={remaining}
        total={total}
        color={color}
        size={120}
      />

      <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{title}</span>

      {subtitle && (
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</span>
      )}

      {isExpired && (
        <span className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
          Vakit geldi!
        </span>
      )}

      <button
        type="button"
        onClick={onComplete}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-medium smooth-transition hover:shadow-lg active:scale-95"
        style={{ backgroundColor: color }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Tamamlandı
      </button>
    </div>
  );
};

export default TimerCard;
