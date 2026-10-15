# Competitor Brief demo

A sales and go-to-market copilot shown on a **fictional** company. ShipSafe is a made-up
deployment-safety SaaS, and all 7 competitors, customers, prospects and numbers are invented.
The app is used to demo what a competitive-intelligence assistant can do for a sales team.

- **Live:** https://rivalyst-978154020895.us-central1.run.app (access code: `Competitor Brief-Demo-26`)
- **GCP:** project `rivalyst-demo-f9efeb`, account `competitivebrief93@gmail.com`, Cloud Run
  service `competitor-brief` in `us-central1`. Budget alert: 75 ILS/month at 50/90/100%.
- **AI:** Gemini on Vertex AI through the runtime service account (no API keys). The default is
  `gemini-3-flash-preview`, which falls back automatically to `gemini-2.5-flash`.

## What's inside
| Tab | What it does |
|---|---|
| Overview | KPI tiles and win rate by competitor |
| Ask Competitor Brief | Free-form questions, answered only from `data/`, with sources, copy and PDF |
| Battlecards | 7 competitors: quick dismiss, why we win, landmines, "they say / you say", proof, full profile |
| Objection handler | A response to say on the call, why it works, the next question and the best proof. Includes a library of 15 objections |
| Pre-call briefings | 8 fictional prospects, or describe any prospect, to get a 2-minute brief |

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
      --set-env-vars=GCP_PROJECT_ID=rivalyst-demo-f9efeb,VERTEX_REGION=global,DEMO_CODE=Competitor Brief-Demo-26,MODEL_ID=gemini-3-flash-preview,FALLBACK_MODEL=gemini-2.5-flash

To change the access code, change `DEMO_CODE` and redeploy. Each visitor is limited to
40 AI calls per 10 minutes.
