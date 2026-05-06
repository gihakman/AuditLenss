import React, { useState } from "react";

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

interface Report {
  id: string;
  contract_name: string;
  auditor: string;
  result: AuditResult;
  verified: boolean;
}

const sevConfig: Record<string, { bg: string; color: string }> = {
  critical: { bg: "var(--red)", color: "#fff" },
  high: { bg: "var(--orange)", color: "#000" },
  medium: { bg: "var(--yellow)", color: "#000" },
  low: { bg: "var(--blue)", color: "#fff" },
  info: { bg: "var(--text-dim)", color: "var(--bg)" },
};

function ScoreRing({ score, size = 120, stroke = 6 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";

  return (
    <div style={{ width: size, height: size, margin: "40px auto 24px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <span style={{ fontFamily: "var(--mono)", fontSize: 36, fontWeight: 700, position: "absolute", color }}>{score}</span>
    </div>
  );
}

export const ReportViewer: React.FC<{
  report: Report;
  onVerify?: (id: string) => void;
  verifying?: boolean;
}> = ({ report, onVerify, verifying }) => {
  const score = Number(report.result?.overall_score ?? 0);
  const [hoveredFinding, setHoveredFinding] = useState<number | null>(null);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <ScoreRing score={score} />
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)", textAlign: "center", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 32 }}>
        Security Score — {report.contract_name}
      </div>

      {/* Summary */}
      <div style={{ margin: "0 24px 24px", padding: 16, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Summary</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>{report.result?.summary}</div>
      </div>

      {/* Findings */}
      {report.result?.findings.map((finding, i) => (
        <div
          key={`${i}-${finding.category}-${finding.severity}`}
          onMouseEnter={() => setHoveredFinding(i)}
          onMouseLeave={() => setHoveredFinding(null)}
          style={{
            margin: "0 24px 16px", padding: 20, borderRadius: 8,
            border: `1px solid ${hoveredFinding === i ? "var(--accent-border)" : "var(--border)"}`,
            background: "var(--card-bg)", transition: "border-color 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.5px", background: sevConfig[finding.severity]?.bg || "var(--border)", color: sevConfig[finding.severity]?.color || "var(--text-h)" }}>
              {finding.severity}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>
              {finding.category.replace(/_/g, " ")}
            </span>
            {finding.line !== null && finding.line !== undefined && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", marginLeft: "auto" }}>line {finding.line}</span>
            )}
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.6, color: "var(--text-dim)", marginBottom: 8 }}>{finding.description}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.5, color: "var(--accent)", padding: "10px 12px", background: "var(--accent-bg)", borderRadius: 6, border: "1px solid var(--accent-border)" }}>
            ↳ {finding.recommendation}
          </div>
        </div>
      ))}

      {/* Verify button */}
      <div style={{ margin: "0 24px 24px" }}>
        {report.verified ? (
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--green)" }}>
            ✓ Verified
          </span>
        ) : (
          <button
            onClick={() => onVerify?.(report.id)}
            disabled={verifying}
            style={{
              fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, padding: "10px 20px",
              border: "1px solid var(--accent-border)", borderRadius: 6, background: "var(--accent-bg)",
              color: "var(--accent)", cursor: verifying ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
              opacity: verifying ? 0.6 : 1,
            }}
          >
            {verifying ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 12, height: 12, border: "2px solid var(--accent-border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} /> : "▸"}
            {verifying ? "Verifying..." : "Verify Report"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportViewer;
