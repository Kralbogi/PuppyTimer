// =============================================================================
// PuppyTimer Web - AnimatedDog
// Irka gore animasyonlu SVG kopek karakteri
// Tiklandiginda kuyruk sallar, ayaga kalkar, dil cikarir
// =============================================================================

import React, { useState, useCallback, useEffect, useRef } from "react";

// =============================================================================
// Types
// =============================================================================

export type EarShape = "floppy" | "pointed" | "round";
export type TailShape = "bushy" | "curled" | "short" | "pom" | "straight";

export interface DogVisuals {
  earShape: EarShape;
  tailShape: TailShape;
  primary: string;
  secondary: string;
  belly: string;
  stocky: boolean;
  curly: boolean;
  small: boolean;
}

// =============================================================================
// Breed → Visual Style Mapping
// =============================================================================

const breedMap: [RegExp, Partial<DogVisuals>][] = [
  // Retrievers & Spaniels (floppy ears, bushy tail)
  [/golden retriever/i, { earShape: "floppy", tailShape: "bushy", primary: "#D4A55A", secondary: "#B8893E", belly: "#F0D89A" }],
  [/labrador/i, { earShape: "floppy", tailShape: "straight", primary: "#D4A55A", secondary: "#B8893E", belly: "#F0D89A" }],
  [/cocker spaniel/i, { earShape: "floppy", tailShape: "bushy", primary: "#8B4513", secondary: "#5C2E0A", belly: "#D4A55A" }],
  [/springer/i, { earShape: "floppy", tailShape: "bushy", primary: "#5C2E0A", secondary: "#3B1A06", belly: "#F5F5DC" }],
  [/cavalier/i, { earShape: "floppy", tailShape: "bushy", primary: "#8B4513", secondary: "#5C2E0A", belly: "#F5F5DC" }],
  [/retriever/i, { earShape: "floppy", tailShape: "bushy", primary: "#C49347", secondary: "#A07830", belly: "#E8CC8B" }],
  [/spaniel/i, { earShape: "floppy", tailShape: "bushy", primary: "#8B4513", secondary: "#5C2E0A", belly: "#D4A55A" }],
  [/setter/i, { earShape: "floppy", tailShape: "bushy", primary: "#8B4513", secondary: "#5C2E0A", belly: "#C49347" }],

  // Hounds (floppy ears)
  [/beagle/i, { earShape: "floppy", tailShape: "straight", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC" }],
  [/basset/i, { earShape: "floppy", tailShape: "straight", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC" }],
  [/bloodhound/i, { earShape: "floppy", tailShape: "straight", primary: "#8B4513", secondary: "#5C2E0A", belly: "#C49347" }],
  [/dachshund/i, { earShape: "floppy", tailShape: "straight", primary: "#8B4513", secondary: "#5C2E0A", belly: "#C49347" }],

  // Large floppy ear breeds
  [/great dane/i, { earShape: "floppy", tailShape: "straight", primary: "#D4A55A", secondary: "#8B6914", belly: "#F0D89A" }],
  [/saint bernard/i, { earShape: "floppy", tailShape: "bushy", primary: "#8B4513", secondary: "#5C2E0A", belly: "#F5F5DC" }],
  [/bernese/i, { earShape: "floppy", tailShape: "bushy", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#C49347" }],
  [/newfoundland/i, { earShape: "floppy", tailShape: "bushy", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#404040" }],
  [/great pyrenees/i, { earShape: "floppy", tailShape: "bushy", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF" }],
  [/dalmatian/i, { earShape: "floppy", tailShape: "straight", primary: "#F5F0E8", secondary: "#2D2D2D", belly: "#FFFFFF" }],
  [/weimaraner/i, { earShape: "floppy", tailShape: "straight", primary: "#808B96", secondary: "#5D6D7E", belly: "#ADB5BD" }],
  [/vizsla/i, { earShape: "floppy", tailShape: "straight", primary: "#C49347", secondary: "#A07830", belly: "#D4A55A" }],

  // Shepherds (pointed ears, bushy tail)
  [/german shepherd/i, { earShape: "pointed", tailShape: "bushy", primary: "#8B6914", secondary: "#2D1F0E", belly: "#D4A55A" }],
  [/malinois/i, { earShape: "pointed", tailShape: "bushy", primary: "#C49347", secondary: "#2D1F0E", belly: "#D4A55A" }],
  [/belgian/i, { earShape: "pointed", tailShape: "bushy", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#5A5A5A" }],
  [/dutch shepherd/i, { earShape: "pointed", tailShape: "bushy", primary: "#7A6838", secondary: "#4A3A18", belly: "#C49347" }],
  [/border collie/i, { earShape: "pointed", tailShape: "bushy", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#F5F5F5" }],
  [/australian shepherd/i, { earShape: "floppy", tailShape: "bushy", primary: "#4A4A6A", secondary: "#2D2D4A", belly: "#C49347" }],
  [/shepherd/i, { earShape: "pointed", tailShape: "bushy", primary: "#8B6914", secondary: "#2D1F0E", belly: "#D4A55A" }],
  [/collie/i, { earShape: "pointed", tailShape: "bushy", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC" }],

  // Spitz types (pointed ears, curled tail)
  [/husky/i, { earShape: "pointed", tailShape: "curled", primary: "#808B96", secondary: "#2C3E50", belly: "#F5F5F5" }],
  [/akita/i, { earShape: "pointed", tailShape: "curled", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC" }],
  [/shiba/i, { earShape: "pointed", tailShape: "curled", primary: "#D4722A", secondary: "#A0522D", belly: "#F5F5DC" }],
  [/malamute/i, { earShape: "pointed", tailShape: "curled", primary: "#808B96", secondary: "#2C3E50", belly: "#F5F5F5" }],
  [/samoyed/i, { earShape: "pointed", tailShape: "curled", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF" }],
  [/pomeranian/i, { earShape: "pointed", tailShape: "curled", primary: "#D4722A", secondary: "#B8611A", belly: "#F0D89A" }],
  [/chow/i, { earShape: "pointed", tailShape: "curled", primary: "#C49347", secondary: "#A07830", belly: "#D4A55A" }],
  [/spitz/i, { earShape: "pointed", tailShape: "curled", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF" }],

  // Stocky breeds (round ears, short tail)
  [/french bulldog/i, { earShape: "pointed", tailShape: "short", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#F5F5DC", stocky: true }],
  [/bulldog/i, { earShape: "round", tailShape: "short", primary: "#C49347", secondary: "#A07830", belly: "#F5F5DC", stocky: true }],
  [/pug/i, { earShape: "round", tailShape: "curled", primary: "#D4A55A", secondary: "#8B6914", belly: "#F0D89A", stocky: true }],
  [/boston terrier/i, { earShape: "pointed", tailShape: "short", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#F5F5F5", stocky: true }],
  [/boxer/i, { earShape: "floppy", tailShape: "short", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC", stocky: true }],
  [/mastiff/i, { earShape: "floppy", tailShape: "straight", primary: "#C49347", secondary: "#8B6914", belly: "#D4A55A", stocky: true }],
  [/rottweiler/i, { earShape: "floppy", tailShape: "short", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#8B4513", stocky: true }],
  [/bull terrier/i, { earShape: "pointed", tailShape: "straight", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF", stocky: true }],
  [/staffordshire/i, { earShape: "round", tailShape: "straight", primary: "#808B96", secondary: "#5D6D7E", belly: "#C0C0C0", stocky: true }],
  [/pit\s?bull/i, { earShape: "round", tailShape: "straight", primary: "#C49347", secondary: "#8B4513", belly: "#D4A55A", stocky: true }],
  [/american bully/i, { earShape: "round", tailShape: "short", primary: "#808B96", secondary: "#5D6D7E", belly: "#C0C0C0", stocky: true }],
  [/cane corso/i, { earShape: "floppy", tailShape: "straight", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#4A4A4A", stocky: true }],

  // Small / Terrier breeds
  [/chihuahua/i, { earShape: "pointed", tailShape: "curled", primary: "#D4A55A", secondary: "#C49347", belly: "#F0D89A", small: true }],
  [/yorkshire/i, { earShape: "pointed", tailShape: "straight", primary: "#8B6914", secondary: "#5C4A0A", belly: "#C49347", small: true }],
  [/jack russell/i, { earShape: "floppy", tailShape: "straight", primary: "#F5F0E8", secondary: "#C49347", belly: "#FFFFFF", small: true }],
  [/schnauzer/i, { earShape: "floppy", tailShape: "straight", primary: "#808B96", secondary: "#5D6D7E", belly: "#ADB5BD", small: true }],
  [/west highland/i, { earShape: "pointed", tailShape: "straight", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF", small: true }],
  [/scottish terrier/i, { earShape: "pointed", tailShape: "straight", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#404040", small: true }],
  [/shih tzu/i, { earShape: "floppy", tailShape: "curled", primary: "#C49347", secondary: "#8B4513", belly: "#F5F5DC", small: true, curly: true }],
  [/maltese/i, { earShape: "floppy", tailShape: "curled", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF", small: true }],
  [/papillon/i, { earShape: "pointed", tailShape: "bushy", primary: "#F5F0E8", secondary: "#C49347", belly: "#FFFFFF", small: true }],
  [/havanese/i, { earShape: "floppy", tailShape: "curled", primary: "#C49347", secondary: "#A07830", belly: "#E8CC8B", small: true, curly: true }],
  [/terrier/i, { earShape: "pointed", tailShape: "straight", primary: "#C49347", secondary: "#8B6914", belly: "#E8CC8B", small: true }],

  // Curly / Poodle types (pom tail)
  [/poodle/i, { earShape: "floppy", tailShape: "pom", primary: "#F5F0E8", secondary: "#D0C8B8", belly: "#FFFFFF", curly: true }],
  [/bichon/i, { earShape: "floppy", tailShape: "pom", primary: "#F5F0E8", secondary: "#E0D8C8", belly: "#FFFFFF", curly: true, small: true }],
  [/goldendoodle/i, { earShape: "floppy", tailShape: "pom", primary: "#D4A55A", secondary: "#B8893E", belly: "#F0D89A", curly: true }],
  [/labradoodle/i, { earShape: "floppy", tailShape: "pom", primary: "#C49347", secondary: "#A07830", belly: "#E8CC8B", curly: true }],
  [/cockapoo/i, { earShape: "floppy", tailShape: "pom", primary: "#C49347", secondary: "#A07830", belly: "#E8CC8B", curly: true, small: true }],

  // Doberman / Pointed + sleek
  [/doberman/i, { earShape: "pointed", tailShape: "short", primary: "#2D2D2D", secondary: "#1A1A1A", belly: "#8B4513" }],

  // Corgi special case
  [/corgi/i, { earShape: "pointed", tailShape: "short", primary: "#D4722A", secondary: "#B8611A", belly: "#F5F5DC" }],
];

const defaultVisuals: DogVisuals = {
  earShape: "floppy",
  tailShape: "straight",
  primary: "#C49347",
  secondary: "#A07830",
  belly: "#E8CC8B",
  stocky: false,
  curly: false,
  small: false,
};

export function getVisuals(irk: string): DogVisuals {
  for (const [pattern, overrides] of breedMap) {
    if (pattern.test(irk)) {
      return { ...defaultVisuals, ...overrides };
    }
  }
  return defaultVisuals;
}

// =============================================================================
// Sub-components: Ears
// =============================================================================

function Ears({
  shape,
  secondary,
  headY,
}: {
  shape: EarShape;
  secondary: string;
  headY: number;
}) {
  const baseY = headY - 8;

  switch (shape) {
    case "pointed":
      return (
        <g>
          <path
            d={`M${72} ${baseY + 2} L${56} ${baseY - 42} L${90} ${baseY - 12} Z`}
            fill={secondary}
          />
          <path
            d={`M${128} ${baseY + 2} L${144} ${baseY - 42} L${110} ${baseY - 12} Z`}
            fill={secondary}
          />
          <path
            d={`M${74} ${baseY - 2} L${63} ${baseY - 32} L${86} ${baseY - 12} Z`}
            fill="#FFB6C1"
            opacity={0.35}
          />
          <path
            d={`M${126} ${baseY - 2} L${137} ${baseY - 32} L${114} ${baseY - 12} Z`}
            fill="#FFB6C1"
            opacity={0.35}
          />
        </g>
      );

    case "round":
      return (
        <g>
          <circle cx={64} cy={baseY - 8} r={14} fill={secondary} />
          <circle cx={136} cy={baseY - 8} r={14} fill={secondary} />
          <circle cx={64} cy={baseY - 8} r={8} fill="#FFB6C1" opacity={0.25} />
          <circle cx={136} cy={baseY - 8} r={8} fill="#FFB6C1" opacity={0.25} />
        </g>
      );

    case "floppy":
    default:
      return (
        <g>
          <ellipse
            cx={58}
            cy={baseY + 2}
            rx={16}
            ry={26}
            fill={secondary}
            transform={`rotate(-12 58 ${baseY + 2})`}
          />
          <ellipse
            cx={142}
            cy={baseY + 2}
            rx={16}
            ry={26}
            fill={secondary}
            transform={`rotate(12 142 ${baseY + 2})`}
          />
        </g>
      );
  }
}

// =============================================================================
// Sub-components: Tail
// =============================================================================

function Tail({
  shape,
  primary,
  secondary,
}: {
  shape: TailShape;
  primary: string;
  secondary: string;
}) {
  switch (shape) {
    case "bushy":
      return (
        <g>
          <path
            d="M148 162 Q172 142 168 112 Q166 100 162 92"
            stroke={secondary}
            fill="none"
            strokeWidth={13}
            strokeLinecap="round"
          />
          <path
            d="M148 162 Q172 142 168 112 Q166 100 162 92"
            stroke={primary}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
          />
        </g>
      );

    case "curled":
      return (
        <path
          d="M145 162 Q172 138 162 110 Q155 98 148 105"
          stroke={primary}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
        />
      );

    case "short":
      return (
        <path
          d="M143 162 Q158 150 158 138"
          stroke={primary}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
        />
      );

    case "pom":
      return (
        <g>
          <path
            d="M145 162 Q165 142 162 122"
            stroke={primary}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
          />
          <circle cx={162} cy={118} r={11} fill={primary} />
          <circle cx={162} cy={118} r={7} fill={secondary} opacity={0.3} />
        </g>
      );

    case "straight":
    default:
      return (
        <path
          d="M148 162 Q168 142 165 112"
          stroke={primary}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
        />
      );
  }
}

// =============================================================================
// Main Component
// =============================================================================

interface AnimatedDogProps {
  irk: string;
  size?: number;
}

const AnimatedDog: React.FC<AnimatedDogProps> = ({ irk, size = 180 }) => {
  const [isHappy, setIsHappy] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showHav, setShowHav] = useState(false);
  const happyTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const havTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Stable CSS scope ID
  const [sid] = useState(() => "ad" + Math.random().toString(36).slice(2, 8));

  // Blink periodically
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const id = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (happyTimer.current) clearTimeout(happyTimer.current);
      if (havTimer.current) clearTimeout(havTimer.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    if (happyTimer.current) clearTimeout(happyTimer.current);
    if (havTimer.current) clearTimeout(havTimer.current);

    setIsHappy(true);
    setShowHav(true);

    havTimer.current = setTimeout(() => setShowHav(false), 800);
    happyTimer.current = setTimeout(() => setIsHappy(false), 2500);
  }, []);

  const v = getVisuals(irk);
  const { primary, secondary, belly, earShape, tailShape, stocky } = v;

  // Body proportions
  const bodyRx = stocky ? 52 : 46;
  const bodyRy = stocky ? 38 : 42;

  // Pose positions (sitting vs standing on tap)
  const headY = isHappy ? 82 : 100;
  const bodyY = isHappy ? 155 : 170;
  const legTopY = isHappy ? 188 : 200;
  const legH = isHappy ? 44 : 32;
  const pawY = isHappy ? 233 : 233;
  const tailBaseY = isHappy ? 148 : 162;
  const shadowRx = isHappy ? 48 : 52;

  const trans = "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <svg
      viewBox="0 0 200 260"
      width={size}
      height={size * 1.3}
      onClick={handleTap}
      style={{ cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent" }}
    >
      <style>{`
        @keyframes ${sid}-breathe {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(1.02) translateY(-1px); }
        }
        @keyframes ${sid}-tailWag {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(25deg); }
        }
        @keyframes ${sid}-havFloat {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          70% { opacity: 1; transform: translateY(-18px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-28px) scale(0.8); }
        }
        .${sid}-body {
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: ${sid}-breathe 3s ease-in-out infinite;
        }
        .${sid}-tail {
          transform-origin: 148px ${tailBaseY}px;
          transition: transform-origin 0.35s ease;
        }
        .${sid}-tail-wag {
          animation: ${sid}-tailWag 0.25s ease-in-out infinite;
        }
        .${sid}-hav {
          animation: ${sid}-havFloat 0.8s ease-out forwards;
        }
      `}</style>

      {/* "Hav!" text */}
      {showHav && (
        <g className={`${sid}-hav`}>
          <text
            x="100"
            y={headY - 50}
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#f97316"
            fontFamily="system-ui, sans-serif"
          >
            Hav!
          </text>
        </g>
      )}

      {/* Shadow */}
      <ellipse
        cx={100}
        cy={246}
        rx={shadowRx}
        ry={6}
        fill="black"
        opacity={0.07}
        style={{ transition: trans }}
      />

      {/* Tail (behind body) */}
      <g
        className={`${sid}-tail ${isHappy ? `${sid}-tail-wag` : ""}`}
        style={{ transition: trans }}
      >
        <g style={{ transform: `translateY(${tailBaseY - 162}px)`, transition: trans }}>
          <Tail shape={tailShape} primary={primary} secondary={secondary} />
        </g>
      </g>

      {/* Body group (with breathing) */}
      <g className={`${sid}-body`}>
        <ellipse
          cx={100}
          cy={bodyY}
          rx={isHappy ? bodyRx * 0.9 : bodyRx}
          ry={isHappy ? bodyRy * 1.1 : bodyRy}
          fill={primary}
          style={{ transition: trans }}
        />
        <ellipse
          cx={100}
          cy={bodyY + 8}
          rx={isHappy ? bodyRx * 0.55 : bodyRx * 0.6}
          ry={isHappy ? bodyRy * 0.7 : bodyRy * 0.63}
          fill={belly}
          style={{ transition: trans }}
        />
      </g>

      {/* Legs */}
      <g>
        {/* Left leg */}
        <rect
          x={stocky ? 64 : 68}
          y={legTopY}
          width={stocky ? 18 : 15}
          height={legH}
          rx={stocky ? 9 : 7.5}
          fill={primary}
          style={{ transition: trans }}
        />
        <ellipse
          cx={stocky ? 73 : 75.5}
          cy={pawY}
          rx={stocky ? 12 : 10}
          ry={5}
          fill={belly}
          style={{ transition: trans }}
        />

        {/* Right leg */}
        <rect
          x={stocky ? 118 : 117}
          y={legTopY}
          width={stocky ? 18 : 15}
          height={legH}
          rx={stocky ? 9 : 7.5}
          fill={primary}
          style={{ transition: trans }}
        />
        <ellipse
          cx={stocky ? 127 : 124.5}
          cy={pawY}
          rx={stocky ? 12 : 10}
          ry={5}
          fill={belly}
          style={{ transition: trans }}
        />
      </g>

      {/* Head */}
      <circle
        cx={100}
        cy={headY}
        r={stocky ? 44 : 42}
        fill={primary}
        style={{ transition: trans }}
      />

      {/* Ears (behind head details, positioned relative to head) */}
      <g style={{ transform: `translateY(${headY - 100}px)`, transition: trans }}>
        <Ears shape={earShape} secondary={secondary} headY={100} />
      </g>

      {/* Face patch */}
      <ellipse
        cx={100}
        cy={headY + 14}
        rx={stocky ? 30 : 28}
        ry={stocky ? 24 : 22}
        fill={belly}
        style={{ transition: trans }}
      />

      {/* Eyes */}
      <g style={{ transition: trans }}>
        {isBlinking ? (
          <>
            <line
              x1={82}
              y1={headY - 4}
              x2={93}
              y2={headY - 4}
              stroke="#333"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ transition: trans }}
            />
            <line
              x1={107}
              y1={headY - 4}
              x2={118}
              y2={headY - 4}
              stroke="#333"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ transition: trans }}
            />
          </>
        ) : (
          <>
            <circle
              cx={87}
              cy={headY - 4}
              r={isHappy ? 6.5 : 5.5}
              fill="#333"
              style={{ transition: trans }}
            />
            <circle
              cx={113}
              cy={headY - 4}
              r={isHappy ? 6.5 : 5.5}
              fill="#333"
              style={{ transition: trans }}
            />
            {/* Eye shine */}
            <circle cx={89} cy={headY - 6} r={2} fill="white" style={{ transition: trans }} />
            <circle cx={115} cy={headY - 6} r={2} fill="white" style={{ transition: trans }} />
            {isHappy && (
              <>
                <circle cx={86} cy={headY - 7} r={1.2} fill="white" />
                <circle cx={112} cy={headY - 7} r={1.2} fill="white" />
              </>
            )}
          </>
        )}
      </g>

      {/* Nose */}
      <ellipse
        cx={100}
        cy={headY + 10}
        rx={stocky ? 7 : 5.5}
        ry={stocky ? 5 : 3.5}
        fill="#333"
        style={{ transition: trans }}
      />
      <ellipse
        cx={100}
        cy={headY + 9.5}
        rx={2.5}
        ry={1}
        fill="#555"
        opacity={0.4}
        style={{ transition: trans }}
      />

      {/* Mouth */}
      <path
        d={`M${93} ${headY + 16} Q${100} ${isHappy ? headY + 23 : headY + 20} ${107} ${headY + 16}`}
        stroke="#6B5B4A"
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{ transition: trans }}
      />

      {/* Tongue (when happy) */}
      {isHappy && (
        <g>
          <path
            d={`M${98} ${headY + 18} Q${97} ${headY + 30} ${100} ${headY + 34} Q${103} ${headY + 30} ${102} ${headY + 18}`}
            fill="#FF6B8A"
          />
          <path
            d={`M${99.5} ${headY + 20} Q${100} ${headY + 30} ${100.5} ${headY + 20}`}
            stroke="#FF5070"
            fill="none"
            strokeWidth={0.5}
          />
        </g>
      )}

      {/* Blush cheeks (when happy) */}
      {isHappy && (
        <>
          <circle cx={72} cy={headY + 7} r={7} fill="#FFB6C1" opacity={0.25} />
          <circle cx={128} cy={headY + 7} r={7} fill="#FFB6C1" opacity={0.25} />
        </>
      )}
    </svg>
  );
};

export default AnimatedDog;
