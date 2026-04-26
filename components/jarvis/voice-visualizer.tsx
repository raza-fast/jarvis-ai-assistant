"use client"

import { useEffect, useRef } from "react"
import type { JarvisState } from "./jarvis-core"
import { Mic } from "lucide-react"

interface VoiceVisualizerProps {
  state: JarvisState
  audioLevel: number
  onActivate: () => void
}

export function VoiceVisualizer({ state, audioLevel, onActivate }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 200
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2

    const animate = () => {
      timeRef.current += 0.02
      ctx.clearRect(0, 0, size, size)

      // Draw based on state
      if (state === "idle") {
        drawIdleState(ctx, centerX, centerY, timeRef.current)
      } else if (state === "listening") {
        drawListeningState(ctx, centerX, centerY, timeRef.current, audioLevel)
      } else if (state === "thinking") {
        drawThinkingState(ctx, centerX, centerY, timeRef.current)
      } else if (state === "speaking") {
        drawSpeakingState(ctx, centerX, centerY, timeRef.current)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [state, audioLevel])

  const drawIdleState = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number
  ) => {
    // Pulsing core
    const pulseSize = 30 + Math.sin(time) * 5
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize)
    gradient.addColorStop(0, "rgba(0, 220, 255, 0.8)")
    gradient.addColorStop(0.5, "rgba(0, 180, 220, 0.4)")
    gradient.addColorStop(1, "rgba(0, 150, 200, 0)")

    ctx.beginPath()
    ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Subtle outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, 60, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(0, 200, 255, ${0.2 + Math.sin(time * 0.5) * 0.1})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const drawListeningState = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number,
    level: number
  ) => {
    // Core glow
    const coreSize = 25 + level * 30
    const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize)
    coreGradient.addColorStop(0, "rgba(0, 255, 255, 1)")
    coreGradient.addColorStop(0.3, "rgba(0, 220, 255, 0.6)")
    coreGradient.addColorStop(1, "rgba(0, 180, 220, 0)")

    ctx.beginPath()
    ctx.arc(cx, cy, coreSize, 0, Math.PI * 2)
    ctx.fillStyle = coreGradient
    ctx.fill()

    // Waveform bars
    const barCount = 24
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2
      const barLength = 20 + level * 40 + Math.sin(time * 3 + i * 0.5) * 10
      const innerRadius = 40
      const outerRadius = innerRadius + barLength

      const x1 = cx + Math.cos(angle) * innerRadius
      const y1 = cy + Math.sin(angle) * innerRadius
      const x2 = cx + Math.cos(angle) * outerRadius
      const y2 = cy + Math.sin(angle) * outerRadius

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + level * 0.5})`
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.stroke()
    }
  }

  const drawThinkingState = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number
  ) => {
    // Rotating segments
    const segments = 3
    for (let i = 0; i < segments; i++) {
      const startAngle = time * 2 + (i * Math.PI * 2) / segments
      const endAngle = startAngle + Math.PI * 0.4

      ctx.beginPath()
      ctx.arc(cx, cy, 50, startAngle, endAngle)
      ctx.strokeStyle = `rgba(0, 220, 255, ${0.8 - i * 0.2})`
      ctx.lineWidth = 4
      ctx.lineCap = "round"
      ctx.stroke()
    }

    // Inner rotating ring (opposite direction)
    for (let i = 0; i < segments; i++) {
      const startAngle = -time * 3 + (i * Math.PI * 2) / segments
      const endAngle = startAngle + Math.PI * 0.3

      ctx.beginPath()
      ctx.arc(cx, cy, 35, startAngle, endAngle)
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 - i * 0.15})`
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.stroke()
    }

    // Center pulse
    const pulseSize = 15 + Math.sin(time * 4) * 5
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize)
    gradient.addColorStop(0, "rgba(0, 255, 255, 1)")
    gradient.addColorStop(1, "rgba(0, 200, 220, 0)")

    ctx.beginPath()
    ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  const drawSpeakingState = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    time: number
  ) => {
    // Expanding rings
    const ringCount = 4
    for (let i = 0; i < ringCount; i++) {
      const phase = (time * 2 + i * 0.5) % 2
      const radius = 30 + phase * 40
      const alpha = 1 - phase / 2

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Core
    const coreSize = 25 + Math.sin(time * 6) * 5
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize)
    gradient.addColorStop(0, "rgba(0, 255, 255, 1)")
    gradient.addColorStop(0.5, "rgba(0, 220, 255, 0.6)")
    gradient.addColorStop(1, "rgba(0, 180, 220, 0)")

    ctx.beginPath()
    ctx.arc(cx, cy, coreSize, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Sound wave visualization
    ctx.beginPath()
    for (let x = -60; x <= 60; x += 2) {
      const y = Math.sin(x * 0.1 + time * 8) * 10 * Math.cos(x * 0.05)
      if (x === -60) {
        ctx.moveTo(cx + x, cy + y + 70)
      } else {
        ctx.lineTo(cx + x, cy + y + 70)
      }
    }
    ctx.strokeStyle = "rgba(0, 255, 255, 0.5)"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  return (
    <button
      onClick={onActivate}
      className="group relative flex items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none"
      aria-label={state === "idle" ? "Activate Jarvis" : `Jarvis is ${state}`}
    >
      <canvas
        ref={canvasRef}
        className="h-[200px] w-[200px]"
      />
      
      {state === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Mic className="h-8 w-8 text-primary/60 transition-colors group-hover:text-primary" />
            <span className="text-xs text-muted-foreground">Say "Jarvis"</span>
          </div>
        </div>
      )}
    </button>
  )
}
