import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury, studionet } from "genlayer-js/chains";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Target network: "studionet" (default, hosted simulator, fast, built-in faucet)
// or "bradbury" (real validators, slow finalization). Override with NETWORK env.
const NETWORK = (process.env.NETWORK || "studionet").toLowerCase();
const CHAIN = NETWORK === "bradbury" ? testnetBradbury : studionet;
const CHAIN_ID = NETWORK === "bradbury" ? 4221 : 61999;
const EXPLORER = NETWORK === "bradbury"
  ? "https://explorer-bradbury.genlayer.com"
  : "https://genlayer-explorer.vercel.app";
const NETWORK_LABEL = NETWORK === "bradbury" ? "Bradbury Testnet" : "Studionet";

// Read private key from frontend/.env
const envText = readFileSync(join(__dirname, "frontend", ".env"), "utf8");
const pkMatch = envText.match(/PRIVATE_KEY=(.+)/);
if (!pkMatch) {
  console.error("PRIVATE_KEY not found in frontend/.env");
  process.exit(1);
}

let privateKey = pkMatch[1].trim();
if (!privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

const account = createAccount(privateKey);
console.log("Deployer:", account.address);
console.log("Network:", NETWORK_LABEL, `(chain id ${CHAIN_ID})`);

const client = createClient({ chain: CHAIN, account });

const code = readFileSync(join(__dirname, "contracts", "auditlens.py"), "utf8");

console.log("Deploying contract...");
const txHash = await client.deployContract({
  account,
  code,
  args: [],
  value: BigInt(0),
});

console.log("Tx hash:", txHash);
console.log("Explorer:", `${EXPLORER}/tx/${txHash}`);

console.log("Waiting for receipt (30-120s)...");
const receipt = await client.waitForTransactionReceipt({
  hash: txHash,
  retries: 90,
  interval: 3000,
});

// Try all possible fields for contract address
const addr = receipt?.contract_data?.contractAddress ?? receipt?.data?.contractAddress ?? receipt?.result?.contract_address ?? receipt?.contractAddress ?? receipt?.recipient;
if (!addr) {
  console.error("Contract address not found in receipt:");
  console.error("Keys:", Object.keys(receipt));
  console.error(JSON.stringify(receipt, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
  process.exit(1);
}

console.log("\nDeployed at:", addr);
console.log("Status:", receipt?.status_name);
console.log("Result:", receipt?.result_name);
console.log("Execution:", receipt?.txExecutionResultName ?? receipt?.result_name);

if (receipt?.txExecutionResultName === "FINISHED_WITH_ERROR" || receipt?.result === 6) {
  console.warn("\nWARNING: Contract deployed but execution finished with error.");
  console.warn("Check the explorer for details:", `${EXPLORER}/tx/${txHash}`);
  console.warn("Proceeding anyway - contract address saved.");
}

const newEnv = `VITE_CONTRACT_ADDRESS=${addr}\nPRIVATE_KEY=${privateKey.slice(2)}\n`;
writeFileSync(join(__dirname, "frontend", ".env"), newEnv);
console.log("Wrote address to frontend/.env");

// Also write the COMMITTED build-time constant so static deploys (Vercel)
// work without a gitignored .env. src/deployed.ts is tracked in git.
const deployedTs = `/**
 * Deployed AuditLens contract on GenLayer.
 *
 * This is a COMMITTED, build-time constant (not gitignored) so that static
 * deployments (Vercel/Netlify) work without requiring a \`.env\` file to be
 * present in the repo. \`deploy.mjs\` / \`scripts/deploy.py\` rewrite this file
 * after a successful deploy, so the address baked into the build always matches
 * the live contract.
 *
 * NETWORK: "studionet" | "bradbury"
 *   - studionet: hosted simulator (chain id 61999), built-in faucet, exposes
 *     full validator stderr for debugging. Best for demos.
 *   - bradbury:  real validators (chain id 4221). Slower finalization.
 */
export const DEPLOYED_NETWORK = "${NETWORK}" as "studionet" | "bradbury";
export const DEPLOYED_CONTRACT_ADDRESS = "${addr}";
export const GENLAYER_CHAIN_ID = ${CHAIN_ID}; // ${NETWORK_LABEL}
export const EXPLORER_BASE = "${EXPLORER}";
export const NETWORK_LABEL = DEPLOYED_NETWORK === "studionet" ? "Studionet" : "Bradbury Testnet";
`;
writeFileSync(join(__dirname, "frontend", "src", "deployed.ts"), deployedTs);
console.log("Wrote address to frontend/src/deployed.ts (committed)");

console.log("\nNext steps:");
console.log("  1. git add frontend/src/deployed.ts && git commit");
console.log("  2. Push so Vercel rebuilds with the new address baked in");
console.log("  3. cd frontend && npm run dev  (or wait for the Vercel deploy)");
