const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const COMMON = [
  "How do we beat OpenDeploy?",
  "30-second pitch for a CISO",
  "Price for 120 services on Business, and discount limits",
  "TCO argument when the customer wants to build with Argo Rollouts",
  "Which customer story should I use for a bank?",
  "Are we FedRAMP authorized?",
  "Why do we lose to MegaSuite?",
];

const START_QS = [
  "Sales: How do we beat OpenDeploy?",
  "GTM: Which industry should we focus on next quarter, and why?",
  "Product: Which missing features cost us the most deals?",
  "Marketing: How should we position against AutoShip AI?",
  "Leadership: What is our biggest competitive risk right now?",
  "Customer success: Which customer story proves we prevent outages?",
];

const SUGGESTED = {
  "Win against a competitor": [
    "How do we beat OpenDeploy?",
    "The customer says MegaSuite is already included. What do I say?",
    "AutoShip AI says their AI makes better rollback decisions. How do I respond?",
  ],
  "Pricing & deals": [
    "How much is 120 services, and what discount can I give?",
    "The customer wants to build it with Argo Rollouts. What's the 3-year cost argument?",
  ],
  "Messaging": [
    "30-second pitch for a CISO",
    "What should I say to a VP Engineering who worries about AI-generated code?",
  ],
  "Customers & proof": [
    "Which customer story should I use for a bank?",
    "Which customer story proves we prevent outages, with numbers?",
  ],
  "GTM & marketing": [
    "Which industry should we focus on next quarter, and why?",
    "What is our one-line message for each buyer: CTO, CISO, CFO?",
  ],
  "Product": [
    "Which missing features cost us the most deals?",
    "What are competitors building that we should watch?",
  ],
  "Leadership": [
    "What is our biggest competitive risk right now?",
    "Where are we winning and losing, in one paragraph?",
  ],
  "Security & procurement": [
    "Are we FedRAMP authorized? What exactly do I say?",
    "Their security team won't allow an agent in their clusters. How do I answer?",
  ],
};

function renderSuggestions(el) {
  el.innerHTML = `<div class="try-grid">${Object.entries(SUGGESTED).map(([g, qs]) => `
    <div class="try-group"><h3>${esc(g)}</h3><ul>${qs.map((q) => `<li><button class="link" data-q="${esc(q)}">${esc(q)}</button></li>`).join("")}</ul></div>`).join("")}</div>`;
  el.querySelectorAll("button[data-q]").forEach((b) => b.addEventListener("click", () => { show("ask"); search(b.dataset.q); }));
}

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

/* sign in */
function showLogin() { $("#app").classList.add("hidden"); $("#login").classList.remove("hidden"); $("#code").focus(); }
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault(); $("#login-error").textContent = "";
  try { await postJSON("/api/login", { code: $("#code").value }); boot(); }
  catch (err) { $("#login-error").textContent = err.message; }
});

/* navigation */
function show(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $(`#view-${view}`).classList.remove("hidden");
  document.querySelectorAll("nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
  window.scrollTo(0, 0);
}
document.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.view); }));

/* result document with copy / PDF links */
function resultDoc(r, title, metaHtml = "") {
  const box = document.createElement("div");
  box.className = "result";
  box.innerHTML = `${metaHtml}<div class="doc">${r.html}</div>
    <div class="result-actions"><button class="link" data-a="copy">Copy text</button><button class="link" data-a="pdf">Download PDF</button></div>`;
  box.querySelector('[data-a="copy"]').onclick = async (e) => { await navigator.clipboard.writeText(r.markdown); e.target.textContent = "Copied"; setTimeout(() => (e.target.textContent = "Copy text"), 1500); };
  box.querySelector('[data-a="pdf"]').onclick = () => downloadPdf(title, r.markdown);
  return box;
}
async function downloadPdf(title, markdown) {
  const res = await api("/api/export-pdf", { body: { title, markdown } });
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: `${title.replace(/[^\w]+/g, "-").slice(0, 60)}.pdf` });
  a.click(); URL.revokeObjectURL(url);
}
const loading = (t) => `<p class="loading">${esc(t)}</p>`;

/* overview */
function renderOverview(meta) {
  $("#t-win").textContent = `${meta.overall_win_rate}%`;
  $("#t-deals").textContent = meta.competitive_deals;
  $("#t-pov").textContent = `${meta.pov_win_rate}%`;
  $("#t-acv").textContent = `$${Math.round(meta.avg_acv / 1000)}K`;
  const rows = [...meta.competitors].sort((a, b) => b.win_rate - a.win_rate);
  const tip = document.createElement("div"); tip.className = "tooltip hidden"; document.body.append(tip);
  $("#chart").innerHTML = rows.map((c) => `
    <div class="bar-row">
      <span class="bar-name" title="${esc(c.name)}">${esc(c.name)}</span>
      <div class="bar-track" data-tip="${esc(c.name)}: ${c.win_rate}% won of ${c.deals} deals"><div class="bar" style="width:${c.win_rate}%"></div></div>
      <span class="bar-val">${c.win_rate}%</span>
    </div>`).join("");
  $("#chart").querySelectorAll(".bar-track").forEach((t) => {
    t.addEventListener("mousemove", (e) => { tip.textContent = t.dataset.tip; tip.classList.remove("hidden"); tip.style.left = `${e.clientX + 12}px`; tip.style.top = `${e.clientY + 12}px`; });
    t.addEventListener("mouseleave", () => tip.classList.add("hidden"));
  });
  $("#chart-table").innerHTML = "<thead><tr><th>Competitor</th><th>Win rate</th><th>Deals</th></tr></thead><tbody>" +
    rows.map((c) => `<tr><td>${esc(c.name)}</td><td class="num-cell">${c.win_rate}%</td><td class="num-cell">${c.deals}</td></tr>`).join("") + "</tbody>";
  $("#home-links").innerHTML = COMMON.map((q) => `<li><button class="link" data-q="${esc(q)}">${esc(q)}</button></li>`).join("");
  $("#home-links").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { show("ask"); search(b.dataset.q); }));
}

/* search */
const history = [];
const recent = [];
async function search(q) {
  $("#question").value = q;
  const out = $("#result");
  out.innerHTML = loading("Searching…");
  const btn = $("#ask-form button"); btn.disabled = true;
  const t0 = performance.now();
  window.scrollTo({ top: 0, behavior: "smooth" });
  try {
    const r = await postJSON("/api/ask", { question: q, history: history.slice(-4) });
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    const src = (r.markdown.match(/Sources?:\s*(.+)\s*$/i) || [])[1];
    const n = src ? src.split(",").filter((x) => x.trim()).length : 0;
    r.meta = `Answered in <b>${secs} seconds</b>${n ? ` · drawn from <b>${n} document${n > 1 ? "s" : ""}</b>` : ""}`;
    out.innerHTML = "";
    out.append(resultDoc(r, q, `<p class="result-q">${esc(q)}</p><p class="result-meta">${r.meta}</p>`));
    $("#suggest-title").textContent = "Try another question";
    history.push({ role: "user", text: q }, { role: "assistant", text: r.markdown });
    recent.unshift({ q, r }); recent.splice(8);
    renderRecent();
  } catch (err) { out.innerHTML = `<p class="error">${esc(err.message)}</p>`; }
  finally { btn.disabled = false; }
}
function renderRecent() {
  $("#recent-wrap").classList.toggle("hidden", recent.length < 2);
  $("#recent").innerHTML = recent.slice(1).map((x, i) => `<li><button class="link" data-i="${i + 1}">${esc(x.q)}</button></li>`).join("");
  $("#recent").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    const x = recent[+b.dataset.i]; $("#question").value = x.q;
    $("#result").innerHTML = ""; $("#result").append(resultDoc(x.r, x.q, `<p class="result-q">${esc(x.q)}</p><p class="result-meta">${x.r.meta || ""}</p>`));
    window.scrollTo(0, 0);
  }));
}
$("#ask-form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#question").value.trim(); if (q) search(q); });

/* competitors */
let CARDS = [];
function renderCompetitors() {
  $("#comp-table").innerHTML = `<thead><tr><th>Competitor</th><th class="hide-sm">Description</th><th>Threat</th><th>Win rate</th><th class="hide-sm">Deals</th></tr></thead><tbody>` +
    CARDS.map((c) => `<tr data-slug="${c.slug}"><td><b>${esc(c.name)}</b></td><td class="hide-sm muted">${esc(c.tagline)}</td><td class="threat">${esc(c.threat)}</td><td class="num-cell">${c.win_rate}%</td><td class="num-cell hide-sm">${c.deals}</td></tr>`).join("") + "</tbody>";
  $("#comp-table").querySelectorAll("tbody tr").forEach((tr) => tr.addEventListener("click", () => openCard(tr.dataset.slug)));
  $("#obj-comp").insertAdjacentHTML("beforeend", CARDS.map((c) => `<option>${esc(c.name)}</option>`).join(""));
}
function openCard(slug) {
  const c = CARDS.find((x) => x.slug === slug);
  document.querySelectorAll("#comp-table tbody tr").forEach((tr) => tr.classList.toggle("sel", tr.dataset.slug === slug));
  const d = $("#card-detail"); d.classList.remove("hidden");
  d.innerHTML = `
    <div class="detail-head"><h2>${esc(c.name)}</h2><span class="muted">Win rate ${c.win_rate}% · ${c.deals} deals · ${esc(c.threat)} threat</span></div>
    <p class="summary">${esc(c.quick_dismiss)}</p>
    <div class="cols">
      <div><h2>Why we win</h2><ul>${c.why_we_win.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div><h2>Questions to ask</h2><ul>${c.landmines.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    </div>
    <h2 style="margin-top:18px">If they say</h2>
    ${c.they_say.map((t) => `<div class="qa"><b>"${esc(t.claim)}"</b>${esc(t.response)}</div>`).join("")}
    <p class="kv"><b>Customer proof:</b> ${esc(c.proof)}</p>
    <p><button class="link" id="full-profile">Show full profile</button></p>
    <div id="profile-body" class="doc"></div>`;
  $("#full-profile").onclick = async (e) => {
    e.target.disabled = true;
    try { const r = await getJSON(`/api/profiles/${slug}`); $("#profile-body").innerHTML = r.html; e.target.remove(); }
    catch (err) { e.target.disabled = false; }
  };
  d.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* objections */
async function handleObjection(text, competitor) {
  const out = $("#obj-out");
  out.innerHTML = loading("Preparing response…");
  try {
    const r = await postJSON("/api/objection", { objection: text, competitor: competitor || null });
    out.innerHTML = "";
    out.append(resultDoc(r, `Objection - ${text}`, `<p class="result-q">"${esc(text)}"</p><p class="result-meta">${competitor ? esc(competitor) + " deal" : "General"}</p>`));
  } catch (err) { out.innerHTML = `<p class="error">${esc(err.message)}</p>`; }
}
$("#obj-form").addEventListener("submit", (e) => { e.preventDefault(); handleObjection($("#obj-text").value.trim(), $("#obj-comp").value); });
function renderLibrary(list) {
  $("#obj-lib").innerHTML = list.map((o) => `
    <details class="lib-item"><summary><span class="cat">${esc(o.category)}</span><span>"${esc(o.objection)}"</span></summary>
      <p>${esc(o.response)}</p>${o.proof ? `<p><b>Proof:</b> ${esc(o.proof)}</p>` : ""}
      <button class="link" data-obj="${esc(o.objection)}">Adapt to my deal</button></details>`).join("");
  $("#obj-lib").querySelectorAll("button[data-obj]").forEach((b) => b.addEventListener("click", () => {
    $("#obj-text").value = b.dataset.obj; handleObjection(b.dataset.obj, $("#obj-comp").value); window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

/* account briefs */
function renderProspects(list) {
  $("#prospect-table").innerHTML = `<thead><tr><th>Account</th><th class="hide-sm">Industry</th><th class="hide-sm">Engineers</th><th>Current setup</th><th class="hide-sm">Recent event</th></tr></thead><tbody>` +
    list.map((p) => `<tr data-slug="${p.slug}"><td><b>${esc(p.name)}</b><br><span class="muted">${esc(p.hq)}</span></td><td class="hide-sm">${esc(p.industry)}</td><td class="num-cell hide-sm">${p.engineers}</td><td>${esc(p.current)}</td><td class="hide-sm muted">${esc(p.trigger)}</td></tr>`).join("") + "</tbody>";
  $("#prospect-table").querySelectorAll("tbody tr").forEach((tr) => tr.addEventListener("click", () => {
    const p = list.find((x) => x.slug === tr.dataset.slug);
    document.querySelectorAll("#prospect-table tbody tr").forEach((x) => x.classList.toggle("sel", x === tr));
    brief({ slug: p.slug }, p.name);
  }));
}
async function brief(body, title) {
  const out = $("#brief-out");
  out.innerHTML = loading(`Preparing brief for ${title}…`);
  out.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const r = await postJSON("/api/briefing", body);
    out.innerHTML = "";
    out.append(resultDoc(r, `Account brief - ${title}`, `<p class="result-q">${esc(title)}</p><p class="result-meta">Pre-call brief</p>`));
  } catch (err) { out.innerHTML = `<p class="error">${esc(err.message)}</p>`; }
}
$("#brief-form").addEventListener("submit", (e) => { e.preventDefault(); const t = $("#brief-text").value.trim(); if (t) brief({ text: t }, "Custom account"); });

/* boot */
async function boot() {
  try {
    const [meta, cards, objs, pros] = await Promise.all([getJSON("/api/meta"), getJSON("/api/battlecards"), getJSON("/api/objections"), getJSON("/api/prospects")]);
    CARDS = cards;
    $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
    renderOverview(meta); renderCompetitors(); renderLibrary(objs); renderProspects(pros);
    renderSuggestions($("#suggestions"));
    $("#start-questions").innerHTML = START_QS.map((x) => { const [role, q] = x.split(/:\s(.+)/); return `<li><span class="role">${esc(role)}</span><button class="link" data-q="${esc(q)}">${esc(q)}</button></li>`; }).join("");
    $("#start-questions").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { show("ask"); search(b.dataset.q); }));
    document.querySelectorAll("#view-start [data-try]").forEach((b) => b.addEventListener("click", () => { show("ask"); search(b.dataset.try); }));
    document.querySelectorAll("#view-start [data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
    show("start");
  } catch { showLogin(); }
}
boot();
