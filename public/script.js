/* =========================================================
   OS-POINT — script.js
   Handles: particles, typed text, counters, tabs, charts,
   scroll animations, cursor glow, binary rain, live feed,
   fake investigation results, relationship graph.
   ========================================================= */

(function () {
  "use strict";

  // ---------- Wait for DOM ----------
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  ready(() => {
    if (!REDUCED_MOTION) {
      initCursorGlow();
      initParticles();
      initBinaryRain();
      initTyped();
    }
    initAOS();
    initCounters();
    initTabs();
    initSearch();
    initCharts();
    initLiveFeed();
    initRelGraph();
    initTilt();
    if (!REDUCED_MOTION) initReveal();
    initAuth();
    initPdfExport();
  });

  // ---------- Cursor Glow ----------
  function initCursorGlow() {
    const el = document.getElementById("cursor-glow");
    if (!el) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      el.style.left = x + "px";
      el.style.top = y + "px";
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- particles.js ----------
  function initParticles() {
    if (!window.particlesJS) return;
    window.particlesJS("particles-hero", {
      particles: {
        number: { value: 70, density: { enable: true, value_area: 900 } },
        color: { value: ["#00E5FF", "#00FF88", "#38BDF8"] },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 2, random: true },
        line_linked: { enable: true, distance: 130, color: "#00E5FF", opacity: 0.25, width: 1 },
        move: { enable: true, speed: 1.2, out_mode: "out" }
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 160, line_linked: { opacity: 0.6 } }, push: { particles_nb: 3 } }
      },
      retina_detect: true
    });
  }

  // ---------- Binary rain ----------
  function initBinaryRain() {
    const c = document.querySelector(".binary-rain");
    if (!c) return;
    const cols = Math.floor(window.innerWidth / 24);
    let html = "";
    for (let i = 0; i < cols; i++) {
      const left = (i * 24) + Math.random() * 10;
      const dur = 8 + Math.random() * 14;
      const delay = -Math.random() * 20;
      let str = "";
      for (let j = 0; j < 40; j++) str += Math.random() > 0.5 ? "1" : "0";
      html += `<div class="binary-col" style="left:${left}px;animation-duration:${dur}s;animation-delay:${delay}s">${str}</div>`;
    }
    c.innerHTML = html;
  }

  // ---------- Typed.js ----------
  function initTyped() {
    if (!window.Typed) return;
    new window.Typed("#typed", {
      strings: [
        "Phone Intelligence",
        "Email Intelligence",
        "IP Intelligence",
        "Facial Intelligence (Demo)",
        "Username Intelligence",
        "Threat Intelligence",
        "Metadata Analysis",
        "Digital Footprint Mapping"
      ],
      typeSpeed: 55,
      backSpeed: 30,
      backDelay: 1400,
      loop: true
    });
  }

  // ---------- AOS ----------
  function initAOS() {
    if (window.AOS) window.AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 60 });
  }

  // ---------- Counters ----------
  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    const format = (n, suffix) => {
      if (n >= 1e9) return (n / 1e9).toFixed(1) + "B" + suffix;
      if (n >= 1e6) return (n / 1e6).toFixed(1) + "M" + suffix;
      if (n >= 1e3) return (n / 1e3).toFixed(0) + "K" + suffix;
      return n.toFixed(0) + suffix;
    };
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1800;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased, suffix);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = el.dataset.display || format(target, suffix);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }

  // ---------- Search tabs + demo search ----------
  const DEMO_TARGETS = {
    phone: "+1 (415) 555-0142",
    email: "torvalds@linux-foundation.org",
    ip: "185.220.101.47",
    username: "gh0st_analyst",
    face: "img_9241.jpg",
    domain: "quantum-recon.io",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4"
  };

  function initTabs() {
    const tabs = Array.from(document.querySelectorAll(".dash-tab"));
    const input = document.getElementById("searchInput");
    const select = (t) => {
      tabs.forEach((x) => {
        x.classList.remove("active");
        x.setAttribute("aria-selected", "false");
        x.setAttribute("tabindex", "-1");
      });
      t.classList.add("active");
      t.setAttribute("aria-selected", "true");
      t.setAttribute("tabindex", "0");
      const kind = t.dataset.kind;
      if (input) {
        input.placeholder = "Enter " + t.textContent.trim().toLowerCase() + " target...";
        input.value = DEMO_TARGETS[kind] || "";
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const next = tabs[(i + dir + tabs.length) % tabs.length];
          select(next);
          next.focus();
        } else if (e.key === "Home") {
          e.preventDefault(); select(tabs[0]); tabs[0].focus();
        } else if (e.key === "End") {
          e.preventDefault(); select(tabs[tabs.length - 1]); tabs[tabs.length - 1].focus();
        }
      });
    });
  }

  function initSearch() {
    const form = document.getElementById("searchForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runInvestigation();
    });
  }

  function runInvestigation() {
    const panel = document.getElementById("resultPanel");
    const target = document.getElementById("searchInput").value || "unknown-target";
    if (!panel) return;
    document.getElementById("resTarget").textContent = target;
    panel.style.display = "block";
    panel.scrollIntoView({ behavior: "smooth", block: "center" });

    // Simulate loading
    const stages = ["Initializing collectors", "Querying data sources", "Correlating entities", "Scoring risk"];
    const statusEl = document.getElementById("resStatus");
    let i = 0;
    statusEl.textContent = stages[0];
    const iv = setInterval(() => {
      i++;
      if (i >= stages.length) { statusEl.textContent = "Complete • Demo data"; clearInterval(iv); return; }
      statusEl.textContent = stages[i];
    }, 550);

    // Randomize demo metrics
    const conf = 70 + Math.floor(Math.random() * 25);
    const risk = 20 + Math.floor(Math.random() * 60);
    const sources = 40 + Math.floor(Math.random() * 80);
    const entities = 12 + Math.floor(Math.random() * 40);

    animateNumber("resConf", conf, "%");
    animateNumber("resRisk", risk, "");
    animateNumber("resSources", sources, "");
    animateNumber("resEntities", entities, "");

    // Score ring
    const ring = document.getElementById("scoreRing");
    if (ring) {
      ring.style.setProperty("--p", conf);
      ring.querySelector("span").textContent = conf + "%";
      ring.style.background = `conic-gradient(${risk > 60 ? "#F87171" : (risk > 35 ? "#FBBF24" : "#00FF88")} ${conf}%, rgba(255,255,255,0.06) 0)`;
    }
  }

  function animateNumber(id, target, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    const dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Charts ----------
  function initCharts() {
    if (!window.Chart) return;
    Chart.defaults.color = "#8CA0BE";
    Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Line: attack volume
    const line = document.getElementById("chartLine");
    if (line) {
      new Chart(line, {
        type: "line",
        data: {
          labels: ["00:00","04:00","08:00","12:00","16:00","20:00","Now"],
          datasets: [
            { label: "Attacks", data: [420, 380, 610, 540, 780, 920, 1120],
              borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.15)",
              fill: true, tension: .4, pointRadius: 0, borderWidth: 2 },
            { label: "Blocked", data: [400, 360, 590, 520, 760, 890, 1080],
              borderColor: "#00FF88", backgroundColor: "rgba(0,255,136,0.08)",
              fill: true, tension: .4, pointRadius: 0, borderWidth: 2 }
          ]
        },
        options: {
          plugins: { legend: { labels: { boxWidth: 10 } } },
          scales: { y: { beginAtZero: true } },
          responsive: true, maintainAspectRatio: false
        }
      });
    }

    // Doughnut: attack types
    const doughnut = document.getElementById("chartDoughnut");
    if (doughnut) {
      new Chart(doughnut, {
        type: "doughnut",
        data: {
          labels: ["Phishing", "Malware", "DDoS", "Brute Force", "Recon"],
          datasets: [{
            data: [32, 24, 14, 18, 12],
            backgroundColor: ["#00E5FF","#00FF88","#8B5CF6","#F472B6","#38BDF8"],
            borderColor: "rgba(6,10,20,0.9)",
            borderWidth: 2
          }]
        },
        options: {
          cutout: "70%",
          plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
          responsive: true, maintainAspectRatio: false
        }
      });
    }

    // Radar: threat surface
    const radar = document.getElementById("chartRadar");
    if (radar) {
      new Chart(radar, {
        type: "radar",
        data: {
          labels: ["Network","Endpoint","Cloud","Identity","App","Data"],
          datasets: [{
            label: "Exposure",
            data: [72, 58, 66, 40, 80, 52],
            borderColor: "#00E5FF",
            backgroundColor: "rgba(0,229,255,0.2)",
            pointBackgroundColor: "#00FF88"
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { r: { angleLines: { color: "rgba(255,255,255,0.08)" }, grid: { color: "rgba(255,255,255,0.06)" }, pointLabels: { color: "#8CA0BE" }, ticks: { display: false }, suggestedMax: 100 } },
          responsive: true, maintainAspectRatio: false
        }
      });
    }

    // Bar: top countries
    const bar = document.getElementById("chartBar");
    if (bar) {
      new Chart(bar, {
        type: "bar",
        data: {
          labels: ["RU","CN","US","BR","IR","KP","IN","DE"],
          datasets: [{
            label: "Sources",
            data: [820, 760, 540, 420, 380, 310, 280, 210],
            backgroundColor: "rgba(0,229,255,0.5)",
            borderColor: "#00E5FF",
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  // ---------- Live threat feed ----------
  function initLiveFeed() {
    const feed = document.getElementById("attackFeed");
    if (!feed) return;
    const srcs = ["185.220.101.47","91.219.236.166","45.155.205.86","103.28.11.9","198.51.100.14","62.102.148.68","5.188.10.23","195.19.192.26"];
    const types = ["SSH Brute","Port Scan","SQL Inject","XSS Probe","C2 Beacon","Phish Kit","RDP Sweep","DNS Tunnel"];
    const sev = [["sev-h","HIGH"],["sev-m","MED"],["sev-l","LOW"],["sev-h","CRIT"]];
    const rand = (a) => a[Math.floor(Math.random() * a.length)];
    const push = () => {
      const s = rand(sev);
      const el = document.createElement("div");
      el.className = "row-a";
      const t = new Date().toISOString().slice(11,19);
      el.innerHTML = `<span>${t}</span><span><span class="src">${rand(srcs)}</span> — ${rand(types)}</span><span class="${s[0]}">${s[1]}</span>`;
      feed.prepend(el);
      while (feed.children.length > 10) feed.removeChild(feed.lastChild);
    };
    for (let i = 0; i < 8; i++) push();
    setInterval(push, 1600);
  }

  // ---------- Relationship graph (SVG-like via absolute positioning) ----------
  function initRelGraph() {
    const g = document.getElementById("relGraph");
    if (!g) return;
    const nodes = [
      { x: 50, y: 50, main: true },
      { x: 18, y: 22 }, { x: 82, y: 22 },
      { x: 12, y: 72 }, { x: 88, y: 74 },
      { x: 40, y: 88 }, { x: 66, y: 88 },
      { x: 30, y: 10 }, { x: 72, y: 12 }
    ];
    nodes.forEach((n) => {
      const el = document.createElement("div");
      el.className = "gnode";
      el.style.left = n.x + "%";
      el.style.top = n.y + "%";
      if (n.main) {
        el.style.width = "18px"; el.style.height = "18px";
        el.style.background = "#00FF88";
        el.style.boxShadow = "0 0 18px #00FF88";
      }
      g.appendChild(el);
    });
    // Lines from main to others
    const main = nodes[0];
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      const dx = (n.x - main.x);
      const dy = (n.y - main.y);
      const len = Math.sqrt(dx*dx + dy*dy);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const line = document.createElement("div");
      line.className = "gline";
      line.style.left = main.x + "%";
      line.style.top = main.y + "%";
      line.style.width = len + "%";
      line.style.transform = `rotate(${ang}deg)`;
      line.style.opacity = "0.6";
      g.appendChild(line);
    }
  }

  // ---------- Tilt ----------
  function initTilt() {
    if (!window.VanillaTilt) return;
    window.VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 6, speed: 400, glare: true, "max-glare": 0.12
    });
  }

  // ---------- Extra scroll reveal via GSAP if available ----------
  function initReveal() {
    if (!window.gsap) return;
    gsap.from(".hero-title", { y: 30, opacity: 0, duration: 1, ease: "power3.out" });
    gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 1, delay: .2, ease: "power3.out" });
    gsap.from(".hero-cta", { y: 20, opacity: 0, duration: 1, delay: .35, ease: "power3.out" });
    gsap.from(".scan-visual", { scale: .9, opacity: 0, duration: 1.1, delay: .1, ease: "power3.out" });
  }

  // ---------- Auth (demo only) ----------
  function initAuth() {
    const showToast = (msg) => {
      const t = document.createElement("div");
      t.setAttribute("role", "status");
      t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0b1220;border:1px solid rgba(0,229,255,.35);color:#e6f2ff;padding:.7rem 1rem;border-radius:10px;z-index:9999;font-family:'JetBrains Mono',monospace;font-size:.85rem;box-shadow:0 10px 40px rgba(0,0,0,.6)";
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3200);
    };
    const login = document.getElementById("loginForm");
    if (login) login.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      try { sessionStorage.setItem("ospoint_demo_user", JSON.stringify({ email, at: Date.now() })); } catch {}
      const m = window.bootstrap && window.bootstrap.Modal.getInstance(document.getElementById("loginModal"));
      if (m) m.hide();
      showToast("Signed in as " + email + " (demo session)");
    });
    const signup = document.getElementById("signupForm");
    if (signup) signup.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value.trim();
      const name = document.getElementById("signupName").value.trim();
      const pw = document.getElementById("signupPassword").value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || pw.length < 8) return;
      try { sessionStorage.setItem("ospoint_demo_user", JSON.stringify({ email, name, at: Date.now() })); } catch {}
      const m = window.bootstrap && window.bootstrap.Modal.getInstance(document.getElementById("signupModal"));
      if (m) m.hide();
      showToast("Demo workspace created for " + name);
    });
  }

  // ---------- Gmail Intelligence (demo aggregator) ----------
  function initGmailScan() {
    const form = document.getElementById("gmailForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      runGmailScan();
    });
  }

  // Simple deterministic hash for stable demo variation per email
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }

  function runGmailScan() {
    const input = document.getElementById("gmailInput");
    const status = document.getElementById("gmailStatus");
    const grid = document.getElementById("gmailResults");
    const srcWrap = document.getElementById("gmailSources");
    const email = (input.value || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "Enter a valid email address (e.g. name@gmail.com).";
      grid.innerHTML = ""; srcWrap.innerHTML = "";
      return;
    }
    const isGmail = /@gmail\.com$/.test(email);
    grid.innerHTML = "";
    srcWrap.innerHTML = "";
    const stages = [
      "Resolving MX records via public DNS...",
      "Querying HaveIBeenPwned breach index...",
      "Checking Gravatar profile...",
      "Probing Google account presence (public heuristics)...",
      "Correlating with OSINT Framework references...",
      "Compiling report...",
    ];
    let i = 0;
    status.textContent = stages[0];
    const iv = setInterval(() => {
      i++;
      if (i >= stages.length) { clearInterval(iv); renderGmailResults(email, isGmail); status.textContent = "Scan complete • Demonstration data only"; return; }
      status.textContent = stages[i];
    }, 420);
  }

  function renderGmailResults(email, isGmail) {
    const h = hashStr(email);
    const localPart = email.split("@")[0];
    const domain = email.split("@")[1];
    const breachCount = (h % 6);
    const services = ["LinkedIn (2021)", "Adobe (2013)", "Dropbox (2012)", "Canva (2019)", "MyFitnessPal (2018)", "Twitter (2022)"];
    const breaches = services.slice(0, breachCount).join(", ") || "None found";
    const gravatar = (h % 3 !== 0);
    const googleAcct = isGmail ? "Likely (public recovery signal)" : "Not applicable";
    const reputation = ["Trusted", "Neutral", "Suspicious"][h % 3];
    const repClass = reputation === "Trusted" ? "ok" : reputation === "Suspicious" ? "bad" : "warn";
    const disposable = /(mailinator|tempmail|guerrilla|10minute)/.test(domain) ? "Yes" : "No";
    const mx = isGmail ? "aspmx.l.google.com (Google)" : domain.split(".")[0] + "-mx." + domain;
    const firstSeen = "20" + (15 + (h % 9)) + "-0" + (1 + (h % 8)) + "-1" + (h % 9);
    const accounts = 3 + (h % 9);

    const cards = [
      ["Address", email, ""],
      ["Provider", isGmail ? "Google (Gmail)" : domain, isGmail ? "ok" : ""],
      ["MX record", mx, "ok"],
      ["Deliverable", "Yes", "ok"],
      ["Disposable", disposable, disposable === "Yes" ? "bad" : "ok"],
      ["Reputation", reputation, repClass],
      ["Breach exposures", String(breachCount), breachCount > 2 ? "bad" : breachCount > 0 ? "warn" : "ok"],
      ["Breach corpus", breaches, ""],
      ["Gravatar", gravatar ? "Profile found" : "None", gravatar ? "ok" : ""],
      ["Google account", googleAcct, isGmail ? "warn" : ""],
      ["Linked services", String(accounts) + " public matches", "warn"],
      ["First public sighting", firstSeen, ""],
      ["Username seed", localPart, ""],
    ];
    const grid = document.getElementById("gmailResults");
    grid.innerHTML = cards.map(([k, v, cls]) => (
      '<div class="gmail-card"><div class="k">' + k + '</div><div class="v ' + (cls || "") + '">' + String(v) + '</div></div>'
    )).join("");

    const sources = [
      "OSINT Framework", "osint.rocks", "Epieos (public checks)",
      "HaveIBeenPwned", "Gravatar", "Hunter.io (pattern)",
      "DeHashed (index only)", "Google Recovery", "GitHub commit index",
    ];
    document.getElementById("gmailSources").innerHTML =
      '<span class="text-muted-2" style="font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;margin-right:.4rem">Sources referenced:</span>' +
      sources.map((s) => '<span class="gmail-src">' + s + '</span>').join("");
  }

  // ---------- PDF Export ----------
  function initPdfExport() {
    const btn = document.getElementById("exportPdfBtn");
    if (!btn) return;
    btn.addEventListener("click", () => generateInvestigationPdf());
  }

  function generateInvestigationPdf() {
    const jspdfNs = window.jspdf || {};
    const JsPDF = jspdfNs.jsPDF;
    if (!JsPDF) { alert("PDF engine loading — please try again in a moment."); return; }
    const doc = new JsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 48;
    let y = M;

    // Header band
    doc.setFillColor(6, 14, 28);
    doc.rect(0, 0, W, 90, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("OS-POINT", M, 42);
    doc.setTextColor(230, 242, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Investigation Report — Demonstration Data", M, 62);
    doc.setTextColor(140, 160, 190);
    doc.setFontSize(9);
    doc.text("Generated " + new Date().toISOString(), M, 78);
    y = 120;

    doc.setTextColor(20, 30, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Target", M, y); y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const target = (document.getElementById("resTarget") || {}).textContent || "—";
    doc.text(String(target), M, y); y += 26;

    // Metrics
    const conf = (document.getElementById("resConf") || {}).textContent || "0%";
    const risk = (document.getElementById("resRisk") || {}).textContent || "0";
    const sources = (document.getElementById("resSources") || {}).textContent || "0";
    const entities = (document.getElementById("resEntities") || {}).textContent || "0";
    doc.setFont("helvetica", "bold"); doc.text("Key Metrics", M, y); y += 16;
    doc.setFont("helvetica", "normal");
    [["Confidence", conf], ["Risk Score", risk], ["Sources Hit", sources], ["Entities Found", entities]].forEach(([k, v]) => {
      doc.text("• " + k + ": " + v, M + 8, y); y += 15;
    });
    y += 10;

    // Timeline
    doc.setFont("helvetica", "bold"); doc.text("Investigation Timeline", M, y); y += 16;
    doc.setFont("helvetica", "normal");
    const items = Array.from(document.querySelectorAll(".timeline .tl-item"));
    if (items.length === 0) {
      doc.text("No timeline entries.", M + 8, y); y += 15;
    } else {
      items.forEach((it) => {
        const t = (it.querySelector(".tt") || {}).textContent || "";
        const h = (it.querySelector(".th") || {}).textContent || "";
        const line = "• " + t + " — " + h;
        const wrapped = doc.splitTextToSize(line, W - M * 2 - 8);
        wrapped.forEach((ln) => { if (y > 780) { doc.addPage(); y = M; } doc.text(ln, M + 8, y); y += 14; });
      });
    }
    y += 10;

    // Gmail results (if present)
    const gmailCards = Array.from(document.querySelectorAll("#gmailResults .gmail-card"));
    if (gmailCards.length) {
      if (y > 720) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "bold"); doc.text("Email / Gmail Intelligence", M, y); y += 16;
      doc.setFont("helvetica", "normal");
      gmailCards.forEach((c) => {
        const k = (c.querySelector(".k") || {}).textContent || "";
        const v = (c.querySelector(".v") || {}).textContent || "";
        const line = "• " + k + ": " + v;
        const wrapped = doc.splitTextToSize(line, W - M * 2 - 8);
        wrapped.forEach((ln) => { if (y > 780) { doc.addPage(); y = M; } doc.text(ln, M + 8, y); y += 14; });
      });
      y += 8;
    }

    // Footer
    if (y > 740) { doc.addPage(); y = M; }
    doc.setDrawColor(200);
    doc.line(M, y, W - M, y); y += 16;
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 150);
    doc.text("This report was generated by the OS-POINT demonstration platform. All values shown are simulated for authorized OSINT demonstration purposes only.", M, y, { maxWidth: W - M * 2 });

    const safe = String(target).replace(/[^a-z0-9._@+-]/gi, "_").slice(0, 40) || "target";
    doc.save("ospoint-report-" + safe + "-" + Date.now() + ".pdf");
  }
})();

