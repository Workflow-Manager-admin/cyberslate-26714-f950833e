import React from "react";
import "./App.css";

// Stubs for each module's main panel/component
const MODULE_COMPONENTS = {
  Recon: () => (
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
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Here you'll find recon tools such as domain input, Amass visualizations, Masscan results, and more.
      </p>
    </div>
  ),
  Scanner: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Vulnerability Scanner
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Integrates Nuclei CLI for vulnerability scanning, filtering, and reporting.
      </p>
    </div>
  ),
  Exploitation: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Exploitation Toolkit
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Built-in proxy, request/response viewer, replay tools, JWT/Base64 decoder, and timeline.
      </p>
    </div>
  ),
  Debugger: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        JS Debugger
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Extract secrets/tokens/endpoints from JS/HTML, display live updates.
      </p>
    </div>
  ),
  Wordlist: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Wordlist Generator
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Paste/upload JS/HTML, run TF-IDF analysis and export keywords.
      </p>
    </div>
  ),
  Reports: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Report Generator
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Markdown editor, live preview, screenshots, findings, export to PDF/HTML.
      </p>
    </div>
  ),
  Bounty: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Bug Bounty Aggregator
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Fetch from HackerOne, Bugcrowd, Intigriti, filter, import domains into Recon.
      </p>
    </div>
  ),
  Settings: () => (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 9, color: "var(--accent)" }}>
        Settings & Plugin Manager
      </div>
      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
        Configure API keys, proxy, and manage plugins.
      </p>
    </div>
  ),
};

// PUBLIC_INTERFACE
function MainContainer({ activeModule }) {
  /**
   * MainContainer renders the active tab/module's main panel.
   * @param {String} activeModule - The name of the module to render.
   */
  const Panel = MODULE_COMPONENTS[activeModule] || (() => <div />);
  return (
    <section className="content-area" tabIndex={0} style={{ minHeight: 300 }}>
      <Panel />
    </section>
  );
}

export default MainContainer;
