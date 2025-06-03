import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "./App";

/**
 * PUBLIC_INTERFACE
 * ReconDashboard
 * Refactored to respond to config in AppContext and dynamically use either
 * HackerTarget subdomain lookups or Google DNS queries per user selection (Settings).
 * - Runs recon via selected provider (no API key needed for these)
 * - Parses, displays, and handles all UX and error states distinctively
 * - Upgraded dark, modern UI for a premium recon experience
 */

const DEMO_DATA = [
  {
    domain: "example.com",
    data: {
      summary: "Demo data for example.com. Switch to Pro for real-time recon.",
      hosts: ["api.example.com", "mail.example.com", "cdn.example.com"],
      openPorts: [80, 443, 25],
      amassNodes: [
        { id: 1, label: "example.com", children: [{ id: 2, label: "api.example.com" }] }
      ]
    },
    status: "Demo",
    error: "",
    quota: ""
  },
  {
    domain: "demo.org",
    data: {
      summary: "Demo: Subdomain recon and port scan. Pro unlocks more.",
      hosts: ["dev.demo.org", "beta.demo.org"],
      openPorts: [8080],
      amassNodes: [
        { id: 1, label: "demo.org", children: [{ id: 2, label: "beta.demo.org" }] }
      ]
    },
    status: "Demo",
    error: "",
    quota: ""
  }
];

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

/**
 * Utility: Parse user input into unique, valid domain array
 * Accept separators: comma, space, newlines
 */
function parseDomains(raw) {
  const split = raw.split(/[\s,;]+/g)
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)
    .filter(x => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x));
  // Preserve order, dedupe
  return [...new Set(split)];
}

/**
 * Utility: Download a file (for export)
 */
function triggerDownload(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 350);
}
/**
 * Utility: Convert result array to CSV
 */
function resultsToCSV(arr) {
  if (!arr?.length) return "";
  // Build header union
  const allKeys = new Set([
    "domain", "status", "summary", "hosts", "openPorts", "quota", "error"
  ]);
  arr.forEach(row =>
    row.data && typeof row.data === "object" &&
    Object.keys(row.data).forEach(k => allKeys.add(k))
  );
  const header = Array.from(allKeys);
  const csvRows = [
    header.join(",")
  ];
  arr.forEach(r => {
    csvRows.push(header.map(k => {
      if (k === "hosts")
        return r.data && Array.isArray(r.data.hosts) ? `"${r.data.hosts.join('; ')}"` : "";
      if (k === "openPorts")
        return r.data && Array.isArray(r.data.openPorts) ? `"${r.data.openPorts.join('; ')}"` : "";
      if (k === "summary")
        return r.data && r.data.summary ? `"${r.data.summary.replace(/"/g, '""')}"` : "";
      if (k === "status")
        return r.status || "";
      if (k === "domain")
        return r.domain || "";
      if (k === "quota")
        return r.quota || "";
      if (k === "error")
        return r.error || "";
      // custom/key passthrough
      return (r.data && r.data[k] !== undefined) ? JSON.stringify(r.data[k]) : "";
    }).join(","));
  });
  return csvRows.join("\n");
}

/**
 * Utility: Convert result array to JSON (one object per domain)
 */
function resultsToJSON(arr) {
  return JSON.stringify(
    arr.map(r => ({
      domain: r.domain,
      status: r.status,
      error: r.error,
      quota: r.quota,
      ...r.data
    })),
    null, 2
  );
}

function statusColor(row, loading) {
  if (loading) return "#b1bbff";
  if (row.error) return "#ff9800";
  if (row.quota) return "#c086ff";
  if (row.status === "Demo" || row.status?.startsWith("Demo")) return "#bab59b";
  return "#56e7a2";
}

/**
 * Feedback Toast
 */
function FeedbackToast({ feedback, onClose }) {
  if (!feedback) return null;
  let fg = "#f5dc94", bg="#25272ecc";
  if (feedback.type === "error") { fg="#ff982b"; bg="#23180dee"; }
  else if (feedback.type === "success") { fg="#6dffb7"; bg="#0c2517f9"; }
  else if (feedback.type === "warning") { fg="#c27df6"; bg="#18132a"; }
  return (
    <div style={{
      position:"fixed",top:86,right:31,zIndex:9999,minWidth:325,
      background: bg, color: fg, padding:"13px 37px", borderRadius:12,
      fontWeight:590, fontSize:"1.14em", boxShadow:"0 4px 13px #0007",
      letterSpacing:".018em", border:`2.3px solid ${fg}50`, display:"flex",alignItems:"center",gap:12,
      animation:"toastpop .33s cubic-bezier(.42,2.3,.47,1)"
    }}>
      <span>
        {feedback.type==="error"&&"⚠️"}
        {feedback.type==="success"&&"✅"}
        {feedback.type==="warning"&&"⏳"}
      </span>
      <span>{feedback.text}</span>
      <button aria-label="Dismiss"
        style={{marginLeft:"auto",background:"none",border:"none",color:fg,fontWeight:700,fontSize:"1.12em", cursor:"pointer"}} onClick={onClose}>×</button>
    </div>
  );
}

/**
 * Expandable modern table for results
 */
function ResultsTable({ results, loadingMap }) {
  if (!results || !results.length) return null;
  return (
    <div style={{
      background:"#23272e", border:"1.5px solid var(--border-color)", borderRadius:18,
      marginTop:17, padding:"19px 9px 9px 9px", boxShadow:"0 5px 24px #0002"
    }}>
      <div style={{fontWeight:600,color:"var(--accent)",fontSize:"1.12em",marginBottom:9}}>
        Recon Results ({results.length} domain{results.length!==1&&"s"})
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{
          width:"100%",borderCollapse:"collapse",background:"none",fontSize:"1.03em"
        }}>
          <thead>
            <tr style={{
              color:"#ff9800dc",background:"#25272f",height:36,
              fontWeight:700, borderRadius:8
            }}>
              <th style={{padding:"6px 9px"}}>Domain</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Hosts/Subdomains</th>
              <th>Open Ports</th>
              <th>Quota/Limits</th>
              <th>Error</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map(row => {
              const loading = !!loadingMap[row.domain];
              return (
                <tr key={row.domain}
                  style={{
                    background: row.error ? "#34211b44"
                      : row.quota ? "#2c2147cc"
                      : loading ? "#25272e"
                      : "#232d2850",
                    borderBottom: "1.4px solid #282b33",
                    minHeight:36
                  }}
                >
                  <td style={{fontWeight:700,padding:"6px 9px"}}>
                    <span style={{
                      background:"linear-gradient(90deg,#23272e77 66%,#ffc80013 100%)",
                      borderRadius:7,border:"1.4px solid #ecee2256",padding:"3.2px 11px"
                    }}>{row.domain}</span>
                  </td>
                  <td>
                    <span style={{
                      background:statusColor(row, loading),
                      color:"#23272e",borderRadius:11,
                      fontWeight:750,padding:"2.6px 14px",fontSize:".96em"
                    }}>
                      {loading?"Loading..."
                        : row.error?"Error"
                        : row.quota?"Quota/Limited"
                        : row.status}
                    </span>
                  </td>
                  <td style={{maxWidth:215,overflow:"hidden",textOverflow:"ellipsis"}}>
                    <span style={{color:"#fde9a7",opacity:.94,fontWeight:500}}>
                      {row.data?.summary || ""}
                      {row.quota && `[Quota: ${row.quota}]`}
                    </span>
                  </td>
                  <td>
                    {row.data && Array.isArray(row.data.hosts) &&
                      <span style={{color:"#adcfd1"}}>
                        {row.data.hosts.slice(0, 3).join(", ")}
                        {row.data.hosts.length > 3 && <span style={{color:"#aaa"}}>...+{row.data.hosts.length-3}</span>}
                      </span>
                    }
                  </td>
                  <td style={{color:"#ffd279",fontWeight:500}}>
                    {row.data && Array.isArray(row.data.openPorts)
                      ? row.data.openPorts.join(", ") : ""}
                  </td>
                  <td>
                    {row.quota
                      ? <span style={{color:"#dc8ffb"}}>{row.quota}</span>
                      : <span style={{color:"#aaa"}}>—</span>
                    }
                  </td>
                  <td style={{
                    color:"#ffb740",fontWeight:560,maxWidth:111,overflow:"hidden",textOverflow:"ellipsis"
                  }}>
                    {row.error ? row.error : ""}
                  </td>
                  <td>
                    {row.data
                      ? <details>
                          <summary style={{color:"#8fdce9",cursor:"pointer",fontWeight:500}}>Expand</summary>
                          <pre style={{
                            fontSize:".94em", color:"#eee0ff", margin:0,
                            whiteSpace:"pre-wrap", wordBreak:"break-word", background:"none"
                          }}>
                            {JSON.stringify(row.data, null, 2)}
                          </pre>
                        </details>
                      : row.quota ? "—"
                      : row.error && "—"
                    }
                  </td>
                </tr>
              );
            })}
            {/* Loading skeletons for still in-flight jobs */}
            {Object.entries(loadingMap).filter(([d, v]) => v).map(([domain]) =>
              <tr key={domain+"-skel"}>
                <td colSpan={8}>
                  <div style={{
                    height: 27, borderRadius: 6, margin: "6px 0",
                    background: "linear-gradient(90deg,#23272e .38%,#181a2077 49%,#23272e 95%)",
                    animation: "skeleton-anim 1.15s infinite linear", backgroundSize: "200% 100%", width:"97%"
                  }}>
                    <span style={{
                      color: "#bbb", marginLeft: 11, fontSize: "1em", fontWeight: 500, letterSpacing: ".03em", opacity: .75
                    }}>
                      <span style={{
                        background: "linear-gradient(90deg, #ecc17b 68%, #ffe29f 100%)", color: "#23272e",
                        borderRadius: 5, padding: "2px 8px", fontSize: ".98em", fontWeight: 700, marginRight: 10
                      }} />
                      Scanning <b style={{color:"#ff9800"}}>{domain}</b>...
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReconDashboard({ sessionMode }) {
  // Get reconProvider from AppContext, as well as API key.
  const { apiKey, reconProvider } = useContext(AppContext);

  // UI/Input State
  const [inputString, setInputString] = useState("");
  const [domainList, setDomainList] = useState([]);
  const [results, setResults] = useState([]); // [{domain, ...}]
  const [loadingMap, setLoadingMap] = useState({});
  const [feedback, setFeedback] = useState(null); // {type,text}
  const [errorMsg, setErrorMsg] = useState("");
  const [hasTried, setHasTried] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef();

  useEffect(() => {
    setResults([]);
    setHasTried(false);
    setShowExport(false);
    setFeedback(null);
    setErrorMsg("");
    setDomainList(parseDomains(inputString));
  }, [sessionMode]); // Reset on mode change

  function handleInputChange(e) {
    setInputString(e.target.value);
    setDomainList(parseDomains(e.target.value));
    setHasTried(false);
    setErrorMsg("");
    setFeedback(null);
  }

  // PUBLIC_INTERFACE
  async function handleReconSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setFeedback(null);
    setHasTried(true);

    const to_scan = parseDomains(inputString);
    setDomainList(to_scan);

    if (!to_scan.length) {
      setErrorMsg("Please enter at least one valid domain (separated by lines, commas or spaces).");
      setResults([]);
      setShowExport(false);
      return;
    }

    // Pro mode: API key required for third party API providers, but not for HackerTarget or Google DNS
    if (sessionMode === "Pro" && !apiKey && !["hackertarget", "googledns"].includes(reconProvider)) {
      setErrorMsg("API key required. Please enter your key in Settings then retry.");
      setFeedback({type:"error", text: "API key missing. Enter your key to unlock Pro features."});
      setResults([]);
      setShowExport(false);
      return;
    }

    // Reset all results, and mark all as loading
    setResults([]);
    let recLoading = {};
    to_scan.forEach(domain => recLoading[domain]=true);
    setLoadingMap(recLoading);

    // Demo: Use local results with some variety
    if (sessionMode === "Demo") {
      let fake = to_scan.map((d, idx) => {
        let variant = DEMO_DATA[idx % DEMO_DATA.length];
        return {
          ...variant,
          domain: d,
          data: { ...variant.data, domain: d, summary: (variant.data.summary||"").replace(variant.domain||"", d)},
          status: "Demo",
          error: "",
          quota: idx>=2 ? "Demo: Only 2 full domains at a time." : ""
        };
      });
      for(let i=0;i<fake.length;i++) { await sleep(400 + i*170);}
      setResults(fake);
      setLoadingMap({});
      setShowExport(false);
      setFeedback({type:"warning",text:"Demo mode shows sample data only. Export and live recon are unlocked in Pro mode."});
      return;
    }

    // Pro mode: Real queries - provider selection via reconProvider
    let allResults = [];

    await Promise.all(
      to_scan.map(async (domain, idx) => {
        setLoadingMap(lmap => ({ ...lmap, [domain]: true }));
        let result = {domain, data:null, status:"", error:"", quota:""};
        try {
          // Recon provider selection (no API key for HACKERTARGET/GOOGLEDNS)
          if (reconProvider === "hackertarget") {
            // https://api.hackertarget.com/hostsearch/?q=example.com (subdomains, CSV)
            // https://api.hackertarget.com/dnslookup/?q=example.com
            // We'll use hostsearch (CSV: subdomain,IP per line)
            const url = `https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domain)}`;
            const resp = await fetch(url);
            if (!resp.ok) {
              result.status = "Error";
              result.error = `HackerTarget: HTTP ${resp.status}`;
            } else {
              const txt = await resp.text();
              if (txt.startsWith("API count exceeded")) {
                result.status = "Quota Exceeded";
                result.quota = "HackerTarget daily limit exceeded.";
                setFeedback({type:"warning", text:`API quota/limit exceeded for ${domain} on HackerTarget.`});
              } else if (/no records found/i.test(txt) || !txt.trim()) {
                result.status = "No Results";
                result.data = { summary: "No subdomains found by HackerTarget for this domain.", hosts: [], openPorts: [] };
              } else {
                const hosts = txt.trim().split("\n").map(row => row.split(",")[0]);
                result.status = "Success";
                result.data = {
                  summary: `Found ${hosts.length} subdomains via HackerTarget`,
                  hosts, openPorts: [], fromProvider: "HackerTarget"
                };
              }
            }
          }
          else if (reconProvider === "googledns") {
            // Google DNS over HTTPS API: https://dns.google/resolve?name=DOMAIN
            const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}`;
            const resp = await fetch(url);
            if (!resp.ok) {
              result.status = "Error";
              result.error = `Google DNS: HTTP ${resp.status}`;
            } else {
              const data = await resp.json();
              let hosts = [];
              if (data?.Answer) {
                hosts = data.Answer.map(a => a.data).filter(h => typeof h === "string");
              }
              result.status = "Success";
              result.data = {
                summary: `${hosts.length} DNS record(s) found by Google DNS over HTTPS.`,
                hosts, openPorts: [], fromProvider: "GoogleDNS"
              };
              if (!hosts.length) {
                result.status = "No Results";
                result.data = { summary: "No DNS records found by Google DNS.", hosts: [], openPorts: [] };
              }
            }
          }
          // If user has a SecurityTrails API Key and a provider is not hackertarget/googledns
          else {
            /**
             * Attempts to detect API provider by the apiKey pattern or allow override.
             * Returns {provider: 'securitytrails'|'shodan'|'censys'|'unknown', endpoint, headers callback}
             * For now, default to SecurityTrails if pattern matches, otherwise unknown.
             */
            function detectProvider(apiKey) {
              if (/^[a-z0-9]{40}$/i.test(apiKey)) {
                return {
                  provider: "securitytrails",
                  endpoint: (domain) => `https://api.securitytrails.com/v1/domain/${encodeURIComponent(domain)}/subdomains`,
                  headers: (key) => ({
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "APIKEY": key,
                  }),
                  process: async (resp, domain) => {
                    if (!resp.ok)
                      throw new Error(`SecurityTrails error: ${resp.status} ${resp.statusText}`);
                    const data = await resp.json();
                    if (!data || !Array.isArray(data.subdomains)) throw new Error("Malformed response");
                    return {
                      summary: `Found ${data.subdomains.length} subdomains via SecurityTrails`,
                      hosts: data.subdomains.map(sub => `${sub}.${domain}`),
                      openPorts: [],
                      fromProvider: "SecurityTrails"
                    };
                  }
                };
              }
              return {
                provider: "unknown",
                endpoint: (domain) => null,
                headers: (key) => ({}),
                process: async () => { throw new Error("Unknown or unsupported API key/provider for direct client-side recon."); }
              };
            }
            const providerInfo = detectProvider(apiKey);
            if (providerInfo.provider === "unknown") {
              result.status = "Error";
              result.error = "API key not recognized or unsupported for direct browser integration. Please use a SecurityTrails API key.";
              setFeedback({type:"error", text:"Unknown or unsupported API provider for direct integration. Only SecurityTrails is supported in this build."});
            } else if (providerInfo.provider === "securitytrails") {
              const resp = await fetch(providerInfo.endpoint(domain),
                { headers: providerInfo.headers(apiKey) }
              );
              if (resp.status === 401 || resp.status === 403) {
                result.status = "Auth Error";
                result.error = "API key invalid or expired.";
                result.quota = "";
                setFeedback({type:"error", text: `API key rejected by SecurityTrails (domain: ${domain}).`});
              } else if (resp.status === 429) {
                result.status = "Quota Exceeded";
                result.quota = "SecurityTrails quota exceeded";
                setFeedback({type:"warning", text:`API quota/limit exceeded for ${domain}.`});
              } else if (!resp.ok) {
                result.status = "Error";
                result.error = `Recon failed: ${resp.status} ${resp.statusText}`;
                setFeedback({type:"error", text:`Recon failed for ${domain} (${resp.status}).`});
              } else {
                try {
                  result.status = "Success";
                  result.data = await providerInfo.process(resp, domain);
                } catch(e) {
                  result.status = "Malformed";
                  result.error = "Malformed/empty API response.";
                }
              }
            }
          }
        } catch (ex) {
          result.status = "Error";
          result.error = ex?.message || "Unknown recon error.";
          setFeedback({type:"error", text:`Recon error for ${domain}: ${result.error}`});
        }
        allResults.push(result);
        setResults(lst => {
          // Insert/replace by domain (preserve order, avoid dupes)
          let n = lst.filter(x => x.domain !== domain);
          return [...n, result];
        });
        setLoadingMap(lmap => ({ ...lmap, [domain]: false }));
      })
    );

    setLoadingMap({});
    setShowExport(true);
    if(allResults.filter(x=>x.status==="Success").length === to_scan.length) {
      setFeedback({type:"success", text:"Recon completed successfully!"});
    }
  }


  function handleExportCSV() {
    if (!results.length) return;
    triggerDownload("recon-results.csv", resultsToCSV(results), "text/csv");
    setFeedback({type:"success", text:"Exported as CSV!"});
  }
  function handleExportJSON() {
    if (!results.length) return;
    triggerDownload("recon-results.json", resultsToJSON(results), "application/json");
    setFeedback({type:"success", text:"Exported as JSON!"});
  }

  return (
    <div>
      <style>
        {`
          @keyframes skeleton-anim {
            0% {background-position: 0% 0;}  100% {background-position: 100% 0;}
          }
          @keyframes toastpop {
            from{transform:translateY(-24px) scale(.92);opacity:0;}
            to{transform:none;opacity:1;}
          }
        `}
      </style>
      <div style={{
        fontSize: "1.22rem", fontWeight: 600, marginBottom: 15, color: "var(--accent)",
      }}>
        Recon Dashboard
        <span style={{
          marginLeft: 15, fontWeight: 500, fontSize: "1.01rem", color: "var(--text-secondary)",
          padding: "3.4px 14px", borderRadius: 10,
          background: sessionMode === "Demo" ? "rgba(255,255,255,0.09)" : "rgba(255,152,0,0.15)",
          border: sessionMode === "Pro"? "1.6px solid var(--accent)": "1.5px solid #fff2",
          marginTop: -4, marginBottom: -4
        }}>
          {sessionMode} Mode
        </span>
      </div>
      {/* --- Input -- */}
      <div style={{ marginBottom: 17, maxWidth: 600 }}>
        <form
          onSubmit={handleReconSubmit}
          style={{display:"flex",flexDirection:"row",alignItems:"flex-start",gap:15,maxWidth:630}}
          autoComplete="off"
        >
          <div style={{ flex: 1 }}>
            <textarea
              ref={inputRef}
              rows={sessionMode === "Pro" ? 4 : 3}
              placeholder={
                "Enter domains here (one per line, comma/space/semicolon allowed).\nEg: acme.com, testsite.dev"
              }
              value={inputString}
              onChange={handleInputChange}
              style={{
                width: "100%", padding: "12px 13px", fontSize: "1.08em",
                background: "#23272e", color: "#ffe9c4", border: "1.5px solid var(--border-color)",
                borderRadius: 8, minHeight: 50, maxHeight: sessionMode==="Pro"?220:110,
                fontWeight: 500, fontFamily: "inherit", resize: "vertical", letterSpacing: ".01em"
              }}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="none"
              disabled={Object.values(loadingMap).some(Boolean)}
            />
            <div style={{
              color: "#bfb677", fontSize: ".96em", marginTop: 7, marginLeft: 2
            }}>
              <b>{domainList.length}</b> valid domain{domainList.length !== 1 && "s"} detected.
              <br/>
              Batch recon: Paste / type multiple domains (deduped, sanitized).
            </div>
          </div>
          <button
            type="submit"
            className="btn"
            style={{
              background:"var(--accent-gradient)", color:"#21261f",
              fontWeight:700, border:"none", borderRadius:8,
              padding:"11px 25px", fontSize:"1.1em", marginTop:2, minWidth:119,
              boxShadow:"0 1px 7px #ff980027", cursor:Object.values(loadingMap).some(Boolean)?"not-allowed":"pointer",
              opacity:Object.values(loadingMap).some(Boolean)?0.66:1, transition: ".13s"
            }}
            disabled={Object.values(loadingMap).some(Boolean)}
            aria-busy={Object.values(loadingMap).some(Boolean)}
          >
            {Object.values(loadingMap).some(Boolean) ? "Scanning..." : "Run Recon"}
          </button>
        </form>
        <div style={{ fontSize:"0.98em", color:"var(--text-secondary)", marginLeft:2,marginTop: 3 }}>
          {sessionMode === "Demo"
            ? <>Demo returns sample/mock data. Switch to <b style={{ color:"#ff9800" }}>Pro</b> + API key for live results, batch and export.</>
            : <>Pro scans live using your API key; data is never stored by this app.</>
          }
        </div>
        {errorMsg && (
          <div style={{
            color: "#ff9800", marginTop: 9, background: "#181a2070",
            border: "1.3px dashed #ff980066", borderRadius: 9,
            padding: "8px 21px", fontSize: "1em", fontWeight: 540, maxWidth: 570
          }}>
            {errorMsg}
          </div>
        )}
        {!errorMsg && !Object.values(loadingMap).some(Boolean) && !results.length && hasTried && (
          <div style={{ color: "#aaa", marginTop: 10, fontSize: "0.99em", fontStyle: "italic" }}>
            Enter domain(s) and click <b>Run Recon</b> to begin.
          </div>
        )}
      </div>
      {/* --- Export bar (on success only in Pro) --- */}
      {results && results.length > 0 && showExport && sessionMode === "Pro" && (
        <div style={{
          marginTop:7, marginBottom:7, display:"flex", alignItems:"center",gap:16
        }}>
          <button className="btn" onClick={handleExportCSV} style={{
            background: "#fde9a7", color:"#23272e", border:"none", borderRadius:8,
            fontWeight:700, fontSize:"1.06em", padding:"6px 18px", boxShadow:"0 1px 7px #ff980019",cursor:"pointer"
          }}>Export CSV</button>
          <button className="btn" onClick={handleExportJSON} style={{
            background: "#adcfd1", color:"#23272e", border:"none", borderRadius:8,
            fontWeight:700, fontSize:"1.06em", padding:"6px 18px", boxShadow:"0 1px 7px #8fdce922", cursor:"pointer"
          }}>Export JSON</button>
          <span style={{color:"#a4a09c",fontSize:".96em"}}>Download results for all scanned domains.</span>
        </div>
      )}
      {/* --- Demo mode disables export, warns --- */}
      {results.length > 0 && sessionMode === "Demo" && (
        <div style={{
          marginTop:7, color:"#ffb400", fontSize:".99em",
          background:"#25221e55", borderRadius:8,padding:"8px 20px"
        }}>
          <b>Export</b> is unlocked only in <span style={{ color:"#42ffbe" }}>Pro mode</span> with valid API key.
        </div>
      )}
      {/* --- Table --- */}
      <ResultsTable results={results} loadingMap={loadingMap} />
      {/* --- Feedback Toast --- */}
      <FeedbackToast feedback={feedback} onClose={()=>setFeedback(null)} />
      {/* --- Demo footer --- */}
      {sessionMode === "Demo" && (
        <p style={{
          background:"#181a2070", border:"1.5px dashed #ff980066", borderRadius:10,
          color:"#ff9800", padding:"6px 22px", marginTop:19, fontSize:"0.97em"
        }}>
          Some advanced features (batch API, export, full graphs) require <b>Pro mode</b>.
          <br />
          <span style={{ color: "#69ffa1" }}>To unlock batch, live recon and export, switch to Pro mode with your API key.</span>
        </p>
      )}
    </div>
  );
}

export default ReconDashboard;
