/* "Your company": one sentence in, then (1) an overview of the whole market with the company on the
   map, and (2) where the company stands and how to improve. Two AI calls, shown as each one lands.
   The workspace is kept in this browser only (localStorage) and sent with each question. */

const WS_KEY = "cb_workspace_v2";
const EXAMPLES = [
  { label: "Cybersecurity startup", desc: "A cybersecurity startup that scans companies' AWS and Azure accounts for risky misconfigurations and explains how to fix them", industry: "Cloud security", customers: ["Mid-market"], region: "United States" },
  { label: "Payroll app for small businesses", desc: "A payroll and HR app for small businesses in Israel: payslips, attendance and pension reporting in one place", industry: "HR tech", customers: ["Small businesses"], region: "Israel" },
  { label: "Online coffee shop", desc: "An online store selling specialty coffee beans by subscription, plus home espresso machines", industry: "E-commerce", customers: ["Consumers"], region: "Europe" },
  { label: "Online physiotherapy clinic", desc: "A digital clinic offering video physiotherapy sessions and personalised exercise plans", industry: "Digital health", customers: ["Consumers", "Enterprise"], region: "Israel" },
];
const CUSTOMERS = ["Consumers", "Small businesses", "Mid-market", "Enterprise", "Government"];
const REGIONS = ["Israel", "United States", "Europe", "Global"];
const DECISIONS = ["Should we raise our prices?", "Should we expand to the US?", "Should we add an AI feature?", "Which customer segment should we focus on?"];
const LOADING_STEPS = ["Reading what you told us", "Mapping the whole market", "Placing every player on the map"];
const LEVEL = { "High": "t-lo", "Medium": "t-md", "Low": "t-hi" };      // impact: high is good
const EFFORT = { "Low": "t-lo", "Medium": "t-md", "High": "t-hi" };     // effort: low is good
const GROWTH = { "Fast-growing": "t-lo", "Growing": "t-lo", "Flat": "t-md", "Shrinking": "t-hi" };

let WS = null;          // { id, profile, market, plan, cards: { [competitorName]: battlecard } }
let wsChat = [];

const loadWS = () => { try { return JSON.parse(localStorage.getItem(WS_KEY)); } catch { return null; } };
const saveWS = () => { try { localStorage.setItem(WS_KEY, JSON.stringify(WS)); } catch {} };
const list = (items) => `<ul>${(items || []).map((x) => `<li dir="auto">${esc(x)}</li>`).join("")}</ul>`;
const knowledge = () => ({ about_the_company: WS.profile, market: WS.market, plan: WS.plan, battlecards: WS.cards });

/* ---------- Wizard ---------- */
function chips(el, options, multi) {
  el.innerHTML = options.map((o) => `<button type="button" class="chip-btn" aria-pressed="false" data-v="${esc(o)}">${esc(o)}</button>`).join("");
  $$(".chip-btn", el).forEach((b) => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    if (!multi) $$(".chip-btn", el).forEach((x) => x.setAttribute("aria-pressed", "false"));
    b.setAttribute("aria-pressed", String(on));
  }));
}
const chipValues = (el) => $$('.chip-btn[aria-pressed="true"]', el).map((b) => b.dataset.v);
const setChips = (el, values) => $$(".chip-btn", el).forEach((b) => b.setAttribute("aria-pressed", String(values.includes(b.dataset.v))));

function initWizard() {
  if (initWizard.done) return;
  initWizard.done = true;
  chips($("#wz-customers"), CUSTOMERS, true);
  chips($("#wz-region"), REGIONS, false);
  $("#wz-examples").innerHTML = EXAMPLES.map((e, i) => `<button type="button" class="chip-btn" data-i="${i}">${esc(e.label)}</button>`).join("");
  $$("#wz-examples .chip-btn").forEach((b) => b.addEventListener("click", () => {
    const e = EXAMPLES[+b.dataset.i];
    $("#wz-error").textContent = "";
    $("#wz-desc").value = e.desc; $("#wz-industry").value = e.industry; $("#wz-name").value = "";
    setChips($("#wz-customers"), e.customers); setChips($("#wz-region"), [e.region]);
    $$("#wz-examples .chip-btn").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  $("#wz-decisions").innerHTML = DECISIONS.map((d) => `<button type="button" class="chip-btn" data-v="${esc(d)}">${esc(d)}</button>`).join("");
  $$("#wz-decisions .chip-btn").forEach((b) => b.addEventListener("click", () => { $("#wz-decision").value = b.dataset.v; }));
  $("#wz-desc").addEventListener("input", () => { $("#wz-error").textContent = ""; });
  $("#wz-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#wz-desc").value.trim().length < 5) { $("#wz-error").textContent = "Describe the company in a sentence to continue."; $("#wz-desc").focus(); return; }
    buildWorkspace();
  });
}

function wizardProfile() {
  const buyer = $("#wz-buyer").value.trim();
  return {
    company_name: $("#wz-name").value.trim(),
    description: $("#wz-desc").value.trim(),
    industry: $("#wz-industry").value.trim(),
    customers: [...chipValues($("#wz-customers")), buyer && `decision maker: ${buyer}`].filter(Boolean).join(", "),
    region: chipValues($("#wz-region")).join(", "),
    competitors: $("#wz-comp").value.trim(),
    decision: $("#wz-decision").value.trim(),
  };
}

async function buildWorkspace() {
  const profile = wizardProfile();
  showPanel("loading");
  const steps = $("#ld-steps");
  steps.innerHTML = LOADING_STEPS.map((s) => `<li>${esc(s)}</li>`).join("");
  const t0 = Date.now();
  const tick = setInterval(() => {
    const secs = Math.round((Date.now() - t0) / 1000);
    const at = Math.min(LOADING_STEPS.length - 1, Math.floor(secs / 5));
    $$("li", steps).forEach((li, i) => { li.className = i < at ? "done" : i === at ? "now" : ""; });
    $("#ld-time").textContent = `${secs} s · usually 15-30 seconds`;
  }, 500);
  let market;
  try { market = await postJSON("/api/workspace/market", profile); }
  catch (err) { showPanel("wizard"); $("#wz-error").textContent = err.message; return; }
  finally { clearInterval(tick); }
  $("#wz-loading").classList.add("hidden");
  WS = { id: Date.now(), profile, market, plan: null, cards: {} };
  wsChat = [];
  saveWS();
  if (location.hash !== "#company") history.replaceState(null, "", "#company");
  renderCompany();
  window.scrollTo(0, 0);
}

async function loadPlan() {
  const id = WS.id;
  renderPlan();
  try {
    const plan = await postJSON("/api/workspace/plan", { profile: WS.profile, market: WS.market });
    if (!WS || WS.id !== id) return;          // the visitor started another company meanwhile
    WS.plan = plan; saveWS(); renderPlan();
  } catch (err) {
    if (!WS || WS.id !== id) return;
    $("#ws-plan").innerHTML = `<section class="ws-block"><div class="panel"><p class="error">${esc(err.message)}</p><button class="btn" id="plan-retry">Try again</button></div></section>`;
    $("#plan-retry").onclick = loadPlan;
  }
}

function showPanel(which) {
  $("#wizard").classList.toggle("hidden", which !== "wizard");
  $("#wz-loading").classList.toggle("hidden", which !== "loading");
  $("#ws").classList.toggle("hidden", which !== "ws");
}

/* ---------- Workspace ---------- */
function renderCompany(sub) {
  initWizard();
  if (!$("#wz-loading").classList.contains("hidden")) return;   // still building
  if (WS === null) WS = loadWS();
  if (sub === "new" || !WS || !WS.market) { showPanel("wizard"); return; }
  showPanel("ws");
  if ($("#ws").dataset.built === String(WS.id)) return;
  renderWorkspace();
  if (!WS.plan) loadPlan();
}

function renderWorkspace() {
  const m = WS.market, c = m.company;
  const el = $("#ws");
  el.dataset.built = String(WS.id);
  el.innerHTML = `
    <div class="ws-head">
      <div>
        <span class="tool-k">Preview · AI draft from public information</span>
        <h1 dir="auto">${esc(m.market_name)}</h1>
        <p class="lead" dir="auto">Seen from <b>${esc(c.name)}</b>: ${esc(c.one_liner)}</p>
      </div>
      <div class="ws-actions">
        <button class="btn primary" id="ws-pdf">Download the brief (PDF)</button>
        <a class="btn" href="#company/new">Try another company</a>
      </div>
    </div>
    <nav class="ws-toc" aria-label="On this page">
      <a href="#" data-to="ws-market">1 · The market</a><a href="#" data-to="ws-mapsec">2 · Market map</a>
      <a href="#" data-to="ws-plan">3 · Where you stand</a><a href="#" data-to="ws-moves">4 · How to get better</a><a href="#" data-to="ws-asksec">5 · Ask</a>
    </nav>

    <section class="ws-block" id="ws-market">
      <h2>1. The market</h2>
      <p class="ws-market" dir="auto">${esc(m.overview)}</p>
      <p class="money" dir="auto"><span class="k">Where the money is</span>${esc(m.where_money_is)}</p>
      <div class="two">
        <div class="panel">
          <h3>Segments</h3>
          <table class="seg-table"><thead><tr><th>Segment</th><th>Size</th><th>Growth</th></tr></thead><tbody>
            ${m.segments.map((s) => `<tr><td dir="auto"><b>${esc(s.name)}</b><span>${esc(s.buyers)}. ${esc(s.needs)}</span></td>
              <td><span class="size size-${esc(s.size).toLowerCase()}" title="${esc(s.size)}" aria-label="${esc(s.size)}"><i></i><i></i><i></i></span></td>
              <td><span class="pill ${GROWTH[s.growth] || "t-md"}">${esc(s.growth)}</span></td></tr>`).join("")}
          </tbody></table>
        </div>
        <div class="panel">
          <h3>How buyers choose</h3>
          <ol class="criteria">${m.buying_criteria.map((k) => `<li dir="auto"><b>${esc(k.criterion)}</b><span>${esc(k.why)}</span></li>`).join("")}</ol>
        </div>
      </div>
      <div class="trends">${m.trends.map((t) => `<div class="trend"><b dir="auto">${esc(t.title)}</b><span dir="auto">${esc(t.detail)}</span></div>`).join("")}</div>
    </section>

    <section class="ws-block" id="ws-mapsec">
      <h2>2. Market map</h2>
      <p class="muted ws-sub">Every player on the two dimensions that best explain how this market splits. Hover a dot for why it sits there; click a competitor for its battlecard.</p>
      <div class="panel map-panel"><div id="ws-map" class="map"></div></div>
      <div class="grid ws-comps">${m.competitors.map((k, i) => `
        <button class="card" data-i="${i}">
          <div class="card-top"><h3 dir="auto">${esc(k.name)}</h3><span class="pill ${threatClass(k.threat)}">${esc(k.threat)} threat</span></div>
          <span class="tag kind">${esc(k.kind)}</span>
          <p dir="auto">${esc(k.one_liner)}</p>
          <p class="edge" dir="auto"><b>Their edge:</b> ${esc(k.their_edge)}</p>
          <p class="edge" dir="auto"><b>Your edge:</b> ${esc(k.your_edge)}</p>
          <span class="open">Open battlecard →</span>
        </button>`).join("")}
      </div>
      <div id="ws-card"></div>
    </section>

    <div id="ws-plan"></div>

    <section class="ws-block" id="ws-asksec">
      <h2>5. Ask about your market</h2>
      <form id="ws-ask" class="ask">
        <input id="ws-q" type="text" autocomplete="off" dir="auto" placeholder="Ask anything about ${esc(c.name)}'s market" aria-label="Your question" required>
        <button class="btn primary" type="submit">Ask</button>
      </form>
      <div class="ws-questions">${m.questions.map((q) => `<button class="example" data-q="${esc(q)}" dir="auto">${esc(q)}</button>`).join("")}</div>
      <div id="ws-result"></div>
    </section>

    <div class="tested ws-tested">
      <span class="tool-k">This was the preview. Here is the real thing.</span>
      <p>This draft took about 30 seconds and uses only public information. In the real service we do the research
        first: we study your market and competitors, and install their products in our live lab to test what they
        really do. Then your app is filled with those findings instead of AI estimates.
        <a href="#ask">See a finished example (ShipSafe) →</a></p>
    </div>`;

  drawMap($("#ws-map"), m.map);
  $$(".ws-toc a", el).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); $(`#${a.dataset.to}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  $$(".ws-comps .card", el).forEach((b) => b.addEventListener("click", () => openWsCard(+b.dataset.i)));
  $$(".ws-questions .example", el).forEach((b) => b.addEventListener("click", () => wsAsk(b.dataset.q)));
  $("#ws-ask").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#ws-q").value.trim(); if (q) wsAsk(q); });
  $("#ws-pdf").addEventListener("click", (e) => wsPdf(e.target));
  renderPlan();
}

function renderPlan() {
  const out = $("#ws-plan");
  if (!out) return;
  const name = esc(WS.market.company.name);
  if (!WS.plan) {
    out.innerHTML = `<section class="ws-block"><h2>3. Where ${name} stands</h2>
      <div class="panel"><div class="thinking"><span class="pulse"></span>Using everything we know about ${name} and the market above to find where you stand and how to improve…</div></div></section>`;
    return;
  }
  const p = WS.plan, pos = p.position;
  out.innerHTML = `
    <section class="ws-block">
      <h2>3. Where ${name} stands</h2>
      <p class="ws-market" dir="auto">${esc(pos.summary)}</p>
      <p class="dismiss" dir="auto"><span class="k">The white space you can own</span>${esc(pos.white_space)}</p>
      <div class="three">
        <div class="panel"><h3>Strengths</h3>${list(pos.strengths)}</div>
        <div class="panel"><h3>Weaknesses</h3>${list(pos.weaknesses)}</div>
        <div class="panel"><h3>Blind spots</h3>${list(pos.blind_spots)}</div>
      </div>
    </section>

    <section class="ws-block" id="ws-moves">
      <h2>4. How to get better</h2>
      <p class="muted ws-sub">${p.moves.length} moves, best return for the effort first. Each one is tied to something in the market above.</p>
      <ol class="moves">${p.moves.map((mv) => `
        <li class="move">
          <div class="move-head"><h3 dir="auto">${esc(mv.title)}</h3>
            <span class="move-tags"><span class="pill ${LEVEL[mv.impact] || "t-md"}">Impact: ${esc(mv.impact)}</span><span class="pill ${EFFORT[mv.effort] || "t-md"}">Effort: ${esc(mv.effort)}</span></span></div>
          <p dir="auto">${esc(mv.why)}</p>
          <p class="do" dir="auto"><b>First step:</b> ${esc(mv.first_step)}</p>
        </li>`).join("")}
      </ol>
      <div class="panel decision">
        <span class="tool-k">Your decision</span>
        <p class="decision-q" dir="auto">${esc(p.decision.question)}</p>
        <p class="decision-rec" dir="auto"><span class="k">Our recommendation</span>${esc(p.decision.recommendation)}</p>
        <div class="decision-cols">
          <div><h3>Why</h3>${list(p.decision.reasons)}</div>
          <div><h3>When this would be wrong</h3>${list(p.decision.risks)}</div>
          <div><h3>Next 30 days</h3>${list(p.decision.next_steps)}</div>
        </div>
      </div>
    </section>`;
}

/* Market map: one neutral series for the market, the visitor's company in the accent colour.
   Direct labels on every dot (it's a positioning map), a hover tooltip, click opens a battlecard. */
function drawMap(el, map) {
  const narrow = el.clientWidth < 560;   // phones: a smaller canvas keeps the text readable
  const W = narrow ? 400 : 680, H = narrow ? 420 : 440, L = 48, R = 12, T = 20, B = 56;
  const px = (v) => L + (Math.max(0, Math.min(100, v)) / 100) * (W - L - R);
  const py = (v) => H - B - (Math.max(0, Math.min(100, v)) / 100) * (H - T - B);
  const players = [...map.players].sort((a, b) => Number(a.is_you) - Number(b.is_you));   // "you" drawn last, on top
  const boxes = players.map((p) => ({ x: px(p.x) - 8, y: py(p.y) - 8, w: 16, h: 16 }));  // keep labels off the dots
  const labelFor = (p) => {
    const x = px(p.x), y = py(p.y), w = p.name.length * 6.6 + 4;
    const sides = x < W - R - w - 14 ? [1, -1] : [-1, 1];
    for (const dy of [0, 15, -15, 30, -30]) {
      for (const side of sides) {
        const bx = side > 0 ? x + 11 : x - 11 - w, by = y + 4 + dy - 11;
        if (bx < 0 || bx + w > W) continue;
        if (!boxes.some((b) => bx < b.x + b.w && bx + w > b.x && by < b.y + b.h && by + 13 > b.y)) {
          boxes.push({ x: bx, y: by, w, h: 13 });
          return `<text x="${side > 0 ? x + 11 : x - 11}" y="${y + 4 + dy}" text-anchor="${side > 0 ? "start" : "end"}" class="${p.is_you ? "lbl you" : "lbl"}">${esc(p.name)}</text>`;
        }
      }
    }
    return "";   // no room: the tooltip still names it
  };
  // Label the company first so its label never gets pushed around.
  const labels = [...players].reverse().map(labelFor);
  const comp = WS.market.competitors.map((c) => c.name.toLowerCase());
  el.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Market map: ${esc(map.x_axis.label)} versus ${esc(map.y_axis.label)}">
      <line class="mid" x1="${px(50)}" x2="${px(50)}" y1="${py(0)}" y2="${py(100)}"/>
      <line class="mid" x1="${px(0)}" x2="${px(100)}" y1="${py(50)}" y2="${py(50)}"/>
      <line class="axis" x1="${px(0)}" x2="${px(100)}" y1="${py(0)}" y2="${py(0)}"/>
      <line class="axis" x1="${px(0)}" x2="${px(0)}" y1="${py(0)}" y2="${py(100)}"/>
      <text class="tick" x="${px(0)}" y="${H - B + 18}">${esc(map.x_axis.low)}</text>
      <text class="tick" x="${px(100)}" y="${H - B + 18}" text-anchor="end">${esc(map.x_axis.high)}</text>
      <text class="axis-title" x="${px(50)}" y="${H - 12}" text-anchor="middle">${esc(map.x_axis.label)} →</text>
      <text class="tick" transform="translate(${L - 10} ${py(0)}) rotate(-90)" text-anchor="start">${esc(map.y_axis.low)}</text>
      <text class="tick" transform="translate(${L - 10} ${py(100)}) rotate(-90)" text-anchor="end">${esc(map.y_axis.high)}</text>
      <text class="axis-title" transform="translate(20 ${py(50)}) rotate(-90)" text-anchor="middle">${esc(map.y_axis.label)} →</text>
      ${players.map((p, i) => `
        <g class="dot${p.is_you ? " you" : ""}${comp.includes(p.name.toLowerCase()) ? " link" : ""}" data-i="${i}" tabindex="0" aria-label="${esc(p.name)}: ${esc(p.note)}">
          <circle class="hit" cx="${px(p.x)}" cy="${py(p.y)}" r="16"/>
          <circle class="mark" cx="${px(p.x)}" cy="${py(p.y)}" r="${p.is_you ? 8 : 6}"/>
        </g>`).join("")}
      ${labels.join("")}
    </svg>
    <div class="map-tip hidden" role="tooltip"></div>`;
  const tip = $(".map-tip", el);
  $$(".dot", el).forEach((g) => {
    const p = players[+g.dataset.i];
    const show = () => {
      const r = g.querySelector(".mark").getBoundingClientRect(), box = el.getBoundingClientRect();
      tip.innerHTML = `<b dir="auto">${esc(p.name)}${p.is_you ? " (you)" : ""}</b><span dir="auto">${esc(p.note)}</span>`;
      tip.classList.remove("hidden");
      const tw = Math.min(260, box.width - 8);
      tip.style.width = `${tw}px`;
      tip.style.left = `${Math.min(box.width - tw, Math.max(0, r.left - box.left - tw / 2))}px`;
      tip.style.top = `${r.bottom - box.top + 8}px`;
    };
    g.addEventListener("mouseenter", show); g.addEventListener("focus", show);
    g.addEventListener("mouseleave", () => tip.classList.add("hidden")); g.addEventListener("blur", () => tip.classList.add("hidden"));
    g.addEventListener("click", () => { const i = comp.indexOf(p.name.toLowerCase()); if (i >= 0) openWsCard(i); });
  });
}

async function openWsCard(i) {
  const k = WS.market.competitors[i];
  $$(".ws-comps .card").forEach((x) => x.classList.toggle("sel", +x.dataset.i === i));
  const out = $("#ws-card");
  out.innerHTML = `<div class="panel"><div class="thinking"><span class="pulse"></span>Writing the battlecard for ${esc(k.name)}…</div></div>`;
  out.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    if (!WS.cards[k.name]) {
      WS.cards[k.name] = await postJSON("/api/workspace/battlecard", { workspace: { about_the_company: WS.profile, market: WS.market, plan: WS.plan }, competitor: k.name });
      saveWS();
    }
  } catch (err) { out.innerHTML = `<p class="error">${esc(err.message)}</p>`; return; }
  const b = WS.cards[k.name];
  out.innerHTML = `
    <div class="ws-battlecard">
      <div class="bc-head"><div><span class="tool-k">Battlecard</span><h2 dir="auto">${esc(k.name)}</h2></div>
        <span class="pill ${threatClass(k.threat)}">${esc(k.threat)} threat</span></div>
      <p class="dismiss" dir="auto"><span class="k">How to win, in one sentence</span>${esc(b.summary)}</p>
      <div class="bc-cols">
        <div class="panel"><h3>Why you win</h3>${list(b.why_we_win)}</div>
        <div class="panel"><h3>Questions that expose their weak spots</h3>${list(b.questions_to_ask)}</div>
        <div class="panel"><h3>Their strengths (concede these)</h3>${list(b.strengths)}</div>
        <div class="panel"><h3>Their weaknesses</h3>${list(b.weaknesses)}</div>
      </div>
      <div class="panel">
        <h3>When they say… you say</h3>
        <div class="claims">${b.they_say.map((t) => `
          <div class="claim"><div class="they" dir="auto"><span class="k">They say</span>"${esc(t.claim)}"</div><div class="we" dir="auto"><span class="k">You say</span>${esc(t.response)}</div></div>`).join("")}
        </div>
      </div>
      <div class="bc-cols" style="margin-top:12px">
        <div class="panel"><h3>Pricing</h3><p dir="auto">${esc(b.pricing)}</p></div>
        <div class="panel"><h3>Watch out</h3><p dir="auto">${esc(b.watch_out)}</p></div>
      </div>
    </div>`;
}

let wsAsking = false;
async function wsAsk(q) {
  if (wsAsking) return;
  wsAsking = true;
  $("#ws-q").value = q;
  const btn = $("#ws-ask button"); btn.disabled = true;
  $("#ws-result").scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const md = await streamAnswer("/api/ask", { question: q, history: wsChat.slice(-4), workspace: knowledge() }, $("#ws-result"),
      { title: q, sub: WS.market.company.name, replace: false, thinking: `Reading the ${WS.market.market_name} overview and everything we know about ${WS.market.company.name}…` });
    if (md) wsChat.push({ role: "user", text: q }, { role: "assistant", text: md });
  } finally { wsAsking = false; btn.disabled = false; }
}

function wsMarkdown() {
  const m = WS.market, c = m.company, p = WS.plan;
  const bullets = (xs) => (xs || []).map((x) => `- ${x}`).join("\n");
  const parts = [
    `**${c.name}:** ${c.one_liner}`, ``,
    `## 1. The market`, m.overview, ``, `**Where the money is:** ${m.where_money_is}`, ``,
    `| Segment | Who buys | Size | Growth |`, `|---|---|---|---|`,
    ...m.segments.map((s) => `| ${s.name} | ${s.buyers} | ${s.size} | ${s.growth} |`), ``,
    `**How buyers choose**`, ...m.buying_criteria.map((k, i) => `${i + 1}. **${k.criterion}:** ${k.why}`), ``,
    ...m.trends.map((t) => `- **${t.title}:** ${t.detail}`), ``,
    `## 2. Market map: ${m.map.x_axis.label} vs ${m.map.y_axis.label}`,
    `| Player | ${m.map.x_axis.label} (0-100) | ${m.map.y_axis.label} (0-100) | Why |`, `|---|---|---|---|`,
    ...m.map.players.map((pl) => `| ${pl.name}${pl.is_you ? " (you)" : ""} | ${pl.x} | ${pl.y} | ${pl.note} |`), ``,
    `| Competitor | Type | Threat | Their edge | Your edge |`, `|---|---|---|---|---|`,
    ...m.competitors.map((k) => `| ${k.name} | ${k.kind} | ${k.threat} | ${k.their_edge} | ${k.your_edge} |`), ``,
  ];
  if (p) {
    parts.push(`## 3. Where ${c.name} stands`, p.position.summary, ``, `**White space:** ${p.position.white_space}`, ``,
      `**Strengths**`, bullets(p.position.strengths), ``, `**Weaknesses**`, bullets(p.position.weaknesses), ``, `**Blind spots**`, bullets(p.position.blind_spots), ``,
      `## 4. How to get better`, ...p.moves.map((mv, i) => `${i + 1}. **${mv.title}** (impact ${mv.impact}, effort ${mv.effort}): ${mv.why} First step: ${mv.first_step}`), ``,
      `### Decision: ${p.decision.question}`, `**Recommendation:** ${p.decision.recommendation}`, ``,
      `**Why**`, bullets(p.decision.reasons), ``, `**When this would be wrong**`, bullets(p.decision.risks), ``, `**Next 30 days**`, bullets(p.decision.next_steps), ``);
  }
  for (const [name, b] of Object.entries(WS.cards)) {
    parts.push(`## Battlecard: ${name}`, b.summary, ``, `**Why you win**`, bullets(b.why_we_win), ``,
      `**Questions to ask**`, bullets(b.questions_to_ask), ``, `**Pricing:** ${b.pricing}`, ``, `**Watch out:** ${b.watch_out}`, ``);
  }
  parts.push(`---`, `AI draft built by Competitor Brief from public market knowledge. Verify key facts before acting on them.`);
  return parts.join("\n");
}

async function wsPdf(btn) {
  btn.disabled = true;
  try { await downloadPdf(`${WS.market.company.name}: market brief`, wsMarkdown()); }
  catch (err) { alert(err.message); }
  finally { btn.disabled = false; }
}
