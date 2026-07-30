/**
 * Deployed AuditLens contract on GenLayer Bradbury Testnet (chain id 4221).
 *
 * This is a COMMITTED, build-time constant (not gitignored) so that static
 * deployments (Vercel/Netlify) work without requiring a `.env` file to be
 * present in the repo. `deploy.mjs` rewrites this file after a successful
 * deploy, so the address baked into the build always matches the live contract.
 */
export const DEPLOYED_CONTRACT_ADDRESS = "0xfa9EC19D0EdB543a0477A6a0bc6F6f91b8bbe5d0";
export const GENLAYER_CHAIN_ID = 4221; // Bradbury testnet
export const EXPLORER_BASE = "https://explorer-bradbury.genlayer.com";
