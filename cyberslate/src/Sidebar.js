import React from "react";
import "./App.css";
import Logo from "./Logo";

// Navigation modules and icons
const MODULES = [
  { name: "Recon", icon: "🕵️" },
  { name: "Scanner", icon: "⚡" },
  { name: "Exploitation", icon: "💥" },
  { name: "Debugger", icon: "🔍" },
  { name: "Wordlist", icon: "📝" },
  { name: "Reports", icon: "📄" },
  { name: "Bounty", icon: "🏆" },
  { name: "Settings", icon: "⚙️" },
];

// PUBLIC_INTERFACE
function Sidebar({ onSelect, activeModule }) {
  /**
   * Modern sidebar for CyberSlate modules.
   * @param {Function} onSelect - Callback when user selects a module.
   * @param {String} activeModule - The currently active module for highlighting.
   */
  return (
    <aside className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-logo" tabIndex={0}>
        <Logo size={29} fontSize="1.19rem" hideText={false} gap={10} />
      </div>
      <nav className="sidebar-nav">
        {MODULES.map((mod) => (
          <button
            key={mod.name}
            className={
              "sidebar-link" + (activeModule === mod.name ? " active" : "")
            }
            tabIndex={0}
            aria-current={activeModule === mod.name ? "page" : undefined}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              outline: "none",
              fontFamily: "'Orbitron', 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif",
            }}
            onClick={() => onSelect(mod.name)}
          >
            <span aria-hidden="true" style={{ marginRight: 13 }}>
              {mod.icon}
            </span>
            <span>{mod.name}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
