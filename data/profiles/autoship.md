# AutoShip AI: Competitor Profile
*Fictional demo data · Competitor Brief · Threat level: MEDIUM (loud, early, growing)*

## At a glance
| Field | Value |
|---|---|
| What | "Autonomous releases": AI agent that decides when to promote or roll back |
| HQ / founded | New York, 2024 |
| Funding | $28M (Series A, Feb 2026) |
| Employees | ~45 |
| Pricing | Usage-based: $0.40 per verified deployment; enterprise minimum $60K/yr |
| Compliance | SOC 2 **Type I** only (Type II expected 2027) |
| Seen in | 11% of competitive deals (rising fast: 3% a year ago) |
| Our win rate vs them | **71%** (41 deals) |

## What they are
An AI-native startup with a slick demo: an LLM agent reads metrics and logs, then "decides"
whether a release is healthy. Strong marketing around "autonomous operations".

## Strengths (concede)
- Great story and demo; resonates with AI-forward CTOs.
- Fast setup for Kubernetes + Datadog.
- Natural-language explanations of release health.

## Weaknesses (where we win)
- **Black-box decisions**: verdicts come from an LLM; same inputs can produce different answers.
  Hard to defend to an auditor or in a post-mortem. ShipSafe's verdicts are statistical and
  reproducible, with Copilot explaining them (advice, not decision).
- **Compliance**: SOC 2 Type I only; no ISO 27001, no HIPAA BAA, no PCI. Blocks regulated buyers.
- Few production references at scale (largest public customer ~60 services).
- Integrations: Kubernetes + Datadog only today.
- Usage pricing taxes velocity: the more you ship, the more you pay. At 1,200 deploys/day:
  1,200 × $0.40 × 365 ≈ **$175K/yr**, and it rises every time teams ship more. ShipSafe is priced
  per service, so tripling deploy frequency costs nothing extra.

## Where we lose
- Startups with an AI-first CTO who wants "autonomous" in the story, no compliance pressure.

## Landmine questions
1. "If the AI rolls back a release, can you reproduce exactly why - and explain it to your auditor?"
2. "Which compliance reports can they share today?"
3. "How many customers run them on 200+ services in production?"

## Responses
- **"ShipSafe is not AI-native."** → We use AI where it helps (Copilot explanations, root-cause
  suggestions, MCP for your agents) and statistics where it must be right every time (the
  rollback decision). Ask: "Would you let an LLM approve your production changes without a reproducible reason?"

## Proof
- **Calyx Health** evaluated AutoShip AI; blocked by GRC (no HIPAA BAA, SOC 2 Type I). Chose ShipSafe.

---
*Demo data · fictional · Competitor Brief*
