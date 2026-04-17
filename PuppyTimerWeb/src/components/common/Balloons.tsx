import { useEffect, useState } from "react";

interface BalloonsProps {
  onComplete?: () => void;
}

const Balloons: React.FC<BalloonsProps> = ({ onComplete }) => {
  // Scoped CSS ID pattern (like AnimatedDog.tsx) to prevent animation conflicts
  const [sid] = useState(() => "bl" + Math.random().toString(36).slice(2, 8));

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const balloons = [
    { color: "#ef4444", left: "15%", delay: "0s", duration: "5s", drift: "30px", rotate: "15deg" },
    { color: "#3b82f6", left: "30%", delay: "0.1s", duration: "5.2s", drift: "-20px", rotate: "-12deg" },
    { color: "#fbbf24", left: "45%", delay: "0.2s", duration: "4.8s", drift: "25px", rotate: "10deg" },
    { color: "#10b981", left: "60%", delay: "0.3s", duration: "5.3s", drift: "-25px", rotate: "-15deg" },
    { color: "#ec4899", left: "75%", delay: "0.4s", duration: "4.9s", drift: "20px", rotate: "12deg" },
    { color: "#f97316", left: "85%", delay: "0.5s", duration: "5.1s", drift: "-15px", rotate: "-10deg" },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <style>{`
        @keyframes ${sid}-float-1 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(30px) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-float-2 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(-20px) rotate(-12deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-float-3 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(25px) rotate(10deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-float-4 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(-25px) rotate(-15deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-float-5 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(20px) rotate(12deg);
            opacity: 0;
          }
        }

        @keyframes ${sid}-float-6 {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) translateX(-15px) rotate(-10deg);
            opacity: 0;
          }
        }

        .${sid}-balloon {
          position: absolute;
          bottom: 0;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          will-change: transform;
        }
      `}</style>

      {balloons.map((balloon, index) => (
        <div
          key={index}
          className={`${sid}-balloon`}
          style={{
            left: balloon.left,
            animation: `${sid}-float-${index + 1} ${balloon.duration} ease-out ${balloon.delay}`,
          }}
        >
          <svg width="50" height="70" viewBox="0 0 50 70">
            {/* Balloon body */}
            <ellipse
              cx="25"
              cy="25"
              rx="20"
              ry="25"
              fill={balloon.color}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
            {/* Shine effect */}
            <ellipse
              cx="18"
              cy="18"
              rx="6"
              ry="8"
              fill="rgba(255,255,255,0.4)"
            />
            {/* String */}
            <line
              x1="25"
              y1="50"
              x2="25"
              y2="70"
              stroke="#666"
              strokeWidth="1"
            />
          </svg>
        </div>
      ))}
    </div>
  );
};

export default Balloons;
