import React, { useState, useCallback } from "react";
import "./App.css";
import Sidebar from "./Sidebar";
import TabBar from "./TabBar";
import MainContainer from "./MainContainer";

// The module definitions (shared among Sidebar, TabBar)
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
function App() {
  // Tabs state: array of { name, icon }
  const [openTabs, setOpenTabs] = useState([
    MODULES[0], // Recon is always open to start
  ]);
  // Active tab: string of module name
  const [activeTab, setActiveTab] = useState("Recon");

  const onSelectModule = useCallback(
    (moduleName) => {
      const exists = openTabs.find((tab) => tab.name === moduleName);
      if (!exists) {
        const def = MODULES.find((m) => m.name === moduleName);
        setOpenTabs((tabs) => [...tabs, def]);
      }
      setActiveTab(moduleName);
    },
    [openTabs]
  );

  const onSwitchTab = useCallback(
    (moduleName) => setActiveTab(moduleName),
    []
  );

  const onCloseTab = useCallback(
    (moduleName) => {
      if (moduleName === "Recon") return; // Recon tab cannot be closed
      const idx = openTabs.findIndex((tab) => tab.name === moduleName);
      if (idx === -1) return;
      const newTabs = openTabs.filter((t) => t.name !== moduleName);
      setOpenTabs(newTabs);
      // If closing active, set to left tab (or right if no left, or none)
      if (activeTab === moduleName) {
        if (newTabs.length > 0) {
          const nextIdx = idx > 0 ? idx - 1 : 0;
          setActiveTab(newTabs[nextIdx].name);
        } else {
          setActiveTab(""); // No tab open
        }
      }
    },
    [openTabs, activeTab]
  );

  return (
    <div className="app-root">
      <Sidebar
        onSelect={onSelectModule}
        activeModule={activeTab}
      />
      <div className="main-layout">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="topbar-logo-symbol" aria-label="CyberRecon Suite logo" />
            CyberRecon Suite
          </div>
          <div className="topbar-session">
            Session: <span style={{ color: "var(--accent)" }}>Demo User</span>
          </div>
        </header>
        <TabBar
          openTabs={openTabs}
          activeTab={activeTab}
          onSwitch={onSwitchTab}
          onClose={onCloseTab}
        />
        <MainContainer activeModule={activeTab} />
      </div>
    </div>
  );
}

export default App;
