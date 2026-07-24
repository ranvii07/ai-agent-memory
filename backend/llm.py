"""Everything the app knows about the LLM provider lives in this one file.

We use Google Gemini for the two things we need:
  1. embeddings      -> turn a piece of text into a vector (list of numbers)
  2. chat completion -> turn (context + question) into a reply

Keeping both in one small module means there is a single place to look
if you ever want to swap providers or models.
"""
import os
from google import genai
from google.genai import types

# The client reads the key once, at import time.
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768                      # must match the vector(...) size in schema.sql
CHAT_MODEL = "gemini-flash-latest"       # alias that always points to the current Flash


def embed(text: str) -> list[float]:
    """Turn text into a 768-dimension vector.

    Two texts with similar meaning produce vectors that are close together,
    which is what lets us do "find the most similar past message" later.
    """
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
    )
    return response.embeddings[0].values


def chat(context: list[str], message: str) -> str:
    """Answer `message`, giving the model `context` (the most similar past
    messages we retrieved) as background 'memory' in the system instruction.
    """
    memory_block = "\n".join(f"- {c}" for c in context) or "(no relevant memories)"

    system_prompt = (
        "You are a helpful assistant with long-term memory.\n"
        "Here are the most relevant things the user has said before, "
        "possibly in earlier or other conversations:\n"
        f"{memory_block}\n\n"
        "Use these memories if they are relevant to the new message. "
        "If they are not relevant, ignore them."
    )

    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=message,
        config=types.GenerateContentConfig(system_instruction=system_prompt),
    )
    return response.text
