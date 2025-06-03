import React from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  const modules = [
    { name: 'Recon', icon: '🕵️', active: true },
    { name: 'Scanner', icon: '⚡' },
    { name: 'Exploitation', icon: '💥' },
    { name: 'Debugger', icon: '🔍' },
    { name: 'Wordlist', icon: '📝' },
    { name: 'Reports', icon: '📄' },
    { name: 'Bounty', icon: '🏆' },
    { name: 'Settings', icon: '⚙️' },
  ];

  // Keyboard navigation accessibility for sidebar links
  const sidebarNavRef = React.useRef(null);
  
  return (
    <div className="app-root">
      <aside className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-logo" tabIndex={0}>
          <span className="sidebar-logo-symbol">⚡</span>CyberSlate
        </div>
        <nav className="sidebar-nav" ref={sidebarNavRef}>
          {modules.map((mod, idx) => (
            <a
              key={mod.name}
              href="#"
              className={`sidebar-link${mod.active ? ' active' : ''}`}
              tabIndex={0}
              aria-current={mod.active ? 'page' : undefined}
            >
              <span aria-hidden="true" style={{ marginRight: 12 }}>{mod.icon}</span>
              <span>{mod.name}</span>
            </a>
          ))}
        </nav>
      </aside>
      <div className="main-layout">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="topbar-accent">⚡</span>CyberSlate
          </div>
          <div className="topbar-session">
            Session: <span style={{ color: 'var(--accent)' }}>Demo User</span>
          </div>
        </header>
        <main className="content-area" tabIndex={0}>
          <h1 style={{ fontWeight: 700, marginBottom: 8, fontSize: '2rem', letterSpacing: 0.01 }}>Welcome to CyberSlate</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 580, fontSize: '1.1rem', marginBottom: 30 }}>
            The modular cybersecurity and recon toolkit.<br />
            Use the sidebar to select a module and get started.
          </p>
          <div>
            {/* Placeholder for main module content */}
            <div style={{
              border: '1px solid var(--border-color)',
              background: 'var(--primary-bg)',
              color: 'var(--text-color)',
              borderRadius: 10,
              padding: 32,
              minHeight: 240,
              boxShadow: '0 3px 18px 0 rgba(0,0,0,0.11)'
            }}>
              <div style={{ fontSize: '1.22rem', fontWeight: 600, marginBottom: 14, color: 'var(--accent)' }}>
                Recon Dashboard (Example)
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Here you'll find recon tools such as domain input, Amass visualizations, Masscan results, and more. Switch modules via the navigation.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
