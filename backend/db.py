"""All database access lives here.

We talk to Postgres (hosted by Supabase) directly with psycopg, and rely
on the pgvector extension for similarity search. There are only two things
we ever do with the database:
  1. search_similar  -> find the past messages closest to a new one
  2. insert_message  -> save a new message + its embedding
"""
import os
import psycopg

DATABASE_URL = os.environ["DATABASE_URL"]


def _to_vector(embedding: list[float]) -> str:
    """pgvector accepts a vector written as a text string like "[0.1,0.2,0.3]".

    We format the embedding this way and cast it with ::vector in the SQL,
    which avoids needing any special driver adapters. Simple and explicit.
    """
    return "[" + ",".join(str(x) for x in embedding) + "]"


def search_similar(embedding: list[float], limit: int = 3) -> list[str]:
    """Return the `limit` past messages whose embeddings are most similar
    to `embedding`.

    `<=>` is pgvector's cosine-distance operator: smaller = more similar,
    so we ORDER BY it ascending and take the first `limit` rows. This searches
    ALL rows in the table, i.e. across every session, not just the current one.
    """
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content
                FROM messages
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (_to_vector(embedding), limit),
            )
            return [row[0] for row in cur.fetchall()]


def insert_message(session_id: str, content: str, embedding: list[float]) -> None:
    """Save a message and its embedding so future queries can retrieve it.

    The `with psycopg.connect(...)` block commits automatically on a clean exit.
    """
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO messages (session_id, content, embedding)
                VALUES (%s, %s, %s::vector)
                """,
                (session_id, content, _to_vector(embedding)),
            )
