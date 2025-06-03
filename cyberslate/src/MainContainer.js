import React, { useContext } from "react";
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
    const { apiKey, setApiKey } = useContext(AppContext);

    // For UX/security, let users toggle visibility
    const [showApiKey, setShowApiKey] = React.useState(false);

    return (
      <div>
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
        <div style={{ margin: "18px 0 26px 0", maxWidth: 390 }}>
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
              placeholder="Enter your API key"
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
              Needed for Pro/3rd-party integrations.
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
