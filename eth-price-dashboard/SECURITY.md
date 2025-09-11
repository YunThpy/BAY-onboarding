# Security Policy

## Reporting a Vulnerability
Please **do not** open public issues for security reports.
Email the maintainer or use your private channel. Provide:
- Repro steps
- Impact assessment
- Suggested fix if known

We aim to triage in 48h and patch quickly. Credit is optional by request.

## Scope
- Next.js app under `/app`
- API routes under `/app/api`
- Hardhat smart contract(s) in `/contracts`

## Guidance
- No secrets in Git (`.env` ignored, use `.env.example` as template).
- Keep 1inch API keys server-side only.
- For HyperEVM deploys, use ephemeral keys and rotate regularly.
- Validate addresses client-side and server-side when feasible.
