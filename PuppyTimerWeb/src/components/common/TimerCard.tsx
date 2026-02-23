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
      className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-md border"
      style={{ borderColor: `${color}4D` }}
    >
      <CountdownCircle
        remaining={remaining}
        total={total}
        color={color}
        size={120}
      />

      <span className="text-base font-semibold text-gray-500">{title}</span>

      {subtitle && (
        <span className="text-sm text-gray-400">{subtitle}</span>
      )}

      {isExpired && (
        <span className="text-sm font-semibold text-red-500">
          Vakit geldi!
        </span>
      )}

      <button
        type="button"
        onClick={onComplete}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-medium transition-colors"
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
