# Competitor Performance Lab: Claims vs Measured Results
*Fictional demo data · Competitor Brief · Lab round 3, run August 18 - September 12, 2026*

Our DevOps engineers deploy each competitor's product in the same live reference environment,
send real traffic through it, inject the same failures, and measure what actually happens.
Every result below compares the competitor's **public claim** (homepage or docs) with what we
**measured**. Use these numbers with the test conditions; never claim a result "always" happens.

## Reference environment (the same for every product)
| Item | Setup |
|---|---|
| Size | "Mid-size" environment: 60 microservices, 1 AWS EKS cluster (12 x m6i.xlarge nodes) plus 8 ECS services and 4 Lambda functions |
| Traffic | Steady synthetic load of ~1,800 requests/second, replayed from a real e-commerce traffic profile, with a 3x evening peak |
| Observability | Datadog (metrics, APM) and Prometheus |
| Failures injected | **A.** Error spike: new version returns 5% HTTP 500s. **B.** Gradual slowdown: p99 latency rises +400 ms over 10 minutes. **C.** Bad config: a config change breaks checkout for 20% of users. |
| Runs | Each failure injected 10 times per product; we report the **median** (and p90 where useful) |
| Healthy baseline | 100 healthy releases under noisy peak traffic, to count false rollbacks |
| What we time | From the moment the failure starts to the moment the bad version stops serving users |

## Summary scorecard
| Product | Error spike (A), median | Gradual slowdown (B) caught | Bad config (C) | False rollbacks / 100 healthy releases | Setup for 20 services |
|---|---|---|---|---|---|
| **ShipSafe** (our reference) | **41 s** | **10 of 10** (median 3 min 20 s) | Rolled back, 44 s | **0** | 1 engineer-day |
| OpenDeploy | 3 min 10 s | 3 of 10 | Not detected (K8s only, config outside scope) | 4 | 2.5 engineer-days |
| AutoShip AI | 2 min 08 s (p90 3 min 40 s) | 7 of 10 | Rolled back, 2 min 30 s | 1 | 1.5 engineer-days |
| FlagWorks Releases | 4 min 30 s (flagged code only) | 4 of 10 | Not possible: config can't be "flagged off"; manual rollback 11 min | 0 | 2 engineer-days (every change must be wrapped in a flag) |
| KubeRoll | 1 min 50 s | 4 of 10 (default templates) | Not detected | 2 | 3 engineer-days |
| MegaSuite Deploy | 17 min (manual: on-call human approves the rollback) | 0 of 10 automatically | 19 min (manual) | 0 (no automatic rollback at all) | 1.5 engineer-days |
| ChangeDesk | Not in scope: approves changes, does not watch production | 0 of 10 | 0 of 10 | n/a | 2 engineer-days |
| DIY (Argo Rollouts + Flagger) | 1 min 40 s | 5 of 10 | Not detected | 3 | 9 engineer-days to reach parity |

## Results per competitor

### AutoShip AI
- **They claim (homepage):** "Our AI catches bad releases in under 30 seconds."
- **We measured:** median **2 min 08 s** from failure to rollback decision (p90 3 min 40 s). Not one of
  the 10 error-spike runs was under 30 seconds; the fastest was 1 min 14 s.
- **Consistency:** we replayed the identical failure twice in 2 of 20 runs and got **different
  decisions** (one promote, one rollback). The AI's reasons were written explanations, not a
  reproducible statistical test, which matters for auditors.
- **False rollback:** 1 of 100 healthy releases rolled back, explained as "elevated log volume".
- **Cost in the test:** ~$0.40 per verified deployment; 1,140 deployments in the test = $456.
- **Where they did well:** fastest setup of the AI tools for Kubernetes + Datadog (about half a day for the first service).

### OpenDeploy
- **They claim (homepage):** "Set up in 5 minutes."
- **We measured:** first deploy of one service in **6 minutes**, true. But a production-ready setup
  (health checks and rollback thresholds tuned for 20 services) took **2.5 engineer-days**.
- **Detection:** error spike caught in a median **3 min 10 s**. The gradual slowdown was caught
  in only **3 of 10** runs, because fixed thresholds don't see slow drift.
- **False rollbacks:** **4 per 100** healthy releases during peak traffic (noisy thresholds).
- **Coverage:** the 8 ECS services and 4 Lambda functions could not be covered (Kubernetes only).
- **Where they did well:** fastest "hello world" deploy of any product; clean UI. Concede this.

### FlagWorks Releases
- **They claim (homepage):** "Instant kill switch. Turn off any feature in milliseconds."
- **We measured:** turning a flag off reached 95% of server-side SDKs in a median **1.8 s**:
  genuinely fast, faster than any rollback. But client-side SDKs polled every 60 s, and mobile apps
  took up to **5 minutes**.
- **Bad config (C):** a broken config or container image **can't be flagged off**; the manual
  rollback took **11 minutes**.
- **Guarded release detection:** median **4 min 30 s** (default 5-minute metric window); gradual
  slowdown caught in 4 of 10.
- **Where they did well:** best tool when the problem is inside a feature that is already behind a flag. Concede this.

### KubeRoll
- **They claim (docs):** "Automated canary analysis. Zero-downtime rollouts."
- **We measured:** with hand-written PromQL analysis, the error spike was caught in a median **1 min 50 s**.
  With the default analysis templates, the gradual slowdown was caught in only **4 of 10** runs.
- **Setup:** **3 engineer-days** to write and tune analysis templates for 20 services.
- **Coverage:** ECS and Lambda not supported (tests skipped).
- **Where they did well:** lightest controller in the test (0.3 vCPU, 280 MB), versus ShipSafe's agent at 0.4 vCPU, 350 MB per cluster.

### MegaSuite Deploy
- **They claim (homepage):** "Safe deployments, built into the platform you already own."
- **We measured:** there is **no automatic rollback** on degraded metrics. In our drill an on-call
  engineer was paged, checked dashboards and approved the rollback gate: median **17 minutes**
  during business hours (failure B was never caught automatically).
- **Pipeline speed:** the same service took **9 min 40 s** to deploy through the MegaSuite pipeline
  versus **4 min 05 s** with ShipSafe.
- **Where they did well:** zero extra setup for teams already on MegaSuite CI; one vendor.

### ChangeDesk
- **They claim (homepage):** "Approve low-risk changes in seconds with automated risk scoring."
- **We measured:** low-risk auto-approvals took a median **4 minutes** (ServiceNow sync runs on a
  polling interval). Changes scored high-risk waited for the CAB: median **26 hours**.
- **Production safety:** ChangeDesk approves changes **before** they ship; it never watched the
  release, so none of the injected failures (A, B, C) were detected.
- **Where they did well:** best audit trail inside ServiceNow; GRC teams like the reports.

### DIY: Argo Rollouts + Flagger
- **Claim we hear from platform teams:** "We can build this ourselves in a sprint."
- **We measured:** our engineers needed **9 engineer-days** to reach basic parity for 20 services
  (analysis templates, dashboards, Slack alerts, audit export). Error spike caught in a median
  **1 min 40 s**; gradual slowdown caught in **5 of 10**; 3 false rollbacks per 100.
- **Ongoing:** estimated **0.5 FTE** to maintain at this size (upgrades, template tuning).

## How to use these results
- Always say "in our lab test" and give the conditions (mid-size environment, 60 services,
  ~1,800 req/s, 10 runs, median). Offer to rerun the same test in the customer's POV.
- Lead with a claim vs measured pair, e.g. "AutoShip AI says under 30 seconds; in our live test the
  median was 2 minutes 8 seconds."
- Concede where competitors did well (FlagWorks flag-off speed, KubeRoll footprint, OpenDeploy first
  deploy). It makes the rest believable.
- The full lab report and raw run logs can be shared with prospects under NDA.
