# OpenDeploy: Competitor Profile
*Fictional demo data · Competitor Brief · Threat level: HIGH (most frequent competitor)*

## At a glance
| Field | Value |
|---|---|
| What | Open-core continuous deployment tool for Kubernetes |
| HQ / founded | San Francisco, 2018 |
| Funding | $65M (Series B, 2023, led by Corvid Capital) |
| Employees | ~180 |
| Open source | OpenDeploy OSS, Apache-2.0, ~14K GitHub stars |
| Pricing | Free OSS; OpenDeploy Cloud **$35 per developer/month**; Enterprise (self-hosted, SSO, support) ~$55/dev/month |
| Seen in | 38% of our competitive deals (most frequent) |
| Our win rate vs them | **58%** (last 4 quarters, 141 deals) |

## What they are
OpenDeploy started as a popular open-source GitOps-style deployment tool for Kubernetes and added a
hosted cloud product. Developers love the UI and the fast start: install with one Helm command,
see deploys in minutes. It's the default choice for startups and for platform teams that prefer
open source.

## Their pitch
"Developer-first deployments. Open source, no lock-in, set up in 5 minutes."

## Strengths (concede these honestly)
- Excellent developer experience and UI; strong community and brand with engineers.
- Free OSS version, so they often arrive already installed by a team.
- Fast time-to-value for a single Kubernetes cluster.
- Good GitOps model and Argo CD compatibility.

## Weaknesses (where we win)
- **Kubernetes only.** No ECS, Lambda, Cloud Run, Azure Container Apps or VMs. Most enterprises run 2+ runtimes.
- **Verification is threshold-based**: "fail if error rate > X%". No statistical baseline comparison,
  so it's noisy (false rollbacks) or too loose (misses gradual latency regressions). Customers
  report tuning thresholds per service by hand.
- **No audit evidence pack.** Approvals exist, but no linked change record (ticket → PR → approver →
  verification). GRC teams still collect evidence manually.
- **Per-developer pricing explodes at scale**: 800 developers × $55 × 12 = **$528K/yr**, vs ~$200-270K for ShipSafe Enterprise at similar size.
- Enterprise support: business-hours only below $250K contracts; no 24/7 P1 unless premium.
- Self-hosted Enterprise requires customers to run Postgres + Redis + their control plane.

## Where we lose to them
- Small teams (<50 engineers), K8s-only, no audit pressure, cost-sensitive.
- Teams with a strong "open source only" policy.
- When the champion is a single developer who already runs OpenDeploy OSS and the buyer never hears the verification story.

## Landmine questions (plant these early)
1. "Besides Kubernetes, which runtimes do you deploy to today - ECS, Lambda, VMs? Will they be in scope in 2 years?"
2. "How do you want rollback decisions made - fixed thresholds you tune per service, or a statistical comparison to the current version?"
3. "When your auditor asks for evidence that change #4,521 was approved, tested and monitored, how will you produce it?"
4. "How many developers will you have in 3 years? How would per-developer pricing scale?"

## Their attacks → our responses
- **"ShipSafe is closed source / lock-in."** → Our agent's rollout definitions are plain YAML,
  exportable to Argo Rollouts format; we publish our verification methodology; no source code
  leaves your environment. Lock-in is lower than maintaining forked OSS internally.
- **"We're free."** → OSS is free; the people to run it aren't. Customers spend 0.5-2 FTE
  maintaining rollout logic and thresholds. And OpenDeploy Cloud is $35-55 per developer, every month.
- **"ShipSafe is overkill for us."** → Start on Team ($1,800/month, 30 services) and grow; unlimited users.

## Proof: displacement stories
- **Brightpay** (fintech, 420 engineers): moved from OpenDeploy Enterprise after a PCI audit
  finding on change evidence; added ECS services OpenDeploy couldn't cover; annual cost down 31%.
- **Hexa Games**: OpenDeploy thresholds caused 14 false rollbacks in a month during a launch;
  ShipSafe's statistical verification had 0 false rollbacks over the same traffic replay in the POV.

## Recent news (fictional)
- Aug 2026: OpenDeploy announced "OpenDeploy Insights" (DORA dashboards), still K8s only.
- Jun 2026: Raised prices for OpenDeploy Cloud from $29 to $35 per developer/month.
- Rumored: working on ECS support (no date). Don't argue it; ask for it in writing for the POV.

---
*Demo data · fictional · Competitor Brief*
