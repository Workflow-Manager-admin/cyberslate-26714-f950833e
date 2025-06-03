import React, { useContext, useEffect } from "react";
import "./App.css";
import { AppContext } from "./App";

/**
 * To support Demo/Pro mode-aware features, sessionMode is provided
 * via AppContext to all modules in the app. See below for usage.
 * 
 * Each module panel receives sessionMode as a prop so it can adapt
 * its features, UI, buttons, or limitations based on mode.
 */

// Example module panels updated to display and use sessionMode.
import ReconDashboard from "./ReconDashboard";
const MODULE_COMPONENTS = {
  // PUBLIC_INTERFACE
  Recon: ({ sessionMode }) => (
    <ReconDashboard sessionMode={sessionMode} />
  ),
  Scanner: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Vulnerability Scanner{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Integrates Nuclei CLI for vulnerability scanning, filtering, and reporting.
      </p>
      {sessionMode === "Demo" && (
        <p style={{
          color: "#ff9800",
          background: "#181a2079",
          border: "1.5px dashed #ff980066",
          borderRadius: 10,
          padding: "5.5px 16px",
          marginTop: 12,
        }}>
          Pro mode enables full automation and additional templates.
        </p>
      )}
    </div>
  ),
  Exploitation: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Exploitation Toolkit{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Built-in proxy, request/response viewer, replay tools, JWT/Base64 decoder, and timeline.
      </p>
      {sessionMode === "Demo" && (
        <p style={{
          color: "#ff9800",
          background: "#181a2079",
          border: "1.5px dashed #ff980066",
          borderRadius: 10,
          padding: "5.5px 16px",
          marginTop: 12,
        }}>
          Some request replay features and timeline export require Pro mode.
        </p>
      )}
    </div>
  ),
  Debugger: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        JS Debugger{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Extract secrets/tokens/endpoints from JS/HTML, display live updates.
      </p>
    </div>
  ),
  Wordlist: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Wordlist Generator{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Paste/upload JS/HTML, run TF-IDF analysis and export keywords.
      </p>
    </div>
  ),
  Reports: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Report Generator{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Markdown editor, live preview, screenshots, findings, export to PDF/HTML.
      </p>
    </div>
  ),
  Bounty: ({ sessionMode }) => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Bug Bounty Aggregator{" "}
        <span style={{
          marginLeft: 10,
          fontWeight: 500,
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          borderRadius: 9,
          background: "rgba(255,255,255,0.08)",
          padding: "2.5px 12px"
        }}>
          {sessionMode} Mode
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Fetch from HackerOne, Bugcrowd, Intigriti, filter, import domains into Recon.
      </p>
    </div>
  ),
  Settings: function SettingsPanel({ sessionMode }) {
    // Use AppContext for API key and setter
    const { apiKey, setApiKey, isDemoApiKey, reconProvider, setReconProvider } = useContext(AppContext);

    // For UX/security, let users toggle visibility
    const [showApiKey, setShowApiKey] = React.useState(false);

    // Provider selection: Local state to sync with AppContext/localStorage if missing
    const PROVIDER_OPTIONS = [
      { value: "hackertarget", label: "HackerTarget (Free, High-Capacity)" },
      { value: "googledns", label: "Google DNS over HTTPS" }
    ];

    // If reconProvider doesn't exist (legacy users), default to 'hackertarget'
    useEffect(() => {
      if (!reconProvider) {
        setReconProvider(window.localStorage.getItem("reconProvider") || "hackertarget");
      }
    }, [reconProvider, setReconProvider]);

    return (
      <div>
        {/* Recon Provider Selection (for Lookups) */}
        <div style={{
          background: "linear-gradient(101deg, #23272e 80%, #21251c 100%)",
          border: "1.6px solid #4bbaec33",
          borderRadius: 12,
          padding: "18px 22px 13px 19px",
          boxShadow: "0 2px 13px 0 #259ddb12",
          color: "#b8eae6",
          margin: "8px 0 24px 0",
          maxWidth: 510
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: "1.07em",
            marginBottom: 7,
            color: "#7ee7ff"
          }}>
            <span role="img" aria-label="satellite" style={{ marginRight: 7 }}>📡</span>
            Recon Lookup Provider
          </div>
          <div style={{
            fontSize: "1.01em",
            color: "#caecfc",
            marginBottom: 8,
            lineHeight: 1.47
          }}>
            Choose which provider to use for live subdomain and DNS lookups:<br />
            <ul style={{ margin: "4px 0 10px 22px", color: "#aad6ec", fontSize: "0.99em" }}>
              <li>
                <b>HackerTarget.com</b> – Free, no registration, high query limit. Fast API for subdomain/DNS recon.
              </li>
              <li>
                <b>Google DNS</b> – DNS-over-HTTPS API (public, privacy friendly). Great for resolving DNS records.
              </li>
            </ul>
          </div>
          {/* Provider radio group */}
          <div role="radiogroup" aria-label="Recon Provider" style={{ display: "flex", gap: 25, marginBottom: 4 }}>
            {PROVIDER_OPTIONS.map(opt => (
              <label key={opt.value} style={{
                display: "flex", alignItems: "center", gap: 9,
                fontWeight: reconProvider === opt.value ? 700 : 520,
                color: reconProvider === opt.value ? "#ffd700" : "#b8eae6",
                background: reconProvider === opt.value ? "#23272e" : "transparent",
                border: reconProvider === opt.value ? "1.6px solid #72caff" : "1.2px solid #22405a",
                borderRadius: 8,
                padding: "4px 17px 4px 10px",
                cursor: "pointer",
                transition: "all 0.13s"
              }}>
                <input
                  type="radio"
                  name="reconProvider"
                  value={opt.value}
                  checked={reconProvider === opt.value}
                  onChange={e => {
                    setReconProvider(opt.value);
                    window.localStorage.setItem("reconProvider", opt.value);
                  }}
                  style={{
                    accentColor: "#38deff",
                    width: 18, height: 18,
                    marginRight: 6, marginLeft: 0
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div style={{
            color: "#c4e9ab", fontSize: ".96em", marginTop: 2, opacity: 0.71
          }}>
            Preference is saved locally and used for lookups in Recon dashboard.
          </div>
        </div>
        {/* If using auto-generated demo key, show a clear UI notice */}
        {sessionMode === "Pro" && isDemoApiKey && apiKey && apiKey.startsWith("demo_") && (
          <div style={{
            background: "linear-gradient(88deg, #ff980055 70%, #23272e 100%)",
            border: "1.7px solid #ffbd4e",
            borderRadius: 10,
            color: "#ffefe2",
            fontWeight: 650,
            fontSize: "1.06em",
            margin: "0 0 15px 0",
            padding: "12px 20px",
            boxShadow: "0 0 14px #ffb94f18"
          }}>
            <span role="img" aria-label="magic" style={{marginRight: "10px"}}>✨</span>
            <span>
              <b>Demo API key auto-generated.</b>
              <br />
              This is a randomly generated key for demo/testing only.
              <br />
              <span style={{ color: "#eed750" }}>To use real Recon APIs, paste a valid API key below.</span>
            </span>
          </div>
        )}
        <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
          Settings & Plugin Manager{" "}
          <span style={{
            marginLeft: 10,
            fontWeight: 500,
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            borderRadius: 9,
            background: "rgba(255,255,255,0.08)",
            padding: "2.5px 12px"
          }}>
            {sessionMode} Mode
          </span>
        </div>
        {/* BEGIN: API Key Requirements and Help (UPDATED, clearer instructions) */}
        <div
          style={{
            background: "linear-gradient(99deg, #23272e 80%, #ff980015 100%)",
            border: "1.6px solid #ff980077",
            borderRadius: 12,
            padding: "18px 20px 15px 19px",
            boxShadow: "0 2px 13px 0 #19151216",
            color: "#ffe9c4",
            margin: "19px 0 20px 0",
            maxWidth: 510
          }}
        >
          <div style={{ fontWeight: 680, fontSize: "1.11em", marginBottom: 7, color: "#ffb65c" }}>
            <span role="img" aria-label="key" style={{ marginRight: 7 }}>🔑</span>
            Recon Dashboard API Key Setup
          </div>
          <div style={{ fontSize: "1.01em", color: "#fed798", marginBottom: 7, lineHeight: 1.49 }}>
            <strong>
              The <b>Recon Dashboard</b> requires an API key to access live reconnaissance data.
            </strong>
            <br />
            <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 22, color: "#ecd792", fontSize: "0.97em" }}>
              <li>
                <b>SecurityTrails API key</b> – <span style={{ color: "#d8a641" }}>Recommended</span> for fast, accurate subdomain discovery.<br />
                <a
                  href="https://securitytrails.com/app/account/api"
                  style={{ color: "#8fdce9", textDecoration: "underline" }}
                  rel="noopener noreferrer" target="_blank"
                >
                  Obtain a SecurityTrails API key
                </a>
              </li>
              <li>
                <b>Shodan API key</b> – For discovering exposed hosts/devices.
                {" "}
                <a
                  href="https://account.shodan.io/register"
                  style={{ color: "#8fdce9", textDecoration: "underline" }}
                  rel="noopener noreferrer" target="_blank"
                >Get a key</a>
              </li>
              <li>
                <b>Censys API credentials</b> – For IP, DNS, and certificate reconnaissance.
                {" "}
                <a
                  href="https://accounts.censys.io/self-service/register"
                  style={{ color: "#8fdce9", textDecoration: "underline" }}
                  rel="noopener noreferrer" target="_blank"
                >Register at Censys</a>
              </li>
              <li>
                <span style={{ color: "#cfde8a" }}>
                  <b>Other compatible APIs:</b> Amass, BinaryEdge, etc. (optional, see docs).
                </span>
              </li>
            </ul>
            <span style={{ color: "#a8d379" }}>
              <b>What does an API key unlock?</b>
              <br />
              – Live, up-to-date reconnaissance results (vs sample/demo-only data)<br />
              – Automatic subdomain/asset discovery<br />
              – Graph and table visualization features<br />
              – CSV/JSON export, batch processing, advanced API integrations<br />
            </span>
          </div>
          <div style={{ color: "#fed47b", fontSize: "0.96em", marginTop: 2, opacity: 0.91 }}>
            <strong>How to get your API key:</strong> <span style={{ color: "#ffd37c" }}>Sign up or login to the provider above.</span> 
            <br />
            For SecurityTrails: visit <a href="https://securitytrails.com/app/account/api" target="_blank" rel="noopener noreferrer" style={{ color: "#8fdce9" }}>your API dashboard</a>.<br />
            <span style={{ color: "#a6eaa3" }}>
              Paste your key below to enable Pro features in the Recon Dashboard.
            </span>
            <br />
            For other setup information, see the 
            {" "}
            <a href="https://docs.cyberrecon.app/api-setup" target="_blank" rel="noopener noreferrer" style={{ color: "#8fdce9" }}>
              CyberRecon API Setup Guide
            </a>.
          </div>
          <div style={{ color: "#fed773", fontSize: "0.94em", marginTop: 8 }}>
            <span style={{ color: "#dbdb99" }}>Demo Mode</span> uses only sample data.
            <b> Pro Mode (API Key required)</b> unlocks full, real-time data.
          </div>
        </div>
        {/* END: API Key Requirements and Help */}
        <div style={{ margin: "0 0 26px 0", maxWidth: 390 }}>
          <label htmlFor="api-key-field"
            style={{
              fontWeight: 500,
              fontSize: "1rem",
              color: "var(--text-secondary)",
              marginBottom: 5,
              display: "inline-block",
              letterSpacing: "0.015em"
            }}
          >
            API Key
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="api-key-field"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              placeholder="Enter your API key (SecurityTrails, Shodan, etc.)"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "90%",
                padding: "10px 14px",
                fontSize: "1.07em",
                background: "#23272e",
                color: "#ffe9c4",
                border: "1.5px solid var(--border-color)",
                borderRadius: 7,
                outline: "none"
              }}
              onChange={e => setApiKey(e.target.value)}
              aria-label="API Key"
            />
            <button
              aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
              type="button"
              tabIndex={0}
              style={{
                padding: "5px 9px",
                fontSize: "1.12em",
                borderRadius: 6,
                background: "none",
                border: "1px solid #fff2",
                color: "#ff9800",
                cursor: "pointer",
                outline: "none"
              }}
              onClick={() => setShowApiKey(s => !s)}
            >
              {showApiKey ? "🙈" : "👁️"}
            </button>
          </div>
          <div style={{
            fontSize: "0.93em",
            color: "#eca917",
            marginTop: 6,
            lineHeight: 1.35,
            opacity: 0.92
          }}>
            Your API key is stored in your browser only.<br />
            It is never sent anywhere unless required for API calls.<br />
            <span style={{ color: "#a8d379" }}>
              Needed for Pro mode and real-time integrations.
            </span>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * PUBLIC_INTERFACE
 * MainContainer renders the active tab/module's main panel, and propagates the
 * sessionMode prop (Demo/Pro) to all modules for mode-specific logic.
 *
 * Example: To access the current session mode in any custom module:
 *   const { sessionMode } = useContext(AppContext);
 *
 * Or in a function component panel, accept sessionMode as a prop.
 *    function MyPanel({ sessionMode }) { ... }
 */
function MainContainer({ activeModule }) {
  const { sessionMode } = useContext(AppContext);

  const Panel = MODULE_COMPONENTS[activeModule] || (() => <div />);
  return (
    <section className="content-area" tabIndex={0} style={{ minHeight: 300 }}>
      {/* Pass sessionMode prop to the currently active module panel */}
      <Panel sessionMode={sessionMode} />
    </section>
  );
}

export default MainContainer;
