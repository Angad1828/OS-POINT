import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OS-POINT — Enterprise Open Source Intelligence Platform" },
      {
        name: "description",
        content:
          "OS-POINT is a premium OSINT platform for authorized security teams: phone, email, IP, username, threat and metadata intelligence with live dashboards.",
      },
      { property: "og:title", content: "OS-POINT — Intelligence Beyond Visibility" },
      {
        property: "og:description",
        content:
          "Enterprise-grade OSINT: investigate targets, correlate entities, and monitor global threat activity in real time.",
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
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/aos@2.3.4/dist/aos.css",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: OSPoint,
});

function OSPoint() {
  useEffect(() => {
    // Load CDN scripts sequentially so dependencies exist before script.js runs
    const scripts = [
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
      "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js",
      "https://unpkg.com/aos@2.3.4/dist/aos.js",
      "https://cdn.jsdelivr.net/npm/typed.js@2.1.0/dist/typed.umd.js",
      "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
      "https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/dist/vanilla-tilt.min.js",
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
      <a href="#home" className="skip-link">Skip to main content</a>
      <div id="cursor-glow" aria-hidden="true" />



      {/* NAV */}
      <nav className="osp-nav navbar navbar-expand-lg">
        <div className="container">
          <a className="navbar-brand" href="#">
            <span className="brand-mark">
              <i className="bi bi-radar"></i>
            </span>
            OS-POINT
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMain"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" style={{ filter: "invert(1)" }}></span>
          </button>
          <div className="collapse navbar-collapse" id="navMain">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item"><a className="nav-link active" href="#home">Home</a></li>
              <li className="nav-item"><a className="nav-link" href="#modules">Modules</a></li>
              <li className="nav-item"><a className="nav-link" href="#dashboard">Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="#intel">Intelligence</a></li>
              <li className="nav-item"><a className="nav-link" href="#api">API</a></li>
              <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact">Contact</a></li>
            </ul>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-ghost btn-sm-cyber" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
              <button type="button" className="btn btn-cyber btn-sm-cyber" data-bs-toggle="modal" data-bs-target="#signupModal">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header id="home" className="hero">
        <div id="particles-hero"></div>
        <div className="binary-rain"></div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="chip"><span className="dot"></span> Live • Authorized OSINT Demo</span>
              <h1 className="hero-title">
                Intelligence <span className="text-grad">Beyond Visibility</span>
              </h1>
              <p className="hero-sub">
                OS-POINT is an enterprise Open Source Intelligence platform for
                authorized security teams. Investigate targets, correlate
                entities, and monitor global threat activity from a single
                mission-grade console.
              </p>
              <div className="typed-line mono">
                <span id="typed"></span>
              </div>
              <div className="hero-cta d-flex flex-wrap gap-3">
                <a href="#dashboard" className="btn btn-cyber">
                  <i className="bi bi-crosshair2 me-2"></i> Launch Investigation
                </a>
                <a href="#modules" className="btn btn-ghost">
                  Explore Platform <i className="bi bi-arrow-right ms-1"></i>
                </a>
              </div>
              <div className="d-flex gap-4 mt-4 text-muted-2" style={{ fontSize: ".82rem" }}>
                <div><i className="bi bi-shield-check text-cyan me-1"></i> SOC 2 Ready</div>
                <div><i className="bi bi-lock text-cyan me-1"></i> Zero Data Retention</div>
                <div><i className="bi bi-globe2 text-cyan me-1"></i> 230+ Countries</div>
              </div>
            </div>
            <div className="col-lg-5" data-aos="zoom-in">
              <div className="scan-visual">
                <div className="scan-ring"></div>
                <div className="scan-ring r2"></div>
                <div className="scan-ring r3"></div>
                <div className="scan-ring r4"></div>
                <div className="scan-sweep"></div>
                <div className="scan-center"></div>
                <span className="node n1"></span>
                <span className="node n2"></span>
                <span className="node n3"></span>
                <span className="node n4"></span>
                <span className="node n5"></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="section" style={{ paddingTop: "2rem" }}>
        <div className="container">
          <div className="row g-3">
            {[
              { n: 12000000, s: "+", d: "12M+", l: "Investigations Run" },
              { n: 230, s: "+", d: "230+", l: "Countries Covered" },
              { n: 400, s: "+", d: "400+", l: "Data Sources" },
              { n: 99.98, s: "%", d: "99.98%", l: "Platform Uptime" },
              { n: 1200000000, s: "+", d: "1.2B+", l: "Records Indexed" },
            ].map((s, i) => (
              <div key={i} className="col-6 col-md-4 col-lg" data-aos="fade-up" data-aos-delay={i * 60}>
                <div className="glass stat">
                  <div className="num" data-count={s.n} data-suffix={s.s} data-display={s.d}>0</div>
                  <div className="lbl">{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Intelligence Modules</span>
            <h2 className="section-title">A full-spectrum <span className="text-grad">OSINT arsenal</span></h2>
            <p className="section-sub mx-auto">
              Twenty specialized modules covering identity, network, threat, and
              content intelligence — all designed for authorized security work.
            </p>
          </div>
          <div className="row g-3">
            {[
              ["bi-telephone-fill", "Phone Intelligence", "Carrier, geo, footprint"],
              ["bi-envelope-fill", "Email Intelligence", "Breach & reputation lookup"],
              ["bi-hdd-network-fill", "IP Intelligence", "ASN, geo, threat class"],
              ["bi-person-badge-fill", "Username Intelligence", "Cross-platform correlation"],
              ["bi-globe", "Domain Intelligence", "Registration & subdomains"],
              ["bi-journal-code", "WHOIS Lookup", "Ownership & history"],
              ["bi-diagram-3-fill", "DNS Lookup", "A, MX, TXT, DNSSEC"],
              ["bi-file-earmark-binary", "Metadata Extraction", "EXIF, docs, signatures"],
              ["bi-image-fill", "Image Intelligence", "Forensics & similarity"],
              ["bi-arrow-repeat", "Reverse Image", "Web presence matching"],
              ["bi-emoji-smile", "Facial Recognition", "Demo model only"],
              ["bi-incognito", "Dark Web Monitor", "Leak surface tracking"],
              ["bi-shield-exclamation", "Breach Lookup", "Credential exposure"],
              ["bi-broadcast-pin", "Threat Feed", "Live IOC aggregation"],
              ["bi-hash", "Hash Analysis", "MD5, SHA, ssdeep"],
              ["bi-bug-fill", "Malware Sandbox", "Behavioral triage"],
              ["bi-geo-alt-fill", "Geo Intelligence", "Location correlation"],
              ["bi-people-fill", "Social Intelligence", "Public profile graph"],
              ["bi-file-earmark-text-fill", "Document Intelligence", "OSINT doc parsing"],
              ["bi-building", "Company Intelligence", "Corp records & filings"],
            ].map(([icon, title, sub], i) => (
              <div key={i} className="col-6 col-md-4 col-lg-3" data-aos="fade-up" data-aos-delay={(i % 4) * 60}>
                <div className="glass module-card" data-tilt>
                  <span className="m-tag">Live</span>
                  <div className="module-icon"><i className={`bi ${icon}`}></i></div>
                  <h5>{title}</h5>
                  <p>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEARCH DASHBOARD */}
      <section id="dashboard" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Investigation Console</span>
            <h2 className="section-title">Search across <span className="text-grad">every surface</span></h2>
            <p className="section-sub mx-auto">
              Pivot from a single identifier to a full investigation. All results
              below are demonstration data.
            </p>
          </div>

          <div className="glass dash" data-aos="fade-up">
            <div className="dash-tabs" role="tablist" aria-label="Investigation target type">
              {[
                ["phone", "bi-telephone", "Phone"],
                ["email", "bi-envelope", "Email"],
                ["ip", "bi-hdd-network", "IP"],
                ["username", "bi-person", "Username"],
                ["face", "bi-emoji-smile", "Face"],
                ["domain", "bi-globe", "Domain"],
                ["hash", "bi-hash", "Hash"],
              ].map(([kind, icon, label], i) => (
                <button
                  key={kind}
                  type="button"
                  role="tab"
                  tabIndex={i === 0 ? 0 : -1}
                  aria-selected={i === 0 ? "true" : "false"}
                  className={`dash-tab ${i === 0 ? "active" : ""}`}
                  data-kind={kind}
                >
                  <i className={`bi ${icon}`} aria-hidden="true"></i> {label}
                </button>
              ))}
            </div>

            <form id="searchForm" className="search-input-wrap" role="search" aria-label="Investigate a target">
              <label htmlFor="searchInput" className="sr-only">Target identifier</label>
              <input
                id="searchInput"
                className="search-input"
                placeholder="Enter phone target..."
                defaultValue="+1 (415) 555-0142"
                autoComplete="off"
              />
              <button className="search-btn" type="submit">
                <i className="bi bi-search me-1" aria-hidden="true"></i> Investigate
              </button>
            </form>

            <div id="resultPanel" className="result-panel" style={{ display: "none" }}>
              <div className="result-head">
                <div>
                  <div className="text-muted-2" style={{ fontSize: ".76rem", letterSpacing: ".1em", textTransform: "uppercase" }}>Target</div>
                  <div id="resTarget" className="target">—</div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="chip"><span className="dot"></span> <span id="resStatus">Idle</span></span>
                  <button id="exportPdfBtn" type="button" className="btn btn-ghost btn-sm-cyber" aria-label="Download investigation report as PDF"><i className="bi bi-download me-1" aria-hidden="true"></i> Export PDF</button>
                </div>
              </div>
              <div className="result-body">
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <div className="metric">
                      <div className="k">Confidence</div>
                      <div className="v g" id="resConf">0%</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="metric">
                      <div className="k">Risk Score</div>
                      <div className="v w" id="resRisk">0</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="metric">
                      <div className="k">Sources Hit</div>
                      <div className="v c" id="resSources">0</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="metric">
                      <div className="k">Entities Found</div>
                      <div className="v c" id="resEntities">0</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-4">
                    <div className="metric h-100 d-flex flex-column align-items-center justify-content-center">
                      <div className="k mb-2">Overall</div>
                      <div id="scoreRing" className="score-ring" style={{ ["--p" as never]: 78 } as never}>
                        <span>78%</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="metric h-100">
                      <div className="k mb-2">Geo Snapshot</div>
                      <div className="graph-placeholder" style={{ aspectRatio: "4/3" }}>
                        <div className="gnode" style={{ top: "30%", left: "20%" }}></div>
                        <div className="gnode" style={{ top: "55%", left: "48%", background: "#00FF88", boxShadow: "0 0 12px #00FF88" }}></div>
                        <div className="gnode" style={{ top: "40%", left: "78%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="metric h-100">
                      <div className="k mb-2">Timeline</div>
                      <div className="timeline">
                        <div className="tl-item"><div className="tt">2024-11 · SRC-14</div><div className="th">First appearance on public dataset</div></div>
                        <div className="tl-item"><div className="tt">2025-03 · SRC-42</div><div className="th">Linked to secondary identifier</div></div>
                        <div className="tl-item"><div className="tt">2025-08 · SRC-71</div><div className="th">Observed on breach corpus</div></div>
                        <div className="tl-item"><div className="tt">2026-06 · SRC-88</div><div className="th">Recent activity flagged</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-12">
                    <div className="metric">
                      <div className="k mb-2">Relationship Graph (demo)</div>
                      <div id="relGraph" className="graph-placeholder"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE THREAT DASHBOARD */}
      <section id="intel" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Live Threat Intelligence</span>
            <h2 className="section-title">Global activity, <span className="text-grad">observed in real time</span></h2>
          </div>
          <div className="row g-3">
            <div className="col-lg-3 col-md-6" data-aos="fade-up">
              <div className="glass widget">
                <h6><span className="live"></span> Threat Level</h6>
                <div className="threat-level">ELEVATED</div>
                <div className="text-muted-2" style={{ fontSize: ".8rem" }}>Global surface score: <span className="text-cyan">72 / 100</span></div>
                <div className="mt-3 shimmer" style={{ height: 6, borderRadius: 4 }}></div>
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-up" data-aos-delay={80}>
              <div className="glass widget">
                <h6><span className="live"></span> Attacks vs. Blocked (24h)</h6>
                <div style={{ height: 220 }}><canvas id="chartLine" className="chart"></canvas></div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay={120}>
              <div className="glass widget">
                <h6><span className="live"></span> Attack Types</h6>
                <div style={{ height: 220 }}><canvas id="chartDoughnut" className="chart"></canvas></div>
              </div>
            </div>

            <div className="col-lg-5" data-aos="fade-up">
              <div className="glass widget">
                <h6><span className="live"></span> Live IOC Stream</h6>
                <div id="attackFeed" className="attack-feed"></div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay={80}>
              <div className="glass widget">
                <h6><span className="live"></span> Threat Surface</h6>
                <div style={{ height: 260 }}><canvas id="chartRadar" className="chart"></canvas></div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay={120}>
              <div className="glass widget">
                <h6><span className="live"></span> Top Source Countries</h6>
                <div style={{ height: 260 }}><canvas id="chartBar" className="chart"></canvas></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Investigation Workflow</span>
            <h2 className="section-title">From identifier to <span className="text-grad">actionable report</span></h2>
          </div>
          <div className="glass p-4" data-aos="fade-up">
            <div className="workflow">
              {[
                ["1", "Target Selected", "Choose identifier"],
                ["2", "Data Collection", "Query 400+ sources"],
                ["3", "Correlation", "Cross-reference data"],
                ["4", "Entity Resolution", "Deduplicate & score"],
                ["5", "Relationship Mapping", "Build graph"],
                ["6", "Threat Analysis", "Risk & context"],
                ["7", "Report Generation", "Export evidence"],
              ].map(([n, t, d], i) => (
                <div key={i} className="wf-step">
                  <div className="n">{n}</div>
                  <div className="t">{t}</div>
                  <div className="d">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="api" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Platform Features</span>
            <h2 className="section-title">Built for <span className="text-grad">serious operators</span></h2>
          </div>
          <div className="row g-3">
            {[
              ["bi-cpu", "AI Powered", "LLM-assisted correlation across signals."],
              ["bi-lightning-charge", "Fast Investigation", "Median case resolution in under 60s."],
              ["bi-shuffle", "Cross Correlation", "Bridge phone, email, IP, and social layers."],
              ["bi-diagram-3", "Relationship Graphs", "Interactive entity graphs with pivots."],
              ["bi-moon-stars", "Dark Mode Native", "Optimized for 24/7 SOC operations."],
              ["bi-broadcast", "Threat Intelligence", "Fresh IOC and CVE feeds."],
              ["bi-globe-americas", "Global Coverage", "230+ countries and 40+ languages."],
              ["bi-plug", "API Ready", "REST + Webhook integrations."],
              ["bi-file-earmark-arrow-down", "Export Reports", "PDF, STIX, JSON, and CSV."],
              ["bi-collection", "Evidence Collection", "Chain-of-custody preserved."],
              ["bi-shield-lock", "Zero Retention Mode", "Investigations vanish on close."],
              ["bi-people", "Team Workspaces", "Case sharing and RBAC."],
            ].map(([icon, t, d], i) => (
              <div key={i} className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={(i % 3) * 60}>
                <div className="glass feature" data-tilt>
                  <div className="fi"><i className={`bi ${icon}`}></i></div>
                  <h5 className="mb-1">{t}</h5>
                  <p className="text-muted-2 mb-0" style={{ fontSize: ".9rem" }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="about" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Trusted by Security Teams</span>
            <h2 className="section-title">What operators <span className="text-grad">say</span></h2>
          </div>
          <div className="row g-3">
            {[
              ["OS-POINT collapsed our investigation time from days to minutes. The entity graph alone is worth the license.", "M. Kaur", "Threat Hunter, Blue Team"],
              ["The IOC stream and pivoting UI feel like a real ops center. Our SOC picked it up in an afternoon.", "D. Ortega", "SOC Lead, Fintech"],
              ["Finally an OSINT tool that respects chain of custody. Reports are court-ready out of the box.", "A. Reyes", "Digital Forensics Analyst"],
              ["Great cross-correlation across phone, email, and username. Cuts through noise fast.", "S. Lindqvist", "CTI Analyst"],
              ["The demo dashboards make executive briefings effortless. Charts export cleanly.", "R. Chen", "Security Director"],
              ["Zero-retention mode makes legal happy. We use it for every external engagement.", "P. Mahmoud", "GRC Lead"],
            ].map(([q, name, role], i) => (
              <div key={i} className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={(i % 3) * 60}>
                <div className="glass quote">
                  <p>“{q}”</p>
                  <div className="who">
                    <div className="avatar">{String(name).split(" ").map((s) => s[0]).join("")}</div>
                    <div>
                      <div className="name">{name}</div>
                      <div className="role">{role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="start" className="section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <span className="section-eyebrow">Pricing</span>
            <h2 className="section-title">Choose your <span className="text-grad">operating tier</span></h2>
          </div>
          <div className="row g-3 justify-content-center">
            {[
              {
                name: "Starter", price: "$0", per: "/mo",
                items: ["5 investigations / day", "10 core modules", "Community support", "PDF export"],
                cta: "Start Free", pop: false,
              },
              {
                name: "Professional", price: "$249", per: "/mo",
                items: ["Unlimited investigations", "All 20 modules", "Live threat feed", "API + webhooks", "Team of 10"],
                cta: "Start Trial", pop: true,
              },
              {
                name: "Enterprise", price: "Custom", per: "",
                items: ["SSO + SAML", "Zero-retention mode", "Dedicated CSM", "On-prem option", "Custom integrations"],
                cta: "Contact Sales", pop: false,
              },
            ].map((p, i) => (
              <div key={i} className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={i * 80}>
                <div className={`glass plan ${p.pop ? "pop" : ""}`}>
                  {p.pop && <span className="badge-pop">Most Popular</span>}
                  <div className="p-name">{p.name}</div>
                  <div className="p-price">{p.price}<small>{p.per}</small></div>
                  <ul>
                    {p.items.map((it, j) => (
                      <li key={j}><i className="bi bi-check-circle-fill"></i> {it}</li>
                    ))}
                  </ul>
                  <a href="#" className={`btn ${p.pop ? "btn-cyber" : "btn-ghost"} w-100`}>{p.cta}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <a className="navbar-brand" href="#">
                <span className="brand-mark"><i className="bi bi-radar"></i></span>
                OS-POINT
              </a>
              <p className="text-muted-2 mt-3" style={{ fontSize: ".9rem", maxWidth: 340 }}>
                Enterprise Open Source Intelligence for authorized security teams.
                All investigation data shown on this site is demonstration content.
              </p>
              <div className="socials mt-3">
                <a href="#" aria-label="Twitter"><i className="bi bi-twitter-x"></i></a>
                <a href="#" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
                <a href="#" aria-label="GitHub"><i className="bi bi-github"></i></a>
                <a href="#" aria-label="YouTube"><i className="bi bi-youtube"></i></a>
              </div>
            </div>
            <div className="col-6 col-lg-2">
              <h6>Product</h6>
              <a href="#modules">Modules</a>
              <a href="#dashboard">Dashboard</a>
              <a href="#intel">Threat Intel</a>
              <a href="#api">API</a>
            </div>
            <div className="col-6 col-lg-2">
              <h6>Company</h6>
              <a href="#about">About</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#">Legal</a>
            </div>
            <div className="col-lg-4">
              <h6>Get intelligence briefings</h6>
              <p className="text-muted-2" style={{ fontSize: ".86rem" }}>
                Monthly CTI digest. No spam. Unsubscribe anytime.
              </p>
              <form className="newsletter d-flex" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="you@company.com" aria-label="Email" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="copy d-flex flex-wrap justify-content-between gap-2">
            <div>© 2026 OS-POINT. Demonstration platform for authorized use only.</div>
            <div>
              <a href="#" style={{ display: "inline", marginRight: "1rem" }}>Privacy</a>
              <a href="#" style={{ display: "inline", marginRight: "1rem" }}>Terms</a>
              <a href="#" style={{ display: "inline" }}>Responsible Use</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
