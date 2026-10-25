"""The "your company" wizard: build a competitive workspace for any company the visitor describes.

Two structured (JSON) Gemini calls: one builds the workspace (market, competitors, insights,
decision brief, suggested questions), the other builds one battlecard on demand. The workspace
lives in the visitor's browser and is sent back with each question, so the server stays stateless.
"""
import json
import logging
from datetime import date
from collections.abc import Iterator

from google.genai import types
from pydantic import BaseModel, Field

from . import ai

logger = logging.getLogger(__name__)

RULES = """You are Competitor Brief, a competitive and market intelligence analyst for B2B and B2C
companies. A visitor described a company (real or invented) and wants insights they can act on.

Rules:
- Be specific to THIS company, its category, its customers and its region. No generic advice that
  would fit any company ("focus on customer experience" is useless). Every insight must name a
  concrete mechanism, segment, competitor, price point, channel or regulation.
- Use what you know about the real market: real competitors, real pricing models, real buyer
  behaviour, regulations and trends. If the visitor's company is invented, treat it as a new entrant
  in that real market.
- Never invent precise statistics (market share, revenue, growth rates, survey numbers). Use
  ranges or qualitative words, and write "estimate" when you give a number.
- Write so a busy CEO understands at first read: short sentences, plain words, no buzzwords.
- Write in the same language as the visitor's company description.
"""


class Company(BaseModel):
    name: str = Field(description="The company's name; invent a fitting one if none was given")
    one_liner: str = Field(description="What the company sells and to whom, one sentence")
    category: str = Field(description="Market category, 2-4 words")
    target: str = Field(description="Who buys, one short phrase")


class Segment(BaseModel):
    name: str
    buyers: str = Field(description="Who buys in this segment, one short phrase")
    needs: str = Field(description="What they pay for and why, one sentence")
    size: str = Field(description="One of: Small, Medium, Large (relative to the other segments)")
    growth: str = Field(description="One of: Shrinking, Flat, Growing, Fast-growing")


class Criterion(BaseModel):
    criterion: str = Field(description="A buying criterion, 2-5 words")
    why: str = Field(description="Why buyers care, one sentence")


class Trend(BaseModel):
    title: str
    detail: str = Field(description="1-2 sentences: what is changing and what it means for players in this market")


class Axis(BaseModel):
    label: str = Field(description="What the axis measures, 1-3 words, e.g. 'Price' or 'Customer size'")
    low: str = Field(description="Label for the low end, 1-2 words, e.g. 'Budget'")
    high: str = Field(description="Label for the high end, 1-2 words, e.g. 'Premium'")


class Player(BaseModel):
    name: str = Field(description="Short name, max 22 characters")
    x: int = Field(description="Position on the x axis, 0-100")
    y: int = Field(description="Position on the y axis, 0-100")
    is_you: bool = Field(description="True only for the visitor's company")
    note: str = Field(description="Why it sits here, one short sentence")


class MarketMap(BaseModel):
    x_axis: Axis
    y_axis: Axis
    players: list[Player] = Field(description="8-10 players including the visitor's company (is_you true). Spread them out; no two players closer than 8 points on both axes.")


class Competitor(BaseModel):
    name: str
    kind: str = Field(description="One of: Direct, Indirect, Alternative (e.g. spreadsheets, agencies, doing nothing)")
    one_liner: str
    threat: str = Field(description="One of: High, Medium, Low")
    their_edge: str = Field(description="Where they are genuinely stronger than the visitor's company, one sentence")
    your_edge: str = Field(description="Where the visitor's company can win against them, one sentence")


class Market(BaseModel):
    company: Company
    market_name: str = Field(description="The market's name, 2-5 words")
    overview: str = Field(description="4 sentences on the whole market: what it is, its size class (with 'estimate' if you give a number), who wins today and why, what is shifting")
    where_money_is: str = Field(description="Where the profit pools are and who captures them, 1-2 sentences")
    segments: list[Segment] = Field(description="4 segments of the market")
    buying_criteria: list[Criterion] = Field(description="The 4 criteria buyers use to choose, most important first")
    trends: list[Trend] = Field(description="3 forces reshaping the market")
    map: MarketMap = Field(description="A positioning map of the market on the two dimensions that best explain how players differ")
    competitors: list[Competitor] = Field(description="The 5 competitors that matter most to the visitor's company, mixing direct, indirect and at least one alternative, most threatening first")
    questions: list[str] = Field(description="5 short questions this company's leadership would want to ask next")


class Position(BaseModel):
    summary: str = Field(description="Where the company stands in this market today, 2 sentences, plain and honest")
    white_space: str = Field(description="The underserved gap on the market map this company is best placed to own, 1-2 sentences")
    strengths: list[str] = Field(description="3 strengths relative to the market, each tied to a buying criterion or segment")
    weaknesses: list[str] = Field(description="3 weaknesses relative to the market")
    blind_spots: list[str] = Field(description="2 things the founder probably has not seen yet")


class Move(BaseModel):
    title: str = Field(description="The move as a short imperative headline")
    why: str = Field(description="Why this move, tied to a specific segment, trend, buying criterion or competitor from the market analysis, 2 sentences")
    impact: str = Field(description="One of: High, Medium, Low")
    effort: str = Field(description="One of: High, Medium, Low")
    first_step: str = Field(description="The first concrete step this month")


class Decision(BaseModel):
    question: str = Field(description="The decision, phrased as a question")
    recommendation: str = Field(description="A clear recommendation in one or two sentences. Take a position.")
    reasons: list[str] = Field(description="3 reasons")
    risks: list[str] = Field(description="2 risks or conditions under which the recommendation is wrong")
    next_steps: list[str] = Field(description="3 next steps for the next 30 days")


class Plan(BaseModel):
    position: Position
    moves: list[Move] = Field(description="5 moves to improve the company's position, best ratio of impact to effort first")
    decision: Decision


class Claim(BaseModel):
    claim: str = Field(description="What the competitor or the buyer says")
    response: str = Field(description="What to say back, 1-2 sentences")


class Battlecard(BaseModel):
    summary: str = Field(description="How to beat them, in one sentence a salesperson can say")
    strengths: list[str] = Field(description="3 genuine strengths of the competitor (concede these)")
    weaknesses: list[str] = Field(description="3 weaknesses or gaps")
    why_we_win: list[str] = Field(description="3 reasons this company wins against them")
    questions_to_ask: list[str] = Field(description="3 questions to ask a buyer that expose the competitor's weak spots")
    they_say: list[Claim] = Field(description="2 claims they or buyers make, with responses")
    pricing: str = Field(description="How they price and how to position price against them; say if it is an estimate")
    watch_out: str = Field(description="The one thing to watch out for in deals against them")


def _dated(system: str) -> str:
    return f"{system}\nToday's date: {date.today().isoformat()}. Refer to current and upcoming years, never past ones as 'latest'.\n"


def _json(system: str, user: str, schema: type[BaseModel]) -> BaseModel:
    """One structured Gemini call, parsed into `schema`; falls back to the GA model like _stream."""
    config = types.GenerateContentConfig(
        system_instruction=_dated(system),
        temperature=0.6,
        max_output_tokens=8192,
        response_mime_type="application/json",
        response_schema=schema,
    )
    contents = [types.Content(role="user", parts=[types.Part(text=user)])]
    for model in (ai.MODEL_ID, ai.FALLBACK_MODEL):
        try:
            resp = ai.retry_429(lambda: ai._client_get().models.generate_content(model=model, contents=contents, config=config), model)
            return schema.model_validate_json(resp.text)
        except Exception:
            if model == ai.FALLBACK_MODEL:
                raise
            logger.exception("Primary model %s failed, falling back to %s", ai.MODEL_ID, ai.FALLBACK_MODEL)
    raise RuntimeError("unreachable")


def _profile_text(profile: dict) -> str:
    return "\n".join(f"- {k.replace('_', ' ').capitalize()}: {v}" for k, v in profile.items() if v)


def market(profile: dict) -> dict:
    """Step 1: the whole market, with the visitor's company placed on it."""
    user = ("Give an overview of the WHOLE market this company competes in, then place the company in it.\n"
            "Everything we know about the company:\n" + _profile_text(profile) +
            "\nIf competitors are given, include them on the map and in the competitor list.")
    return _json(RULES, user, Market).model_dump()


def plan(profile: dict, market_data: dict) -> dict:
    """Step 2: where the company stands and how to improve, using every detail we have."""
    user = ("Everything we know about the company (use every detail):\n" + _profile_text(profile) +
            "\n\nOur market analysis (use it; tie each point to a specific segment, buying criterion, trend, "
            "competitor or position on the map):\n" + json.dumps(market_data, ensure_ascii=False) +
            "\n\nNow assess where the company stands and how it can improve its position. "
            "If no decision is given, choose the most important strategic decision it faces now.")
    return _json(RULES, user, Plan).model_dump()


def battlecard(workspace: dict, competitor: str) -> dict:
    user = (f"Our company and market:\n{json.dumps(workspace, ensure_ascii=False)[:20000]}\n\n"
            f"Write a sales battlecard for competing against: {competitor}")
    return _json(RULES, user, Battlecard).model_dump()


ASK_RULES = RULES + """
You are answering a question inside this company's workspace. The knowledge base below is the
workspace we built for them (an AI draft from public market knowledge, not their internal data).
- Answer from the workspace and your knowledge of the real market. If the answer depends on their
  internal data (their real win rates, revenue, customers), say what data would settle it.
- Format: first line the answer in **bold**, one sentence. Then at most 4 short bullets. Then one
  line **Next step:** what to do now. Never more than ~150 words. No greetings, no emojis.
- End with a line "Sources:" naming the workspace parts you used in plain words (e.g. "Sources:
  Competitor landscape, Market trends, Decision brief").
"""


def ask(question: str, history: list[dict] | None, workspace: dict) -> Iterator[str]:
    return ai._stream(_dated(ASK_RULES), question, history, knowledge=json.dumps(workspace, ensure_ascii=False, indent=1))
