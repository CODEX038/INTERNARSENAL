"use client"

import { useState, useRef, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUERIES = [
  "Find me Python internships in Mumbai",
  "What skills do I need for a data science role?",
  "How do I write a cold email to a startup founder?",
  "Which companies are hiring for React developers?",
  "Help me improve my profile for ML internships",
]

export default function InternBotPage() {
  const [messages, setMessages]   = useState<Message[]>([
    {
      role:    "assistant",
      content: "Hi! I'm InternBot 🤖 — your AI career assistant. I can help you find internships, improve your profile, write cold emails, and more. What would you like to know?",
    },
  ])
  const [input,    setInput]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text?: string) {
    const query = text ?? input
    if (!query.trim()) return

    const userMessage: Message = { role: "user", content: query }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({
        role:    m.role,
        content: m.content,
      }))

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: query, history }),
      })

      const data = await res.json()

      const assistantMessage: Message = {
        role:    "assistant",
        content: data.reply ?? "Sorry, something went wrong.",
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Sorry, I ran into an error. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[85vh]">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">
            InternBot <span className="text-indigo-400">AI</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Powered by GPT-4o + RAG — searches real internship data
          </p>
        </div>

        {/* Suggested queries */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 px-3 py-2 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 border border-white/10 text-slate-200"
              }`}>
                {msg.role === "assistant" && (
                  <span className="text-indigo-400 font-medium text-xs block mb-1">
                    InternBot
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-indigo-400 font-medium text-xs block mb-1">
                  InternBot
                </span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Ask anything about internships..."
            className="flex-1 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6"
          >
            Send
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}