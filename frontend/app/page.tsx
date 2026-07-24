"use client";

import { useEffect, useRef, useState } from "react";

// Where the FastAPI backend lives. Override via NEXT_PUBLIC_API_URL in .env.local
// (and in Vercel's env settings once deployed).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Message = {
  role: "user" | "assistant";
  text: string;
  context?: string[]; // memories the backend retrieved (assistant messages only)
};

export default function Home() {
  // The session ID is an editable field on purpose: to demo cross-session
  // memory, chat under one ID, then change it and watch the agent still recall
  // things you said under the previous ID.
  const [sessionId, setSessionId] = useState("session-a");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever messages change or a reply lands.
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    // Optimistically show the user's message.
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply, context: data.context },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "⚠️ Error contacting the backend." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6">
      {/* Radial neon glows behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[520px] w-[520px] -translate-x-1/2 animate-pulse rounded-full bg-purple-600/20 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute left-1/4 top-0 h-[360px] w-[360px] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      {/* Faint dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
        }}
      />

      {/* Gradient-border glass card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="rounded-3xl bg-gradient-to-br from-purple-500/50 via-slate-600/20 to-cyan-500/50 p-px shadow-2xl shadow-purple-500/20">
          <div className="flex h-[85vh] max-h-[760px] flex-col overflow-hidden rounded-[23px] bg-slate-900/80 backdrop-blur-xl">
            {/* Header */}
            <header className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 text-lg"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(168,85,247,0.55))",
                  }}
                >
                  <span aria-hidden>🧠</span>
                </div>
                <div>
                  <h1
                    className="animate-gradient-x bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl"
                    style={{ backgroundSize: "200% auto" }}
                  >
                    AI Agent with Memory
                  </h1>
                  <p className="font-mono text-[11px] text-slate-500 sm:text-xs">
                    // persistent memory across sessions
                  </p>
                </div>
              </div>

              {/* Session ID — terminal-style tag with live indicator */}
              <label className="group flex items-center gap-2 self-start rounded-full border border-cyan-400/40 bg-slate-950/70 py-1.5 pl-3 pr-2 shadow-[0_0_12px_-2px_rgba(34,211,238,0.3)] transition focus-within:border-cyan-300/70 focus-within:shadow-[0_0_16px_-2px_rgba(34,211,238,0.5)] sm:self-auto">
                <span className="h-2 w-2 flex-shrink-0 animate-blink rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/70">
                  session
                </span>
                <input
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-24 bg-transparent font-mono text-sm text-cyan-100 outline-none placeholder:text-cyan-500/40"
                  aria-label="Session ID"
                />
              </label>
            </header>

            {/* Messages */}
            <div className="scroll-elegant flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-7">
              {messages.length === 0 && !loading && <EmptyState />}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex animate-message-in ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[82%]"
                        : "flex max-w-[85%] items-start gap-2.5"
                    }
                  >
                    {m.role === "assistant" && (
                      <div
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-sm"
                        style={{
                          filter: "drop-shadow(0 0 8px rgba(168,85,247,0.5))",
                        }}
                      >
                        <span aria-hidden>🧠</span>
                      </div>
                    )}

                    <div className="flex flex-col">
                      <div
                        className={
                          m.role === "user"
                            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-purple-600 to-blue-600 px-4 py-3 text-[15px] leading-relaxed text-white shadow-lg shadow-purple-600/30"
                            : "rounded-2xl rounded-tl-md border border-slate-700/60 border-l-2 border-l-cyan-500/60 bg-slate-800/80 px-4 py-3 text-[15px] leading-relaxed text-slate-200 shadow-[0_0_25px_-8px_rgba(34,211,238,0.25)]"
                        }
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {m.text}
                      </div>

                      {m.role === "assistant" &&
                        m.context &&
                        m.context.length > 0 && (
                          <MemoriesNote memories={m.context} />
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex animate-message-in justify-start">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-sm"
                      style={{
                        filter: "drop-shadow(0 0 8px rgba(168,85,247,0.5))",
                      }}
                    >
                      <span aria-hidden>🧠</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-md border border-slate-700/60 border-l-2 border-l-cyan-500/60 bg-slate-800/80 px-4 py-3.5 shadow-[0_0_25px_-8px_rgba(34,211,238,0.25)]">
                      <ThinkingIndicator />
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4 sm:px-7">
              <div className="flex items-center gap-2.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-slate-700 bg-slate-800/70 px-5 py-3 text-[15px] text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30 transition-all duration-150 hover:scale-105 hover:shadow-[0_0_22px_rgba(168,85,247,0.65)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-lg"
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- presentational pieces only (no app logic) ---------- */

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-5 flex h-16 w-16 animate-glow-pulse items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-500 text-2xl"
        style={{ filter: "drop-shadow(0 0 22px rgba(168,85,247,0.6))" }}
      >
        <span aria-hidden>🧠</span>
      </div>
      <p className="text-base font-semibold text-slate-200">
        Initialize a conversation
      </p>
      <p className="mt-1.5 max-w-xs font-mono text-[12px] leading-relaxed text-slate-500">
        // send a message, switch the session id,
        <br />
        and watch the agent recall it
      </p>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {[0, 0.15, 0.3].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 animate-bounce-dot rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          retrieving memory…
        </span>
      </div>
      {/* scanning-line effect */}
      <div className="h-px w-36 overflow-hidden rounded bg-slate-700/40">
        <div className="h-full w-1/3 animate-scan bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      </div>
    </div>
  );
}

function MemoriesNote({ memories }: { memories: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded px-1 font-mono text-[11px] font-medium text-cyan-400/60 transition hover:text-cyan-300"
      >
        <DatabaseIcon />
        <span>
          {memories.length} {memories.length === 1 ? "memory" : "memories"}{" "}
          retrieved
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="mt-2 animate-collapse-in space-y-1.5 overflow-hidden rounded-lg border-l-2 border-cyan-500 bg-slate-950/70 p-2.5 font-mono text-[11px] leading-relaxed text-slate-400">
          {memories.map((mem, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 text-cyan-500/70">
                [{i}]
              </span>
              <span>{mem}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
