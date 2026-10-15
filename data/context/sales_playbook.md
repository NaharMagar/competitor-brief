# ShipSafe Sales Playbook
*Fictional demo data · Competitor Brief*

## 1. Sales motion
- **Inbound/PLG:** Starter (free) sign-ups → product-qualified leads when a team connects 3+
  services and runs 10+ verified canaries in 14 days. SDR reaches out within 24h.
- **Outbound:** SDRs target ICP accounts with a buying trigger (outage in the news, SOC 2/PCI audit
  season, platform-engineering job posts, AI-coding-tool rollout).
- **Partner-sourced:** AWS Marketplace (EDP burn-down is a strong closer), GSIs.
- Segments: Commercial (<500 engineers, Business tier, AE owns end-to-end), Enterprise (500+
  engineers, AE + SE + CSM pod).

## 2. Stages & exit criteria
| Stage | Exit criteria | Typical length |
|---|---|---|
| 1. Discovery | Pain confirmed (deploy-caused incidents, audit pain or velocity goal); champion identified | 1-2 weeks |
| 2. Technical validation | Demo on their stack; observability tool confirmed supported; success criteria agreed in writing | 2-3 weeks |
| 3. Proof of value (POV) | 2-4 services live with verified canaries for 14 days; at least one caught regression OR measured verification accuracy | 2-4 weeks |
| 4. Business case | ROI model signed off by economic buyer; security review started | 1-3 weeks |
| 5. Negotiation & close | Mutual action plan dated; legal + security complete | 2-4 weeks |

## 3. Qualification (MEDDPICC)
- **Metrics:** change failure rate, MTTR for deploy-caused incidents, deploys/day, hours of audit prep.
- **Economic buyer:** VP Eng/CTO (velocity) or CISO (audit) - know which budget you are in.
- **Decision criteria:** we win when verification quality, multi-runtime and audit evidence are on the list. Push to add them.
- **Decision process:** security review always required for Enterprise (~3 weeks), plan it in stage 2.
- **Paper process:** MSA + DPA; AWS Marketplace private offer shortens procurement by ~3 weeks.
- **Identify pain:** quantify the last 3 deploy-caused incidents (duration × cost/minute).
- **Champion:** usually Platform Engineering lead or SRE manager.
- **Competition:** always ask "what else are you looking at, including building it yourselves?"

## 4. Discovery questions by persona
**VP Engineering**
1. How many deploys a day today, and what's the goal for next year?
2. How many of last quarter's incidents started with a change? What did the worst one cost?
3. How much has AI-generated code changed your change volume?
4. Who decides to roll back today, and how long does it take?

**Platform Engineering lead**
1. How are rollouts done today - Argo Rollouts, Flagger, scripts? Who maintains them?
2. How many runtimes do you deploy to (K8s, ECS, Lambda, VMs)?
3. What would you rather your team be building instead of deployment glue?

**SRE manager**
1. What % of pages are deploy-related? How fast do you detect a bad release?
2. Do you have SLOs/error budgets? Do releases consume them?

**CISO / GRC**
1. Which audits are you subject to and when is the next one?
2. How do you prove each production change was approved, tested and monitored?
3. How many engineering days does audit evidence collection take?

## 5. Demo flow (30 minutes, "the bad deploy")
1. (3 min) Their pain in their words - recap discovery.
2. (8 min) Ship a release to a demo checkout service with a planted latency regression. Show Verify
   comparing canary vs baseline, the statistical verdict and **automatic rollback in under a minute**.
3. (5 min) Open the explainable verdict: which signal failed and why. Show the Slack message.
4. (6 min) Guard: show the policy file (freeze window, approvals), then export the audit evidence pack.
5. (5 min) Insights: DORA dashboard and "cost of incidents avoided".
6. (3 min) Next step: propose the POV with 2-4 of their services.

## 6. Proof of value (POV) rules
- Max 4 weeks, max 4 services, written success criteria (template: `POV-success-criteria-v3`).
- SE-led install, typically < 2 hours with the agent's Helm chart.
- Success = at least 2 of: (a) verification verdicts match SRE judgment ≥ 95%, (b) one real
  regression caught, (c) audit evidence pack accepted by their GRC team, (d) rollout scripts
  retired for POV services.
- POV win rate: **78%** (deals that complete a structured POV), vs 41% for deals that skip it.

## 7. Pricing & negotiation guardrails
- AE can discount up to **15%** without approval.
- 15-25%: Regional VP Sales approval. >25%: CRO + CFO (rare, only for logo value or competitive displacement of MegaSuite).
- Multi-year: 3-year prepaid adds up to 10% extra discount.
- Never discount Guard below list when the deal is audit-driven - it's the reason they're buying.
- Give-gets: discount only in exchange for case study, reference calls, 3-year term, or close-by date.
- AWS Marketplace private offers allowed for any deal ≥ $50K.
- Ramp deals allowed: year 1 at 60% of services, full by month 12.

## 8. ROI framework (use in stage 4)
1. **Incident cost avoided** = (deploy-caused Sev-1/2 incidents per year) × 62% × (avg duration × cost per minute).
   - Typical cost per minute of downtime: e-commerce $5K-$20K, fintech $8K-$25K, SaaS $1K-$5K.
2. **Engineering time returned** = rollout-script maintenance (0.5-3 FTE) + manual release babysitting
   (15-30 min per deploy × deploys) + audit prep (avg 6 weeks → <1 week).
3. **Velocity** = 3.1x deploy frequency → faster feature delivery (hard to quantify; use as narrative).
- Fully loaded engineer cost assumption: $210K/yr (US), $140K (EU), adjust to the customer.
- Typical payback: **4-7 months** on Business, **6-9 months** on Enterprise.

## 9. Mutual action plan template (Enterprise)
Week 0 kickoff → Week 1 POV install → Week 3 POV readout → Week 4 business case to EB → Week 5
security review complete → Week 6 legal/procurement → Week 7 signature → Week 8 production onboarding.

## 10. Handoff to Customer Success
- Within 48h of close: CSM intro, onboarding plan, "first 10 services" list.
- Goal: **first verified production canary within 9 days**, 50% of services onboarded by day 60.

---
*Demo data · fictional · Competitor Brief*
