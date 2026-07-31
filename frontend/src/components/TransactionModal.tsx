import React from "react";
import { EXPLORER_BASE } from "../deployed";

const txData = {
  hash: "0xa77f85e1...14377a14",
  fullHash: "0xa77f85e1a82038dba0ce6984690eeabcc29651d6ab9ebbe446903a3214377a14",
  status: "finalized",
  value: "0.00 GEN",
  fee: "0.00 GEN",
  type: "CONTRACT_CALL",
  method: "submit_contract",
  from: "0x0b30FFf90Ed88739670A0bf10e9e70717372Ae28",
  to: "0xf7CBaC0ee603B80d2775Ff66c3376D7AC04CE10A",
  epoch: 37,
  timeSubmitted: "May 05 2026, 23:46:57",
  timeFinalized: "May 06 2026, 00:17:05",
  l2Txs: 14,
  gas: "11,187,448",
  gasCost: "0.0014147 GEN",
  executionHash: "0x6cd23eb3...bdb46ec8ca1a8c",
  resultHash: "0xc9070e38...de9ff455ceb89a",
  committee: {
    leader: { name: "Blocmates X Firstset", addr: "0x149...78d68" },
    validators: [
      { name: "FairStaking", addr: "0x3B9...A8e79" },
      { name: "Nodes.Guru", addr: "0x992...e4b5a" },
      { name: "genlayerlabs-validator-3", addr: "0x58a...E0F49" },
      { name: "StakingCabin2", addr: "0x0c5...f06Bc" },
    ],
  },
  journey: [
    { step: 8, label: "Finalized", time: "00:17:05", block: "8568419", icon: "◆", status: "final" },
    { step: 7, label: "Decided: Accepted", time: "23:47:05", block: "8562850", icon: "✓", status: "success" },
    { step: 6, label: "Vote Reveal", time: "23:46:57", block: "8562847–850", icon: "◈", status: "done" },
    { step: 5, label: "Leader Reveal", time: "23:46:57", block: "8562846", icon: "◇", status: "done" },
    { step: 4, label: "Vote Commit", time: "23:46:57", block: "8562839–843", icon: "⬡", status: "done" },
    { step: 3, label: "Leader Proposal", time: "23:47:00", block: "8562834", icon: "⟐", status: "done" },
    { step: 2, label: "Activation", time: "23:46:57", block: "8562825", icon: "▸", status: "done" },
    { step: 1, label: "Transaction Submitted", time: "23:46:57", block: "8562822", icon: "○", status: "done" },
  ],
};

export const TransactionModal: React.FC<{
  txHash: string;
  onClose: () => void;
}> = ({ txHash, onClose }) => {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 680, maxHeight: "85vh", overflow: "auto", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, animation: "slideUp 0.4s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color: "var(--text-h)", display: "flex", alignItems: "center", gap: 10 }}>
            Transaction
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.5px", background: "var(--green)", color: "#000" }}>finalized</span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 28 }}>
          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Type", value: txData.type },
              { label: "Method", value: txData.method },
              { label: "Value", value: txData.value },
              { label: "Fee", value: txData.fee },
              { label: "From", value: txData.from.slice(0, 10) + "..." + txData.from.slice(-6) },
              { label: "To (Contract)", value: txData.to.slice(0, 10) + "..." + txData.to.slice(-6) },
              { label: "Epoch", value: txData.epoch },
              { label: "L2 Transactions", value: `${txData.l2Txs} txs · ${txData.gas} gas` },
            ].map((m, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-h)", wordBreak: "break-all" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Gas bar */}
          <div style={{ padding: 16, borderRadius: 8, marginBottom: 32, border: "1px solid var(--border)", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 6 }}>Total Gas Cost</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "var(--text-h)" }}>{txData.gasCost}</div>
            </div>
            <div style={{ width: 200, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ width: "14%", height: "100%", borderRadius: 3, background: "var(--accent)", animation: "slideRight 1s ease both" }} />
            </div>
          </div>

          {/* Committee */}
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>Validator Committee</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
            <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--accent-border)", background: "var(--accent-bg)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--accent)", padding: "2px 6px", borderRadius: 3, background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>Leader</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-h)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txData.committee.leader.name}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)" }}>{txData.committee.leader.addr}</span>
            </div>
            {txData.committee.validators.map((v, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-dim)", padding: "2px 6px", borderRadius: 3, border: "1px solid var(--border)" }}>V{i}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-h)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)" }}>{v.addr}</span>
              </div>
            ))}
          </div>

          {/* Journey */}
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>Transaction Journey</div>
          <div style={{ position: "relative", paddingLeft: 36 }}>
            {txData.journey.map((j, i) => (
              <div key={i} style={{ position: "relative", paddingBottom: i === txData.journey.length - 1 ? 0 : 24 }}>
                <div style={{ position: "absolute", left: -36, top: 2, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 11, background: j.status === "final" ? "var(--accent)" : j.status === "success" ? "var(--green)" : "var(--card-bg)", color: j.status === "final" || j.status === "success" ? "#000" : "var(--text-dim)", border: j.status === "final" || j.status === "success" ? "none" : "1px solid var(--border)", zIndex: 1 }}>{j.icon}</div>
                {i < txData.journey.length - 1 && <div style={{ position: "absolute", left: -25, top: 26, bottom: 0, width: 1, background: "var(--border)" }} />}
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{j.step}. {j.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginTop: 3, display: "flex", gap: 12 }}>
                  <span>{j.time}</span>
                  <span>Block {j.block}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Hashes */}
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16, marginTop: 32 }}>Receipt Hashes</div>
          <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 8, border: "1px solid var(--border)", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Execution</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-h)" }}>{txData.executionHash}</div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>Result</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-h)" }}>{txData.resultHash}</div>
            </div>
          </div>

          {/* Explorer link */}
          <a href={`${EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 24, padding: "14px 20px", borderRadius: 8, border: "1px solid var(--accent-border)", background: "var(--accent-bg)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", textDecoration: "none", textAlign: "center", transition: "background 0.2s" }}>
            View on Explorer →
          </a>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
