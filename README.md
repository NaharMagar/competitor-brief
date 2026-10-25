# Competitor Brief demo

A sales and go-to-market copilot shown on a **fictional** company. ShipSafe is a made-up
deployment-safety SaaS, and all 7 competitors, customers, prospects and numbers are invented.
The app is used to demo what a competitive-intelligence assistant can do for a sales team.

- **Live:** https://competitor-brief-qmhggel5zq-uc.a.run.app (access code: `Brief-Demo-26`)
- **GCP:** project `rivalyst-demo-f9efeb`, account `competitivebrief93@gmail.com`, Cloud Run
  service `competitor-brief` in `us-central1`. Budget alert: 75 ILS/month at 50/90/100%.
- **AI:** Gemini on Vertex AI through the runtime service account (no API keys). The default is
  `gemini-3-flash-preview`, which falls back automatically to `gemini-2.5-flash`.

## What's inside
| Tab | What it does |
|---|---|
| Your company | Landing page after sign-in. One sentence about any company (yours, a client's or an invented one), plus optional details. Step 1 (~20 s): an overview of the whole market: segments, how buyers choose, trends, where the money is, and a market map placing every player including the company. Step 2 (~15 s more): where the company stands (white space, strengths, weaknesses, blind spots), 5 moves to improve ranked by impact vs effort, and a decision brief, using every detail given plus the market analysis. Then battlecards on demand, Ask scoped to that company, and a PDF brief. Stored only in the visitor's browser (`app/workspace.py`, `app/static/company.js`) |
| Ask | ShipSafe sample. Free-form questions with example questions per team (leadership, marketing, product, sales, customer success); answers stream in with source chips, copy and PDF. Below: "What we found in our lab" (competitor claims vs measured results, from `data/lab_tests.json`) |
| Competitors | 7 competitor cards ranked by threat; each opens a battlecard (`#cards/<slug>`): one-line dismiss, why we win, landmine questions, "they say / you say", proof, full profile |
| Objections | A response to say on the call, why it works, the next question and the best proof. Includes a library of 15 objections |
| Account briefs | 8 fictional prospects, or describe any account, to get a 1-minute pre-call brief |

## Knowledge base (`data/`)
`context/` holds the company primer, sales playbook, messaging, win/loss, security FAQ and market.
`profiles/` has one file per competitor. `customers/` has the case studies. `prospects/` has
`prospects.json`. Also `battlecards.json` and `objections.json`.
The whole corpus (~66K characters) is sent to the model on every call, so to change an answer,
edit the data files and redeploy.

## Run locally
    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    COOKIE_SECURE=0 DEMO_CODE=test GCP_PROJECT_ID=rivalyst-demo-f9efeb .venv/bin/uvicorn app.main:app --port 8765
(The AI tabs need Application Default Credentials that can call Vertex AI on the project.)

## Deploy
    CLOUDSDK_CORE_ACCOUNT=competitivebrief93@gmail.com gcloud run deploy competitor-brief --source . \
      --project=rivalyst-demo-f9efeb --region=us-central1 --allow-unauthenticated \
      --memory=1Gi --max-instances=3 --concurrency=20 --timeout=180 \
      --set-env-vars="GCP_PROJECT_ID=rivalyst-demo-f9efeb,VERTEX_REGION=global,DEMO_CODE=Brief-Demo-26,MODEL_ID=gemini-3-flash-preview,FALLBACK_MODEL=gemini-2.5-flash"

To change the access code, change `DEMO_CODE` and redeploy. Each visitor is limited to
40 AI calls per 10 minutes.
