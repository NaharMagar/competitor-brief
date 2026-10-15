# ShipSafe Messaging & Positioning
*Fictional demo data · Competitor Brief*

## Positioning statement
For engineering organizations that ship many times a day, **ShipSafe** is the deployment safety
platform that verifies every release against live production signals and rolls it back in
seconds, while collecting audit evidence automatically. Unlike CI/CD suites that stop at "deploy"
or open-source rollout tools you have to wire together yourself, ShipSafe makes every change safe
by default, across every runtime, with verdicts you can explain to an engineer and an auditor.

## Elevator pitches
**10 seconds:** "We make every deploy safe: each release is checked against live production data
and rolled back in about 40 seconds if it hurts users."

**30 seconds:** "Most outages start with a change. ShipSafe rolls every release out gradually,
compares the new version to the old one using your existing Datadog or Prometheus data, and
rolls back automatically, typically in 41 seconds, before customers notice. It also records every
change for your auditors, so SOC 2 and PCI evidence is ready without anyone chasing screenshots.
Customers cut failed changes by 62% and ship three times as often."

**2 minutes (story):** "Northwind Freight was deploying 40 times a day with a team watching
dashboards after every release. One bad config change took their booking API down for 52
minutes during peak season. They put ShipSafe in front of their 180 services. In the first
quarter, ShipSafe caught 23 bad releases, rolled each back in under a minute, and their on-call
pages from deploys dropped 70%. Their SOC 2 audit prep went from five weeks to four days because
every change already had its approval, tests and verification attached. Today they deploy 120
times a day. That's what we'd like to prove with you in a 3-week proof of value."

## Value pillars
1. **Catch bad releases automatically**: statistical verification, not fixed thresholds; explainable verdicts.
2. **Recover in seconds**: automated rollback, median 41s; no human in the loop at 3 a.m.
3. **Audit-ready by default**: every change carries its evidence; one-click export.
4. **One platform, every runtime**: K8s, ECS, Lambda, Cloud Run, Azure Container Apps, VMs.
5. **Priced for scale**: per service, unlimited users; no per-developer tax as you grow.

## Persona messages
- **VP Eng:** "Ship 3x more often without adding incidents."
- **Platform lead:** "Delete your rollout scripts. One policy file, every runtime."
- **SRE:** "Bad releases are rolled back before the pager fires."
- **CISO:** "Change management that proves itself to the auditor."
- **CFO:** "Each avoided Sev-1 pays for a year of ShipSafe."
- **CTO:** "AI writes more code than ever. ShipSafe makes it safe to ship."

## Words we use / avoid
- Use: *deployment safety, release verification, explainable verdicts, audit-ready, per service*.
- Avoid: *"zero downtime guaranteed"* (we never guarantee it), *"AI decides your releases"*
  (verification is statistical and explainable; Copilot advises, it doesn't decide),
  *"FedRAMP authorized"* (we are not yet).

## Proof points to quote (approved)
- "-62% change failure rate, 3.1x deploy frequency, 41-second median rollback" (customer medians).
- "Leader, Gridline Research Wave: Progressive Delivery Platforms, Q2 2026."
- "310 customers including Northwind Freight, Calyx Health, Brightpay and Orbital Bank."

---
*Demo data · fictional · Competitor Brief*
