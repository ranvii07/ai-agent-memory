# AI Agent with Persistent Memory

A minimal full-stack AI agent that remembers things you tell it — **across
sessions**. Chat under one session ID, then start a fresh session ID and it
still recalls the relevant thing you said, because "memory" is a similarity
search over every message ever stored, not a per-conversation transcript.

## Architecture (one paragraph)

A **Next.js** page sends `{session_id, message}` to a **FastAPI** backend. The
backend runs the message through a 3-node **LangGraph** graph:
`retrieve_memory → call_llm → store_memory`. Node 1 embeds the message and
finds the 3 most similar past messages in **Supabase Postgres** using the
**pgvector** cosine-distance operator (`<=>`); node 2 sends those memories plus
the new message to the LLM (**Google Gemini**); node 3 saves the new message and its
embedding back to Postgres so it becomes retrievable memory for the future. The
reply (and the memories that were used) is returned to the page.

```
Next.js page ──POST /chat──▶ FastAPI ──▶ LangGraph
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
  retrieve_memory                    call_llm                        store_memory
  embed + top-3 search   ─────▶   LLM answers with    ─────▶   save message + embedding
  (pgvector <=>)                  memories as context          (for future retrieval)
```

## The 3 LangGraph nodes (`backend/graph.py`)

1. **`retrieve_memory`** — Embeds the incoming message (`llm.embed`), then
   queries Postgres for the 3 rows whose embeddings are closest to it
   (`db.search_similar`). Searches **all** rows, i.e. every session. The
   embedding is stashed in the graph state so node 3 can reuse it.
2. **`call_llm`** — Puts the retrieved messages into the system prompt as
   "things the user said before", then asks the model to answer the new message
   (`llm.chat`).
3. **`store_memory`** — Inserts the new message + its embedding into Postgres
   (`db.insert_message`). Runs **after** the LLM call, so a message never
   retrieves itself as its own context.

The three nodes are wired in a straight line and compiled into `graph`, which
`main.py` runs with `graph.invoke(...)`.

## How memory retrieval works

- **Embedding:** `gemini-embedding-001` turns any text into a 768-number
  vector. Texts with similar *meaning* land near each other in that space.
- **Storage:** every message is stored in the `messages` table with its vector
  in a `vector(768)` column (pgvector).
- **Search:** to find memories for a new message, we embed it and run
  `ORDER BY embedding <=> query LIMIT 3`. `<=>` is pgvector's **cosine
  distance** — smaller means more similar — so the first 3 rows are the 3
  closest past messages. Because the query has no `WHERE session_id = ...`
  filter, memory is shared across every session.

## Files

```
ai-agent-memory/
├── schema.sql              # run once in Supabase: pgvector + `messages` table
├── backend/
│   ├── main.py             # FastAPI app + POST /chat
│   ├── graph.py            # the 3-node LangGraph
│   ├── llm.py              # Gemini embeddings + chat (the only LLM code)
│   ├── db.py               # Postgres/pgvector search + insert
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/page.tsx        # the single chat page (input + history)
    ├── app/layout.tsx
    ├── package.json
    └── .env.example
```

## Run it locally

### 0. Database (once)
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `schema.sql`, and run it.
3. Copy your connection string from **Project Settings → Database → Connection
   string → URI**.

### 1. Backend
```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit .env with your real keys
uvicorn main:app --reload   # -> http://localhost:8000
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                 # -> http://localhost:3000
```

### 3. Demo cross-session memory
1. With **Session ID = `session-a`**, send: *"My favorite programming language
   is Rust and I'm building a CLI tool."*
2. Change **Session ID** to `session-b` and send: *"What language should I use
   for my new command-line project?"*
3. The reply references Rust — and the grey "memories used" line under it shows
   the exact past message that was retrieved from the other session.

## Deploy

**Frontend → Vercel**
- Import the repo, set **Root Directory** to `frontend`.
- Add env var `NEXT_PUBLIC_API_URL` = your deployed backend URL.
- Deploy (Next.js is auto-detected).

**Backend → Railway or Render**
- New service from the repo, **Root Directory** `backend`.
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GEMINI_API_KEY`, `DATABASE_URL` (the Supabase URI).
- After it's live, copy its URL into Vercel's `NEXT_PUBLIC_API_URL`.

## Notes / easy extensions

- **Why Gemini for everything?** pgvector search needs an embeddings endpoint,
  and using one provider keeps it to a single API key. All provider code lives
  in `llm.py`, so switching to OpenAI or another provider is a one-file change
  (just keep the `vector(...)` size in `schema.sql` matching the new embedding
  model's dimension).
- **Storing replies too:** we store the user message (as specified). To make
  memory richer, also call `insert_message` for the assistant reply in
  `store_memory`.
- Deliberately **not** included: auth, accounts, WebSockets, rate limiting.
