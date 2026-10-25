"""Competitor Brief demo: a competitive-intelligence & sales copilot over a fictional company (ShipSafe).

Access is gated by a shared demo code (env DEMO_CODE) so the public URL can't be used to burn
Gemini quota. The session cookie is an HMAC of the code, so it survives restarts and works
across Cloud Run instances without server-side state.
"""
import hashlib
import html as htmllib
import hmac
import io
import json
import logging
import os
import re
import time
from collections import defaultdict, deque

import markdown as md
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from xhtml2pdf import pisa

from . import ai, kb, workspace

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rivalyst")

DEMO_CODE = os.environ.get("DEMO_CODE", "pipelane2026")
COOKIE = "rivalyst_session"
STATIC = os.path.join(os.path.dirname(__file__), "static")
AI_LIMIT, AI_WINDOW = 40, 600  # 40 AI calls per 10 minutes per client

app = FastAPI(title="Competitor Brief demo", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=STATIC), name="static")
_calls: dict[str, deque] = defaultdict(deque)


def _token() -> str:
    return hmac.new(DEMO_CODE.encode(), b"rivalyst-session-v1", hashlib.sha256).hexdigest()


def _require_auth(request: Request) -> None:
    if not hmac.compare_digest(request.cookies.get(COOKIE, ""), _token()):
        raise HTTPException(401, "Enter the demo access code.")


def _rate_limit(request: Request) -> None:
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "?")).split(",")[0]
    q, now = _calls[ip], time.time()
    while q and now - q[0] > AI_WINDOW:
        q.popleft()
    if len(q) >= AI_LIMIT:
        raise HTTPException(429, "Demo limit reached - try again in a few minutes.")
    q.append(now)


_LIST_ITEM = re.compile(r"^\s*([*+-]|\d+\.)\s+")


def _fix_lists(text: str) -> str:
    """Python-Markdown needs a blank line before a list; LLM output often omits it, which glues
    bullets into the previous paragraph. Insert one wherever a list starts after plain text."""
    out: list[str] = []
    for line in text.splitlines():
        prev = out[-1] if out else ""
        if _LIST_ITEM.match(line) and prev.strip() and not _LIST_ITEM.match(prev) and not prev.lstrip().startswith("|"):
            out.append("")
        out.append(line)
    return "\n".join(out)


def _html(text: str) -> str:
    return md.markdown(_fix_lists(text), extensions=["tables", "sane_lists", "fenced_code"])


_SOURCES = re.compile(r"\n\s*\**Sources?:?\**:?\s*(.+?)\s*$", re.I | re.S)


def _split_sources(text: str) -> tuple[str, list[str]]:
    """Pull the trailing "Sources: a, b" line out of an answer so the UI can show it as chips."""
    m = _SOURCES.search(text)
    if not m or "\n" in m.group(1).strip():
        return text, []
    return text[:m.start()].rstrip(), [x.strip(" .*") for x in m.group(1).split(",") if x.strip(" .*")]


def _ai_stream(chunks) -> StreamingResponse:
    """Stream the answer as NDJSON: {"delta"} lines while it is generated, then one {"done"} line
    with the final HTML and sources (or one {"error"} line)."""
    def gen():
        text = ""
        try:
            for piece in chunks:
                text += piece
                yield json.dumps({"delta": piece}) + "\n"
        except Exception:  # surface a clean message; details go to logs
            logger.exception("AI call failed")
            yield json.dumps({"error": "The AI service didn't answer. Please try again."}) + "\n"
            return
        body, sources = _split_sources(text.strip())
        yield json.dumps({"done": True, "markdown": text.strip(), "html": _html(body), "sources": sources}) + "\n"
    return StreamingResponse(gen(), media_type="application/x-ndjson", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


class Login(BaseModel):
    code: str


class AskIn(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    history: list[dict] = []
    workspace: dict | None = None  # a visitor-built workspace; None means the ShipSafe sample


class ProfileIn(BaseModel):
    company_name: str = Field(default="", max_length=80)
    description: str = Field(min_length=5, max_length=800)
    industry: str = Field(default="", max_length=80)
    customers: str = Field(default="", max_length=200)
    region: str = Field(default="", max_length=120)
    competitors: str = Field(default="", max_length=300)
    decision: str = Field(default="", max_length=400)


class PlanIn(BaseModel):
    profile: ProfileIn
    market: dict


class CardIn(BaseModel):
    workspace: dict
    competitor: str = Field(min_length=1, max_length=120)


class ObjectionIn(BaseModel):
    objection: str = Field(min_length=2, max_length=1000)
    competitor: str | None = None


class BriefingIn(BaseModel):
    slug: str | None = None
    text: str | None = Field(default=None, max_length=3000)


class PdfIn(BaseModel):
    title: str = "Competitor Brief"
    markdown: str = Field(max_length=60000)


@app.get("/", response_class=HTMLResponse)
def index():
    return FileResponse(os.path.join(STATIC, "index.html"))


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/api/login")
def login(body: Login):
    if not hmac.compare_digest(body.code.strip(), DEMO_CODE):
        raise HTTPException(401, "Wrong access code.")
    resp = JSONResponse({"ok": True})
    resp.set_cookie(COOKIE, _token(), httponly=True, secure=os.environ.get("COOKIE_SECURE", "1") == "1", samesite="lax", max_age=60 * 60 * 24 * 14)
    return resp


@app.get("/api/meta")
def meta(request: Request):
    _require_auth(request)
    return kb.stats()


@app.get("/api/battlecards")
def battlecards(request: Request):
    _require_auth(request)
    return kb.battlecards()


@app.get("/api/profiles/{slug}")
def profile(slug: str, request: Request):
    _require_auth(request)
    text = kb.profile(slug)
    if text is None:
        raise HTTPException(404, "Unknown competitor")
    return {"markdown": text, "html": _html(text)}


@app.get("/api/objections")
def objections(request: Request):
    _require_auth(request)
    return kb.objections()


@app.get("/api/prospects")
def prospects(request: Request):
    _require_auth(request)
    return kb.prospects()


@app.post("/api/ask")
def ask(body: AskIn, request: Request):
    _require_auth(request)
    _rate_limit(request)
    if body.workspace is not None:
        _check_size(body.workspace)
        return _ai_stream(workspace.ask(body.question, body.history, body.workspace))
    return _ai_stream(ai.ask(body.question, body.history))


def _check_size(ws: dict) -> None:
    if len(json.dumps(ws)) > 80000:
        raise HTTPException(413, "This workspace is too large. Please start a new one.")


def _ai_json(fn, *args) -> dict:
    try:
        return fn(*args)
    except Exception:  # surface a clean message; details go to logs
        logger.exception("AI call failed")
        raise HTTPException(502, "The AI service didn't answer. Please try again.")


@app.post("/api/workspace/market")
def workspace_market(body: ProfileIn, request: Request):
    _require_auth(request)
    _rate_limit(request)
    return _ai_json(workspace.market, body.model_dump())


@app.post("/api/workspace/plan")
def workspace_plan(body: PlanIn, request: Request):
    _require_auth(request)
    _check_size(body.market)
    _rate_limit(request)
    return _ai_json(workspace.plan, body.profile.model_dump(), body.market)


@app.post("/api/workspace/battlecard")
def workspace_battlecard(body: CardIn, request: Request):
    _require_auth(request)
    _check_size(body.workspace)
    _rate_limit(request)
    return _ai_json(workspace.battlecard, body.workspace, body.competitor)


@app.post("/api/objection")
def objection(body: ObjectionIn, request: Request):
    _require_auth(request)
    _rate_limit(request)
    return _ai_stream(ai.handle_objection(body.objection, body.competitor))


@app.post("/api/briefing")
def briefing(body: BriefingIn, request: Request):
    _require_auth(request)
    prospect = next((p for p in kb.prospects() if p["slug"] == body.slug), None) if body.slug else None
    if not prospect and not (body.text and body.text.strip()):
        raise HTTPException(400, "Pick a prospect or describe one.")
    _rate_limit(request)
    return _ai_stream(ai.briefing(prospect, body.text))


_PDF_CSS = """<style>
body { font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; }
h1 { font-size: 17pt; color: #4B3BD6; margin: 0 0 6pt 0; }
h2 { font-size: 13pt; margin-top: 14pt; color: #1F2A44; }
h3 { font-size: 11.5pt; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
td, th { border: 0.5pt solid #9aa3b5; padding: 4pt 6pt; text-align: left; vertical-align: top; }
th { background: #EEF0FB; }
.foot { color: #777; font-size: 8pt; margin-top: 16pt; }
</style>"""


@app.post("/api/export-pdf")
def export_pdf(body: PdfIn, request: Request):
    _require_auth(request)
    # The markdown comes from the browser; escape raw HTML so xhtml2pdf never fetches remote URLs.
    html = (f"<html><head><meta charset='utf-8'>{_PDF_CSS}</head><body><h1>{htmllib.escape(body.title)}</h1>"
            f"{_html(body.markdown.replace('<', '&lt;'))}<p class='foot'>Competitor Brief · demo data, fictional companies</p></body></html>")
    out = io.BytesIO()
    if pisa.CreatePDF(html, dest=out, encoding="utf-8").err:
        raise HTTPException(500, "PDF export failed")
    out.seek(0)
    return StreamingResponse(out, media_type="application/pdf",
                             headers={"Content-Disposition": 'attachment; filename="competitor-brief.pdf"'})
