# AuditLens

Automated security scanner for GenLayer Intelligent Contracts. LLM validators run an 8-point audit and store structured, tamper-evident reports on-chain with severity scores.

**Network:** GenLayer Studionet (chain id 61999, hosted simulator) — fast consensus + built-in faucet, best for live demos. The contract also deploys to Bradbury (4221, real validators) but LLM-audit consensus there is currently flaky (validator timeouts on long prompts).
**Live:** _set after deploy — see Deployed Contract below_

---

## How It Works

1. Paste a GenLayer contract into the editor
2. Click **Scan Contract**
3. LLM validators reach consensus on vulnerabilities
4. A structured report is stored on-chain, **bound to a sha256 hash of the exact source audited**, with a 0-100 score
5. Anyone can **Verify Report** — the audit is re-run and the **actual findings set** is compared (not just the aggregate score); on a match the original auditor earns on-chain reputation

### Tamper-evident binding & findings-based verification

Each report stores `source_hash = sha256(contract_source)`. Re-verification re-derives that hash from the stored source and asserts it still matches, then re-runs the audit and compares the **findings** (categories + severities + descriptions, order-independent) via a separate comparative equivalence-principle consensus call. The 0-100 score is kept only as a secondary guard. Two audits that find different vulnerabilities but happen to score ~75 no longer pass verification.

### Consensus model

The audit and re-audit use **`gl.eq_principle_prompt_non_comparative`** — each validator independently runs the audit and checks it against fixed criteria (valid JSON, score 0-100, findings array, genuine security review). This is what makes subjective, verbose LLM audit reports converge: validators don't have to match the leader's exact wording, only meet the criteria. Findings-comparison during verification uses `gl.eq_principle_prompt_comparative` (comparing two concrete finding strings), with the score tolerance as a deterministic fallback guard.

### py-genlayer API note

The pinned `py-genlayer` build exposes a **flat API** (no `gl.nondet.*` / `gl.eq_principle.*` / `gl.vm.*` namespaces). The contract uses:
- `gl.exec_prompt(prompt)` (was `gl.nondet.exec_prompt`)
- `gl.eq_principle_prompt_non_comparative(fn, task=, criteria=)` and `gl.eq_principle_prompt_comparative(fn, principle)`
- `gl.message.sender_address`, `gl.public.write`, `gl.public.view`, `gl.Contract` (unchanged)

## Vulnerability Classes

1. Prompt injection in `gl.exec_prompt`
2. Hardcoded secrets or private data
3. Missing domain whitelisting for `gl.web.render` / `gl.get_webpage`
4. Wrong equivalence principle for data volatility
5. Missing access control on `@gl.public.write`
6. Unsafe JSON parsing
7. Reentrancy-like cross-contract calls
8. Divide-by-zero or arithmetic issues

## Tech Stack

| Layer | Tech |
|-------|------|
| Contract | Python (py-genlayer) |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| Editor | Monaco Editor |
| Web3 | genlayer-js + MetaMask |
| Hosting | Vercel (`frontend/vercel.json`) |

## Project Structure

```
├── contracts/
│   └── auditlens.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── deployed.ts        # committed build-time contract address (not gitignored)
│   │   ├── components/
│   │   │   ├── ReportViewer.tsx
│   │   │   ├── TransactionModal.tsx
│   │   │   └── LandingPage.tsx
│   │   └── main.tsx
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.ts
├── deploy.mjs                  # deploy to Studionet (Node) — writes .env + src/deployed.ts
├── scripts/deploy.py           # deploy to Studionet (Python) — same outputs
├── tests/
│   └── test_sanitize_json.py
└── README.md
```

## Setup

```bash
cd frontend
npm install
```

## Deploy Contract

Put your private key in `frontend/.env` as `PRIVATE_KEY=0x...`. Studionet has a built-in faucet (wallets are auto-funded); for Bradbury use the faucet at https://testnet-faucet.genlayer.foundation/. Deploy with either:

```bash
node deploy.mjs                       # deploys to Studionet (default)
NETWORK=bradbury node deploy.mjs      # deploys to Bradbury instead
# or (needs Python 3.12+ and genlayer-py)
python scripts/deploy.py
NETWORK=bradbury python scripts/deploy.py
```

Both write the resulting address into:
- `frontend/.env` (gitignored, local dev) as `VITE_CONTRACT_ADDRESS`
- `frontend/src/deployed.ts` (**committed** — survives static builds) as `DEPLOYED_CONTRACT_ADDRESS`, plus `DEPLOYED_NETWORK`, `GENLAYER_CHAIN_ID`, `EXPLORER_BASE`
- this README

> The contract address must be available at **build time** for the deployed app to work. Because `frontend/.env` is gitignored, the committed `src/deployed.ts` is what the Vercel build reads. After deploying, commit `frontend/src/deployed.ts` and push so Vercel rebuilds with the live address baked in.

### Contract address resolution (build time)

The frontend resolves the contract address in this order:
1. `VITE_CONTRACT_ADDRESS` env var (if set in the Vercel project settings) — override
2. `DEPLOYED_CONTRACT_ADDRESS` from committed `src/deployed.ts` — fallback

## Run (local)

```bash
cd frontend
npm run dev
```

Connect MetaMask, paste contract, scan.

## Deploy to Vercel

1. Import the GitHub repo into Vercel; set **Root Directory** to `frontend/`.
2. `vercel.json` is already configured (Vite framework, `npm run build`, `dist/` output, SPA rewrites).
3. After deploying the contract, commit `frontend/src/deployed.ts` and push — Vercel rebuilds with the live contract address. (Optional: set `VITE_CONTRACT_ADDRESS` in Project → Settings → Environment Variables to override.)

## GenLayer Primitives

| Primitive | Use |
|-----------|-----|
| `gl.exec_prompt()` | LLM analysis of contract code |
| `gl.eq_principle_prompt_non_comparative()` | Validator consensus for the audit + re-audit (criteria-based, converges on subjective output) |
| `gl.eq_principle_prompt_comparative()` | Findings-set comparison during verification |
| `gl.message.sender_address` | Auditor / verifier identity |
| `hashlib.sha256` | Authenticated source binding per report |
| JSON string storage | Reports, verifications, reputation scores |

## Networks

**Studionet** (default, live demo):
- **Chain ID:** 61999
- **RPC:** `https://studio.genlayer.com/api`
- **Explorer:** https://genlayer-explorer.vercel.app
- **Faucet:** built-in (wallets auto-funded)

**Bradbury** (real validators):
- **Chain ID:** 4221
- **RPC:** `https://rpc-bradbury.genlayer.com`
- **Faucet:** https://testnet-faucet.genlayer.foundation/
- **Explorer:** https://explorer-bradbury.genlayer.com/

## Deployed Contract

```
0xYourDeployedContractAddressHere
```

_(Replace after running `node deploy.mjs` — the deploy script updates this automatically.)_

## Tests

```bash
python -m pytest tests/ -v
```

Covers JSON sanitization, the sha256 source-hash helper, and the order-independent findings-signature helper used by verification.

## License

MIT

