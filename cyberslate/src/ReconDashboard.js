import React, { useContext, useState } from "react";
import { AppContext } from "./App";

// PUBLIC_INTERFACE
/**
 * ReconDashboard - Main recon panel for domain input and results
 * Props: sessionMode (Demo | Pro)
 * Shows: domain input, submits to recon API (using API key from context), displays results, 
 * adapts enabled features based on sessionMode.
 */
function ReconDashboard({ sessionMode }) {
  const { apiKey } = useContext(AppContext);

  const [domain, setDomain] = useState("");
  const [reconData, setReconData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  // Simulated endpoint for demo; swap for your real API base URL
  const RECON_API_ENDPOINT = "https://api.cyberrecon.ex/v1/recon/domain";

  // API call handler
  // PUBLIC_INTERFACE
  const handleReconSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    setReconData(null);

    // Validate input
    if (!domain.trim()) {
      setError("Please enter a valid domain.");
      return;
    }
    if (sessionMode === "Demo") {
      // In Demo, show stub/sample results
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setReconData({
          domain,
          hosts: ["demo.example.com", "api.example.com"],
          summary: "This is a demo result. Upgrade to Pro for real data.",
          openPorts: [80, 443],
          amassNodes: [
            { id: 1, label: "example.com", children: [{ id: 2, label: "demo.example.com" }] }
          ],
        });
      }, 900);
      return;
    }

    // Pro mode: require an API key
    if (!apiKey) {
      setError("API key required. Please enter your key in Settings.");
      return;
    }

    setLoading(true);
    try {
      // Real API call -- adjust as needed for your backend spec!
      const response = await fetch(`${RECON_API_ENDPOINT}?domain=${encodeURIComponent(domain)}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Recon failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || typeof data !== "object") throw new Error("Malformed response.");
      setReconData(data);
      setError("");
    } catch (err) {
      setError(err && err.message ? err.message : "Unknown error. Please try again.");
      setReconData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          fontSize: "1.22rem",
          fontWeight: 600,
          marginBottom: 14,
          color: "var(--accent)",
        }}
      >
        Recon Dashboard
        <span
          style={{
            marginLeft: 14,
            fontWeight: 500,
            fontSize: "0.97rem",
            color: "var(--text-secondary)",
            padding: "3px 14px",
            borderRadius: 10,
            background:
              sessionMode === "Demo"
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,152,0,0.15)",
            border:
              sessionMode === "Pro"
                ? "1.5px solid var(--accent)"
                : "1.5px solid #ffffff22",
            marginTop: -4,
            marginBottom: -4,
            marginRight: 0,
          }}
          aria-label={`Current mode: ${sessionMode}`}
        >
          {sessionMode} Mode
        </span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <form
          onSubmit={handleReconSubmit}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            marginBottom: 4,
            maxWidth: 440,
          }}
          autoComplete="off"
        >
          <input
            type="text"
            placeholder="Enter domain, e.g. example.com"
            value={domain}
            onChange={e => {
              setDomain(e.target.value);
              setTouched(true);
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            style={{
              flex: 1,
              padding: "10px 13px",
              fontSize: "1.08em",
              background: "#23272e",
              color: "#ffe9c4",
              border: "1.5px solid var(--border-color)",
              borderRadius: 7,
              outline: "none",
              fontWeight: 500
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn"
            style={{
              background: "var(--accent-gradient)",
              color: "#22272e",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: "1.07em",
              boxShadow: "0 1px 7px #ff980027",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.62 : 1,
              transition: "opacity 0.11s"
            }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Scanning..." : "Run Recon"}
          </button>
        </form>
        <div style={{
          fontSize: "0.98em",
          color: "var(--text-secondary)",
          marginLeft: 2
        }}>
          {
            sessionMode === "Demo" ?
              "Demo mode returns mock data. Switch to Pro for real recon."
              : "Uses your API key securely, no data is stored."
          }
        </div>
        {error && (
          <div
            style={{
              color: "#ff9800",
              marginTop: 8,
              background: "#181a2070",
              border: "1.3px dashed #ff980066",
              borderRadius: 9,
              padding: "6px 20px",
              fontSize: "0.98em",
              fontWeight: 500
            }}
          >
            {error}
          </div>
        )}
        {(!error && touched && !loading && !reconData) && (
          <div style={{ color: "#999", marginTop: 10, fontSize: "0.99em", fontStyle: "italic" }}>
            Enter a domain to begin recon.
          </div>
        )}
      </div>
      {/* RESULT PANEL */}
      {reconData && (
        <div style={{
          marginTop: 22,
          background: "#23272e",
          border: "1.5px solid var(--border-color)",
          borderRadius: 16,
          padding: "26px 29px 22px 31px",
          boxShadow: "0 4px 25px #0003, 0 2px 6px #ff98000b"
        }}>
          <div style={{ fontWeight: 600, color: "var(--accent)", fontSize: "1.08em", marginBottom: 7, letterSpacing: "0.02em" }}>
            Recon Results for {reconData.domain || domain}
          </div>
          {reconData.summary && (
            <div style={{ color: "#fde9a7", marginBottom: 8 }}>{reconData.summary}</div>
          )}
          {reconData.hosts && Array.isArray(reconData.hosts) && (
            <div style={{ marginBottom: 12 }}>
              <b style={{ color: "#adfda7" }}>Hosts:</b>
              <ul style={{ margin: 0, marginTop: 3, paddingLeft: 20 }}>
                {reconData.hosts.map((h, i) => (
                  <li key={i} style={{ color: "#ff9800cc", fontSize: "1em" }}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          {reconData.openPorts && (
            <div style={{ marginBottom: 11 }}>
              <b style={{ color: "#d6c970" }}>Open Ports:</b>
              <span style={{ marginLeft: 8, color: "#ffd279", fontWeight: 500 }}>{reconData.openPorts.join(", ")}</span>
            </div>
          )}
          {reconData.amassNodes && (
            <div style={{ marginTop: 11 }}>
              <b style={{ color: "#8fdce9" }}>Amass Graph:</b>
              <div style={{
                background: "#191a20",
                border: "1.1px solid #21252c",
                borderRadius: 8,
                padding: "7px 14px",
                marginTop: 5,
                fontFamily: "monospace",
                color: "#bffae1",
                fontSize: "0.97em"
              }}>
                {/* For MVP: just display JSON tree for now */}
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(reconData.amassNodes, null, 2)}
                </pre>
                {sessionMode === "Demo" &&
                  <div style={{ color: "#ff9800", marginTop: 6, fontSize: "0.96em", fontWeight: 500 }}>
                    Graph and table visualizations require Pro mode.
                  </div>
                }
              </div>
            </div>
          )}
          {/* Additional details displayed for Pro */}
          {sessionMode === "Pro" && reconData.extraDetails && (
            <div style={{ marginTop: 15, color: "#e6beb2" }}>
              <hr style={{ border: "none", borderTop: "1.2px solid #333", margin: "10px 0" }} />
              <div>
                <b>Extra Details:</b>
                <pre style={{
                  background: "#170e0e33",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#eee0ff",
                  fontSize: "0.97em",
                  margin: 0
                }}>
                  {JSON.stringify(reconData.extraDetails, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Demo limitation info */}
      {sessionMode === "Demo" && (
        <p style={{
          background: "#181a2070",
          border: "1.5px dashed #ff980066",
          borderRadius: 10,
          color: "#ff9800",
          padding: "6px 22px",
          marginTop: 21,
          fontSize: "0.97em"
        }}>
          Some advanced features (live graph, asset import/export, real subdomains) require <b>Pro mode</b>.
        </p>
      )}
    </div>
  );
}

export default ReconDashboard;
