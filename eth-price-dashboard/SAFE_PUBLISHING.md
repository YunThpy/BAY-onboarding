# Safe Publishing Guide (GitHub)

This repository is prepared to be **safe-by-default** for public GitHub.
Follow this checklist before pushing:

## 1) Secrets & Environment
- **Never commit real secrets.** All environment values must be kept **outside Git**.
- Use `.env.example` as the only env file in Git.
- Locally, create `.env` and fill values:
  - `ONEINCH_API_KEY=<your-1inch-key>`
  - `NEXT_PUBLIC_HL_BUYER_CONTRACT=<deployed-address>`
  - (optional) `PRIVATE_KEY` only for local deploy; **do not** keep it in `.env` on shared machines.

> `.gitignore` already ignores `.env` / `.env.*` and common key formats.

## 2) Hardhat / Deploy
- Use ephemeral deploy keys for HyperEVM. Example:
  ```bash
  PRIVATE_KEY=<hex-no-0x> HYPER_EVM_RPC=https://rpc.hyperliquid.xyz/evm \
  pnpm hardhat run scripts/deploy-hl.ts --network hyperevm
  ```
- After deploying, copy the printed address into `.env` as `NEXT_PUBLIC_HL_BUYER_CONTRACT`.

## 3) 1inch API
- Get your key at 1inch developer portal.
- The key is used **server-side only** via `Authorization: Bearer` header inside Next.js API routes.

## 4) Branch Protections
- Protect `main` branch.
- Require PR reviews and status checks.
- Enable Dependabot alerts & security updates.

## 5) CI (Optional)
- If you add GitHub Actions, store secrets in **Repository Settings → Secrets and variables → Actions**.
- Do not echo secrets in logs. Prefer masked outputs.

## 6) Quick sanity check before committing
- `git status` shows no `.env`, no keys, no `artifacts/` from Hardhat.
- Search for accidental keys: `git grep -n "API_KEY\|PRIVATE_KEY\|Bearer\|sk_"`

---

### Publishing Steps
1. `git init && git remote add origin <your-repo-url>`
2. `cp .env.example .env` and fill locally (do not commit).
3. `git add . && git commit -m "feat: initial public-safe dashboard"`
4. `git push -u origin main`

Stay safe 🚀
