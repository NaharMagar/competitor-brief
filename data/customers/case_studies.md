# Customer Case Studies & References
*Fictional demo data · Competitor Brief. "Reference: Yes" = approved for reference calls (max 2 calls per quarter each).*

| Customer | Industry | Size | Tier / ACV | Replaced | Reference |
|---|---|---|---|---|---|
| Northwind Freight | Logistics | 900 engineers, 180 → 410 services | Enterprise, $310K | DIY scripts + manual watching | Yes (VP Platform) |
| Calyx Health | Healthtech (HIPAA) | 350 engineers | Enterprise, $205K | Evaluated AutoShip AI; DIY Flagger | Yes (CISO) |
| Brightpay | Fintech (PCI) | 420 engineers | Enterprise, $188K | OpenDeploy Enterprise | Yes (Head of SRE) |
| Orbital Bank | Regional bank (SOX) | 1,100 engineers | Enterprise, $395K | MegaSuite Deploy (kept MegaSuite CI) | Yes (CTO), finance prospects only |
| Lumora Media | Streaming | 600 engineers | Enterprise, $260K | Manual + FlagWorks-only | Yes (Director Eng) |
| Ferro Retail Group | E-commerce/retail | 280 engineers | Business, $118K | KubeRoll | Yes |
| Quantia Insurance | Insurance | 500 engineers | Enterprise, $232K | ChangeDesk-only process | No (logo only) |
| Hexa Games | Gaming | 210 engineers | Business, $96K | OpenDeploy Cloud | Yes |

## Northwind Freight (flagship)
- **Challenge:** 40 deploys/day, team watching dashboards after each; a bad config took the
  booking API down 52 minutes in peak season (~$1.1M impact).
- **Result:** 23 bad releases caught and rolled back in Q1 (median 38s); deploy pages -70%;
  SOC 2 prep from 5 weeks to 4 days; now 120 deploys/day; services 180 → 410.
- **Quote:** "ShipSafe is the reason we stopped having release-night war rooms." (VP Platform)

## Calyx Health
- **Challenge:** HIPAA + SOC 2; manual CAB; 2-week release trains.
- **Result:** daily releases; change failure rate 18% → 5%; auditors accepted the evidence pack with zero findings.
- Chose ShipSafe over AutoShip AI because of HIPAA BAA, SOC 2 Type II and explainable verdicts.
- **Quote:** "For the first time, our change management is faster *and* stronger." (CISO)

## Brightpay
- **Challenge:** PCI audit finding on change evidence; OpenDeploy didn't cover ECS payment services.
- **Result:** all 140 services on one platform (K8s + ECS); audit finding closed; total cost -31% vs OpenDeploy per-developer pricing.

## Orbital Bank
- **Challenge:** 9 deploy-caused Sev-1s in a year; MegaSuite Deploy used only for manual gates.
- **Result:** deploy-caused Sev-1s 9 → 2 in 12 months; SOX change evidence automated; MegaSuite CI kept.
- Best reference for: banks, MegaSuite displacement, SOX.

## Lumora Media
- **Result:** caught a CDN-config regression during a live event that would have hit 2.1M viewers; runs FlagWorks alongside (complement story).

## Ferro Retail Group
- **Result:** after KubeRoll missed a gradual p99 regression on Black Friday (~$740K lost carts), moved 95 services to ShipSafe; next Black Friday: 0 deploy-caused incidents, 3 automatic rollbacks.

## Quantia Insurance
- **Result:** low-risk changes auto-approved by ShipSafe Guard policies with evidence attached; CAB load -60%; change lead time from 3 days to 4 hours. Logo only, no reference calls.

## Hexa Games
- **Result:** launch-day releases with 0 false rollbacks (OpenDeploy thresholds had produced 14 in a month); deploy frequency 2.6x.

## Quick picker: which reference for which prospect
- Bank / SOX / MegaSuite shop → **Orbital Bank**
- Healthcare / HIPAA / AI-startup competitor → **Calyx Health**
- Fintech / PCI / OpenDeploy → **Brightpay**
- Retail / peak season / KubeRoll or DIY → **Ferro Retail Group**, **Northwind Freight**
- Media / gaming / FlagWorks / launch events → **Lumora Media**, **Hexa Games**

---
*Demo data · fictional · Competitor Brief*
