"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { User, Bot, ExternalLink } from "lucide-react"

interface SearchResult {
  title: string
  link: string
  snippet: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  searchResults?: SearchResult[]
}

interface ConversationPanelProps {
  messages: Message[]
}

export function ConversationPanel({ messages }: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="glass-panel mx-auto max-w-2xl rounded-t-2xl">
      <div
        ref={scrollRef}
        className="max-h-[30vh] overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20"
      >
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fade-in-up",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary/20 border border-primary/30 text-primary"
                    : "bg-secondary/50 border border-border text-foreground"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>

                {/* Search results */}
                {message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                      Sources
                    </p>
                    <div className="flex flex-col gap-2">
                      {message.searchResults.slice(0, 3).map((result, idx) => (
                        <a
                          key={idx}
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2 rounded-lg bg-background/50 p-2 transition-colors hover:bg-background/80"
                        >
                          <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate group-hover:text-primary">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {result.snippet}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
