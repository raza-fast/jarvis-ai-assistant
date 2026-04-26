"use client"

import { cn } from "@/lib/utils"
import type { JarvisState } from "./jarvis-core"

interface CircularInterfaceProps {
  state: JarvisState
}

export function CircularInterface({ state }: CircularInterfaceProps) {
  return (
    <div className="relative h-[400px] w-[400px]">
      {/* Outer rotating ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border border-primary/20 animate-rotate-slow",
          state !== "idle" && "border-primary/40"
        )}
        style={{
          background: "linear-gradient(135deg, transparent 0%, rgba(0, 200, 255, 0.02) 50%, transparent 100%)",
        }}
      >
        {/* Ring markers */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-2 w-0.5 bg-primary/30 rounded-full"
            style={{
              left: "50%",
              top: "0",
              transformOrigin: "50% 200px",
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* Middle ring - counter rotation */}
      <div
        className={cn(
          "absolute inset-8 rounded-full border border-primary/10",
          state !== "idle" && "border-primary/30"
        )}
        style={{
          animation: "rotate-slow 30s linear infinite reverse",
        }}
      >
        {/* Decorative arcs */}
        <svg className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="rgba(0, 200, 255, 0.1)"
            strokeWidth="1"
            strokeDasharray="20 40"
            className={cn(
              "transition-all duration-500",
              state !== "idle" && "stroke-[rgba(0,200,255,0.3)]"
            )}
          />
        </svg>
      </div>

      {/* Inner decorative ring */}
      <div
        className={cn(
          "absolute inset-16 rounded-full border border-dashed border-primary/10",
          state !== "idle" && "border-primary/20"
        )}
      />

      {/* Core container */}
      <div
        className={cn(
          "absolute inset-24 rounded-full",
          "bg-gradient-to-b from-primary/5 to-transparent",
          "border border-primary/20",
          state !== "idle" && "jarvis-glow"
        )}
      />

      {/* Data points around the ring */}
      {state !== "idle" && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <div
              key={angle}
              className="absolute h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
              style={{
                left: `calc(50% + ${Math.cos((angle - 90) * (Math.PI / 180)) * 180}px)`,
                top: `calc(50% + ${Math.sin((angle - 90) * (Math.PI / 180)) * 180}px)`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Status text around ring */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="h-full w-full" viewBox="0 0 400 400">
          <defs>
            <path
              id="textCircle"
              d="M 200, 200 m -150, 0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0"
            />
          </defs>
          <text
            fill="rgba(0, 200, 255, 0.3)"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="2"
          >
            <textPath href="#textCircle">
              JARVIS NEURAL INTERFACE SYSTEM // STARK INDUSTRIES // SECURE CONNECTION ESTABLISHED //
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  )
}
