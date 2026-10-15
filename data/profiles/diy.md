# Build-it-yourself (Argo Rollouts / Flagger + scripts): Competitor Profile
*Fictional demo data · Competitor Brief · Threat level: HIGH ("no decision" is our #3 loss reason)*

## At a glance
| Field | Value |
|---|---|
| What | In-house rollout logic: Argo Rollouts or Flagger + custom scripts + dashboards + a human watching |
| Seen in | 31% of deals list "build" as an option |
| Our win rate when DIY is the alternative | **52%** |

## True cost of DIY (use in the business case)
| Cost item | Typical (300 services, 400 engineers) |
|---|---|
| Platform engineers maintaining rollout + analysis code | 1.5-3 FTE → $315K-$630K/yr |
| Manual release babysitting (20 min × 60 deploys/day × 250 days) | ~5,000 hrs/yr → ~$500K |
| Audit evidence collection | 6 weeks × 3 engineers per audit → ~$70K per audit |
| Deploy-caused incidents not caught | Customer-specific; typically the largest number |
| **Total (excluding incidents)** | **~$0.9M-$1.2M/yr** vs ShipSafe Enterprise ~$270K |

## Strengths (concede)
- Full control; no vendor; Argo/Flagger are solid open-source projects.
- Platform teams enjoy building it.

## Weaknesses
- Only Kubernetes; each new runtime is a new project.
- Analysis templates drift; thresholds tuned by hand; nobody owns them after the author leaves.
- No audit evidence, no DORA, no explainable verdicts, no cross-team standard.

## How to win
- Respect the build: "Argo Rollouts is great. ShipSafe runs **on top of** it (we can drive Argo
  Rollouts as the executor) and adds statistical verification, governance and every other runtime."
- Build a 3-year TCO together with the champion; include attrition risk ("bus factor").
- Ask: "Is deployment safety your company's product, or is it a utility you'd rather not maintain?"

---
*Demo data · fictional · Competitor Brief*
