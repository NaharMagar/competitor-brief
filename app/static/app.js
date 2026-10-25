const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Example questions by team. Leadership and marketing first: they are who buys. */
const ROLES = {
  Leadership: [
    "What is our biggest competitive risk right now?",
    "Where are we winning and losing, in one paragraph?",
    "Build vs buy: what does it cost a customer to build this with Argo Rollouts over 3 years?",
  ],
  "Competitor performance": [
    "AutoShip AI says its AI catches a bad release in under 30 seconds. What did we measure in our live test?",
    "OpenDeploy says \"set up in 5 minutes\". How long did a real production setup take in our lab?",
    "FlagWorks promises an instant kill switch. What happened when we pushed a bad config in our live environment?",
  ],
  Marketing: [
    "How should we position against AutoShip AI?",
    "What is our one-line message for each buyer: CTO, CISO and CFO?",
    "Which industry should we focus on next quarter, and why?",
  ],
  Product: [
    "Which missing features cost us the most deals?",
    "What are competitors building that we should watch?",
    "Where does OpenDeploy beat us today?",
  ],
  Sales: [
    "How do we beat OpenDeploy?",
    "The customer says MegaSuite already includes deployment. What do I say?",
    "What does 120 services on Business cost, and what discount can I give?",
  ],
  "Customer success": [
    "Which customer story proves we prevent outages, with numbers?",
    "Which customer story should I use for a bank?",
    "Their security team won't allow an agent in their clusters. How do I answer?",
  ],
};
const THREAT = { "High": ["t-hi", 0], "Medium-High": ["t-mh", 1], "Medium": ["t-md", 2], "Low-Medium": ["t-lo", 3], "Low": ["t-lo", 4] };
const threatClass = (t) => (THREAT[t] || ["t-md"])[0];
const threatRank = (t) => (THREAT[t] || [0, 9])[1];

let META = {}, CARDS = [], PROSPECTS = [];

/* ---------- API ---------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.body ? "POST" : "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 401 && path !== "/api/login") { showLogin(); throw new Error("Please sign in."); }
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { msg = (await res.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return res;
}
const getJSON = async (p) => (await api(p)).json();
const postJSON = async (p, body) => (await api(p, { body })).json();

/* ---------- Streaming answers ---------- */

// Light markdown for the text while it streams in; the server's HTML replaces it at the end.
function draft(md) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const out = []; let list = null; let rows = [];
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.join("")}</${list.tag}>`); list = null; } };
  const flushTable = () => {
    if (rows.length) {
      out.push(`<table>${rows.map((r, i) => `<tr>${r.map((c) => i ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`).join("")}</tr>`).join("")}</table>`);
      rows = [];
    }
  };
  for (const line of md.split("\n")) {
    if (/^\s*\**Sources?:/i.test(line)) continue;
    const ul = line.match(/^\s*[-*+]\s+(.*)/), ol = line.match(/^\s*\d+\.\s+(.*)/), h = line.match(/^(#{1,4})\s+(.*)/);
    if (/^\s*\|/.test(line)) {
      flushList();
      if (!/^\s*\|[\s:|-]+\|?\s*$/.test(line)) rows.push(line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      continue;
    }
    flushTable();
    if (ul || ol) {
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(`<li>${inline((ul || ol)[1])}</li>`);
    } else if (h) { flushList(); out.push(`<h${Math.min(h[1].length + 1, 4)}>${inline(h[2])}</h${Math.min(h[1].length + 1, 4)}>`); }
    else if (line.trim()) { flushList(); out.push(`<p>${inline(line)}</p>`); }
    else flushList();
  }
  flushList(); flushTable();
  return out.join("");
}

function answerCard(title, sub, thinking) {
  const el = document.createElement("article");
  el.className = "answer";
  el.innerHTML = `
    <div class="answer-head"><p class="answer-q">${esc(title)}</p><p class="answer-meta">${esc(sub)}</p></div>
    <div class="answer-body"><div class="doc" dir="auto">
      <div class="thinking"><span class="pulse"></span>${esc(thinking || `Reading ${META.documents || "all"} documents: battlecards, lab tests, pricing, customer stories…`)}</div>
    </div></div>
    <div class="answer-foot hidden"></div>`;
  return el;
}

/** Stream an AI answer into a new card in `container`. Resolves to the final markdown (or null on error). */
async function streamAnswer(path, body, container, { title, sub, pdfTitle, replace = true, thinking }) {
  const card = answerCard(title, sub, thinking);
  if (replace) container.innerHTML = "";
  container.prepend(card);
  const doc = $(".doc", card), meta = $(".answer-meta", card), foot = $(".answer-foot", card);
  const t0 = performance.now();
  let text = "", final = null;
  try {
    const res = await api(path, { body });
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.error) throw new Error(msg.error);
        if (msg.delta) { text += msg.delta; doc.innerHTML = draft(text); doc.lastElementChild?.classList.add("caret"); }
        if (msg.done) final = msg;
      }
    }
    if (!final) throw new Error("The answer was cut off. Please try again.");
  } catch (err) {
    doc.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    return null;
  }
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  doc.innerHTML = final.html;
  meta.textContent = `${sub ? sub + " · " : ""}Answered in ${secs} s`;
  foot.classList.remove("hidden");
  foot.innerHTML = `
    <div class="sources">${final.sources.length ? `<span class="k">Sources</span>${final.sources.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}` : ""}</div>
    <div class="actions"><button class="link" data-a="copy">Copy</button><button class="link" data-a="pdf">Download PDF</button></div>`;
  $('[data-a="copy"]', foot).onclick = async (e) => {
    await navigator.clipboard.writeText(final.markdown);
    e.target.textContent = "Copied"; setTimeout(() => (e.target.textContent = "Copy"), 1500);
  };
  $('[data-a="pdf"]', foot).onclick = () => downloadPdf(pdfTitle || title, final.markdown);
  return final.markdown;
}

async function downloadPdf(title, markdown) {
  const res = await api("/api/export-pdf", { body: { title, markdown } });
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: `${title.replace(/[^\w]+/g, "-").slice(0, 60)}.pdf` });
  a.click(); URL.revokeObjectURL(url);
}

/* ---------- Routing: #ask, #cards, #cards/<slug>, #objections, #briefings ---------- */
const VIEWS = ["company", "ask", "cards", "objections", "briefings"];
let currentView = null;
function route() {
  let [view, slug] = location.hash.slice(1).split("/");
  if (!VIEWS.includes(view)) view = "company";
  $("#ws-pill-text").textContent = view === "company" ? "Preview · AI draft" : "Example: ShipSafe (invented)";
  if (view === "company") renderCompany(slug);
  $$(".view").forEach((v) => v.classList.toggle("hidden", v.id !== `view-${view}`));
  $$("nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
  if (view === "cards") {
    const c = CARDS.find((x) => x.slug === slug);
    $("#cards-list").classList.toggle("hidden", !!c);
    $("#card-detail").classList.toggle("hidden", !c);
    if (c) renderBattlecard(c);
  }
  if (view !== currentView || view === "cards") window.scrollTo(0, 0);
  currentView = view;
}
window.addEventListener("hashchange", route);
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

/* ---------- Ask ---------- */
const chat = [];
let asking = false;
function renderRoles() {
  const names = Object.keys(ROLES);
  $("#roles").innerHTML = names.map((r, i) => `<button class="role-tab" role="tab" aria-selected="${i === 0}" data-role="${esc(r)}">${esc(r)}</button>`).join("");
  const pick = (r) => {
    $$(".role-tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.role === r));
    $("#examples").innerHTML = ROLES[r].map((q) => `<button class="example" data-q="${esc(q)}">${esc(q)}</button>`).join("");
    $$("#examples .example").forEach((b) => b.addEventListener("click", () => ask(b.dataset.q)));
  };
  $$(".role-tab").forEach((b) => b.addEventListener("click", () => pick(b.dataset.role)));
  pick(names[0]);
}

async function ask(q) {
  if (asking) return;
  asking = true;
  go("#ask");
  $("#question").value = q;
  const btn = $("#ask-form button"); btn.disabled = true;
  // Keep the previous answer, collapsed, under "Earlier in this session".
  const prev = $("#result .answer");
  if (prev) {
    const d = document.createElement("details");
    d.className = "earlier";
    d.innerHTML = `<summary>${esc($(".answer-q", prev).textContent)}</summary>`;
    d.append(prev);
    $("#earlier").prepend(d);
    $("#earlier-wrap").classList.remove("hidden");
  }
  $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const md = await streamAnswer("/api/ask", { question: q, history: chat.slice(-4) }, $("#result"), { title: q, sub: "" });
    if (md) chat.push({ role: "user", text: q }, { role: "assistant", text: md });
  } finally { asking = false; btn.disabled = false; }
}
$("#ask-form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#question").value.trim(); if (q) ask(q); });

function renderLab() {
  const lab = META.lab;
  $("#lab-round").textContent = lab.round;
  $("#lab-env").textContent = `Test setup: ${lab.environment}.`;
  $("#lab-kpis").innerHTML = lab.kpis.map((k) => `
    <div class="stat"><span class="label">${esc(k.label)}</span><span class="num">${esc(k.value)}</span><span class="note">${esc(k.note)}</span></div>`).join("");
  const max = Math.max(...lab.time_to_stop.map((r) => r.seconds));
  $("#chart").innerHTML = lab.time_to_stop.map((r) => `
    <button class="bar-row${r.ours ? " ours" : ""}" ${r.slug ? `data-slug="${esc(r.slug)}"` : "disabled"} aria-label="${esc(r.name)}: ${esc(r.label)}">
      <span class="bar-name">${esc(r.name)}</span>
      <span class="bar-track"><span class="bar" style="display:block;width:${Math.max(2, (r.seconds / max) * 100)}%"></span></span>
      <span class="bar-val">${esc(r.label)}</span>
    </button>`).join("");
  $("#chart-note").textContent = lab.time_to_stop_note;
  $$("#chart .bar-row[data-slug]").forEach((b) => b.addEventListener("click", () => go(`#cards/${b.dataset.slug}`)));
  $("#lab-claims").innerHTML = lab.claims.map((c) => `
    <a class="lab-claim" href="#cards/${esc(c.slug)}">
      <span class="lc-name">${esc(c.name)}</span>
      <span class="lc-claim"><span class="k">They say</span>${esc(c.claim)}</span>
      <span class="lc-measured"><span class="k">We measured</span>${esc(c.measured)}</span>
      <span class="verdict ${c.held ? "held" : "failed"}">${c.held ? "Partly true" : "Didn't hold up"}</span>
    </a>`).join("");
}

/* ---------- Competitors ---------- */
function renderCompetitors() {
  const sorted = [...CARDS].sort((a, b) => threatRank(a.threat) - threatRank(b.threat) || b.deals - a.deals);
  $("#comp-grid").innerHTML = sorted.map((c) => `
    <a class="card" href="#cards/${esc(c.slug)}">
      <div class="card-top"><h3>${esc(c.name)}</h3><span class="pill ${threatClass(c.threat)}">${esc(c.threat)} threat</span></div>
      <p>${esc(c.tagline)}</p>
      <div class="mini" aria-hidden="true"><div style="width:${c.win_rate}%"></div></div>
      <div class="card-meta"><span>We win <b>${c.win_rate}%</b></span><span><b>${c.deals}</b> deals</span></div>
    </a>`).join("");
  $("#obj-comp").insertAdjacentHTML("beforeend", CARDS.map((c) => `<option>${esc(c.name)}</option>`).join(""));
}

function renderBattlecard(c) {
  const d = $("#card-detail");
  d.innerHTML = `
    <a class="back" href="#cards">← All competitors</a>
    <div class="bc-head">
      <div><h1>${esc(c.name)}</h1><p class="lead">${esc(c.tagline)}</p></div>
      <div class="bc-kpis">
        <div><span>We win</span><b>${c.win_rate}%</b></div>
        <div><span>Deals</span><b>${c.deals}</b></div>
        <div><span>Threat</span><b><span class="pill ${threatClass(c.threat)}">${esc(c.threat)}</span></b></div>
      </div>
    </div>
    <p class="dismiss"><span class="k">In one sentence</span>${esc(c.quick_dismiss)}</p>
    <div class="bc-cols">
      <div class="panel"><h3>Why we win</h3><ul>${c.why_we_win.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="panel"><h3>Questions that expose their weak spots</h3><ul>${c.landmines.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
    <div class="panel">
      <h3>When they say… you say</h3>
      <div class="claims">${c.they_say.map((t) => `
        <div class="claim"><div class="they"><span class="k">They say</span>"${esc(t.claim)}"</div><div class="we"><span class="k">You say</span>${esc(t.response)}</div></div>`).join("")}
      </div>
    </div>
    <div class="panel proof" style="margin-top:12px"><span class="tool-k">Customer proof</span><span>${esc(c.proof)}</span></div>
    <div class="bc-actions">
      <button class="btn primary" id="bc-ask">Ask: how do we beat ${esc(c.name)}?</button>
      <button class="btn" id="bc-profile">Show full profile</button>
    </div>
    <div id="profile-body"></div>`;
  $("#bc-ask").onclick = () => ask(`How do we beat ${c.name}?`);
  $("#bc-profile").onclick = async (e) => {
    e.target.disabled = true;
    try {
      const r = await getJSON(`/api/profiles/${c.slug}`);
      $("#profile-body").innerHTML = `<div class="panel doc">${r.html}</div>`;
      e.target.remove();
    } catch { e.target.disabled = false; }
  };
}

/* ---------- Objections ---------- */
let objecting = false;
async function handleObjection(text, competitor) {
  if (objecting) return;
  objecting = true;
  const btn = $("#obj-form button"); btn.disabled = true;
  $("#obj-out").scrollIntoView({ behavior: "smooth", block: "center" });
  try {
    await streamAnswer("/api/objection", { objection: text, competitor: competitor || null }, $("#obj-out"),
      { title: `"${text}"`, sub: competitor ? `${competitor} deal` : "Any competitor", pdfTitle: `Objection: ${text}` });
  } finally { objecting = false; btn.disabled = false; }
}
$("#obj-form").addEventListener("submit", (e) => { e.preventDefault(); const t = $("#obj-text").value.trim(); if (t) handleObjection(t, $("#obj-comp").value); });

function renderLibrary(list) {
  $("#obj-count").textContent = `· ${list.length}`;
  $("#obj-lib").innerHTML = list.map((o) => `
    <details class="lib-item">
      <summary><span class="cat">${esc(o.category)}</span><span class="obj">"${esc(o.objection)}"</span></summary>
      <div class="lib-body">
        <p>${esc(o.response)}</p>${o.proof ? `<p><b>Proof:</b> ${esc(o.proof)}</p>` : ""}
        <button class="link" data-obj="${esc(o.objection)}">Tailor this to my deal →</button>
      </div>
    </details>`).join("");
  $$("#obj-lib button[data-obj]").forEach((b) => b.addEventListener("click", () => {
    $("#obj-text").value = b.dataset.obj; handleObjection(b.dataset.obj, $("#obj-comp").value);
  }));
}

/* ---------- Account briefs ---------- */
let briefing = false;
async function brief(body, name) {
  if (briefing) return;
  briefing = true;
  const btn = $("#brief-form button"); btn.disabled = true;
  $("#brief-out").scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    await streamAnswer("/api/briefing", body, $("#brief-out"), { title: `Account brief: ${name}`, sub: "Pre-call brief" });
  } finally { briefing = false; btn.disabled = false; }
}
function renderProspects() {
  $("#prospect-grid").innerHTML = PROSPECTS.map((p) => `
    <button class="card" data-slug="${esc(p.slug)}">
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="tag">${esc(p.industry)}</span></div>
      <p>${esc(p.trigger)}</p>
      <div class="card-meta"><span><b>${esc(p.engineers)}</b> engineers</span><span>Today: <b>${esc(p.current)}</b></span></div>
    </button>`).join("");
  $$("#prospect-grid .card").forEach((el) => el.addEventListener("click", () => {
    if (briefing) return;
    const p = PROSPECTS.find((x) => x.slug === el.dataset.slug);
    $$("#prospect-grid .card").forEach((x) => x.classList.toggle("sel", x === el));
    brief({ slug: p.slug }, p.name);
  }));
}
$("#brief-form").addEventListener("submit", (e) => { e.preventDefault(); const t = $("#brief-text").value.trim(); if (t) brief({ text: t }, "Custom account"); });

/* ---------- Sign in & boot ---------- */
function showLogin() { $("#app").classList.add("hidden"); $("#login").classList.remove("hidden"); $("#code").focus(); }
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault(); $("#login-error").textContent = "";
  const btn = $("#login-form button"); btn.disabled = true;
  try { await postJSON("/api/login", { code: $("#code").value }); await boot(); }
  catch (err) { $("#login-error").textContent = err.message; }
  finally { btn.disabled = false; }
});

async function boot() {
  try {
    [META, CARDS, PROSPECTS] = await Promise.all([getJSON("/api/meta"), getJSON("/api/battlecards"), getJSON("/api/prospects")]);
    const objs = await getJSON("/api/objections");
    $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
    renderRoles(); renderLab(); renderCompetitors(); renderLibrary(objs); renderProspects();
    route();
  } catch { showLogin(); }
}
boot();
