// =============================================================================
// PawLand - AnimatedDog3D
// Three.js ile gercek 3D kopek karakteri
// Irka gore farkli gorunum, tiklandiginda animasyon, dondurme destegi
// =============================================================================

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getVisuals } from "./AnimatedDog";
import type { DogVisuals, TailShape } from "./AnimatedDog";
import { dominantRenklerCikar } from "../../services/renkCikarma";

// =============================================================================
// Tail Mesh
// =============================================================================

function TailMesh({
  shape,
  color,
  secondaryColor,
}: {
  shape: TailShape;
  color: string;
  secondaryColor: string;
}) {
  switch (shape) {
    case "bushy":
      return (
        <group>
          <mesh position={[0, 0.12, -0.05]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.28, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.28, -0.14]} scale={[0.09, 0.11, 0.09]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color={secondaryColor} roughness={0.85} />
          </mesh>
        </group>
      );

    case "curled":
      return (
        <group>
          <mesh position={[0, 0.12, 0]} rotation={[0.8, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.2, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.22, 0.06]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </group>
      );

    case "short":
      return (
        <mesh position={[0, 0.05, -0.02]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.12, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      );

    case "pom":
      return (
        <group>
          <mesh position={[0, 0.1, -0.02]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 0.18, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.22, -0.1]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </group>
      );

    case "straight":
    default:
      return (
        <mesh position={[0, 0.14, -0.05]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.045, 0.28, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      );
  }
}

// =============================================================================
// Inner 3D Dog (renders inside Canvas)
// =============================================================================

interface Dog3DProps {
  visuals: DogVisuals;
  isHappy: boolean;
  onTap: () => void;
  aksesuarlar?: string[];
}

function Dog3D({ visuals, isHappy, onTap, aksesuarlar = [] }: Dog3DProps) {
  const { primary, secondary, belly, earShape, tailShape, stocky, curly, small } = visuals;

  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const tongueRef = useRef<THREE.Mesh>(null);
  const [blinking, setBlinking] = useState(false);

  // Scale factor for small breeds
  const sc = small ? 0.82 : 1;

  // Blink periodically
  useEffect(() => {
    const doBlink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const id = setInterval(doBlink, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  // Animation loop
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;

    // Breathing
    groupRef.current.scale.y = 1 + Math.sin(t * 2) * 0.012;

    // Gentle bob / happy jump
    if (isHappy) {
      const phase = (t * 3) % 1;
      groupRef.current.position.y = Math.sin(phase * Math.PI) * 0.12;
    } else {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.01;
    }

    // Tail wag
    if (tailRef.current) {
      const speed = isHappy ? 14 : 2.5;
      const amp = isHappy ? 0.6 : 0.15;
      tailRef.current.rotation.z = Math.sin(t * speed) * amp;
    }

    // Tongue visibility + wiggle
    if (tongueRef.current) {
      tongueRef.current.visible = isHappy;
      if (isHappy) {
        tongueRef.current.rotation.z = Math.sin(t * 8) * 0.1;
      }
    }
  });

  const bodyW = (stocky ? 0.48 : 0.42) * sc;
  const bodyH = (stocky ? 0.35 : 0.38) * sc;
  const headR = (stocky ? 0.40 : 0.38) * sc;

  return (
    <group ref={groupRef} onClick={onTap} scale={[sc === 1 ? 1 : 1.1, sc === 1 ? 1 : 1.1, sc === 1 ? 1 : 1.1]}>
      {/* ---- Body ---- */}
      <mesh position={[0, 0.55, 0]} scale={[bodyW, bodyH, 0.5 * sc]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={primary} roughness={curly ? 1 : 0.85} />
      </mesh>

      {/* Curly fur bumps on body */}
      {curly && (
        <>
          {[[-0.2, 0.65, 0.25], [0.2, 0.6, 0.28], [0.0, 0.7, 0.3],
            [-0.15, 0.5, 0.3], [0.15, 0.48, 0.32], [-0.25, 0.55, 0.15],
            [0.25, 0.55, 0.15], [0.0, 0.45, 0.28], [-0.1, 0.68, 0.2],
            [0.1, 0.42, 0.25]].map(([x, y, z], i) => (
            <mesh key={`cb${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.055, 6, 6]} />
              <meshStandardMaterial color={primary} roughness={1} />
            </mesh>
          ))}
        </>
      )}

      {/* Belly */}
      <mesh
        position={[0, 0.48, 0.08]}
        scale={[bodyW * 0.65, bodyH * 0.7, 0.35 * sc]}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>

      {/* ---- Head ---- */}
      <mesh position={[0, 1.05 * sc + (1 - sc) * 0.3, 0.15]} scale={[headR, headR * 0.95, headR * 0.92]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={primary} roughness={curly ? 1 : 0.85} />
      </mesh>

      {/* Curly fur bumps on head */}
      {curly && (
        <>
          {[[-0.18, 1.15, 0.25], [0.18, 1.15, 0.25], [0, 1.22, 0.12],
            [-0.12, 1.2, 0.05], [0.12, 1.2, 0.05], [0, 1.18, -0.1]].map(([x, y, z], i) => (
            <mesh key={`ch${i}`} position={[x * sc, y * sc + (1 - sc) * 0.3, z]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={primary} roughness={1} />
            </mesh>
          ))}
        </>
      )}

      {/* Snout / face patch */}
      <mesh position={[0, 0.95, 0.38]} scale={[0.2, 0.17, 0.18]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>

      {/* ---- Eyes ---- */}
      {!blinking ? (
        <>
          <mesh position={[-0.13, 1.08, 0.42]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </mesh>
          <mesh position={[-0.115, 1.095, 0.465]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>

          <mesh position={[0.13, 1.08, 0.42]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </mesh>
          <mesh position={[0.115, 1.095, 0.465]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.13, 1.08, 0.44]} scale={[0.08, 0.008, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0.13, 1.08, 0.44]} scale={[0.08, 0.008, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        </>
      )}

      {/* ---- Nose ---- */}
      <mesh position={[0, 0.97, 0.52]} scale={[0.055, 0.04, 0.04]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#222" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* ---- Tongue ---- */}
      <mesh
        ref={tongueRef}
        position={[0, 0.88, 0.52]}
        scale={[0.04, 0.07, 0.02]}
        visible={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#FF6B8A" roughness={0.7} />
      </mesh>

      {/* ---- Cheek blush (when happy) ---- */}
      {isHappy && (
        <>
          <mesh position={[-0.25, 1.0, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color="#FFB6C1"
              transparent
              opacity={0.35}
              roughness={1}
            />
          </mesh>
          <mesh position={[0.25, 1.0, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color="#FFB6C1"
              transparent
              opacity={0.35}
              roughness={1}
            />
          </mesh>
        </>
      )}

      {/* ---- Ears ---- */}
      {earShape === "floppy" && (
        <>
          <mesh
            position={[-0.3, 1.12, 0.05]}
            rotation={[0, 0, 0.3]}
            scale={[0.08, 0.22, 0.06]}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
          <mesh
            position={[0.3, 1.12, 0.05]}
            rotation={[0, 0, -0.3]}
            scale={[0.08, 0.22, 0.06]}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
        </>
      )}
      {earShape === "pointed" && (
        <>
          <mesh position={[-0.2, 1.35, 0.08]} rotation={[0.1, 0, 0.15]}>
            <coneGeometry args={[0.08, 0.25, 8]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
          <mesh position={[0.2, 1.35, 0.08]} rotation={[0.1, 0, -0.15]}>
            <coneGeometry args={[0.08, 0.25, 8]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
          {/* Inner ear pink */}
          <mesh position={[-0.2, 1.33, 0.1]} rotation={[0.1, 0, 0.15]} scale={[0.7, 0.7, 0.7]}>
            <coneGeometry args={[0.06, 0.15, 8]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.9} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.2, 1.33, 0.1]} rotation={[0.1, 0, -0.15]} scale={[0.7, 0.7, 0.7]}>
            <coneGeometry args={[0.06, 0.15, 8]} />
            <meshStandardMaterial color="#FFB6C1" roughness={0.9} transparent opacity={0.4} />
          </mesh>
        </>
      )}
      {earShape === "round" && (
        <>
          <mesh position={[-0.28, 1.22, 0.08]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
          <mesh position={[0.28, 1.22, 0.08]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color={secondary} roughness={0.85} />
          </mesh>
        </>
      )}

      {/* ---- Front Legs ---- */}
      <mesh position={[-0.15, 0.2, 0.15]}>
        <cylinderGeometry args={[0.055, 0.06, 0.35, 10]} />
        <meshStandardMaterial color={primary} roughness={0.85} />
      </mesh>
      <mesh position={[0.15, 0.2, 0.15]}>
        <cylinderGeometry args={[0.055, 0.06, 0.35, 10]} />
        <meshStandardMaterial color={primary} roughness={0.85} />
      </mesh>

      {/* Front Paws */}
      <mesh position={[-0.15, 0.02, 0.2]} scale={[0.08, 0.035, 0.1]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.02, 0.2]} scale={[0.08, 0.035, 0.1]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>

      {/* ---- Back Legs (sitting) ---- */}
      <mesh position={[-0.22, 0.28, -0.12]} scale={[0.12, 0.16, 0.2]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={primary} roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.28, -0.12]} scale={[0.12, 0.16, 0.2]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={primary} roughness={0.85} />
      </mesh>

      {/* Back Paws */}
      <mesh position={[-0.28, 0.12, 0.02]} scale={[0.09, 0.035, 0.1]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.12, 0.02]} scale={[0.09, 0.035, 0.1]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={belly} roughness={0.9} />
      </mesh>

      {/* ---- Tail ---- */}
      <group ref={tailRef} position={[0, 0.65, -0.45]}>
        <TailMesh
          shape={tailShape}
          color={primary}
          secondaryColor={secondary}
        />
      </group>

      {/* ---- Aksesuarlar ---- */}
      {/* Şapka (hat) */}
      {aksesuarlar.includes("hat") && (
        <group position={[0, 1.42 * sc + (1 - sc) * 0.3, 0.08]}>
          {/* Hat brim */}
          <mesh position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          {/* Hat top */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.22, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          {/* Hat band */}
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.05, 16]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Tasma (collar) */}
      {aksesuarlar.includes("collar") && (
        <group position={[0, 0.82, 0.15]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.025, 8, 24]} />
            <meshStandardMaterial color="#FF1493" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Collar tag */}
          <mesh position={[0, -0.08, 0.22]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* Gözlük (glasses) */}
      {aksesuarlar.includes("glasses") && (
        <group position={[0, 1.08, 0.42]}>
          {/* Left lens */}
          <mesh position={[-0.13, 0, 0]}>
            <torusGeometry args={[0.08, 0.015, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[-0.13, 0, 0.01]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.15} roughness={0.1} metalness={0.3} />
          </mesh>
          {/* Right lens */}
          <mesh position={[0.13, 0, 0]}>
            <torusGeometry args={[0.08, 0.015, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0.13, 0, 0.01]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.15} roughness={0.1} metalness={0.3} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Bandana */}
      {aksesuarlar.includes("bandana") && (
        <group position={[0, 0.8, 0.1]}>
          <mesh rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.25, 0.18, 4]} />
            <meshStandardMaterial color="#FF4500" roughness={0.7} />
          </mesh>
          {/* Bandana knot */}
          <mesh position={[0, 0.05, -0.25]} scale={[0.08, 0.06, 0.08]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#FF4500" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Fiyonk (bow) - on head */}
      {aksesuarlar.includes("bow") && (
        <group position={[0, 1.28 * sc + (1 - sc) * 0.3, 0.15]}>
          {/* Left bow */}
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FF69B4" roughness={0.5} />
          </mesh>
          {/* Right bow */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FF69B4" roughness={0.5} />
          </mesh>
          {/* Center knot */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#FF1493" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* Atkı (scarf) */}
      {aksesuarlar.includes("scarf") && (
        <group position={[0, 0.75, 0.1]}>
          {/* Main scarf loop */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.035, 6, 16]} />
            <meshStandardMaterial color="#FF8C00" roughness={0.8} />
          </mesh>
          {/* Left hanging end */}
          <mesh position={[-0.15, -0.18, 0.2]} rotation={[0.4, 0, -0.2]}>
            <cylinderGeometry args={[0.03, 0.04, 0.25, 6]} />
            <meshStandardMaterial color="#FF8C00" roughness={0.8} />
          </mesh>
          {/* Right hanging end */}
          <mesh position={[0.15, -0.15, 0.18]} rotation={[0.35, 0, 0.15]}>
            <cylinderGeometry args={[0.03, 0.04, 0.22, 6]} />
            <meshStandardMaterial color="#FF8C00" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// =============================================================================
// Main Wrapper Component
// =============================================================================

interface AnimatedDog3DProps {
  irk: string;
  size?: number;
  fotoData?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    belly?: string;
  };
  onColorChange?: (colors: { primary: string; secondary: string; belly: string }) => void;
  showColorPicker?: boolean;
  aksesuarlar?: string[];
}

const AnimatedDog3D: React.FC<AnimatedDog3DProps> = ({
  irk,
  size = 200,
  fotoData,
  customColors,
  onColorChange,
  showColorPicker = false,
  aksesuarlar = [],
}) => {
  const [isHappy, setIsHappy] = useState(false);
  const [showHav, setShowHav] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const havTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [fotoRenkler, setFotoRenkler] = useState<{ primary: string; secondary: string; belly: string } | null>(null);
  const [manuelRenkler, setManuelRenkler] = useState(customColors || null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (havTimerRef.current) clearTimeout(havTimerRef.current);
    };
  }, []);

  // Foto renk cikarma
  useEffect(() => {
    if (!fotoData) {
      setFotoRenkler(null);
      return;
    }
    let cancelled = false;
    dominantRenklerCikar(fotoData).then((renkler) => {
      if (!cancelled) setFotoRenkler(renkler);
    }).catch(() => {
      if (!cancelled) setFotoRenkler(null);
    });
    return () => { cancelled = true; };
  }, [fotoData]);

  const handleTap = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (havTimerRef.current) clearTimeout(havTimerRef.current);

    setIsHappy(true);
    setShowHav(true);

    havTimerRef.current = setTimeout(() => setShowHav(false), 800);
    timerRef.current = setTimeout(() => setIsHappy(false), 2500);
  }, []);

  const visuals = useMemo(() => {
    const base = getVisuals(irk);
    // Öncelik: manuel renkler > foto renkleri > varsayılan
    if (manuelRenkler) {
      return { ...base, ...manuelRenkler };
    }
    if (fotoRenkler) {
      return { ...base, ...fotoRenkler };
    }
    return base;
  }, [irk, fotoRenkler, manuelRenkler]);

  const handleColorChange = useCallback((key: 'primary' | 'secondary' | 'belly', color: string) => {
    const yeniRenkler = { ...visuals, [key]: color };
    setManuelRenkler(yeniRenkler);
    if (onColorChange) {
      onColorChange(yeniRenkler);
    }
  }, [visuals, onColorChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: "pointer",
      }}
    >
      {/* "Hav!" floating text */}
      {showHav && (
        <div
          style={{
            position: "absolute",
            top: "2%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            fontSize: 20,
            fontWeight: "bold",
            color: "#f97316",
            pointerEvents: "none",
            animation: "havFloat3d 0.8s ease-out forwards",
          }}
        >
          Hav!
        </div>
      )}

      {/* Keyframes for Hav animation */}
      <style>{`
        @keyframes havFloat3d {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          70% { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.15); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-32px) scale(0.8); }
        }
      `}</style>

      <Canvas
        camera={{ position: [0, 0.8, 3], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={0.85} />
        <directionalLight
          position={[-2, 3, -1]}
          intensity={0.25}
          color="#ffeedd"
        />
        <hemisphereLight
          color="#ffeebb"
          groundColor="#b0c4de"
          intensity={0.3}
        />

        {/* Dog */}
        <Dog3D visuals={visuals} isHappy={isHappy} onTap={handleTap} aksesuarlar={aksesuarlar} />

        {/* Ground shadow */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.08} />
        </mesh>

        {/* Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          target={[0, 0.6, 0]}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate
          autoRotateSpeed={isHappy ? 3 : 0.5}
        />
      </Canvas>

    </div>

      {/* Renk Secici — animasyonun ALTında, normal akışta */}
      {showColorPicker && (
        <div
          style={{
            display: "flex",
            gap: 6,
            background: "rgba(255,255,255,0.96)",
            padding: "6px 10px",
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            marginTop: 4,
          }}
        >
          {([
            { key: 'primary',   label: 'Ana',    val: visuals.primary   },
            { key: 'secondary', label: 'İkincil', val: visuals.secondary },
            { key: 'belly',     label: 'Karın',  val: visuals.belly     },
          ] as const).map(({ key, label, val }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <input
                type="color"
                value={val}
                onChange={(e) => handleColorChange(key, e.target.value)}
                style={{ width: 28, height: 28, border: "none", borderRadius: 8, cursor: "pointer", padding: 0 }}
              />
              <span style={{ fontSize: 9, color: "#999", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnimatedDog3D;
