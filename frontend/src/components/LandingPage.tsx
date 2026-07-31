import React, { useState, useEffect, useRef, memo } from "react";
import { NETWORK_LABEL, EXPLORER_BASE, GENLAYER_CHAIN_ID } from "../deployed";

function GridBg() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(var(--text-dim) 1px, transparent 1px), linear-gradient(90deg, var(--text-dim) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "absolute", top: "-10%", left: "30%", width: "40%", height: "50%", background: "radial-gradient(circle, rgba(0,255,163,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
    </div>
  );
}

const allLines = [
  { text: "$ auditlens scan ./contracts/vault.py", type: "prompt", delay: 0 },
  { text: `▸ Connecting to GenLayer ${NETWORK_LABEL}...`, type: "normal", delay: 600 },
  { text: "▸ Submitting to LLM validator consensus...", type: "normal", delay: 1200 },
  { text: "▸ Validator 1/5 — analyzing 8 vulnerability classes", type: "normal", delay: 1800 },
  { text: "▸ Validator 3/5 — cross-checking findings", type: "normal", delay: 2400 },
  { text: "▸ Consensus reached — 5/5 validators agree", type: "success", delay: 3000 },
  { text: "", type: "normal", delay: 3400 },
  { text: "  ┌─────────────────────────────────────────┐", type: "normal", delay: 3600 },
  { text: "  │  AUDIT SCORE: 73/100        [MEDIUM]    │", type: "accent", delay: 3800 },
  { text: "  ├─────────────────────────────────────────┤", type: "normal", delay: 4000 },
  { text: "  │  ⚠  2 HIGH   │  ⚡ 1 MEDIUM  │  ✓ 5 OK │", type: "normal", delay: 4200 },
  { text: "  └─────────────────────────────────────────┘", type: "normal", delay: 4400 },
  { text: "", type: "normal", delay: 4600 },
  { text: "▸ Report stored on-chain: 0xf7CB...E10A", type: "success", delay: 4800 },
];

const TerminalAnimation = memo(function TerminalAnimation() {
  const [visibleCount, setVisibleCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timers = allLines.map((line, i) =>
      setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setVisibleCount(i + 1));
      }, line.delay)
    );
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.8, color: "var(--text-dim)", whiteSpace: "pre-wrap", contain: "content" }}>
      {allLines.slice(0, visibleCount).map((l, i) => (
        <div key={i} style={{
          color: l.type === "prompt" ? "var(--accent)" : l.type === "success" ? "var(--green)" : l.type === "accent" ? "var(--accent)" : "var(--text-dim)",
          fontWeight: l.type === "prompt" ? 600 : 400,
          animation: "fadeSlideIn 0.3s ease both",
        }}>
          {l.text || "\u00A0"}
        </div>
      ))}
      <span style={{ animation: "blink 1s step-end infinite", color: "var(--accent)" }}>▊</span>
    </div>
  );
});

const features = [
  { icon: "⟐", title: "AI Consensus Audit", desc: "Multiple LLM validators independently analyze your contract, then cross-verify through GenLayer consensus." },
  { icon: "⧫", title: "8-Point Scan", desc: "Checks prompt injection, hardcoded secrets, missing access control, reentrancy patterns, and more." },
  { icon: "◈", title: "On-Chain Reports", desc: "Every audit is immutably stored on GenLayer. Verifiable, permanent, trustless." },
  { icon: "⬡", title: "Severity Scoring", desc: "Each finding is classified critical to info with an overall security score 0–100." },
  { icon: "◉", title: "Verification Layer", desc: "Independent re-audit by a second party. Matching results earn on-chain reputation." },
  { icon: "⟡", title: "Reputation Economy", desc: "Auditors build verifiable track records. Reputation scores stored on-chain as consensus-validated data." },
];

const FeatureCard = memo(function FeatureCard({ f }: { f: typeof features[number] }) {
  return (
    <div className="feature-card" style={{ padding: 32, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card-bg)", transition: "border-color 0.3s, transform 0.3s", cursor: "default", contain: "content" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", fontFamily: "var(--mono)", fontSize: 18, color: "var(--accent)" }}>{f.icon}</div>
      <div style={{ fontFamily: "var(--heading)", fontSize: 17, fontWeight: 600, color: "var(--text-h)", marginBottom: 10 }}>{f.title}</div>
      <div style={{ fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.65, color: "var(--text-dim)" }}>{f.desc}</div>
    </div>
  );
});

export const LandingPage: React.FC<{
  onLaunchApp: () => void;
  theme: string;
  onToggleTheme: () => void;
}> = ({ onLaunchApp, theme, onToggleTheme }) => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", background: "var(--nav-bg)", isolation: "isolate" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="6" stroke="var(--accent)" strokeWidth="2" fill="none" />
            <path d="M16 8L16 24M10 16L22 16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="4" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-bg)" />
          </svg>
          <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, color: "var(--text-h)", letterSpacing: "-0.5px" }}>AuditLens</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)", textDecoration: "none", letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer" }}>Docs</a>
          <a href={EXPLORER_BASE} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-dim)", textDecoration: "none", letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer" }}>Explorer</a>
          <button onClick={onToggleTheme} style={{ fontFamily: "var(--mono)", fontSize: 14, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button onClick={onLaunchApp} style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, padding: "14px 32px", border: "none", borderRadius: 8, cursor: "pointer", background: "var(--accent)", color: "#000", letterSpacing: "0.5px", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 8 }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "160px 48px 120px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <GridBg />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 24, display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", border: "1px solid var(--accent-border)", borderRadius: 100, background: "var(--accent-bg)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)" }} />
            Live on GenLayer {NETWORK_LABEL}
          </div>
          <h1 style={{ fontFamily: "var(--heading)", fontSize: "clamp(48px, 7vw, 88px)", fontWeight: 700, color: "var(--text-h)", lineHeight: 1.05, letterSpacing: "-3px", margin: "0 0 28px", maxWidth: 900 }}>
            Trustless security<br />
            <span style={{ color: "var(--accent)" }}>for intelligent contracts</span>
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 18, lineHeight: 1.7, color: "var(--text-dim)", maxWidth: 540, margin: "0 0 48px" }}>
            Automated 8-point vulnerability scans powered by LLM consensus.
            On-chain reports. Zero trust required.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={onLaunchApp} style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, padding: "14px 32px", border: "none", borderRadius: 8, cursor: "pointer", background: "var(--accent)", color: "#000", letterSpacing: "0.5px", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 8 }}>
              Scan a Contract <span style={{ fontSize: 16 }}>→</span>
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, padding: "14px 32px", border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text-h)", letterSpacing: "0.5px", transition: "all 0.25s", textDecoration: "none", cursor: "pointer" }}>
              View Documentation
            </a>
          </div>
          <div style={{ display: "flex", gap: 64, marginTop: 80, padding: "32px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Scanning</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>8 vulnerability classes checked by 5 independent LLM validators</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Reporting</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>Results stored on-chain. Verifiable by any second party.</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Speed</div>
              <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>Full audit in under 60 seconds. Consensus finality in ~30 min.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "120px 48px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Capabilities</div>
        <h2 style={{ fontFamily: "var(--heading)", fontSize: 42, fontWeight: 700, color: "var(--text-h)", letterSpacing: "-1.5px", marginBottom: 64, lineHeight: 1.15 }}>
          Machine-speed audits,<br />consensus-grade trust
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <style>{`.feature-card:hover{border-color:var(--accent-border)!important;transform:translateY(-2px)}`}</style>
          {features.map((f, i) => (
            <FeatureCard key={i} f={f} />
          ))}
        </div>
      </section>

      {/* Terminal */}
      <section style={{ padding: "0 48px 120px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>How it works</div>
        <h2 style={{ fontFamily: "var(--heading)", fontSize: 42, fontWeight: 700, color: "var(--text-h)", letterSpacing: "-1.5px", marginBottom: 32, lineHeight: 1.15 }}>
          One command. Full audit.
        </h2>
        <div style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", background: "var(--terminal-bg)", contain: "content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--terminal-header)" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", marginLeft: 8 }}>auditlens — zsh</span>
          </div>
          <TerminalAnimation />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>© 2026 AuditLens — Built on GenLayer</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>{NETWORK_LABEL} · Chain {GENLAYER_CHAIN_ID}</span>
      </footer>
    </div>
  );
};

export default LandingPage;
