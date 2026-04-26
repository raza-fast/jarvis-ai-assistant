import { NextResponse } from "next/server"

interface SearchResult {
  title: string
  link: string
  snippet: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

async function searchWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SEARCHAPI_API_KEY
  if (!apiKey) {
    console.error("SEARCHAPI_API_KEY not configured")
    return []
  }

  try {
    const response = await fetch(
      `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error("Search API request failed")
    }

    const data = await response.json()
    
    return (data.organic_results || []).slice(0, 5).map((result: { title: string; link: string; snippet: string }) => ({
      title: result.title || "",
      link: result.link || "",
      snippet: result.snippet || "",
    }))
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

export async function POST(request: Request) {
  try {
    const { query, history } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      )
    }

    // Determine if we should search the web
    const shouldSearch = query.toLowerCase().includes("search") ||
      query.toLowerCase().includes("find") ||
      query.toLowerCase().includes("look up") ||
      query.toLowerCase().includes("what is") ||
      query.toLowerCase().includes("who is") ||
      query.toLowerCase().includes("where is") ||
      query.toLowerCase().includes("how to") ||
      query.toLowerCase().includes("news") ||
      query.toLowerCase().includes("latest") ||
      query.toLowerCase().includes("current") ||
      query.toLowerCase().includes("today")

    let searchResults: SearchResult[] = []
    let searchContext = ""

    if (shouldSearch) {
      searchResults = await searchWeb(query)
      if (searchResults.length > 0) {
        searchContext = `\n\nWeb search results for context:\n${searchResults
          .map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`)
          .join("\n")}`
      }
    }

    // Build conversation history for context
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = (history || [])
      .slice(-10)
      .map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      }))

    // System prompt for Jarvis personality
    const systemPrompt = `You are JARVIS (Just A Rather Very Intelligent System), Tony Stark's AI assistant. You are helpful, witty, sophisticated, and occasionally dry in your humor. You speak in a refined British manner while being extremely knowledgeable and capable.

Key traits:
- Address users respectfully, occasionally using "sir" or "ma'am"
- Provide concise, informative responses
- Show subtle wit when appropriate
- Be proactive in offering helpful suggestions
- When you have web search results, incorporate them naturally into your response
- Keep responses suitable for text-to-speech (avoid markdown, code blocks, or special characters)

${searchContext}`

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: query },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Groq API request failed")
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || "I apologize, but I was unable to generate a response."

    return NextResponse.json({
      response: aiResponse,
      searchResults: searchResults.length > 0 ? searchResults : undefined,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
