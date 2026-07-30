# AuditLens

Automated security scanner for GenLayer Intelligent Contracts. LLM validators run an 8-point audit and store structured, tamper-evident reports on-chain with severity scores.

**Chain:** GenLayer Bradbury Testnet (4221)
**Live:** _set after deploy — see Deployed Contract below_

---

## How It Works

1. Paste a GenLayer contract into the editor
2. Click **Scan Contract**
3. LLM validators reach consensus on vulnerabilities
4. A structured report is stored on-chain, **bound to a sha256 hash of the exact source audited**, with a 0-100 score
5. Anyone can **Verify Report** — the audit is re-run and the **actual findings set** is compared (not just the aggregate score); on a match the original auditor earns on-chain reputation

### Tamper-evident binding & findings-based verification

Each report stores `source_hash = sha256(contract_source)`. Re-verification re-derives that hash from the stored source and asserts it still matches, then re-runs the audit and compares the **findings** (categories + severities + descriptions, order-independent) via a separate `gl.eq_principle.prompt_comparative` consensus call. The 0-100 score is kept only as a secondary guard. Two audits that find different vulnerabilities but happen to score ~75 no longer pass verification.

## Vulnerability Classes

1. Prompt injection in `gl.nondet.exec_prompt`
2. Hardcoded secrets or private data
3. Missing domain whitelisting for `gl.nondet.web.render`
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
├── deploy.mjs                  # deploy to Bradbury (Node) — writes .env + src/deployed.ts
├── scripts/deploy.py           # deploy to Bradbury (Python) — same outputs
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

You need a funded wallet on Bradbury (faucet: https://testnet-faucet.genlayer.foundation/). Deploy with either:

```bash
node deploy.mjs        # reads PRIVATE_KEY from frontend/.env
# or
python scripts/deploy.py   # needs Python 3.12+ and genlayer-py
```

Both deploy to Bradbury (chain id 4221) and write the resulting address into:
- `frontend/.env` (gitignored, local dev) as `VITE_CONTRACT_ADDRESS`
- `frontend/src/deployed.ts` (**committed** — survives static builds) as `DEPLOYED_CONTRACT_ADDRESS`
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
| `gl.nondet.exec_prompt()` | LLM analysis of contract code |
| `gl.eq_principle.prompt_comparative()` | Validator consensus (audit + findings comparison) |
| `gl.message.sender_address` | Auditor / verifier identity |
| `hashlib.sha256` | Authenticated source binding per report |
| JSON string storage | Reports, verifications, reputation scores |

## Testnet

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

