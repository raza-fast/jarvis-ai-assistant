"use client"

import { cn } from "@/lib/utils"
import type { JarvisState } from "./jarvis-core"
import { Mic, Brain, Volume2, Circle } from "lucide-react"

interface StatusIndicatorProps {
  state: JarvisState
  transcript: string
}

const stateConfig: Record<JarvisState, { label: string; icon: typeof Mic }> = {
  idle: { label: "Ready", icon: Circle },
  listening: { label: "Listening", icon: Mic },
  thinking: { label: "Processing", icon: Brain },
  speaking: { label: "Speaking", icon: Volume2 },
}

export function StatusIndicator({ state, transcript }: StatusIndicatorProps) {
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status badge */}
      <div
        className={cn(
          "glass-panel flex items-center gap-3 rounded-full px-6 py-3 transition-all duration-300",
          state === "listening" && "animate-pulse-glow",
          state === "thinking" && "border-primary/50"
        )}
      >
        <div
          className={cn(
            "flex h-3 w-3 items-center justify-center rounded-full",
            state === "idle" && "bg-muted-foreground",
            state === "listening" && "bg-green-400 animate-pulse",
            state === "thinking" && "bg-primary animate-pulse",
            state === "speaking" && "bg-primary"
          )}
        />
        <Icon
          className={cn(
            "h-5 w-5 transition-colors",
            state === "idle" && "text-muted-foreground",
            state !== "idle" && "text-primary"
          )}
        />
        <span
          className={cn(
            "text-sm font-medium tracking-wider uppercase",
            state === "idle" && "text-muted-foreground",
            state !== "idle" && "text-primary jarvis-text-glow"
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Transcript display */}
      {transcript && state === "listening" && (
        <div className="glass-panel max-w-md rounded-lg px-4 py-2 animate-fade-in-up">
          <p className="text-sm text-primary/80 italic">"{transcript}"</p>
        </div>
      )}
    </div>
  )
}
