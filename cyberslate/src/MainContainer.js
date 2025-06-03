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
const MODULE_COMPONENTS = {
  // PUBLIC_INTERFACE
  Recon: ({ sessionMode }) => (
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
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Here you'll find recon tools such as domain input, Amass visualizations, Masscan results, and more.
      </p>
      {/* Example: Conditionally show feature limitation */}
      {sessionMode === "Demo" && (
        <p style={{
          background: "#181a2070",
          border: "1.5px dashed #ff980066",
          borderRadius: 10,
          color: "#ff9800",
          padding: "6px 22px",
          marginTop: 16,
          fontSize: "0.97em"
        }}>
          Some advanced features are available in <b>Pro mode</b>.
        </p>
      )}
    </div>
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
  Settings: ({ sessionMode }) => (
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
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Configure API keys, proxy, and manage plugins.
      </p>
    </div>
  ),
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
