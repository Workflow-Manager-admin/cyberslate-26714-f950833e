import React from "react";
import "./App.css";

/**
 * PRIMARY TAB COLOR/STYLE: accent underline, dark bg, close "x" on hover/focus, modern minimal styling
 */

// PUBLIC_INTERFACE
function TabBar({ openTabs, activeTab, onSwitch, onClose }) {
  /**
   * TabBar for managing opened modules/tabs.
   * @param {Array} openTabs - Array of { name, icon } for opened tabs.
   * @param {String} activeTab - Name of currently active tab.
   * @param {Function} onSwitch - Function to make a tab active.
   * @param {Function} onClose - Function to close a tab.
   */
  return (
    <nav
      className="tabbar"
      style={{
        display: "flex",
        alignItems: "flex-end",
        paddingLeft: 16,
        height: 46,
        borderBottom: "1px solid var(--border-color)",
        background: "var(--primary-bg)",
        overflowX: "auto",
        zIndex: 101,
      }}
      aria-label="Opened Modules"
    >
      {openTabs.map((tab) => (
        <div
          key={tab.name}
          className="tabbar-tab"
          tabIndex={0}
          aria-selected={activeTab === tab.name}
          style={{
            display: "flex",
            alignItems: "center",
            color:
              activeTab === tab.name
                ? "var(--accent)"
                : "var(--text-secondary)",
            background:
              activeTab === tab.name ? "rgba(255,152,0,0.07)" : "none",
            borderBottom:
              activeTab === tab.name
                ? "3px solid var(--accent)"
                : "3px solid transparent",
            fontWeight: 600,
            fontSize: "1.02rem",
            padding: "0 22px 0 14px",
            height: 38,
            marginRight: 2,
            borderRadius: "9px 9px 0 0",
            position: "relative",
            outline: "none",
            cursor: "pointer",
            transition: "all 0.14s",
          }}
          onClick={() => onSwitch(tab.name)}
          onKeyDown={(e) => {
            // Enable arrow key navigation
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const idx = openTabs.findIndex((t) => t.name === tab.name);
              let nextIdx =
                e.key === "ArrowRight"
                  ? (idx + 1) % openTabs.length
                  : (idx - 1 + openTabs.length) % openTabs.length;
              onSwitch(openTabs[nextIdx].name);
            }
          }}
        >
          <span style={{ fontSize: "1.15em", marginRight: 9 }}>
            {tab.icon}
          </span>
          <span style={{ maxWidth: 115, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tab.name}
          </span>
          {tab.name !== "Recon" && (
            <button
              className="tabbar-close-btn"
              tabIndex={0}
              aria-label={`Close ${tab.name}`}
              style={{
                marginLeft: 7,
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                fontSize: "1.16em",
                cursor: "pointer",
                outline: "none",
                opacity: 0.5,
                transition: "opacity 0.16s",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.name);
              }}
              onFocus={(e) => (e.target.style.opacity = "1")}
              onBlur={(e) => (e.target.style.opacity = "0.5")}
              onMouseEnter={(e) => (e.target.style.opacity = "1")}
              onMouseLeave={(e) => (e.target.style.opacity = "0.5")}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}

export default TabBar;
