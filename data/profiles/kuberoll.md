# KubeRoll: Competitor Profile
*Fictional demo data · Competitor Brief · Threat level: MEDIUM*

## At a glance
| Field | Value |
|---|---|
| What | Kubernetes-native GitOps progressive delivery, open source (Apache-2.0) with paid support |
| HQ / founded | Berlin, 2021 |
| Funding | $18M Series A (2024) |
| Employees | ~55 |
| Pricing | OSS free; "KubeRoll Pro" support $40K-$120K/yr flat |
| Seen in | 14% of competitive deals |
| Our win rate vs them | **61%** (52 deals) |

## What they are
A CNCF-style open-source controller for Kubernetes canary and blue/green rollouts with GitOps.
Popular with platform teams who want full control and like building their own platform.

## Strengths (concede)
- Free and open; strong technical credibility in the Kubernetes community.
- Flexible: any analysis you can script in PromQL.
- Flat-fee support is cheap.

## Weaknesses (where we win)
- **Kubernetes only**; no ECS/Lambda/VMs.
- **DIY verification**: teams write and maintain PromQL analysis templates per service; no statistical baseline engine, no explainable verdicts.
- **No governance or audit evidence**; no approvals, freeze windows or evidence export.
- No UI beyond a basic dashboard; no DORA insights; no Slack verdicts.
- Small company: 55 people, support from Berlin business hours (24/7 only on top tier).

## Where we lose
- Pure-K8s platform teams with strong "build it ourselves" culture and no audit pressure.

## Landmine questions
1. "Who writes and maintains the analysis templates for each of your services?"
2. "How will you show your auditor which checks each release passed?"
3. "What happens when your ECS or Lambda workloads need the same safety?"

## Responses
- **"It's free."** → Free software, expensive people: customers we displaced spent ~1.5 FTE
  maintaining KubeRoll analysis templates (~$315K/yr at $210K fully loaded).

## Proof
- **Ferro Retail Group**: replaced KubeRoll after Black Friday; their hand-written PromQL checks
  missed a gradual p99 latency regression that cost ~$740K in abandoned carts.

---
*Demo data · fictional · Competitor Brief*
