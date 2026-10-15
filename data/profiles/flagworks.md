# FlagWorks: Competitor Profile
*Fictional demo data · Competitor Brief · Threat level: MEDIUM-HIGH (adjacent leader expanding into our space)*

## At a glance
| Field | Value |
|---|---|
| What | Feature-flag and experimentation platform; added "FlagWorks Releases" (Sept 2025) |
| HQ / founded | Seattle, 2015 |
| Funding | $210M (Series D, 2022) |
| Employees | ~600 |
| Pricing | Per seat ($20-45/seat/month) + monthly active users (MAU) for client-side flags; Releases add-on +30% |
| Seen in | 21% of competitive deals |
| Our win rate vs them | **64%** (77 deals) |

## What they are
The best-known feature-flag company. Product and engineering teams use FlagWorks to turn
features on/off and run experiments. In 2025 they launched "Releases": guarded rollouts of
*flags* with metric monitoring, positioned as "progressive delivery".

## Their pitch
"Decouple deploy from release. Every feature behind a flag, rolled out safely."

## Strengths (concede)
- Category leader in feature flags and experimentation; huge brand, polished product.
- Product managers love it (experiments, targeting, A/B tests).
- Often already purchased by the product org, so they're "already in the building".

## Weaknesses (where we win)
- **Flags only protect code that's wrapped in a flag.** Infrastructure changes, config changes,
  dependency upgrades, database migrations and unflagged code (most of AI-generated code) aren't
  covered. ShipSafe verifies the *whole deployment*.
- **No infrastructure rollback.** A bad container image or config can't be "flagged off".
- Guarded rollouts use their own SDK metrics; limited integration with Datadog/Prometheus
  service-level signals compared to ShipSafe Verify.
- **Flag debt**: customers accumulate thousands of stale flags; adds code complexity.
- Expensive at scale: seats + MAU; Releases add-on increases the bill ~30%.
- No audit evidence pack for infra/deploy changes.

## Where we lose to them
- When the buyer is the product org and the main need is experimentation.
- Companies already deeply standardized on flags-for-everything with low infra change volume.

## Positioning: complement, not war
Lead with **"FlagWorks controls features; ShipSafe controls deployments."** Many customers run
both (Lumora Media, Quantia Insurance). We integrate: ShipSafe reads FlagWorks flag events into
verification context. Make the competitor the *gap*, not the company.

## Landmine questions
1. "What share of your production changes are behind a flag today - including infra, config and dependency updates?"
2. "When a bad container image or Helm value goes out, how does a flag roll it back?"
3. "How many active flags do you have, and who cleans them up?"

## Their attacks → our responses
- **"You don't have feature flags."** → Correct, by design: we cover the 70-80% of changes that
  aren't behind a flag, and integrate with your flag tool. ShipSafe Flags (Q1 2027, NDA) covers
  simple release toggles.
- **"Decouple deploy from release."** → Agreed, and the deploy itself still has to be safe.

## Proof
- **Lumora Media** (streaming): runs FlagWorks for experiments and ShipSafe for 260 services;
  ShipSafe caught a CDN-config regression no flag could have covered (would have affected 2.1M viewers).

## Recent news (fictional)
- Sept 2026: FlagWorks "Releases 2.0" adds Datadog metrics import (beta).
- Layoffs of ~8% in March 2026; focus on enterprise upsell.

---
*Demo data · fictional · Competitor Brief*
