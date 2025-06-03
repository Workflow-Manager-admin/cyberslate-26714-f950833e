import React, { useContext, useState, useRef } from "react";
import { AppContext } from "./App";

/**
 * PUBLIC_INTERFACE
 * ReconDashboard - Enhanced recon panel supporting multi-domain batch input,
 * rich & contextual results, Demo vs Pro adaptation, CSV/JSON export,
 * quota/error/API key/feedback UX, and polished loader/skeleton states.
 *
 * Props:
 *   sessionMode ("Demo"|"Pro")
 */
function ReconDashboard({ sessionMode }) {
  const { apiKey } = useContext(AppContext);

  // UI/input state
  const [batchInput, setBatchInput] = useState("");
  const [parsedDomains, setParsedDomains] = useState([]);
  const [results, setResults] = useState([]); // [{domain, data, status, error, quota, ctx}]
  const [loadingMap, setLoadingMap] = useState({}); // { domain: true/false }
  const [globalError, setGlobalError] = useState("");
  const [showExportBar, setShowExportBar] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null); // null or { type, text }
  const [hasAttempted, setHasAttempted] = useState(false);

  // API feedback context
  const reconEndpoint = "https://api.cyberrecon.ex/v1/recon/domain";
  const demoStub = {
    summary: "This is demo data. Switch to Pro mode with an API key for live recon and export features.",
    hosts: ["demo.example.com", "api.example.com"], openPorts: [80,443],
    amassNodes: [{ id: 1, label: "example.com", children: [{ id: 2, label: "demo.example.com" }] }],
    // Simulate different data for multi-domain demo batches:
    _demoVariants: [
      {
        summary: "Demo: Attack surface summary for foo.bar. Full data requires Pro.",
        hosts: ["ws.foo.bar", "cdn.foo.bar"], openPorts: [8080],
        amassNodes: [{id: 1, label: "foo.bar", children: [{id: 2, label: "cdn.foo.bar"}]}]
      }, {
        summary: "Demo: Subdomain graph for testsite.dev.",
        hosts: ["api.testsite.dev"], openPorts: [443, 1234],
        amassNodes: [{id: 1, label: "testsite.dev", children: [{id:2, label:"api.testsite.dev"}]}]
      }
    ]
  };

  // --- Utilities ---

  // PUBLIC_INTERFACE
  /** Parse the batch textarea into array of sanitized, deduped domains. */
  function parseDomains(input) {
    const SEPARATORS = /[,\s\n]+/;
    const domains = input.split(SEPARATORS)
      .map(s => s.trim().toLowerCase())
      .filter(d => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d))
      .filter(Boolean);
    // Return unique, order-preserved domains
    return Array.from(new Set(domains));
  }

  /** Helper: triggers browser file download for given text and filename. */
  function triggerDownload(filename, data, type="text/csv") {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Clean up after download
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  /** Converts the multi-result object to a CSV string. */
  function resultsToCSV(results) {
    // Gather all unique fields for headers
    const headerSet = new Set(["Domain", "ResultStatus", "Summary", "Hosts", "OpenPorts", "APIQuotalimit", "Error"]);
    results.forEach(r => {
      // If extra fields in response, add
      if (r.data && typeof r.data === "object") {
        Object.keys(r.data).forEach(k => {
          if (!["domain", "hosts", "summary", "openPorts", "amassNodes", "extraDetails"].includes(k))
            headerSet.add(k);
        });
      }
    });
    const headers = Array.from(headerSet);
    // Compile rows
    const rows = [headers];
    results.forEach(r => {
      rows.push(headers.map(key => {
        if (key === "Domain") return r.domain;
        if (key === "ResultStatus") return r.status || (r.data ? "Success" : "—");
        if (key === "Summary") return (r.data && r.data.summary) || "";
        if (key === "Hosts") return (r.data && r.data.hosts && Array.isArray(r.data.hosts)) ? r.data.hosts.join("; ") : "";
        if (key === "OpenPorts") return (r.data && r.data.openPorts && Array.isArray(r.data.openPorts)) ? r.data.openPorts.join("; ") : "";
        if (key === "Error") return r.error || "";
        if (key === "APIQuotalimit") return r.quota || "";
        // Extra
        if (r.data && r.data[key] !== undefined) return typeof r.data[key] === "object" ? JSON.stringify(r.data[key]) : r.data[key];
        return "";
      }));
    });
    // CSV encode
    return rows.map(row => row.map(v => `"${(v||"").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  /** Converts the multi-result object to a JSON string (pretty). */
  function resultsToJSON(results) {
    return JSON.stringify(results.map(r => ({
      domain: r.domain,
      status: r.status,
      summary: r.data && r.data.summary || undefined,
      ...r.data,
      error: r.error,
      quota: r.quota,
    })), null, 2);
  }

  /** Get status badge color for a result row (success, error, quota, loading). */
  function statusBadge(row) {
    if (row.error) return "#ff9800";
    if (row.quota) return "#c77deb";
    if (loadingMap[row.domain]) return "#b1bbff";
    return "#45ef97";
  }

  // --- Handler: on submit, run recon for all parsed domains ---
  // PUBLIC_INTERFACE
  async function handleReconBatchSubmit(e) {
    e.preventDefault();
    setGlobalError("");
    setResults([]);
    setFeedbackMsg(null);
    setHasAttempted(true);

    // Parse and validate input
    const domains = parseDomains(batchInput);
    setParsedDomains(domains);
    if (domains.length === 0) {
      setGlobalError("Please enter one or more valid domains (use commas, whitespace, or line-breaks).");
      return;
    }
    // For Pro, enforce API key requirement
    if (sessionMode === "Pro" && !apiKey) {
      setGlobalError("API key required. Please enter your key in Settings to use Pro mode.");
      setFeedbackMsg({ type: "error", text: "Missing API key. Switch to Demo or enter your key in Settings." });
      return;
    }
    // Reset for incoming
    let batchResults = [];
    // Mark all as loading
    let loadMap = {};
    domains.forEach(domain => loadMap[domain] = true);
    setLoadingMap({ ...loadMap });

    // For handling batch in Demo, rotate stubs per input for some variety
    let useDemoVariants = sessionMode === "Demo";
    let feedbacks = [];

    // Loop async per domain, parallelize in real usage
    await Promise.all(domains.map(async (domain, idx) => {
      // Helper to set result
      function appendResult(data, status, err, quota) {
        batchResults.push({
          domain,
          data,
          status,
          error: err || "",
          quota, // e.g. "Quota exceeded" or undefined
        });
        setResults(results_ => {
          // Remove previous for domain if re-run
          const filtered = results_.filter(r => r.domain !== domain);
          return [...filtered, { domain, data, status, error: err, quota }];
        });
      }
      try {
        let data, status = "Success", quota;
        if (sessionMode === "Demo") {
          // Use stub with some variation
          await new Promise(r => setTimeout(r, 800 + (idx * 200)));
          let demoData = demoStub;
          if (useDemoVariants && demoStub._demoVariants[idx % demoStub._demoVariants.length]) {
            demoData = { ...demoStub, ...demoStub._demoVariants[idx % demoStub._demoVariants.length] };
          }
          data = { ...demoData, domain };

          // Demo mode limitations
          status = "Demo (Mock Data)";
          if (idx === 1) quota = "Demo limit: 2 real batch domains per run";
          appendResult(data, status, "", quota);

        } else {
          // PRO MODE: Run real API query
          const resp = await fetch(`${reconEndpoint}?domain=${encodeURIComponent(domain)}`, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: "application/json",
            },
          });
          // Simulate network fail for certain Batched domains (simulate quota, error)
          if (resp.status === 401 || resp.status === 403) {
            status = "API Key Invalid";
            appendResult(null, status, "API key was missing or invalid.", null);
            feedbacks.push({ type: "error", text: `API key rejected for ${domain}. Update key in Settings.` });
            return;
          }
          if (resp.status === 429) {
            // Quota
            quota = "API quota exceeded!";
            appendResult(null, "Quota Exceeded", null, quota);
            feedbacks.push({ type: "warning", text: `API quota/limit exceeded while scanning ${domain}. Try again later or review plan.` });
            return;
          }
          if (!resp.ok) {
            status = "Error";
            appendResult(null, status, `Recon failed: ${resp.status} ${resp.statusText}`, null);
            feedbacks.push({ type: "error", text: `Recon failed for ${domain}: ${resp.status}` });
            return;
          }
          // Good response
          let rdata = await resp.json();
          if (!rdata || typeof rdata !== "object") {
            status = "Error";
            appendResult(null, status, "Malformed/empty API response.", null);
            feedbacks.push({ type: "error", text: `Malformed/empty API response for ${domain}.` });
            return;
          }
          data = { ...rdata, domain };
          status = "Success";
          appendResult(data, status, "", undefined);
        }
      } catch (ex) {
        appendResult(null, "Error", ex && ex.message ? ex.message : "Unknown recon error.", null);
        feedbacks.push({ type: "error", text: `Recon error for ${domain}: ${ex && ex.message}` });
      } finally {
        setLoadingMap(prev => ({ ...prev, [domain]: false }));
      }
    }));
    // If quota or api error, set globalFeedback
    if (feedbacks.length) setFeedbackMsg(feedbacks[feedbacks.length - 1]);
    setShowExportBar(true); // Show export on results
  }

  // --- Export handlers ---
  function handleExportCSV() {
    if (!results || !results.length) return;
    triggerDownload("recon-results.csv", resultsToCSV(results), "text/csv");
    setFeedbackMsg({ type: "success", text: "Results exported as CSV!" });
  }
  function handleExportJSON() {
    if (!results || !results.length) return;
    triggerDownload("recon-results.json", resultsToJSON(results), "application/json");
    setFeedbackMsg({ type: "success", text: "Results exported as JSON!" });
  }

  // --- UI skeleton and feedback ---
  function SkeletonRow({ domain="...", idx }) {
    // Simple animated skeleton bar for each "loading" row
    return (
      <tr style={{ background: "#23272e" }}>
        <td colSpan={7}>
          <div style={{
            height: 28, borderRadius: 7, margin: "6px 0", background:
            "linear-gradient(90deg, #181a2066 30%, #1a1c2399 60%, #181a2066 100%)",
            animation: "skeleton-anim 1.3s infinite linear",
            backgroundSize: "200% 100%",
            width: "95%"
          }}>
            <span style={{
              color: "#bbb", marginLeft: 11,
              fontSize: "1em", fontWeight: 500,
              letterSpacing: ".03em",
              opacity: .82
            }}>
              <span style={{
                background: "linear-gradient(90deg, #ecc17b 58%, #ffe29f 100%)",
                color: "#23272e",
                borderRadius: 5, padding: "2.5px 8px",
                fontSize: ".98em", fontWeight: 700, marginRight: 10
              }} />
              Loading scan for&nbsp;
              <b style={{ color: "#ff9800", fontWeight: 700 }}>{domain}</b>
              &nbsp;...
            </span>
          </div>
        </td>
      </tr>
    );
  }

  // --- Feedback toast/modal ---
  function FeedbackToast({ msg }) {
    if (!msg) return null;
    let bg, fg;
    if (msg.type === "error") { bg = "#25221eec"; fg="#ff982b"; }
    else if (msg.type === "success") { bg="#191f16e9"; fg="#6dffb7"; }
    else if (msg.type === "warning") { bg="#18132a"; fg="#c27df6"; }
    else { bg="#202540"; fg="#fde9a7"; }
    return (
      <div style={{
        position:"fixed", top:81, right:31, zIndex:9999, minWidth:320,
        background: bg, color: fg, padding:"13px 32px", borderRadius:12, fontWeight:590,
        fontSize:"1.09em", boxShadow:"0 3px 13px #000a", letterSpacing:".02em",
        border:`2px solid ${fg}40`,display:"flex",alignItems:"center", gap:13,
        animation:"toastpop .32s cubic-bezier(.4,2.4,.5,1)"
      }}>
        <span>
          {msg.type==="error"&&"⚠️"}
          {msg.type==="success"&&"✅"}
          {msg.type==="warning"&&"⏳"}
        </span>
        <span>{msg.text}</span>
        <button
          aria-label="Dismiss" style={{
            marginLeft:"auto",cursor:"pointer",background:"none",border:"none",fontWeight:700,
            color:fg,fontSize:"1.13em"
          }}
          onClick={()=>setFeedbackMsg(null)}>×</button>
      </div>
    );
  }

  // --- Results Table/Detail UI ---
  function ResultsTable({ rows }) {
    if (!rows || !rows.length) return null;
    return (
      <div style={{
        background:"#23272e",border:"1.5px solid var(--border-color)",borderRadius:18,
        marginTop:17,padding:"19px 9px 10px 9px",boxShadow:"0 5px 22px #0003"
      }}>
        <div style={{fontWeight: 600, color: "var(--accent)", fontSize:"1.09em",
          marginBottom:9, letterSpacing:".01em"}}>
          Recon Results ({rows.length} domain{rows.length!==1 && "s"})
        </div>
        <div style={{overflowX:"auto"}}>
        <table style={{
          width:"100%",borderCollapse:"collapse",background:"none", fontSize:"1.01em"
        }}>
          <thead>
            <tr style={{
              color:"#ff9800c9",fontWeight:700,fontSize:"1.01em",background:"#25272f",height:36,
              borderRadius:8
            }}>
              <th style={{padding:"7px 9px"}}>Domain</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Hosts/Subdomains</th>
              <th>Open Ports</th>
              <th>Quota/API Limit</th>
              <th>Error</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading Rows */}
            {rows.filter(row=>loadingMap[row.domain])
              .map((row, idx) => <SkeletonRow domain={row.domain} key={`skeleton-${row.domain}`} idx={idx} />)}
            {/* Actual Data */}
            {rows && rows.map((row, i)=>{
              // Render as error (fail row), success, quota, etc.
              let badgeStyle = {
                background:statusBadge(row), color:"#23272e", borderRadius:10,
                fontWeight:750, padding:"2.5px 13px", fontSize:".96em", marginRight:5
              };
              return (
                <tr key={row.domain} style={{
                  background: row.error ? "#43202644"
                    : row.quota ? "#2c2c44cc"
                    : loadingMap[row.domain] ? "#23272e"
                    : "#232d2850",
                  borderBottom: "1.5px solid #282b33", height:38
                }}>
                  <td style={{fontWeight:700,letterSpacing:".01em",padding:"6px 9px"}}>
                    <span style={{
                      background:"linear-gradient(90deg,#23272e77 60%,#ffc80013 100%)",
                      border:"1.5px solid #ecee224d", borderRadius:8,
                      padding:"3px 11px",marginRight:2
                    }}>{row.domain}</span>
                  </td>
                  <td>
                    <span style={badgeStyle}>
                      {row.error  ? "Error"
                        : row.quota ? "Quota"
                        : loadingMap[row.domain] ? "Loading"
                        : row.status}
                    </span>
                  </td>
                  <td style={{maxWidth:199,overflow:"hidden",textOverflow:"ellipsis"}}>
                    <span style={{color:"#fde9a7", opacity:.94,fontWeight:500}}>
                      {row.data && row.data.summary}
                      {row.quota && `[Quota: ${row.quota}]`}
                      {row.error && ""}
                    </span>
                  </td>
                  <td>
                    {row.data && Array.isArray(row.data.hosts) &&
                      <span style={{color:"#adcfd1"}}>
                        {row.data.hosts.slice(0,3).join(", ")}
                        {row.data.hosts.length>3 && <span style={{color:"#aaaa"}}>...+{row.data.hosts.length-3}</span>}
                      </span>
                    }
                  </td>
                  <td style={{color:"#ffd279",fontWeight:500}}>
                    {row.data && row.data.openPorts && Array.isArray(row.data.openPorts)
                      ? row.data.openPorts.join(", ") : ""}
                  </td>
                  <td>
                    {row.quota ?
                      <span style={{color:"#dc8ffb"}}>{row.quota}</span>
                      : <span style={{color:"#aaa"}}>—</span>
                    }
                  </td>
                  <td style={{color:"#ff9800",fontWeight:570,maxWidth:128,
                      overflow:"hidden",textOverflow:"ellipsis"}}>
                    {row.error}
                  </td>
                  <td>
                    {/* Expand details inline: small pre for now, enhance later */}
                    {row.data ?
                      <details>
                        <summary style={{
                          color:"#8fdce9",cursor:"pointer",fontWeight:530}}>View
                        </summary>
                        <pre style={{
                          fontSize:".93em", color:"#eee0ff",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word"
                        }}>
                          {JSON.stringify(row.data, null, 2)}
                        </pre>
                      </details>
                    : row.quota ?"—": row.error && "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div>
      <style>
        {`
        @keyframes skeleton-anim {
          0% {background-position: 0% 0;}  100% {background-position: 100% 0;}
        }
        @keyframes toastpop {
          from{transform:translateY(-25px) scale(.94);opacity:0;}
          to{transform:none;opacity:1;}
        }
        `}
      </style>
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
      <div style={{ marginBottom: 16, maxWidth: 570 }}>
        <form
          onSubmit={handleReconBatchSubmit}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 3,
            maxWidth: 570,
          }}
          autoComplete="off"
        >
          <div style={{ flex: 1 }}>
            <textarea
              placeholder={
                "Enter one or more domains.\nSeparate with commas, whitespace or line breaks. e.g.:\nexample.com, testsite.dev, foo.bar"
              }
              rows={sessionMode === "Demo" ? 3 : 6}
              value={batchInput}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="none"
              style={{
                width: "100%",
                padding: "12px 13px",
                fontSize: "1.07em",
                background: "#23272e",
                color: "#ffe9c4",
                border: "1.5px solid var(--border-color)",
                borderRadius: 8,
                outline: "none",
                fontWeight: 500,
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: 50,
                maxHeight: sessionMode==="Pro" ? 220 : 110,
                letterSpacing: ".01em",
              }}
              onChange={e => {
                setBatchInput(e.target.value);
                setParsedDomains(parseDomains(e.target.value));
                setHasAttempted(false);
                setGlobalError("");
                setFeedbackMsg(null);
              }}
              disabled={Object.values(loadingMap).some(Boolean)}
            />
            <div style={{ color: "#bfb677", fontSize: ".96em", marginTop: 7, marginLeft: 2 }}>
              Batch mode: Type/paste domains (one per line, or comma/space/semicolon separated).
              <br />
              {/* UX touchpoint: Show how many are parsed and if valid */}
              <b>{parsedDomains.length}</b> valid domain{parsedDomains.length !== 1 && "s"} detected.
            </div>
          </div>
          <button
            type="submit"
            className="btn"
            style={{
              background: "var(--accent-gradient)",
              color: "#22272e",
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              padding: "10px 26px",
              fontSize: "1.09em",
              boxShadow: "0 1px 7px #ff980027",
              cursor: Object.values(loadingMap).some(Boolean) ? "not-allowed" : "pointer",
              opacity: Object.values(loadingMap).some(Boolean) ? 0.6 : 1,
              marginTop: 3,
              minWidth: 118,
              transition: "opacity 0.11s"
            }}
            disabled={Object.values(loadingMap).some(Boolean)}
            aria-busy={Object.values(loadingMap).some(Boolean)}
          >
            {Object.values(loadingMap).some(Boolean) ? "Scanning..." : "Run Recon"}
          </button>
        </form>
        {sessionMode === "Demo" ? (
          <div style={{
            fontSize: "0.98em",
            color: "var(--text-secondary)",
            marginLeft: 2
          }}>
            <span>
              Demo mode returns sample/mock data.<br />
              Switch to <b style={{ color: "#ff9800" }}>Pro</b> (with API key) for live reconnaissance, full export, and feature unlocks.
            </span>
          </div>
        ) : (
          <div style={{
            fontSize: "0.98em",
            color: "var(--text-secondary)",
            marginLeft: 2
          }}>
            Your API key is used securely for each scan; no data is stored by the app.
          </div>
        )}
        {/* Error/block state */}
        {globalError && (
          <div
            style={{
              color: "#ff9800",
              marginTop: 9,
              background: "#181a2070",
              border: "1.3px dashed #ff980066",
              borderRadius: 9,
              padding: "8px 22px",
              fontSize: "1em",
              fontWeight: 540
            }}
          >
            {globalError}
          </div>
        )}
        {/* Guidance when idle */}
        {(!globalError && !Object.values(loadingMap).some(Boolean) && !results.length && hasAttempted) && (
          <div style={{ color: "#999", marginTop: 10, fontSize: "0.99em", fontStyle: "italic" }}>
            Enter one or more domains above to begin reconnaissance.
          </div>
        )}
      </div>
      {/* --- Results Export Bar --- */}
      {results && results.length > 0 && showExportBar && sessionMode === "Pro" && (
        <div style={{
          marginTop: 3, marginBottom: 7, display: "flex", alignItems: "center", gap: 16
        }}>
          <button
            className="btn"
            onClick={handleExportCSV}
            style={{
              background: "#fde9a7", color: "#23272e", border: "none",
              borderRadius: 8, fontWeight: 700, fontSize: "1.07em",
              padding: "6px 18px", boxShadow: "0 1px 7px #ff980019", cursor: "pointer"
            }}
            disabled={!results.length}
          >
            Export CSV
          </button>
          <button
            className="btn"
            onClick={handleExportJSON}
            style={{
              background: "#adcfd1", color: "#212433", border: "none",
              borderRadius: 8, fontWeight: 700, fontSize: "1.07em",
              padding: "6px 18px", boxShadow: "0 1px 7px #8fdce922", cursor: "pointer"
            }}
            disabled={!results.length}
          >
            Export JSON
          </button>
          <span style={{ color: "#9c9aa9", fontSize: ".97em" }}>
            Download all findings for this batch.
          </span>
        </div>
      )}
      {/* Notification for Demo mode export lockout */}
      {results && results.length > 0 && sessionMode === "Demo" && (
        <div style={{
          marginTop: 7, color: "#ffb400", fontSize: ".99em",
          background: "#25221e55", borderRadius: 8, padding: "8px 20px"
        }}>
          <b>Export features</b> are only available in <span style={{ color: "#42ffbe" }}>Pro mode</span> with a valid API key.
        </div>
      )}
      {/* --- Results Table --- */}
      <ResultsTable rows={results} />
      {/* --- Feedback Toast --- */}
      <FeedbackToast msg={feedbackMsg} />
      {/* --- Demo limitation info/footer --- */}
      {sessionMode === "Demo" && (
        <p style={{
          background: "#181a2070",
          border: "1.5px dashed #ff980066",
          borderRadius: 10,
          color: "#ff9800",
          padding: "6px 22px",
          marginTop: 19,
          fontSize: "0.97em"
        }}>
          Some advanced features (multi-source graph, asset import/export, real-time subdomains, enhanced API types) require <b>Pro mode</b>.
          <br />
          <span style={{ color: "#69ffa1" }}>To unlock export, batch, and graph features, switch to Pro mode with your API key.</span>
        </p>
      )}
    </div>
  );
}

export default ReconDashboard;
