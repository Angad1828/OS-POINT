import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OS-POINT — Enterprise Threat Intelligence Platform" },
      {
        name: "description",
        content:
          "OS-POINT is an enterprise OSINT & threat intelligence platform for SOC analysts, DFIR teams, and threat hunters. Investigate emails, domains, IPs, usernames, and infrastructure in real time.",
      },
      { name: "theme-color", content: "#0b1220" },
      { property: "og:title", content: "OS-POINT — Intelligence Beyond Visibility" },
      {
        property: "og:description",
        content:
          "Enterprise-grade OSINT command center: real-time DNS, WHOIS, breach, and infrastructure intelligence for authorized security operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: "/style.css" },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
      },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: OSPoint,
});

function OSPoint() {
  useEffect(() => {
    const scripts = [
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "/script.js",
    ];
    const loaded: HTMLScriptElement[] = [];
    const loadNext = (i: number) => {
      if (i >= scripts.length) return;
      const s = document.createElement("script");
      s.src = scripts[i];
      s.async = false;
      s.onload = () => loadNext(i + 1);
      document.body.appendChild(s);
      loaded.push(s);
    };
    loadNext(0);
    return () => {
      loaded.forEach((s) => s.parentNode && s.parentNode.removeChild(s));
    };
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* TOP BAR */}
      <header className="osp-topbar" role="banner">
        <div className="topbar-inner">
          <button className="sidebar-toggle" id="sidebarToggle" aria-label="Toggle navigation">
            <i className="bi bi-list"></i>
          </button>
          <a href="#dashboard" className="brand" aria-label="OS-POINT home">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-dot" />
            </span>
            <span className="brand-name">OS-POINT</span>
            <span className="brand-tag">Intelligence</span>
          </a>

          <div className="global-search" role="search">
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              id="globalSearch"
              type="search"
              placeholder="Search across intelligence modules…"
              aria-label="Global search"
              autoComplete="off"
            />
            <kbd className="kbd-hint" aria-hidden="true">⌘ K</kbd>
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" id="themeToggle" aria-label="Toggle theme" title="Toggle theme">
              <i className="bi bi-moon-stars"></i>
            </button>
            <button className="icon-btn has-dot" aria-label="Notifications" title="Notifications" data-bs-toggle="dropdown">
              <i className="bi bi-bell"></i>
              <span className="dot" aria-hidden="true"></span>
            </button>
            <div className="dropdown-menu dropdown-menu-end notif-menu">
              <div className="notif-header">Notifications <span className="pill">3 new</span></div>
              <div className="notif-item"><i className="bi bi-shield-exclamation text-warn"></i><div><strong>New breach corpus indexed</strong><span>collection-192 · 44M records · 2m ago</span></div></div>
              <div className="notif-item"><i className="bi bi-diagram-3 text-cyan"></i><div><strong>Investigation ready</strong><span>case-2041 finished DNS enrichment · 12m ago</span></div></div>
              <div className="notif-item"><i className="bi bi-graph-up-arrow text-green"></i><div><strong>Threat feed updated</strong><span>18 new IoCs from OTX · 34m ago</span></div></div>
            </div>
            <div className="topbar-divider" />
            <button className="user-chip" aria-label="Profile menu" data-bs-toggle="dropdown">
              <span className="avatar">AK</span>
              <span className="user-meta">
                <span className="user-name">Analyst · Kaur</span>
                <span className="user-role">Enterprise · Tier 2</span>
              </span>
              <i className="bi bi-chevron-down"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><a className="dropdown-item" href="#"><i className="bi bi-person"></i> Profile</a></li>
              <li><a className="dropdown-item" href="#settings"><i className="bi bi-gear"></i> Settings</a></li>
              <li><a className="dropdown-item" href="#"><i className="bi bi-key"></i> API keys</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#" data-osp-signout><i className="bi bi-box-arrow-right"></i> Sign out</a></li>
            </ul>
          </div>
        </div>
      </header>

      {/* APP SHELL */}
      <div className="app-shell">
        {/* SIDEBAR */}
        <aside className="osp-sidebar" id="ospSidebar" aria-label="Primary navigation">
          <div className="side-section">
            <div className="side-label">Workspace</div>
            <a className="side-link active" href="#dashboard"><i className="bi bi-grid-1x2"></i><span>Dashboard</span></a>
            <a className="side-link" href="#investigate"><i className="bi bi-crosshair"></i><span>Investigate</span><span className="side-kbd">/</span></a>
            <a className="side-link" href="#cases"><i className="bi bi-folder2-open"></i><span>Cases</span></a>
            <a className="side-link" href="#reports"><i className="bi bi-file-earmark-text"></i><span>Reports</span></a>
          </div>
          <div className="side-section">
            <div className="side-label">Intelligence Modules</div>
            <a className="side-link" href="#investigate" data-entity="email"><i className="bi bi-envelope-at"></i><span>Email</span></a>
            <a className="side-link" href="#investigate" data-entity="domain"><i className="bi bi-globe2"></i><span>Domain</span></a>
            <a className="side-link" href="#investigate" data-entity="ip"><i className="bi bi-hdd-network"></i><span>IP</span></a>
            <a className="side-link" href="#investigate" data-entity="username"><i className="bi bi-at"></i><span>Username</span></a>
            <a className="side-link" href="#investigate" data-entity="phone"><i className="bi bi-telephone"></i><span>Phone</span></a>
            <a className="side-link" href="#investigate" data-entity="hash"><i className="bi bi-fingerprint"></i><span>Hash</span></a>
            <a className="side-link" href="#investigate" data-entity="url"><i className="bi bi-link-45deg"></i><span>URL</span></a>
            <a className="side-link" href="#investigate" data-entity="image"><i className="bi bi-image"></i><span>Face / Image</span></a>
          </div>
          <div className="side-section">
            <div className="side-label">Platform</div>
            <a className="side-link" href="#threats"><i className="bi bi-activity"></i><span>Threat Feed</span><span className="live-dot" aria-hidden="true" /></a>
            <a className="side-link" href="#api"><i className="bi bi-code-slash"></i><span>API</span></a>
            <a className="side-link" href="#docs"><i className="bi bi-book"></i><span>Documentation</span></a>
            <a className="side-link" href="#pricing"><i className="bi bi-tag"></i><span>Pricing</span></a>
            <a className="side-link" href="#settings"><i className="bi bi-sliders"></i><span>Settings</span></a>
          </div>
          <div className="side-foot">
            <div className="status-line"><span className="live-dot" /> All systems operational</div>
            <div className="status-sub">API p95 · 142 ms</div>
          </div>
        </aside>

        <main className="osp-main" id="main" role="main">
          {/* DASHBOARD */}
          <section id="dashboard" className="page-section">
            <div className="page-head">
              <div>
                <div className="eyebrow">Command Center</div>
                <h1 className="page-title">Threat Intelligence Dashboard</h1>
                <p className="page-sub">Authorized OSINT workflows across email, infrastructure, and identity — with live enrichment.</p>
              </div>
              <div className="page-head-actions">
                <button className="btn-ghost" id="openCmdPalette"><i className="bi bi-command"></i> Command palette <kbd>⌘K</kbd></button>
                <a href="#investigate" className="btn-primary"><i className="bi bi-crosshair"></i> New investigation</a>
              </div>
            </div>

            <div className="kpi-row">
              <KpiCard icon="bi-search" label="Investigations · 24h" value="1,284" delta="+12.4%" tone="cyan" />
              <KpiCard icon="bi-shield-exclamation" label="High-risk indicators" value="47" delta="+8" tone="warn" />
              <KpiCard icon="bi-database" label="Corpora indexed" value="812" delta="+3" tone="green" />
              <KpiCard icon="bi-lightning-charge" label="Avg. enrichment" value="1.42s" delta="-9%" tone="violet" />
            </div>

            <div className="grid-2">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <h3 className="panel-title">Investigation volume</h3>
                    <p className="panel-sub">Rolling 14-day window across all modules</p>
                  </div>
                  <div className="segmented" role="tablist">
                    <button role="tab" className="active">14d</button>
                    <button role="tab">30d</button>
                    <button role="tab">90d</button>
                  </div>
                </div>
                <div className="chart-wrap"><canvas id="volChart" height="180" aria-label="Investigation volume chart"></canvas></div>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <h3 className="panel-title">Risk distribution</h3>
                    <p className="panel-sub">Enrichment confidence bands across recent cases</p>
                  </div>
                </div>
                <div className="chart-wrap"><canvas id="riskChart" height="180" aria-label="Risk distribution chart"></canvas></div>
              </div>
            </div>

            <div className="grid-3">
              <div className="panel">
                <div className="panel-head"><h3 className="panel-title">Recent investigations</h3><a href="#cases" className="link-muted">View all →</a></div>
                <ul className="list-clean" id="recentList" aria-live="polite"></ul>
              </div>
              <div className="panel">
                <div className="panel-head"><h3 className="panel-title">Live threat feed</h3><span className="live-dot" aria-hidden="true"></span></div>
                <ul className="threat-feed" id="threatFeed" aria-live="polite"></ul>
              </div>
              <div className="panel">
                <div className="panel-head"><h3 className="panel-title">Global signal map</h3><span className="pill">Simulated</span></div>
                <div className="mapwrap" id="mapWrap" aria-hidden="true"></div>
                <div className="legend"><span><em className="dot cyan" /> Enrichment</span><span><em className="dot warn" /> High-risk</span><span><em className="dot green" /> Benign</span></div>
              </div>
            </div>
          </section>

          {/* INVESTIGATE — Search command center */}
          <section id="investigate" className="page-section">
            <div className="page-head">
              <div>
                <div className="eyebrow">Investigation Console</div>
                <h2 className="page-title">Search everything</h2>
                <p className="page-sub">Pick an entity type, paste an indicator, and watch enrichment stream in.</p>
              </div>
            </div>

            <div className="console">
              <div className="entity-tabs" role="tablist" aria-label="Entity type">
                {[
                  ["email", "bi-envelope-at", "Email"],
                  ["domain", "bi-globe2", "Domain"],
                  ["ip", "bi-hdd-network", "IP"],
                  ["username", "bi-at", "Username"],
                  ["phone", "bi-telephone", "Phone"],
                  ["hash", "bi-fingerprint", "Hash"],
                  ["url", "bi-link-45deg", "URL"],
                  ["image", "bi-image", "Image"],
                ].map(([id, icon, label]) => (
                  <button
                    key={id}
                    role="tab"
                    className={"etab" + (id === "email" ? " active" : "")}
                    data-entity={id}
                    aria-selected={id === "email"}
                  >
                    <i className={"bi " + icon}></i> {label}
                  </button>
                ))}
              </div>

              <form className="console-form" id="investigateForm" autoComplete="off" noValidate>
                <div className="input-shell">
                  <i className="bi bi-search input-icon" aria-hidden="true"></i>
                  <input
                    id="investigateInput"
                    className="console-input"
                    type="text"
                    placeholder="e.g. torvalds@linux-foundation.org"
                    aria-label="Indicator to investigate"
                  />
                  <div className="validation" id="validation" aria-live="polite"></div>
                </div>
                <div className="console-actions">
                  <div className="filter-chips">
                    <label className="chip"><input type="checkbox" defaultChecked /> DNS</label>
                    <label className="chip"><input type="checkbox" defaultChecked /> WHOIS</label>
                    <label className="chip"><input type="checkbox" defaultChecked /> Avatar</label>
                    <label className="chip"><input type="checkbox" defaultChecked /> Breaches</label>
                    <label className="chip"><input type="checkbox" /> Username enum</label>
                  </div>
                  <button type="submit" className="btn-primary btn-lg" id="runBtn">
                    <i className="bi bi-play-fill"></i> Investigate
                  </button>
                </div>
                <div className="console-foot">
                  <div className="recent-label">Recent</div>
                  <div className="recent-chips" id="recentChips"></div>
                </div>
              </form>
            </div>

            {/* RESULTS */}
            <div className="results-wrap" id="results" hidden aria-live="polite">
              <div className="results-head">
                <div>
                  <div className="eyebrow" id="caseKind">Email intelligence</div>
                  <h3 className="target-title" id="targetTitle">—</h3>
                  <div className="target-meta">
                    <span className="pill" id="caseId">CASE-—</span>
                    <span className="pill pill-muted" id="caseTime">—</span>
                    <span className="pill pill-muted" id="caseSources">0 sources</span>
                  </div>
                </div>
                <div className="results-actions">
                  <button className="btn-ghost" id="exportJson"><i className="bi bi-filetype-json"></i> JSON</button>
                  <button className="btn-ghost" id="exportCsv"><i className="bi bi-filetype-csv"></i> CSV</button>
                  <button className="btn-primary" id="exportPdf"><i className="bi bi-file-earmark-pdf"></i> Export PDF</button>
                </div>
              </div>

              <div className="score-row">
                <ScoreCard id="riskScore" label="Risk score" tone="warn" />
                <ScoreCard id="confScore" label="Confidence" tone="cyan" />
                <div className="score-card summary">
                  <div className="score-label">Executive summary</div>
                  <p id="execSummary" className="score-summary">Awaiting evidence…</p>
                </div>
              </div>

              <div className="tabs-2" role="tablist">
                <button role="tab" className="t2 active" data-view="identity">Identity</button>
                <button role="tab" className="t2" data-view="infra">Infrastructure</button>
                <button role="tab" className="t2" data-view="exposure">Exposure</button>
                <button role="tab" className="t2" data-view="profiles">Public profiles</button>
                <button role="tab" className="t2" data-view="evidence">Evidence</button>
                <button role="tab" className="t2" data-view="timeline">Timeline</button>
              </div>

              <div className="view" data-view="identity">
                <div className="grid-3">
                  <div className="panel identity-card">
                    <div className="identity-avatar" id="identityAvatarWrap">
                      <div className="avatar-fallback">?</div>
                    </div>
                    <div className="identity-name" id="identityName">—</div>
                    <div className="identity-sub" id="identitySub">No public identity resolved yet</div>
                    <div className="identity-badges" id="identityBadges"></div>
                  </div>
                  <div className="panel span-2">
                    <div className="panel-head"><h3 className="panel-title">Signals</h3><span className="pill" id="signalsCount">0</span></div>
                    <div className="signal-grid" id="signalGrid"></div>
                  </div>
                </div>
              </div>

              <div className="view" data-view="infra" hidden>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-head"><h3 className="panel-title">DNS records</h3><span className="pill" id="dnsCount">0</span></div>
                    <div className="dns-table" id="dnsTable"></div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><h3 className="panel-title">Mail authentication</h3></div>
                    <div className="auth-grid" id="authGrid"></div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">WHOIS / RDAP</h3><span className="pill" id="whoisSrc">rdap.org</span></div>
                  <div className="whois-grid" id="whoisGrid"></div>
                </div>
              </div>

              <div className="view" data-view="exposure" hidden>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Breach exposure</h3><span className="pill pill-muted">Requires authorized API key</span></div>
                  <div className="breach-empty" id="breachEmpty">
                    <i className="bi bi-shield-lock"></i>
                    <div>
                      <strong>Live breach lookups disabled</strong>
                      <p>Connect HaveIBeenPwned or Enzoic in <a href="#settings">Settings → API keys</a> to enable authorized breach enrichment. Placeholder heuristics are shown below.</p>
                    </div>
                  </div>
                  <div className="breach-list" id="breachList"></div>
                </div>
              </div>

              <div className="view" data-view="profiles" hidden>
                <div className="panel">
                  <div className="panel-head">
                    <h3 className="panel-title">Public profiles</h3>
                    <span className="pill pill-muted">Inferred from local-part</span>
                  </div>
                  <p className="panel-note">
                    <i className="bi bi-info-circle"></i>
                    Results below are <strong>inferred</strong> username matches based on the email local-part. Only entries with a <span className="badge-verify">Verified</span> badge are corroborated by a public source.
                  </p>
                  <div className="profile-grid" id="profileGrid"></div>
                </div>
              </div>

              <div className="view" data-view="evidence" hidden>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Evidence log</h3><span className="pill" id="evidenceCount">0</span></div>
                  <div className="evidence-list" id="evidenceList"></div>
                </div>
              </div>

              <div className="view" data-view="timeline" hidden>
                <div className="panel">
                  <div className="panel-head"><h3 className="panel-title">Investigation timeline</h3></div>
                  <ol className="timeline" id="timeline"></ol>
                </div>
              </div>
            </div>
          </section>

          {/* CASES */}
          <section id="cases" className="page-section">
            <div className="page-head">
              <div>
                <div className="eyebrow">Cases</div>
                <h2 className="page-title">Saved investigations</h2>
                <p className="page-sub">Pin, tag, and reopen cases you've run in this workspace.</p>
              </div>
            </div>
            <div className="panel">
              <div className="cases-toolbar">
                <div className="filter-chips">
                  <button className="chip active">All</button>
                  <button className="chip">Pinned</button>
                  <button className="chip">High-risk</button>
                  <button className="chip">Last 7d</button>
                </div>
                <input className="mini-search" placeholder="Filter cases…" aria-label="Filter cases" />
              </div>
              <div className="case-table" id="caseTable">
                <div className="case-empty">
                  <i className="bi bi-inbox"></i>
                  <p>No saved cases yet. Run an investigation to see it here.</p>
                </div>
              </div>
            </div>
          </section>

          {/* THREAT FEED */}
          <section id="threats" className="page-section">
            <div className="page-head">
              <div>
                <div className="eyebrow">Threat Intelligence</div>
                <h2 className="page-title">Global signal stream</h2>
                <p className="page-sub">Simulated, deterministic feed for platform demonstration.</p>
              </div>
            </div>
            <div className="grid-2">
              <div className="panel">
                <div className="panel-head"><h3 className="panel-title">Category breakdown</h3></div>
                <div className="chart-wrap"><canvas id="catChart" height="200"></canvas></div>
              </div>
              <div className="panel">
                <div className="panel-head"><h3 className="panel-title">Source health</h3></div>
                <div className="chart-wrap"><canvas id="srcChart" height="200"></canvas></div>
              </div>
            </div>
          </section>

          {/* API + PRICING teaser */}
          <section id="pricing" className="page-section">
            <div className="page-head">
              <div>
                <div className="eyebrow">Plans</div>
                <h2 className="page-title">Built for teams that ship investigations</h2>
              </div>
            </div>
            <div className="grid-3">
              <PricingCard tier="Analyst" price="$0" desc="Solo researchers running authorized OSINT." features={["25 investigations / day","DNS + WHOIS enrichment","PDF/JSON export"]} />
              <PricingCard tier="Team" price="$149" featured desc="Small SOC & DFIR teams." features={["Unlimited investigations","Breach API integrations","Case sharing & tags","Priority enrichment"]} />
              <PricingCard tier="Enterprise" price="Custom" desc="Regulated environments & MSSPs." features={["SSO / SCIM","On-prem enrichment relay","Dedicated support","Audit trail export"]} />
            </div>
          </section>

          <footer className="osp-footer">
            <div>
              <div className="brand small">
                <span className="brand-mark"><span className="brand-dot" /></span>
                <span className="brand-name">OS-POINT</span>
              </div>
              <p className="foot-note">Prototype for authorized OSINT training. No private data is retrieved. Live enrichment uses public CORS-enabled endpoints (Google DNS-over-HTTPS, RDAP.org, Gravatar).</p>
            </div>
            <div className="foot-cols">
              <div><div className="foot-h">Product</div><a href="#dashboard">Dashboard</a><a href="#investigate">Investigate</a><a href="#reports">Reports</a></div>
              <div><div className="foot-h">Platform</div><a href="#api">API</a><a href="#docs">Docs</a><a href="#pricing">Pricing</a></div>
              <div><div className="foot-h">Company</div><a href="#">About</a><a href="#">Security</a><a href="#">Contact</a></div>
            </div>
          </footer>
        </main>
      </div>

      {/* COMMAND PALETTE */}
      <div className="cmdk-backdrop" id="cmdkBackdrop" hidden>
        <div className="cmdk" role="dialog" aria-label="Command palette">
          <div className="cmdk-input-wrap">
            <i className="bi bi-search"></i>
            <input id="cmdkInput" placeholder="Type a command or paste an indicator…" aria-label="Command palette input" />
            <kbd>ESC</kbd>
          </div>
          <div className="cmdk-list" id="cmdkList"></div>
        </div>
      </div>

      {/* TOAST */}
      <div className="toast-wrap" id="toastWrap" aria-live="polite" aria-atomic="true"></div>
    </>
  );
}

function KpiCard({ icon, label, value, delta, tone }: { icon: string; label: string; value: string; delta: string; tone: string; }) {
  return (
    <div className={"kpi tone-" + tone}>
      <div className="kpi-icon"><i className={"bi " + icon}></i></div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-delta">{delta} <span>vs prev</span></div>
      </div>
    </div>
  );
}

function ScoreCard({ id, label, tone }: { id: string; label: string; tone: string }) {
  return (
    <div className={"score-card tone-" + tone}>
      <div className="score-label">{label}</div>
      <div className="score-ring" id={id}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="ring-bg" />
          <circle cx="60" cy="60" r="52" className="ring-fg" strokeDasharray="326.7" strokeDashoffset="326.7" />
        </svg>
        <div className="ring-val">—</div>
      </div>
    </div>
  );
}

function PricingCard({ tier, price, desc, features, featured }: { tier: string; price: string; desc: string; features: string[]; featured?: boolean }) {
  return (
    <div className={"panel pricing" + (featured ? " featured" : "")}>
      {featured && <div className="pricing-flag">Most popular</div>}
      <div className="pricing-tier">{tier}</div>
      <div className="pricing-price">{price}<span>/mo</span></div>
      <p className="pricing-desc">{desc}</p>
      <ul className="pricing-list">
        {features.map((f) => <li key={f}><i className="bi bi-check2"></i>{f}</li>)}
      </ul>
      <button className={featured ? "btn-primary w-100" : "btn-ghost w-100"}>Choose {tier}</button>
    </div>
  );
}
