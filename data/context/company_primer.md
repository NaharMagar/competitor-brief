# ShipSafe: Company Primer
*Fictional company for the Competitor Brief demo. All names, numbers and customers are invented.*

## 1. One-liner
**ShipSafe is the deployment safety platform.** Every release goes out progressively, is verified
automatically against live telemetry, and is rolled back in seconds if anything degrades, with
the change evidence your auditors need collected along the way.

Tagline: **"Ship daily. Sleep nightly."**

## 2. Company facts
| Field | Value |
|---|---|
| Founded | 2020, Austin, Texas |
| Offices | Austin (HQ), Lisbon (R&D), London (EMEA sales) |
| Employees | ~240 (R&D 110, Sales & Marketing 75, CS 30, G&A 25) |
| Funding | $142M total. Series C $90M (March 2025) led by Halberd Ventures; earlier: Northgate Capital, Ridgeline Partners |
| ARR | $41M (FY2026), +63% YoY |
| Customers | 310 paying customers; 62 at $150K+ ACV |
| Net revenue retention | 128% |
| Gross logo retention | 94% |
| Average ACV | $118K (Business tier avg $95K, Enterprise avg $240K) |
| Sales cycle | Median 74 days (Business), 121 days (Enterprise) |
| Analyst recognition | Named a **Leader** in the Gridline Research Wave: Progressive Delivery Platforms, Q2 2026 (highest score for "Release Verification") |
| Founders | Maya Lindqvist (CEO, ex-SRE lead at a large streaming company), Daniel Okafor (CTO, built the internal deployment system at a global ride-hailing company) |

## 3. The problem we solve
- **Most production incidents are caused by changes.** Across our customer base, 71% of Sev-1/Sev-2
  incidents in the 90 days before onboarding were triggered by a deployment or config change.
- Teams want to ship faster (business pressure, AI-generated code increasing change volume), but
  every extra deploy is extra risk.
- Today's "safety" is manual: a human watches dashboards for 15-30 minutes after a deploy, then
  decides to roll back. It's slow, inconsistent and doesn't scale to 50+ deploys a day.
- Auditors (SOC 2, ISO 27001, PCI, SOX) require change-management evidence. Teams assemble it by
  hand from Jira, GitHub and Slack before every audit: **weeks of engineering time a year**.
- AI coding assistants roughly doubled change volume at many customers in 2025-26; change failure
  rate rose with it.

## 4. Product (five modules)
### ShipSafe Release (progressive delivery)
- Canary, blue/green, ring-based and percentage rollouts.
- Runtimes: **Kubernetes, Amazon ECS, AWS Lambda, Google Cloud Run, Azure Container Apps and plain
  VMs (Linux)**. Windows VMs on the roadmap (Q2 2027).
- Works with any CI: GitHub Actions, GitLab CI, Jenkins, CircleCI, Buildkite; and GitOps (Argo CD,
  Flux). We don't replace CI; we take over at "deploy".

### ShipSafe Verify (automated release verification), our crown jewel
- Pulls metrics, logs and traces from Datadog, Prometheus, New Relic, Grafana, Splunk, Dynatrace,
  Elastic and OpenTelemetry.
- Compares the new version against the baseline with **statistical analysis** (not fixed
  thresholds): error rate, latency percentiles, saturation, business KPIs (checkout rate, logins).
- Automatic rollback. **Median time from regression to rollback: 41 seconds** (customer
  telemetry, Q3 2026).
- "Explainable verdicts": every rollback shows exactly which signal failed and by how much.

### ShipSafe Guard (change governance)
- Policy-as-code: approvals, freeze windows, separation of duties, risk scoring per change.
- **Automatic audit evidence pack**: every change linked to ticket, PR, approver, test results,
  verification outcome. One-click export for SOC 2, ISO 27001, PCI DSS, SOX, HIPAA auditors.
- ServiceNow and Jira Service Management integrations for organizations with a CAB.

### ShipSafe Insights
- DORA metrics (deploy frequency, lead time, change failure rate, MTTR) per team and service.
- "Cost of incidents" view: translates rollbacks avoided into revenue protected.

### ShipSafe Copilot (AI release assistant), beta, GA in Q4 2026
- Explains failed releases in plain language, suggests likely root cause (diff + telemetry).
- Lives in Slack and Microsoft Teams; **MCP server** so engineers' own AI agents (Claude, Cursor,
  Copilot) can check release status and safety before acting.
- Copilot never deploys or rolls back on its own; humans or policies decide.

## 5. Architecture & security (short version)
- SaaS control plane (US: us-east, EU: Frankfurt) + lightweight **agent in the customer's cluster or
  VPC**. Source code never leaves the customer. Only deployment metadata and aggregated telemetry
  statistics reach the control plane.
- Self-hosted control plane available on Enterprise (air-gapped supported).
- SOC 2 Type II, ISO 27001, GDPR, HIPAA BAA available. PCI DSS service provider (Level 2).
  FedRAMP Moderate: "In Process" target Q2 2027 (not yet authorized; never say otherwise).
- SSO (SAML/OIDC), SCIM, RBAC, audit logs, customer-managed keys (Enterprise).

## 6. Pricing (list)
| Tier | Price | Includes |
|---|---|---|
| Starter | Free | Up to 5 services, Release + basic Verify (Prometheus only), community support |
| Team | $1,800/month (billed annually: $21,600/yr) | Up to 30 services, all Verify integrations, Insights, business-hours support |
| Business | $72,000/yr | 75 services included, +$700 per extra service/yr, Guard (standard policies), SSO, 99.9% SLA |
| Enterprise | From $180,000/yr | 150 services included, +$600 per extra service/yr, full Guard + audit evidence pack, SCIM, self-hosted option, customer-managed keys, dedicated CSM, 99.95% SLA, 24/7 P1 support |

- **Pricing unit is the "service"** (a deployable unit), never per developer. Unlimited users on every
  paid tier. This is a key differentiator against per-seat competitors (OpenDeploy, FlagWorks).
- Copilot: included in Business and Enterprise during 2026; expected add-on from 2027 (not priced yet).
- Worked examples:
  - 120 services on Business: $72,000 + 45 × $700 = **$103,500/yr**.
  - 300 services on Enterprise: $180,000 + 150 × $600 = **$270,000/yr**.

## 7. Ideal customer profile (ICP)
- 200-3,000 engineers; 80+ production services; 20+ deploys a day or a goal to get there.
- Kubernetes or ECS in production, a modern observability tool (Datadog, Prometheus, New Relic...).
- Strongest in: **fintech & banking, healthcare, e-commerce/retail, media/streaming, gaming, SaaS**.
- Buying triggers: a costly outage caused by a deploy; an upcoming audit (SOC 2, PCI, SOX); a
  platform-engineering initiative; adoption of AI coding tools increasing change volume; a merger
  that forces standardizing deployment.

## 8. Buyer personas
| Persona | Cares about | Lead with |
|---|---|---|
| VP / Head of Engineering | Velocity without incidents, team morale, DORA | "3.1x more deploys with 62% fewer failed changes" |
| Platform Engineering lead | Standard golden path, less glue code | "Replace 4,000 lines of rollout scripts with one policy file" |
| SRE / Reliability manager | MTTR, on-call load, error budgets | "Rollback in 41 seconds, before the pager fires" |
| CISO / GRC | Change control, audit evidence | "Audit evidence collected automatically for every change" |
| CFO / COO | Cost of outages, headcount | "Each prevented Sev-1 saves $180K-$1.2M for our e-commerce customers" |
| CTO | Strategy, AI-era change volume, vendor risk | "Make AI-generated code safe to ship" |

## 9. Proof points (customer medians, verified in QBRs)
- Change failure rate: **-62%** median within 6 months.
- MTTR for deploy-caused incidents: **48 min → 6 min** median.
- Deploy frequency: **3.1x** in 9 months.
- Audit prep time: **-85%** (from ~6 weeks to under 1 week of engineering time per audit).
- Rollout scripts retired: avg **3,800 lines** of in-house deployment code per customer.
- Time to first verified canary: **median 9 days** from contract signature.

## 10. Partners
- AWS (Advanced Technology Partner, available in AWS Marketplace, counts toward EDP commits).
- Google Cloud Marketplace, Azure Marketplace (since Aug 2026).
- Datadog, New Relic and Grafana Labs technology partners.
- GSIs: Ferrum Consulting (North America), Altavia Digital (EMEA).

## 11. Roadmap (share only under NDA, never commit dates in writing)
| Quarter | Item |
|---|---|
| Q4 2026 | Copilot GA; Database migration verification (beta): checks schema changes before and after rollout |
| Q1 2027 | Lightweight feature flags ("ShipSafe Flags"), included in Enterprise |
| Q1 2027 | Cost-aware rollouts: flag releases that raise cloud cost per request |
| Q2 2027 | Windows VM support; FedRAMP Moderate authorization target |
| H2 2027 | Mobile app release verification (iOS/Android staged rollouts) |

## 12. Known gaps (be honest, have the answer ready)
- No full feature-flag/experimentation product (FlagWorks wins there). Answer: integrate with
  FlagWorks, or use ShipSafe Flags (Q1 2027) for simple release flags.
- No Windows VMs until Q2 2027.
- Not FedRAMP authorized yet (target Q2 2027).
- Mobile app releases not covered.
- Smallest teams (<20 engineers) often find Starter/Team enough or choose OpenDeploy OSS.

---
*Demo data · fictional · Competitor Brief*
