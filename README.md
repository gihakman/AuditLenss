# AuditLens

Automated security scanner for GenLayer Intelligent Contracts. LLM validators run an 8-point audit and store structured reports on-chain with severity scores.

**Chain:** GenLayer Bradbury Testnet (4221)
**Live:** https://dulcet-babka-8c41fd.netlify.app/

---

## How It Works

1. Paste a GenLayer contract into the editor
2. Click **Scan Contract**
3. LLM validators reach consensus on vulnerabilities
4. Structured report stored on-chain with 0-100 score

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

## Project Structure

```
├── contracts/
│   └── auditlens.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ReportViewer.tsx
│   │   │   ├── TransactionModal.tsx
│   │   │   └── LandingPage.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── deploy.mjs
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

```bash
node deploy.mjs
```

Reads private key from `frontend/.env`, deploys to Bradbury, writes contract address back.

## Run

```bash
cd frontend
npm run dev
```

Or use the live app: https://dulcet-babka-8c41fd.netlify.app/

Connect MetaMask, paste contract, scan.

## GenLayer Primitives

| Primitive | Use |
|-----------|-----|
| `gl.nondet.exec_prompt()` | LLM analysis of contract code |
| `gl.eq_principle.prompt_comparative()` | Validator consensus |
| `gl.message.sender_address` | Auditor identity |
| JSON string storage | Reports and reputation scores |

## Testnet

- **Chain ID:** 4221
- **RPC:** `https://rpc-bradbury.genlayer.com`
- **Faucet:** https://testnet-faucet.genlayer.foundation/
- **Explorer:** https://explorer-bradbury.genlayer.com/

## Deployed Contract

```
0xf7CBaC0ee603B80d2775Ff66c3376D7AC04CE10A
```

## License

MIT
