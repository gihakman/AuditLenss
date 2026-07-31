/**
 * Deployed AuditLens contract on GenLayer.
 *
 * This is a COMMITTED, build-time constant (not gitignored) so that static
 * deployments (Vercel/Netlify) work without requiring a `.env` file to be
 * present in the repo. `deploy.mjs` / `scripts/deploy.py` rewrite this file
 * after a successful deploy, so the address baked into the build always matches
 * the live contract.
 *
 * NETWORK: "studionet" | "bradbury"
 *   - studionet: hosted simulator (chain id 61999), built-in faucet, exposes
 *     full validator stderr for debugging. Best for demos.
 *   - bradbury:  real validators (chain id 4221). Slower finalization.
 */
export const DEPLOYED_NETWORK = "studionet" as "studionet" | "bradbury";
export const DEPLOYED_CONTRACT_ADDRESS = "0x32a3d6E1cC9CAa2a6cCef1Bd0c8eAd63e79783Fe";
export const GENLAYER_CHAIN_ID = 61999; // Studionet
export const EXPLORER_BASE = "https://genlayer-explorer.vercel.app";
export const NETWORK_LABEL = DEPLOYED_NETWORK === "studionet" ? "Studionet" : "Bradbury Testnet";
