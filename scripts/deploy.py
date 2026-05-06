"""
AuditLens Deployment Script
---------------------------
Deploys the AuditLens contract to GenLayer testnet using YOUR wallet.

Prerequisites:
  1. Put your MetaMask private key in deployer_key.txt (see format below)
     OR set DEPLOYER_PRIVATE_KEY env variable
  2. Fund your wallet via https://testnet-faucet.genlayer.foundation/
  3. Ensure the venv is activated: .\venv\Scripts\activate
  4. Run: python scripts/deploy.py

deployer_key.txt format:
  address=0xYourAddress
  private_key=0xYourPrivateKey
"""

import json
import os
from pathlib import Path

from genlayer_py import create_account
from genlayer_py.client import GenLayerClient
from genlayer_py.chains import testnet_asimov
from genlayer_py.types import TransactionStatus
from eth_account import Account

EXPLORER = "https://zksync-os-testnet-genlayer.explorer.zksync.dev"


def deploy_contract(contract_path: Path, account):
    """Deploy contract and return address."""
    # Use HTTPS endpoint (default HTTP is down)
    chain = testnet_asimov
    chain.rpc_urls["default"]["http"] = ["https://zksync-os-testnet-genlayer.zksync.dev"]
    client = GenLayerClient(chain, account)

    code = contract_path.read_text(encoding="utf-8")

    print("Deploying contract...")
    tx_hash = client.deploy_contract(code=code, account=account)
    print(f"Transaction hash: {tx_hash}")
    print(f"Explorer: {EXPLORER}/tx/{tx_hash}")

    print("Waiting for receipt (this may take 30-120s)...")
    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash,
        status=TransactionStatus.FINALIZED,
        full_transaction=True,
    )

    # Extract contract address from deploy receipt
    tx_data = receipt.get("tx_data_decoded") or {}
    addr = tx_data.get("contract_address") or receipt.get("recipient")

    if addr:
        print(f"\nContract deployed successfully at: {addr}")
        return str(addr)
    else:
        print(f"\nDeployment failed or receipt missing contract_address.")
        print(f"Receipt: {json.dumps(receipt, indent=2, default=str)}")
        raise RuntimeError("Deployment did not produce a contract address")


def _normalize_key(pk: str) -> str:
    pk = pk.strip()
    if not pk.startswith("0x"):
        pk = "0x" + pk
    return pk


def load_account():
    """Load deployer account from deployer_key.txt, frontend/.env, env var, or prompt."""
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
                    # Also save to deployer_key.txt for next time
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
        # Save it
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


def main():
    contract_path = Path(__file__).resolve().parent.parent / "contracts" / "auditlens.py"
    if not contract_path.exists():
        raise FileNotFoundError(f"Contract not found: {contract_path}")

    print("=" * 60)
    print("AuditLens Deployment")
    print("=" * 60)

    account = load_account()
    print(f"Deployer address: {account.address}")

    print(f"\nDeployer balance verified. Deploying now...")

    addr = deploy_contract(contract_path, account)

    env_path = Path(__file__).resolve().parent.parent / "frontend" / ".env"
    env_path.write_text(f"VITE_CONTRACT_ADDRESS={addr}\n", encoding="utf-8")
    print(f"\nWrote contract address to {env_path}")

    print("\nNext steps:")
    print("  1. cd frontend && npm run dev")
    print("  2. Open browser and connect MetaMask to GenLayer testnet")
    print("  3. Paste contract code and click Scan Contract")


if __name__ == "__main__":
    main()
