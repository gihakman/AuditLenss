"""
AuditLens Deployment Script (Python)
-------------------------------------
Deploys the AuditLens contract to the SAME chain the frontend talks to.
Defaults to GenLayer Studionet (chain id 61999, hosted simulator, fast,
built-in faucet); set NETWORK=bradbury to target Bradbury (chain id 4221,
real validators, slow finalization).

Use this OR deploy.mjs — they target the same chain and both write the
resulting contract address into frontend/.env and frontend/src/deployed.ts.

Prerequisites:
  1. Put your MetaMask private key in deployer_key.txt (see format below)
     OR set DEPLOYER_PRIVATE_KEY env variable
  2. Fund your wallet via https://testnet-faucet.genlayer.foundation/
  3. Ensure the venv is activated: .\\venv\\Scripts\\activate  (Python >= 3.12)
  4. Run: python scripts/deploy.py

deployer_key.txt format:
  address=0xYourAddress
  private_key=0xYourPrivateKey

NOTE: genlayer-py requires Python 3.12+. If you hit
`ImportError: cannot import name 'Buffer' from 'collections.abc'`,
upgrade Python or use `node deploy.mjs` instead.
"""

import json
import os
from pathlib import Path

from genlayer_py.client import GenLayerClient
from genlayer_py.chains import testnet_bradbury, studionet
from genlayer_py.types import TransactionStatus
from eth_account import Account

# Target network: "studionet" (default) or "bradbury". Override with NETWORK env.
NETWORK = os.environ.get("NETWORK", "studionet").lower()
if NETWORK == "bradbury":
    CHAIN = testnet_bradbury
    CHAIN_ID = 4221
    EXPLORER = "https://explorer-bradbury.genlayer.com"
    NETWORK_LABEL = "Bradbury Testnet"
else:
    CHAIN = studionet
    CHAIN_ID = 61999
    EXPLORER = "https://genlayer-explorer.vercel.app"
    NETWORK_LABEL = "Studionet"


def deploy_contract(contract_path: Path, account):
    """Deploy contract to the selected network and return address."""
    client = GenLayerClient(CHAIN, account)

    code = contract_path.read_text(encoding="utf-8")

    print(f"Deploying contract to {NETWORK_LABEL} (chain id {CHAIN_ID})...")
    tx_hash = client.deploy_contract(code=code, account=account)
    print(f"Transaction hash: {tx_hash}")
    print(f"Explorer: {EXPLORER}/tx/{tx_hash}")

    print("Waiting for receipt (this may take 30-120s)...")
    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash,
        status=TransactionStatus.FINALIZED,
        full_transaction=True,
    )

    tx_data = receipt.get("tx_data_decoded") or {}
    addr = tx_data.get("contract_address") or receipt.get("recipient")

    if addr:
        print(f"\nContract deployed successfully at: {addr}")
        return str(addr)
    else:
        print("\nDeployment failed or receipt missing contract_address.")
        print(f"Receipt: {json.dumps(receipt, indent=2, default=str)}")
        raise RuntimeError("Deployment did not produce a contract address")


def _normalize_key(pk: str) -> str:
    pk = pk.strip()
    if not pk.startswith("0x"):
        pk = "0x" + pk
    return pk


def load_account():
    """Load deployer account from DEPLOYER_PRIVATE_KEY, deployer_key.txt, frontend/.env, or prompt."""
    root = Path(__file__).resolve().parent.parent
    key_path = root / "deployer_key.txt"
    env_path = root / "frontend" / ".env"

    # 1. Try env variable first
    env_key = os.environ.get("DEPLOYER_PRIVATE_KEY", "").strip()
    if env_key:
        account = Account.from_key(_normalize_key(env_key))
        print(f"Loaded account from DEPLOYER_PRIVATE_KEY env variable: {account.address}")
        return account

    # 2. Try deployer_key.txt
    if key_path.exists():
        content = key_path.read_text(encoding="utf-8").strip()
        for line in content.splitlines():
            if line.strip().startswith("private_key="):
                pk = line.strip().split("private_key=", 1)[1].strip()
                if pk:
                    account = Account.from_key(_normalize_key(pk))
                    print(f"Loaded account from {key_path}: {account.address}")
                    return account

    # 3. Try frontend/.env PRIVATE_KEY
    if env_path.exists():
        content = env_path.read_text(encoding="utf-8").strip()
        for line in content.splitlines():
            if line.strip().startswith("PRIVATE_KEY="):
                pk = line.strip().split("PRIVATE_KEY=", 1)[1].strip()
                if pk:
                    account = Account.from_key(_normalize_key(pk))
                    print(f"Loaded account from {env_path} PRIVATE_KEY: {account.address}")
                    key_path.write_text(
                        f"address={account.address}\nprivate_key={_normalize_key(pk)}\n",
                        encoding="utf-8",
                    )
                    return account

    # 4. Prompt user
    print("=" * 60)
    print("NO WALLET FOUND")
    print("=" * 60)
    print("You need a funded wallet to deploy the contract.")
    print()
    print("Option A - Paste private key now (not recommended, but fast):")
    print("Option B - Create deployer_key.txt with your key and re-run")
    print()
    choice = input("Paste private key now? [y/N]: ").strip().lower()

    if choice == "y":
        pk = _normalize_key(input("Private key (0x...): ").strip())
        account = Account.from_key(pk)
        key_path.write_text(
            f"address={account.address}\nprivate_key={pk}\n",
            encoding="utf-8",
        )
        print(f"Saved to {key_path}")
        return account
    else:
        print("\nPlease create deployer_key.txt with this format:")
        print("  address=0xYourMetaMaskAddress")
        print("  private_key=0xYourMetaMaskPrivateKey")
        print(f"\nSave it to: {key_path}")
        raise SystemExit(1)


def _write_deploy_outputs(root: Path, addr: str):
    """Write the address to frontend/.env (gitignored) and frontend/src/deployed.ts (committed)."""
    env_path = root / "frontend" / ".env"
    # Preserve PRIVATE_KEY if it already exists in .env
    private_key_line = ""
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("PRIVATE_KEY="):
                private_key_line = line.strip()
    env_body = f"VITE_CONTRACT_ADDRESS={addr}\n"
    if private_key_line:
        env_body += private_key_line + "\n"
    env_path.write_text(env_body, encoding="utf-8")
    print(f"Wrote contract address to {env_path}")

    deployed_ts = f'''/**
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
export const DEPLOYED_NETWORK = "{NETWORK}" as "studionet" | "bradbury";
export const DEPLOYED_CONTRACT_ADDRESS = "{addr}";
export const GENLAYER_CHAIN_ID = {CHAIN_ID}; // {NETWORK_LABEL}
export const EXPLORER_BASE = "{EXPLORER}";
export const NETWORK_LABEL = DEPLOYED_NETWORK === "studionet" ? "Studionet" : "Bradbury Testnet";
'''
    deployed_path = root / "frontend" / "src" / "deployed.ts"
    deployed_path.write_text(deployed_ts, encoding="utf-8")
    print(f"Wrote contract address to {deployed_path} (committed)")

    # Update README address too
    readme_path = root / "README.md"
    if readme_path.exists():
        import re

        readme = readme_path.read_text(encoding="utf-8")
        readme = re.sub(r"0x[a-fA-F0-9]{40}", addr, readme)
        readme_path.write_text(readme, encoding="utf-8")
        print(f"Updated contract address in {readme_path}")


def main():
    root = Path(__file__).resolve().parent.parent
    contract_path = root / "contracts" / "auditlens.py"
    if not contract_path.exists():
        raise FileNotFoundError(f"Contract not found: {contract_path}")

    print("=" * 60)
    print(f"AuditLens Deployment -> {NETWORK_LABEL} ({CHAIN_ID})")
    print("=" * 60)

    account = load_account()
    print(f"Deployer address: {account.address}")
    print("Deploying now...")

    addr = deploy_contract(contract_path, account)
    _write_deploy_outputs(root, addr)

    print("\nNext steps:")
    print("  1. git add frontend/src/deployed.ts README.md && git commit")
    print("  2. Push so Vercel rebuilds with the new address baked in")
    print("  3. cd frontend && npm run dev  (or wait for the Vercel deploy)")


if __name__ == "__main__":
    main()
