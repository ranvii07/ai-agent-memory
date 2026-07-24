"""The LangGraph orchestration: a tiny 3-node graph.

    retrieve_memory  ->  call_llm  ->  store_memory

A single dictionary (the "state") flows through the nodes. Each node reads
what it needs from the state and returns the fields it wants to add/update;
LangGraph merges those returned fields back into the shared state.
"""
from typing import TypedDict
from langgraph.graph import StateGraph, END

from llm import embed, chat
from db import search_similar, insert_message


class ChatState(TypedDict):
    session_id: str          # which conversation this message belongs to
    message: str             # the new user message
    embedding: list[float]   # the message turned into a vector (set by node 1)
    context: list[str]       # similar past messages (set by node 1)
    reply: str               # the model's answer (set by node 2)


def retrieve_memory(state: ChatState) -> dict:
    """Node 1 — MEMORY IN.
    Embed the incoming message, then fetch the 3 most similar past messages
    from the database (across all sessions). We keep the embedding in the
    state so node 3 can reuse it instead of embedding the same text twice.
    """
    embedding = embed(state["message"])
    context = search_similar(embedding, limit=3)
    return {"embedding": embedding, "context": context}


def call_llm(state: ChatState) -> dict:
    """Node 2 — THINK.
    Ask the model to answer, handing it the retrieved memories as context.
    """
    reply = chat(state["context"], state["message"])
    return {"reply": reply}


def store_memory(state: ChatState) -> dict:
    """Node 3 — MEMORY OUT.
    Save the new message + its embedding so it can be retrieved as memory in
    future turns. This runs AFTER the LLM call, so a message never retrieves
    itself as its own context.
    """
    insert_message(state["session_id"], state["message"], state["embedding"])
    return {}


# Wire the three nodes together into a straight line and compile.
builder = StateGraph(ChatState)
builder.add_node("retrieve_memory", retrieve_memory)
builder.add_node("call_llm", call_llm)
builder.add_node("store_memory", store_memory)

builder.set_entry_point("retrieve_memory")
builder.add_edge("retrieve_memory", "call_llm")
builder.add_edge("call_llm", "store_memory")
builder.add_edge("store_memory", END)

graph = builder.compile()
