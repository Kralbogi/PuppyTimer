import { useEffect, useState } from "react";

interface ConfettiProps {
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#fbbf24", // yellow
  "#10b981", // green
  "#ec4899", // pink
  "#f97316", // orange
  "#8b5cf6", // purple
];

const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  // Scoped CSS ID pattern to prevent animation conflicts
  const [sid] = useState(() => "cf" + Math.random().toString(36).slice(2, 8));

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate 25 confetti pieces
  const pieces = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`, // Pseudo-random distribution
    top: `-${10 + (i % 3) * 5}px`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationType: (i % 3) + 1, // Rotate between 3 animation types
    duration: `${4 + (i % 10) * 0.2}s`,
    delay: `${i * 0.05}s`,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      <style>{`
        @keyframes ${sid}-fall-1 {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-fall-2 {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(-360deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-fall-3 {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(180deg);
            opacity: 0;
          }
        }

        .${sid}-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          animation-timing-function: ease-in;
          animation-fill-mode: forwards;
          will-change: transform;
        }
      `}</style>

      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`${sid}-piece`}
          style={{
            left: piece.left,
            top: piece.top,
            backgroundColor: piece.color,
            animation: `${sid}-fall-${piece.animationType} ${piece.duration} ease-in ${piece.delay}`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
