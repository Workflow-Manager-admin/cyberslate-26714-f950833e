import React, { useState, useCallback, useMemo, useEffect } from "react";
import "./App.css";
import Sidebar from "./Sidebar";
import TabBar from "./TabBar";
import MainContainer from "./MainContainer";
import Logo from "./Logo";

/**
 * AppContext for session info and API key sharing
 * Includes sessionMode, setSessionMode, apiKey, setApiKey, reconProvider, setReconProvider.
 */
// PUBLIC_INTERFACE
export const AppContext = React.createContext({
  sessionMode: "Demo",
  setSessionMode: () => {},
  apiKey: "",
  setApiKey: () => {},
  reconProvider: "hackertarget",
  setReconProvider: () => {},
});

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

/**
 * PUBLIC_INTERFACE
 * App component manages sessionMode, API key, and propagates via AppContext.
 */
function App() {
  // Session (Demo/Pro); initialize from localStorage else default to Demo
  const [sessionMode, setSessionMode] = useState(() => {
    return window.localStorage.getItem("sessionMode") || "Demo";
  });

  // API Key, securely loaded from localStorage if present
  const [apiKey, setApiKeyInternal] = useState(() => {
    return window.localStorage.getItem("apiKey") || "";
  });
  // Track if key is an app-generated demo key (so we can show the yellow indicator)
  const [isDemoApiKey, setIsDemoApiKey] = useState(() => {
    // true if localStorage key is generated, false if user-supplied or empty
    return window.localStorage.getItem("isDemoApiKey") === "true";
  });

  // Save sessionMode on change
  useEffect(() => {
    window.localStorage.setItem("sessionMode", sessionMode);
  }, [sessionMode]);

  // Save apiKey on change (persist immediately for all modules)
  useEffect(() => {
    if (apiKey !== undefined) {
      window.localStorage.setItem("apiKey", apiKey || "");
    }
    window.localStorage.setItem("isDemoApiKey", isDemoApiKey ? "true" : "false");
  }, [apiKey, isDemoApiKey]);

  // On sessionMode change: if switching to "Pro" and no API key, generate a random one and store
  useEffect(() => {
    if (sessionMode === "Pro" && !apiKey) {
      // Generate a mock secure/random API key, visually distinct
      const genKey = () => {
        // Simple secure key (32 chars, hex + some symbols)
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.";
        let result = "";
        // Uses crypto if available, fallback to Math.random
        if (window.crypto && window.crypto.getRandomValues) {
          let array = new Uint8Array(32);
          window.crypto.getRandomValues(array);
          for (let i = 0; i < array.length; i++) {
            result += charset[array[i] % charset.length];
          }
        } else {
          for (let i = 0; i < 32; i++) {
            result += charset[Math.floor(Math.random() * charset.length)];
          }
        }
        // Prefix for demo
        return "demo_" + result;
      };
      const fakeKey = genKey();
      setApiKeyInternal(fakeKey);
      setIsDemoApiKey(true);
      // Save & mark as demo key
      window.localStorage.setItem("apiKey", fakeKey);
      window.localStorage.setItem("isDemoApiKey", "true");
    }
    // If switching back to Demo, keep user key (don't clear)
  // eslint-disable-next-line
  }, [sessionMode]); // only run on sessionMode

  // Setter exposed to context (if you want to do further sanitization, add here)
  const setApiKey = (key) => {
    setApiKeyInternal(key);
    // User sets key manually, so not auto/demo anymore
    setIsDemoApiKey(false);
    // (Will be saved via useEffect)
  };

  // Tabs state: array of { name, icon }
  const [openTabs, setOpenTabs] = useState([
    MODULES[0],
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

  // Memoize context value to avoid unnecessary rerenders
  const appContextValue = useMemo(() => ({
    sessionMode,
    setSessionMode,
    apiKey,
    setApiKey,
    isDemoApiKey
  }), [sessionMode, setSessionMode, apiKey, isDemoApiKey]); // setApiKey is stable

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="app-root">
        <Sidebar
          onSelect={onSelectModule}
          activeModule={activeTab}
        />
        <div className="main-layout">
          <header className="topbar">
            <div className="topbar-brand">
              <Logo size={29} fontSize="1.05rem" gap={10} hideText={false} />
            </div>
            {/* --- SESSION SELECTION BUTTONS --- */}
            <div className="topbar-session" style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: 8 }}>Session:</span>
              <button
                className="session-btn"
                style={{
                  marginRight: 4,
                  padding: "5.5px 18px",
                  borderRadius: 16,
                  border: sessionMode === "Demo" ? "2px solid var(--accent)" : "1.5px solid #ccc2",
                  background: sessionMode === "Demo" ? "var(--accent-gradient)" : "transparent",
                  color: sessionMode === "Demo" ? "#23272e" : "var(--text-secondary)",
                  fontWeight: sessionMode === "Demo" ? 700 : 530,
                  cursor: "pointer",
                  fontSize: "1rem",
                  outline: "none",
                  boxShadow: sessionMode === "Demo" ? "0 4px 8px 0 #ff980032" : "none",
                  transition: "all 0.15s",
                  marginLeft: 4,
                }}
                aria-pressed={sessionMode === "Demo"}
                onClick={() => setSessionMode("Demo")}
              >
                Demo
              </button>
              <button
                className="session-btn"
                style={{
                  marginRight: 0,
                  padding: "5.5px 18px",
                  borderRadius: 16,
                  border: sessionMode === "Pro" ? "2px solid var(--accent)" : "1.5px solid #ccc2",
                  background: sessionMode === "Pro" ? "var(--accent-gradient)" : "transparent",
                  color: sessionMode === "Pro" ? "#23272e" : "var(--text-secondary)",
                  fontWeight: sessionMode === "Pro" ? 700 : 530,
                  cursor: "pointer",
                  fontSize: "1rem",
                  outline: "none",
                  boxShadow: sessionMode === "Pro" ? "0 4px 8px 0 #ff980032" : "none",
                  transition: "all 0.15s",
                  marginLeft: 7,
                }}
                aria-pressed={sessionMode === "Pro"}
                onClick={() => setSessionMode("Pro")}
              >
                Pro
              </button>
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
    </AppContext.Provider>
  );
}

export default App;
