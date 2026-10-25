"""Gemini calls for the three AI tools: Ask, Objection handler and Prospect briefing.

Client construction follows the pattern already verified in syncloud-app/app/gemini_client.py
(google-genai, Vertex backend via enterprise=True, auth from the Cloud Run service account; no
API key). The model is configurable with MODEL_ID because availability differs per project.
"""
import logging
import os
import time
from collections.abc import Iterator

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from . import kb

MODEL_ID = os.environ.get("MODEL_ID", "gemini-3-flash-preview")
FALLBACK_MODEL = os.environ.get("FALLBACK_MODEL", "gemini-2.5-flash")
logger = logging.getLogger(__name__)
_client: genai.Client | None = None

BASE_RULES = """You are Competitor Brief, the competitive and market intelligence assistant for every
team at ShipSafe: sales, go-to-market and marketing, product, customer success and leadership.
Answer from the angle of the person asking (a product manager wants gaps and priorities, a
marketer wants positioning and segments, a leader wants risks and numbers, a rep wants what to
say). Use win/loss, market and roadmap data for product and strategy questions. ShipSafe and every company, person and number in the knowledge base
are fictional demo data; treat them as real for the purpose of answering.

Rules:
- Answer ONLY from the knowledge base below. Never invent numbers, customers, features, dates,
  causes or rankings (e.g. never call something a "top request" unless a document says so).
  If something is not in the knowledge base, say so in one line and give the closest useful fact.
- Be specific and practical: exact numbers, names of reference customers, landmine questions,
  talk tracks a rep can say out loud.
- Respect the honesty rules in the knowledge base (e.g. FedRAMP is "In Process", roadmap items are
  under NDA and never committed in writing, concede competitor strengths where the profile does).
- Keep answers SHORT and in plain English that a non-expert understands at first read:
  1. First line: the answer in **bold**, one sentence, with the key number if there is one.
  2. Then at most 3 short bullets with the reasons or facts. No sub-bullets, no tables unless the
     question is about price, no jargon or acronyms without a short explanation.
  3. ONLY for questions about talking to a customer (sales, objections, references): one line
     **Say:** "a sentence the rep can say". Never add a Say line for product, marketing,
     leadership or internal questions.
  4. One line: **Next step:** what to do now.
  Never more than ~120 words. Never repeat the question.
- For performance questions, use the lab test results: give the competitor's public claim, then what
  we measured in our live test environment, with the test conditions in a few words (e.g. "mid-size
  environment, 60 services, median of 10 runs"). Include where the competitor did well if relevant.
- End with a line "Sources:" naming the documents you used in plain words, never file paths, e.g.
  "Sources: OpenDeploy profile, Company primer, Sales playbook".
- Write like an experienced sales-enablement colleague, not a chatbot: no greetings, no "Great
  question", no emojis, no mention of being an AI or of a "knowledge base".
"""


def _client_get() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(
            enterprise=True,
            project=os.environ["GCP_PROJECT_ID"],
            location=os.environ.get("VERTEX_REGION", "global"),
        )
    return _client


def _request(system: str, user: str, history: list[dict] | None, knowledge: str | None = None):
    contents = []
    for turn in (history or [])[-6:]:
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=turn.get("text", "")[:4000])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=user)]))
    config = types.GenerateContentConfig(
        system_instruction=f"{system}\n\n#### KNOWLEDGE BASE ####\n{kb.corpus() if knowledge is None else knowledge}",
        temperature=0.3,
        max_output_tokens=4096,
    )
    return contents, config


def _stream(system: str, user: str, history: list[dict] | None = None, knowledge: str | None = None) -> Iterator[str]:
    """Yield the answer as it is generated. The default is a preview model; if it fails before
    the first chunk (unavailable, out of quota), answer with the GA fallback instead."""
    contents, config = _request(system, user, history, knowledge)
    for model in (MODEL_ID, FALLBACK_MODEL):
        started = False
        try:
            for chunk in _open_stream(model, contents, config):
                if chunk.text:
                    started = True
                    yield chunk.text
            if not started:
                yield "_No answer was generated. Try rephrasing the question._"
            return
        except Exception:
            if started or model == FALLBACK_MODEL:
                raise
            logger.exception("Primary model %s failed, falling back to %s", MODEL_ID, FALLBACK_MODEL)


def _open_stream(model: str, contents, config):
    def start():
        stream = _client_get().models.generate_content_stream(model=model, contents=contents, config=config)
        first = next(stream, None)
        return iter(()) if first is None else _chain(first, stream)
    return retry_429(start, model)


def retry_429(fn, model: str):
    """Call fn(), retrying with backoff while Vertex answers 429 (quota)."""
    delay = 3
    for attempt in range(4):
        try:
            return fn()
        except genai_errors.ClientError as e:
            if e.code != 429 or attempt == 3:
                raise
            logger.warning("Gemini 429 on %s, retry %d in %ds", model, attempt + 1, delay)
            time.sleep(delay)
            delay *= 2
    raise RuntimeError("unreachable")


def _chain(first, rest):
    yield first
    yield from rest


def ask(question: str, history: list[dict] | None = None) -> Iterator[str]:
    return _stream(BASE_RULES, question, history)


def handle_objection(objection: str, competitor: str | None) -> Iterator[str]:
    system = BASE_RULES + """
Task: the rep just heard an objection on a call. Keep it under ~120 words. Reply with:
1. **Say this** - a 2-4 sentence response the rep can say verbatim, in a calm, confident tone.
2. **Why it works** - 2-3 bullets with the facts behind it (numbers, proof).
3. **Ask next** - one or two follow-up/landmine questions to regain control.
4. **Proof to offer** - the best reference customer or case study and why.
"""
    ctx = f"Competitor in the deal: {competitor}.\n" if competitor else ""
    return _stream(system, f"{ctx}Objection: \"{objection}\"")


def briefing(prospect: dict | None, free_text: str | None) -> Iterator[str]:
    system = BASE_RULES + """
Task: write a pre-call briefing a rep can read in 1 minute (max ~220 words, short bullets). Sections:
## Snapshot (table: industry, size, stack, current tool, trigger)
## Why they'll care (2-3 bullets mapped to ShipSafe value pillars and their trigger)
## Likely competition & how to win (name the competitor(s), quick dismiss, 2 landmine questions)
## Stakeholders & what to say to each (one line per persona)
## Discovery questions (4-5, specific to them)
## Best reference customer (one, with the reason)
## Risks / watch-outs (honest: gaps like Windows VMs or FedRAMP if relevant, ICP fit)
## Suggested next step
"""
    if prospect:
        details = "\n".join(f"- {k}: {v}" for k, v in prospect.items() if k != "slug")
        user = f"Prepare the briefing for this prospect from prospects/prospects.json:\n{details}"
    else:
        user = f"Prepare the briefing for this prospect described by the rep:\n{free_text}"
    return _stream(system, user)
