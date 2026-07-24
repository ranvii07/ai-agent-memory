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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-slate-50 to-slate-200 p-4 sm:p-6">
      {/* Soft decorative background glows for depth */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/30 blur-3xl" />

      {/* Glass chat card */}
      <div className="relative z-10 flex h-[85vh] max-h-[760px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-white/50 bg-white/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-lg shadow-indigo-500/30">
              <span aria-hidden>🧠</span>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl">
                AI Agent with Memory
              </h1>
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Persistent memory across sessions
              </p>
            </div>
          </div>

          {/* Session ID pill */}
          <label className="group flex items-center gap-2 self-start rounded-full border border-slate-200/80 bg-white/70 py-1.5 pl-3 pr-1.5 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-200 sm:self-auto">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Session
            </span>
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-28 rounded-full bg-slate-100/80 px-3 py-1 text-sm font-medium text-slate-700 outline-none transition focus:bg-white"
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
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm shadow-md shadow-indigo-500/25">
                    <span aria-hidden>🧠</span>
                  </div>
                )}

                <div className="flex flex-col">
                  <div
                    className={
                      m.role === "user"
                        ? "rounded-2xl rounded-br-md bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-3 text-[15px] leading-relaxed text-white shadow-lg shadow-indigo-500/25"
                        : "rounded-2xl rounded-tl-md border border-slate-200/70 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-700 shadow-sm"
                    }
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {m.text}
                  </div>

                  {m.role === "assistant" &&
                    m.context &&
                    m.context.length > 0 && <MemoriesNote memories={m.context} />}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex animate-message-in justify-start">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm shadow-md shadow-indigo-500/25">
                  <span aria-hidden>🧠</span>
                </div>
                <div className="rounded-2xl rounded-tl-md border border-slate-200/70 bg-white px-4 py-3.5 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/50 bg-white/50 px-4 py-4 sm:px-7">
          <div className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-slate-200/80 bg-white/90 px-5 py-3 text-[15px] text-slate-700 shadow-inner shadow-slate-200/60 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all duration-150 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- small presentational pieces (no app logic) ---------- */

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl shadow-xl shadow-indigo-500/30">
        <span aria-hidden>🧠</span>
      </div>
      <p className="text-base font-semibold text-slate-700">
        Start a conversation
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Tell the agent something, then switch the session ID and watch it recall
        what you said.
      </p>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 0.15, 0.3].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

function MemoriesNote({ memories }: { memories: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-1 text-xs font-medium text-slate-400 transition hover:text-indigo-500"
      >
        <SparkIcon />
        <span>
          {memories.length} {memories.length === 1 ? "memory" : "memories"} used
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="mt-2 animate-collapse-in space-y-1.5 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/80 p-2.5">
          {memories.map((mem, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs leading-relaxed text-slate-500"
            >
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-300" />
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

function SparkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l1.9 5.8L20 9.6l-5 3.6L16.8 19 12 15.6 7.2 19 9 13.2l-5-3.6 6.1-1.8L12 2z" />
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
