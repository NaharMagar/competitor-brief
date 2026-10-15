# Security & Procurement FAQ (approved answers)
*Fictional demo data · Competitor Brief*

**Does source code leave our environment?** No. The ShipSafe agent runs in your cluster/VPC. Only deployment metadata (service, version, timestamps, policy results) and aggregated telemetry statistics (e.g., error-rate percentiles per version) are sent to the control plane.

**What access does the agent need?** Deploy permissions scoped to the namespaces/services you onboard, and read-only API access to your observability tool. No access to secrets or databases.

**Certifications?** SOC 2 Type II (report under NDA), ISO 27001, PCI DSS service provider Level 2, HIPAA BAA available, GDPR DPA. **FedRAMP Moderate: In Process, target Q2 2027 - not authorized today.**

**Data residency?** US (us-east) or EU (Frankfurt) control plane; self-hosted control plane on Enterprise (air-gapped supported).

**Encryption?** TLS 1.2+ in transit, AES-256 at rest; customer-managed keys (AWS KMS, GCP KMS, Azure Key Vault) on Enterprise.

**SSO / user management?** SAML 2.0 and OIDC on Business+; SCIM on Enterprise; RBAC with custom roles; full audit log export.

**Availability / SLA?** Business 99.9%, Enterprise 99.95%. If the control plane is unreachable, the agent fails safe: in-flight rollouts pause and keep the last healthy version; you can always deploy manually.

**Pen testing?** Annual third-party penetration test; summary letter available under NDA. Bug bounty since 2024.

**AI and customer data?** Copilot uses deployment metadata and telemetry statistics only; customer data is never used to train models; Copilot can be disabled per workspace. LLM sub-processor listed in the DPA.

**Sub-processors?** Listed in the DPA (cloud hosting, email, support tooling, LLM provider for Copilot). 30 days' notice before changes.

**Typical security review time?** 2-3 weeks for Enterprise; we provide a pre-filled SIG Lite and CAIQ.

**Procurement shortcuts?** AWS/Google Cloud/Azure Marketplace private offers (count toward cloud commits); standard MSA with pre-negotiated fallback clauses; 3-year terms available.

---
*Demo data · fictional · Competitor Brief*
