-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

-- 1. Enable pgvector: the extension that adds the `vector` column type and
--    similarity operators like <=> (cosine distance).
create extension if not exists vector;

-- 2. The single table that stores every message and its embedding.
create table if not exists messages (
    id          uuid        primary key default gen_random_uuid(),
    session_id  text        not null,
    content     text        not null,
    embedding   vector(768),             -- 768 = size of gemini-embedding-001 (output_dimensionality)
    created_at  timestamptz not null default now()
);

-- 3. No vector index by default -- on purpose.
--    With a small table, pgvector does an EXACT sequential scan, which is both
--    correct and fast at demo scale. Do NOT add an ivfflat index for small data:
--    ivfflat is APPROXIMATE, and with only a handful of rows it probes a nearly
--    empty partition and can return incomplete or even ZERO results (which
--    silently breaks memory retrieval).
--
--    Once you have thousands of rows and want to scale, add an HNSW index --
--    it is accurate and safe at any size. Uncomment the line below:
--
-- create index on messages using hnsw (embedding vector_cosine_ops);
