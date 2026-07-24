"""FastAPI app exposing a single POST /chat endpoint.

Run locally with:  uvicorn main:app --reload
"""
from dotenv import load_dotenv

# Load backend/.env into environment variables BEFORE importing anything that
# reads those variables at import time (llm.py needs OPENAI_API_KEY, db.py
# needs DATABASE_URL). Import order matters here.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from graph import graph

app = FastAPI()

# Allow the Next.js frontend (a different origin) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # fine for a local demo; restrict for production
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    context: list[str]   # the memories that were retrieved, so retrieval is visible


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest) -> ChatResponse:
    # Feed the request through the 3-node graph. `invoke` runs the nodes in
    # order and returns the final state dictionary.
    result = graph.invoke({"session_id": req.session_id, "message": req.message})
    return ChatResponse(reply=result["reply"], context=result["context"])
