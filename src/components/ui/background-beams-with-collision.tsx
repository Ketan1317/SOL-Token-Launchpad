
"use client";

import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import React, { useRef, useState, useEffect } from "react";

type BeamOptions = {
  initialX?: number;
  translateX?: number;
  initialY?: number | string;
  translateY?: number | string;
  rotate?: number;
  className?: string;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
};

export const BackgroundBeamsWithCollision = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const beams: BeamOptions[] = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
  ];

  return (
    <div
      ref={parentRef}
      className={cn(
        "relative isolate w-full min-h-screen overflow-hidden bg-[#080910]",
        className
      )}
    >
      {/* Decorative beams stay behind the actual page content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {beams.map((beam) => (
          <CollisionMechanism
            key={beam.initialX + "-beam"}
            beamOptions={beam}
            containerRef={containerRef}
            parentRef={parentRef}
          />
        ))}

        <div
          ref={containerRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-transparent"
        />
      </div>

      {/* Content retains its natural width, height, and document flow */}
      <div className="relative z-10 w-full min-w-0">
        {children}
      </div>
    </div>
  );
};

const CollisionMechanism = ({
  parentRef,
  containerRef,
  beamOptions = {},
}: {
  parentRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  beamOptions?: BeamOptions;
}) => {
  const beamRef = useRef<HTMLDivElement>(null);

  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({ detected: false, coordinates: null });

  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    let animationFrame = 0;

    const checkCollision = () => {
      const beam = beamRef.current;
      const floor = containerRef.current;
      const parent = parentRef.current;

      if (beam && floor && parent && !cycleCollisionDetected) {
        const beamRect = beam.getBoundingClientRect();
        const floorRect = floor.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        if (beamRect.bottom >= floorRect.top) {
          setCollision({
            detected: true,
            coordinates: {
              x: beamRect.left - parentRect.left + beamRect.width / 2,
              y: beamRect.bottom - parentRect.top,
            },
          });

          setCycleCollisionDetected(true);
        }
      }

      animationFrame = window.setTimeout(checkCollision, 50);
    };

    animationFrame = window.setTimeout(checkCollision, 50);

    return () => window.clearTimeout(animationFrame);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (!collision.detected) return;

    const resetTimer = window.setTimeout(() => {
      setCollision({ detected: false, coordinates: null });
      setCycleCollisionDetected(false);
      setBeamKey((previous) => previous + 1);
    }, 2000);

    return () => window.clearTimeout(resetTimer);
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        aria-hidden="true"
        initial={{
          y: beamOptions.initialY ?? -200,
          x: beamOptions.initialX ?? 0,
          rotate: beamOptions.rotate ?? 0,
        }}
        animate={{
          y: beamOptions.translateY ?? "100vh",
          x: beamOptions.translateX ?? 0,
          rotate: beamOptions.rotate ?? 0,
        }}
        transition={{
          duration: beamOptions.duration ?? 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay ?? 0,
          repeatDelay: beamOptions.repeatDelay ?? 0,
        }}
        className={cn(
          "absolute left-0 top-0 h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent",
          beamOptions.className
        )}
      />

      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className="pointer-events-none"
            style={{
              left: collision.coordinates.x,
              top: collision.coordinates.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const Explosion = (props: React.HTMLProps<HTMLDivElement>) => {
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, id) => ({
      id,
      x: Math.floor(Math.random() * 80 - 40),
      y: Math.floor(Math.random() * -50 - 10),
      duration: Math.random() * 1.5 + 0.5,
    }))
  );

  return (
    <div
      {...props}
      className={cn("absolute z-50 h-2 w-2", props.className)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
      />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: 0,
          }}
          transition={{
            duration: particle.duration,
            ease: "easeOut",
          }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
        />
      ))}
    </div>
  );
};
