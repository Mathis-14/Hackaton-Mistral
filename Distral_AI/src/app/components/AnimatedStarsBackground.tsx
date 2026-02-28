"use client";

import React from "react";
import { useTheme } from "next-themes";

interface Star {
  x: number;
  y: number;
  baseOpacity: number;
  currentOpacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  lifetime: number;
  maxLifetime: number;
  sizeMultiplier: number;
}

interface AnimatedStarsBackgroundProps {
  density?: number;
  maxOpacity?: number;
  minOpacity?: number;
  spawnRate?: number;
  minLifetime?: number;
  maxLifetime?: number;
}

const AnimatedStarsBackground: React.FC<AnimatedStarsBackgroundProps> = ({
  density = 2000,
  maxOpacity = 1.0,
  minOpacity = 0.05,
  spawnRate = 0.03,
  minLifetime = 18000,
  maxLifetime = 29000,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const animationRef = React.useRef<number | null>(null);
  const starsRef = React.useRef<Star[]>([]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    starsRef.current = [];

    if (!resolvedTheme) return;
    if (resolvedTheme !== "dark") return;

    const resizeCanvas = () => {
      const footerElement = canvas.closest("footer");
      canvas.width = window.innerWidth;
      canvas.height = footerElement ? footerElement.offsetHeight : window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const generateStar = (): Star => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const baseOpacity = minOpacity + (y / canvas.height) * (maxOpacity - minOpacity);

      return {
        x,
        y,
        baseOpacity,
        currentOpacity: baseOpacity,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        pulsePhase: Math.random() * Math.PI * 2,
        lifetime: 0,
        maxLifetime: minLifetime + Math.random() * (maxLifetime - minLifetime),
        sizeMultiplier: 0.5 + Math.random() * 1.0,
      };
    };

    const numberOfStars = Math.floor((canvas.width * canvas.height) / density);

    const animate = (_timestamp: number) => {
      if (!resolvedTheme || resolvedTheme !== "dark") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current = starsRef.current.filter((star) => {
        star.lifetime += 32;
        star.pulsePhase += star.pulseSpeed;

        const lifetimeProgress = star.lifetime / star.maxLifetime;
        let fadeMultiplier = 1;

        if (lifetimeProgress > 0.8) {
          fadeMultiplier = 1 - (lifetimeProgress - 0.8) / 0.2;
        } else if (lifetimeProgress < 0.4) {
          fadeMultiplier = lifetimeProgress / 0.4;
        }

        star.currentOpacity = star.baseOpacity * fadeMultiplier;

        const baseSize = 4;
        const size = Math.max(1, Math.round(baseSize * star.sizeMultiplier));
        const x = Math.floor(star.x);
        const y = Math.floor(star.y);

        const auraIntensity = 0.3 + 0.7 * (Math.sin(star.pulsePhase) * 0.5 + 0.5);

        const auraSize = size + 2;
        const auraOpacity = star.currentOpacity * auraIntensity * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${auraOpacity})`;
        ctx.fillRect(x - 1, y - 1, auraSize, auraSize);

        const glowSize = size + 1;
        const glowOpacity = star.currentOpacity * auraIntensity * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${glowOpacity})`;
        ctx.fillRect(x - 0.5, y - 0.5, glowSize, glowSize);

        ctx.fillStyle = `rgba(255, 255, 255, ${star.currentOpacity})`;
        ctx.fillRect(x, y, size, size);

        return star.lifetime < star.maxLifetime;
      });

      const currentStarCount = starsRef.current.length;
      const targetStars = numberOfStars;
      const spawnChance =
        currentStarCount < targetStars * 0.3
          ? spawnRate * 8
          : currentStarCount < targetStars * 0.7
            ? spawnRate * 3
            : spawnRate;

      if (Math.random() < spawnChance && currentStarCount < targetStars * 1.5) {
        starsRef.current.push(generateStar());
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(() => animate(0));

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [
    density,
    maxOpacity,
    minOpacity,
    spawnRate,
    minLifetime,
    maxLifetime,
    resolvedTheme,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default AnimatedStarsBackground;
