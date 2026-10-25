"""Loads the mock knowledge base under data/ once at startup.

Everything the AI answers from lives here. The whole corpus is small (~25K tokens), so it is
passed to the model in full on every request instead of retrieving chunks: simpler, and the
model can connect facts across files (a prospect's competitor + that competitor's battlecard +
the right reference customer).
"""
import json
from functools import lru_cache
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def _read(rel: str) -> str:
    return (DATA / rel).read_text(encoding="utf-8")


@lru_cache(maxsize=1)
def battlecards() -> list[dict]:
    return json.loads(_read("battlecards.json"))


@lru_cache(maxsize=1)
def objections() -> list[dict]:
    return json.loads(_read("objections.json"))


@lru_cache(maxsize=1)
def prospects() -> list[dict]:
    return json.loads(_read("prospects/prospects.json"))


def profile(slug: str) -> str | None:
    path = DATA / "profiles" / f"{slug}.md"
    if not path.is_file() or path.parent != DATA / "profiles":
        return None
    return path.read_text(encoding="utf-8")


@lru_cache(maxsize=1)
def corpus() -> str:
    """Every knowledge-base file, each wrapped with its path so answers can cite sources."""
    parts = []
    for path in sorted(DATA.rglob("*")):
        if path.suffix not in (".md", ".json") or not path.is_file():
            continue
        rel = path.relative_to(DATA).as_posix()
        parts.append(f"=== FILE: {rel} ===\n{path.read_text(encoding='utf-8')}")
    return "\n\n".join(parts)


@lru_cache(maxsize=1)
def lab() -> dict:
    return json.loads(_read("lab_tests.json"))


def stats() -> dict:
    return {"company": "ShipSafe", "documents": corpus().count("=== FILE: "), "lab": lab()}
