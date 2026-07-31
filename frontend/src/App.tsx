import { useState, useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { createClient } from "genlayer-js";
import { testnetBradbury, studionet } from "genlayer-js/chains";
import { TransactionStatus, ExecutionResult } from "genlayer-js/types";
import { ReportViewer } from "./components/ReportViewer";
import { TransactionModal } from "./components/TransactionModal";
import { LandingPage } from "./components/LandingPage";
import { DEPLOYED_CONTRACT_ADDRESS, DEPLOYED_NETWORK, GENLAYER_CHAIN_ID, EXPLORER_BASE, NETWORK_LABEL } from "./deployed";

/**
 * Contract address resolution (build time):
 *   1. VITE_CONTRACT_ADDRESS env var (if set in Vercel dashboard) — override
 *   2. DEPLOYED_CONTRACT_ADDRESS from committed src/deployed.ts — fallback
 *
 * `src/deployed.ts` is committed (not gitignored) so static deploys work
 * even when no `.env` is present in the repo. `deploy.mjs` keeps it in sync
 * with the latest deploy.
 */
const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) ||
  DEPLOYED_CONTRACT_ADDRESS ||
  "";

/** Active GenLayer chain, selected by DEPLOYED_NETWORK in deployed.ts. */
const CHAIN = DEPLOYED_NETWORK === "studionet" ? studionet : testnetBradbury;

const readClient = createClient({ chain: CHAIN });

interface Finding {
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  line: string | number | null;
  description: string;
  recommendation: string;
}

interface AuditResult {
  overall_score: number;
  findings: Finding[];
  summary: string;
}

interface Verification {
  verifier: string;
  score: number;
}

interface Report {
  id: string;
  contract_name: string;
  auditor: string;
  source_hash?: string;
  result: AuditResult;
  verified: boolean;
  verification_count?: number;
  verifications?: Verification[];
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

const DEFAULT_CODE = `# { "Depends": "py-genlayer:15qfivjvy80800rh998pcxmd2m8va1wq2qzqhz850n8ggcr4i9q0" }
import json
from genlayer import *

class SentimentOracle(gl.Contract):
    """On-chain sentiment oracle using AI consensus."""

    owner: str
    results_json: str

    def __init__(self):
        self.owner = str(gl.message.sender_address)
        self.results_json = "[]"

    @gl.public.write
    def check_sentiment(self, topic: str) -> str:
        assert 0 < len(topic) <= 500, "Topic too long"
        results = json.loads(self.results_json)

        def _analyze() -> str:
            html = gl.nondet.web.render(
                f"https://www.reddit.com/search/?q={topic}",
                mode="text",
            )
            prompt = f"""Analyze public sentiment about: {topic}

Source data:
{html[:8000]}

Return ONLY JSON: {{"sentiment": "positive|negative|neutral", "confidence": 0-100, "summary": "brief"}}"""
            result = gl.nondet.exec_prompt(prompt)
            return json.dumps(result, sort_keys=True)

        consensus_str = gl.eq_principle.prompt_comparative(
            _analyze,
            principle="The sentiment must be the same. Confidence must be within 10 points.",
        )
        entry = {
            "id": str(len(results)),
            "topic": topic,
            "result": json.loads(consensus_str),
            "requester": str(gl.message.sender_address),
        }
        results.append(entry)
        self.results_json = json.dumps(results)
        return str(len(results) - 1)

    @gl.public.view
    def get_results(self) -> str:
        return self.results_json
`;

function ScanningOverlay() {
  const [step, setStep] = useState(0);
  const steps = [
    "Submitting to validator network...",
    "Validator 1/5 — scanning vulnerabilities",
    "Validator 3/5 — cross-referencing findings",
    "Reaching consensus...",
    "Finalizing report...",
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setStep(s => Math.min(s + 1, steps.length - 1));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 1s linear infinite" }} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", textAlign: "center", lineHeight: 1.8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ opacity: i <= step ? 1 : 0.3, transition: "opacity 0.4s", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span style={{ color: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--text-dim)" }}>
              {i < step ? "✓" : i === step ? "▸" : "○"}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScannerApp({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [contractName, setContractName] = useState("SentimentOracle");
  const [account, setAccount] = useState<string | null>(null);
  const [writeClient, setWriteClient] = useState<ReturnType<typeof createClient> | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [scanning, setScanning] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTx, setShowTx] = useState(false);
  const isMountedRef = useRef(true);

  const ensureChain = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
    if (!eth) return;
    const chainHex = "0x" + GENLAYER_CHAIN_ID.toString(16);
    const currentChain = (await eth.request({ method: "eth_chainId" })) as string;
    if (currentChain.toLowerCase() === chainHex.toLowerCase()) return;
    const isStudio = DEPLOYED_NETWORK === "studionet";
    const chainParams = isStudio
      ? {
          chainId: chainHex,
          chainName: "Genlayer Studionet",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: ["https://studio.genlayer.com/api"],
          blockExplorerUrls: ["https://genlayer-explorer.vercel.app"],
        }
      : {
          chainId: chainHex,
          chainName: "Genlayer Bradbury Testnet",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: ["https://rpc-bradbury.genlayer.com"],
          blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
        };
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [chainParams],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const eth = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
      if (!eth) {
        setError("MetaMask not detected. Please install MetaMask.");
        return;
      }
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts || accounts.length === 0) {
        setError("No accounts found.");
        return;
      }
      const addr = accounts[0];
      setAccount(addr);
      const client = createClient({
        chain: CHAIN,
        account: addr as `0x${string}`,
        provider: eth,
      });
      setWriteClient(client);
      setError(null);
      await ensureChain();
    } catch (e: any) {
      setError(e.message || "Failed to connect wallet");
    }
  }, [ensureChain]);

  const fetchReports = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return;
    try {
      const result = await readClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "get_reports_page",
        args: [0, 50],
      });
      const fetched = (typeof result === "string" ? JSON.parse(result) : result) as Report[];
      if (isMountedRef.current) {
        setReports([...fetched].reverse());
      }
    } catch (e: any) {
      console.error("fetchReports", e);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleScan = async () => {
    if (!writeClient || !account) { setError("Connect wallet first"); return; }
    if (!CONTRACT_ADDRESS) { setError("Contract address not configured."); return; }
    if (!code.trim()) { setError("Contract source cannot be empty."); return; }
    if (!contractName.trim()) { setError("Contract name cannot be empty."); return; }
    setScanning(true);
    setError(null);
    setTxHash(null);
    try {
      await ensureChain();
      const hash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "submit_contract",
        args: [code, contractName],
        value: BigInt(0),
      }) as any;
      const txHashStr = String(hash);
      setTxHash(txHashStr);
      // Studionet (simulator) finalizes in seconds -> wait FINALIZED so the
      // report is actually stored and readable. Bradbury finalization takes
      // ~27min, so wait ACCEPTED there and let the user check the explorer.
      const waitStatus = DEPLOYED_NETWORK === "studionet"
        ? TransactionStatus.FINALIZED
        : TransactionStatus.ACCEPTED;
      const receipt = await readClient.waitForTransactionReceipt({
        hash: txHashStr as `0x${string}` & { length: 66 },
        status: waitStatus,
      });
      if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN) {
        // Report is stored once finalized; fetch what's readable now.
        await fetchReports();
      } else {
        setError(`Transaction status: ${receipt.txExecutionResultName}. Check explorer for details.`);
      }
    } catch (e: any) {
      setError(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!writeClient || !account) return;
    if (!CONTRACT_ADDRESS) { setError("Contract address not configured."); return; }
    setVerifyingId(id);
    setError(null);
    try {
      await ensureChain();
      const hash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: "verify_report",
        args: [Number(id)],
        value: BigInt(0),
      }) as any;
      // Studionet finalizes fast -> FINALIZED; Bradbury -> ACCEPTED (~27min to finalize).
      const verifyWaitStatus = DEPLOYED_NETWORK === "studionet"
        ? TransactionStatus.FINALIZED
        : TransactionStatus.ACCEPTED;
      await readClient.waitForTransactionReceipt({
        hash: String(hash) as `0x${string}` & { length: 66 },
        status: verifyWaitStatus,
      });
      await fetchReports();
    } catch (e: any) {
      setError(e.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const latestReport = reports[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)" }}>
      {/* Sticky blur nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid var(--border)", background: "var(--nav-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="var(--accent)" strokeWidth="2" fill="none" />
            <path d="M16 8L16 24M10 16L22 16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-bg)" />
          </svg>
          <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "var(--text-h)" }}>AuditLens</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)" }}>{NETWORK_LABEL}</span>
          <button onClick={connectWallet} style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-h)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "border-color 0.2s" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: account ? "var(--green)" : "var(--red)", boxShadow: account ? "0 0 6px var(--green)" : "none" }} />
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* Error bar */}
      {error && (
        <div style={{ padding: "12px 32px", background: "var(--accent-bg)", borderBottom: "1px solid var(--accent-border)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--red)" }}>
          ⚠ {error}
        </div>
      )}

      {/* Two-pane layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {/* Editor pane */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 57px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Contract Source</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="text" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="Contract name" style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-h)", outline: "none", width: 160 }} />
              <button onClick={handleScan} disabled={scanning} style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, padding: "10px 24px", border: "none", borderRadius: 6, cursor: scanning ? "not-allowed" : "pointer", background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.3px", opacity: scanning ? 0.6 : 1, transition: "all 0.25s" }}>
                {scanning ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%" }} /> : "▸"}
                {scanning ? "Scanning..." : "Scan Contract"}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, background: "var(--terminal-bg)" }}>
            <Editor height="100%" defaultLanguage="python" value={code} onChange={(v) => setCode(v || "")} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, lineHeight: 28, padding: { top: 24 } }} />
          </div>
        </div>

        {/* Results pane */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 57px)", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.5px" }}>Audit Report</span>
            {latestReport && (
              <div style={{ display: "flex", gap: 8 }}>
                {(["critical", "high", "medium", "low", "info"] as const).map(sev => {
                  const count = latestReport.result.findings.filter(f => f.severity === sev).length;
                  if (!count) return null;
                  const sevColors: Record<string, { bg: string; color: string }> = { critical: { bg: "var(--red)", color: "#fff" }, high: { bg: "var(--orange)", color: "#000" }, medium: { bg: "var(--yellow)", color: "#000" }, low: { bg: "var(--blue)", color: "#fff" }, info: { bg: "var(--text-dim)", color: "var(--bg)" } };
                  return <span key={sev} style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px", background: sevColors[sev]?.bg, color: sevColors[sev]?.color }}>{count} {sev}</span>;
                })}
              </div>
            )}
          </div>

          {scanning ? (
            <ScanningOverlay />
          ) : latestReport ? (
            <div style={{ overflow: "auto", flex: 1 }}>
              <ReportViewer report={latestReport} onVerify={handleVerify} verifying={verifyingId === latestReport.id} />
              {txHash && (
                <div style={{ margin: "0 24px 16px" }}>
                  <a
                    href={`${EXPLORER_BASE}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
                      borderRadius: 8, border: "1px solid var(--accent-border)",
                      background: "var(--accent-bg)", cursor: "pointer", width: "100%",
                      fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)",
                      textDecoration: "none", transition: "background 0.2s",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>◈</span>
                    <span style={{ flex: 1 }}>
                      View on Explorer
                      <span style={{ display: "block", fontSize: 10, color: "var(--text-dim)", marginTop: 2, wordBreak: "break-all" }}>{txHash}</span>
                    </span>
                    <span style={{ color: "var(--text-dim)" }}>→</span>
                  </a>
                  <button onClick={() => setShowTx(true)} style={{ marginTop: 8, padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", transition: "background 0.2s" }}>
                    <span style={{ fontSize: 12 }}>⬡</span>
                    Transaction Journey Details
                    <span style={{ marginLeft: "auto" }}>→</span>
                  </button>
                </div>
              )}
              {reports.length > 1 && (
                <div style={{ padding: "0 24px 24px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Previous Reports</div>
                  {reports.slice(1).map(r => (
                    <ReportViewer key={r.id} report={r} onVerify={handleVerify} verifying={verifyingId === r.id} />
                  ))}
                </div>
              )}
            </div>
          ) : txHash ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 28, color: "var(--accent)" }}>◈</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.6 }}>
                Transaction submitted. Report will appear after finalization.<br />
                <strong style={{ color: "var(--accent)" }}>Check the explorer for status.</strong>
              </div>
              <a
                href={`${EXPLORER_BASE}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 20px",
                  borderRadius: 8, border: "1px solid var(--accent-border)",
                  background: "var(--accent-bg)", cursor: "pointer", width: "100%", maxWidth: 400,
                  fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)",
                  textDecoration: "none", transition: "background 0.2s",
                }}
              >
                <span style={{ fontSize: 14 }}>→</span>
                <span style={{ flex: 1 }}>
                  View on Explorer
                  <span style={{ display: "block", fontSize: 10, color: "var(--text-dim)", marginTop: 2, wordBreak: "break-all" }}>{txHash}</span>
                </span>
              </a>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 28, color: "var(--accent)" }}>⟐</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.6 }}>
                Paste a GenLayer contract and hit<br /><strong style={{ color: "var(--accent)" }}>Scan Contract</strong> to begin.
              </div>
            </div>
          )}
        </div>
      </div>

      {showTx && txHash && <TransactionModal txHash={txHash} onClose={() => setShowTx(false)} />}
    </div>
  );
}

function App() {
  const [page, setPage] = useState<"landing" | "app">("landing");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (page === "landing") {
    return <LandingPage onLaunchApp={() => setPage("app")} theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />;
  }

  return (
    <>
      <ScannerApp onBack={() => setPage("landing")} />
      <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ position: "fixed", bottom: 20, right: 20, width: 40, height: 40, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-dim)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, transition: "all 0.2s" }} title="Toggle theme">
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </>
  );
}

export default App;
