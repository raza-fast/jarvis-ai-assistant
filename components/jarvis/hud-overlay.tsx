"use client"

import { useEffect, useState } from "react"
import type { JarvisState } from "./jarvis-core"

interface HudOverlayProps {
  state: JarvisState
}

export function HudOverlay({ state }: HudOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")
  const [systemStats, setSystemStats] = useState({
    cpu: 25,
    memory: 45,
    network: "CONNECTED",
  })

  useEffect(() => {
    setMounted(true)
    
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }))
      setDate(now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }))
    }
    
    updateTime()
    const interval = setInterval(() => {
      updateTime()
      // Simulate varying system stats
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.round(Math.max(10, Math.min(40, prev.cpu + (Math.random() - 0.5) * 5))),
        memory: Math.round(Math.max(30, Math.min(70, prev.memory + (Math.random() - 0.5) * 3))),
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Scan line effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-line"
        />
      </div>

      {/* Top left - System info */}
      <div className="absolute left-6 top-6 z-20">
        <div className="glass-panel rounded-lg p-3">
          <div className="flex flex-col gap-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SYS:</span>
              <span className="text-primary jarvis-text-glow">JARVIS v3.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">CPU:</span>
              <span className="text-foreground">{Math.round(systemStats.cpu)}%</span>
              <div className="h-1 w-16 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.round(systemStats.cpu)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">MEM:</span>
              <span className="text-foreground">{Math.round(systemStats.memory)}%</span>
              <div className="h-1 w-16 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.round(systemStats.memory)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top right - Time and status */}
      <div className="absolute right-6 top-6 z-20">
        <div className="glass-panel rounded-lg p-3 text-right">
          <div className="flex flex-col gap-1 text-xs font-mono">
            <div className="text-2xl font-light text-primary jarvis-text-glow tabular-nums">
              {time || "--:--:--"}
            </div>
            <div className="text-muted-foreground">
              {date || "Loading..."}
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400">{systemStats.network}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="pointer-events-none absolute left-0 top-0 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M 0 30 L 0 0 L 30 0"
            fill="none"
            stroke="rgba(0, 200, 255, 0.3)"
            strokeWidth="1"
          />
          <path
            d="M 0 20 L 0 0 L 20 0"
            fill="none"
            stroke="rgba(0, 200, 255, 0.5)"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M 100 30 L 100 0 L 70 0"
            fill="none"
            stroke="rgba(0, 200, 255, 0.3)"
            strokeWidth="1"
          />
          <path
            d="M 100 20 L 100 0 L 80 0"
            fill="none"
            stroke="rgba(0, 200, 255, 0.5)"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M 0 70 L 0 100 L 30 100"
            fill="none"
            stroke="rgba(0, 200, 255, 0.3)"
            strokeWidth="1"
          />
          <path
            d="M 0 80 L 0 100 L 20 100"
            fill="none"
            stroke="rgba(0, 200, 255, 0.5)"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M 100 70 L 100 100 L 70 100"
            fill="none"
            stroke="rgba(0, 200, 255, 0.3)"
            strokeWidth="1"
          />
          <path
            d="M 100 80 L 100 100 L 80 100"
            fill="none"
            stroke="rgba(0, 200, 255, 0.5)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </>
  )
}
