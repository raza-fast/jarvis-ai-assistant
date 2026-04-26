"use client"

import { useState, useRef, useEffect } from "react"
import { VoiceVisualizer } from "./voice-visualizer"
import { StatusIndicator } from "./status-indicator"
import { ConversationPanel } from "./conversation-panel"
import { HudOverlay } from "./hud-overlay"
import { CircularInterface } from "./circular-interface"

export type JarvisState = "idle" | "listening" | "thinking" | "speaking"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  searchResults?: SearchResult[]
}

interface SearchResult {
  title: string
  link: string
  snippet: string
}

export function JarvisCore() {
  const [state, setState] = useState<JarvisState>("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState("")
  const [textInput, setTextInput] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const stateRef = useRef<JarvisState>("idle")
  const isProcessingRef = useRef(false)

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Mount effect
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize audio analysis for visualizer
  const initializeAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission("granted")
      
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()
      
      return true
    } catch (error) {
      // Microphone permission denied or error
      setMicPermission("denied")
      return false
    }
  }

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (typeof window === "undefined") return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Speech recognition not supported in this browser
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      console.log("[v0] Speech recognition result received!")
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += text
        } else {
          interimTranscript += text
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      console.log("[v0] Transcript:", currentTranscript, "Final:", !!finalTranscript, "State:", stateRef.current)
      
      // Update transcript display
      setTranscript(currentTranscript)
      
      // Also show in text input when listening
      if (stateRef.current === "listening") {
        setTextInput(currentTranscript)
      }

      // Check for wake word "Jarvis" when idle
      if (stateRef.current === "idle" && currentTranscript.toLowerCase().includes("jarvis")) {
        // Wake word detected
        setState("listening")
      }

      // Process final transcript when listening
      if (finalTranscript && stateRef.current === "listening" && !isProcessingRef.current) {
        const query = finalTranscript.replace(/jarvis/gi, "").trim()
        if (query.length > 2) {
          // Processing query
          isProcessingRef.current = true
          processQuery(query)
        }
      }
    }

    recognition.onerror = (event) => {
      console.log("[v0] Speech recognition error:", event.error)
      if (event.error === "not-allowed") {
        setMicPermission("denied")
      }
    }
    
    recognition.onstart = () => {
      console.log("[v0] Speech recognition onstart event fired")
    }
    
    recognition.onaudiostart = () => {
      console.log("[v0] Speech recognition audio started - microphone is capturing")
    }

    recognition.onend = () => {
      // Speech recognition ended, restarting
      // Only restart if we're not processing
      if (!isProcessingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          // Could not restart recognition
        }
      }
    }

    return recognition
  }

  // Process user query
  const processQuery = async (query: string) => {
    setState("thinking")
    setTranscript("")
    setTextInput("")

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch("/api/jarvis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history: messages.slice(-10) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()
      // Got response from API

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        searchResults: data.searchResults,
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Speak the response
      await speakResponse(data.response)
    } catch (error) {
      // Error processing query
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setState("idle")
      isProcessingRef.current = false
      
      // Restart recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (e) {
          // Could not restart recognition after error
        }
      }
    }
  }

  // Text-to-speech with ElevenLabs
  const speakResponse = async (text: string) => {
    setState("speaking")

    try {
      const response = await fetch("/api/jarvis/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        // TTS failed, falling back to browser speech
        // Fallback to browser's speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 1
          utterance.pitch = 1
          utterance.onend = () => {
            setState("idle")
            isProcessingRef.current = false
            // Restart recognition
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) {
                // Could not restart recognition
              }
            }
          }
          window.speechSynthesis.speak(utterance)
        } else {
          setState("idle")
          isProcessingRef.current = false
        }
        return
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudioRef.current = audio

      // Wait for audio to be ready before playing
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve()
        audio.onerror = () => reject(new Error("Audio load error"))
        audio.load()
      })

      audio.onended = () => {
        setState("idle")
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        isProcessingRef.current = false
        
        // Restart recognition after speaking
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start()
          } catch (e) {
            // Already running or couldn't start
          }
        }
      }

      audio.onerror = () => {
        setState("idle")
        isProcessingRef.current = false
      }

      // Only play if we're still in speaking state (not interrupted)
      if (stateRef.current === "speaking") {
        await audio.play()
      } else {
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
      }
    } catch (error) {
      // Error speaking response
      setState("idle")
      isProcessingRef.current = false
    }
  }

  // Manual activation
  const handleActivate = () => {
    // Stop any current audio playback safely
    if (currentAudioRef.current) {
      const audio = currentAudioRef.current
      currentAudioRef.current = null
      audio.onended = null
      audio.onerror = null
      audio.pause()
    }
    
    // Cancel any browser speech synthesis
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    setState("listening")
    isProcessingRef.current = false
    
    // Make sure recognition is running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Already running, that's fine
      }
    }
  }

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && state !== "thinking" && state !== "speaking") {
      processQuery(textInput.trim())
    }
  }

  // Request microphone permission
  const requestMicPermission = async () => {
    console.log("[v0] Requesting microphone permission...")
    const hasPermission = await initializeAudioAnalysis()
    console.log("[v0] Microphone permission result:", hasPermission)
    
    if (hasPermission) {
      console.log("[v0] Initializing speech recognition...")
      recognitionRef.current = initializeSpeechRecognition()
      console.log("[v0] Recognition object:", recognitionRef.current ? "created" : "null")
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          console.log("[v0] Speech recognition started successfully!")
        } catch (e) {
          console.log("[v0] Could not start recognition:", e)
        }
      } else {
        console.log("[v0] Speech recognition not available in this browser")
      }
    }
  }

  // Initialize on mount
  useEffect(() => {
    if (!mounted) return

    requestMicPermission()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [mounted])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--jarvis-dark)]">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 200, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* HUD Overlay */}
      <HudOverlay state={state} />

      {/* Main interface */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        {/* Status indicator */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <StatusIndicator state={state} transcript={transcript} />
        </div>

        {/* Microphone permission prompt */}
        {micPermission === "denied" && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 glass-panel rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Microphone access is required for voice commands.
            </p>
            <button
              onClick={requestMicPermission}
              className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90"
            >
              Enable Microphone
            </button>
          </div>
        )}

        {/* Circular interface with visualizer */}
        <div className="relative">
          <CircularInterface state={state} />
          <div className="absolute inset-0 flex items-center justify-center">
            <VoiceVisualizer 
              state={state} 
              audioLevel={audioLevel}
              onActivate={handleActivate}
            />
          </div>
        </div>

        {/* Text input and Conversation panel */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <ConversationPanel messages={messages} />
          
          {/* Text input form */}
          <form onSubmit={handleTextSubmit} className="p-4 bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-2xl mx-auto flex gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={state === "listening" ? "Listening... speak now" : "Type a message or say 'Jarvis'..."}
                disabled={state === "thinking" || state === "speaking"}
                className="flex-1 px-4 py-3 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || state === "thinking" || state === "speaking"}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleActivate}
                disabled={state === "thinking" || state === "speaking"}
                className={`px-4 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  state === "listening" 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {state === "listening" ? "Listening..." : "Voice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
