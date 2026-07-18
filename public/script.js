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

    const activeTab = document.querySelector(".dash-tab.active");
    const kind = activeTab ? activeTab.dataset.kind : "";
    const emailIntel = document.getElementById("emailIntel");
    if (emailIntel) emailIntel.style.display = kind === "email" ? "block" : "none";

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

    // Kick off real email OSINT if this is an email target
    if (kind === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target.trim())) {
      runEmailIntel(target.trim().toLowerCase());
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

  // ---------- Email OSINT (real, CORS-safe probes) ----------
  //
  // Live probes used from the browser:
  //  - Gravatar avatar image (image request, no CORS needed)
  //  - Gravatar profile JSON (CORS-open on www.gravatar.com/<md5>.json)
  //  - GitHub users search API (CORS-open on api.github.com)
  //
  // Other sites (Twitter/X, Instagram, TikTok, LinkedIn, Facebook, Reddit,
  // Medium, GitLab, Dev.to, Stack Overflow, Pinterest, Keybase, Have I
  // Been Pwned) do not allow direct browser scraping due to CORS. We
  // surface them as CANDIDATE profile URLs derived from the email's local
  // part — the standard OSINT-framework approach (Sherlock/Holehe style).
  // Users can click through to verify. A real backend would resolve these.

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }

  // Compact MD5 (public domain, Joseph Myers) — needed for Gravatar hash
  function md5(s) {
    function toUtf8(str) {
      return unescape(encodeURIComponent(str));
    }
    function add32(a, b) { return (a + b) & 0xffffffff; }
    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
    function md5cycle(x, k) {
      let a=x[0],b=x[1],c=x[2],d=x[3];
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);
    }
    function md5blk(s){const md5blks=[];for(let i=0;i<64;i+=4){md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);}return md5blks;}
    function md51(s){const n=s.length,state=[1732584193,-271733879,-1732584194,271733878];let i;for(i=64;i<=s.length;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)));}s=s.substring(i-64);const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);tail[i>>2]|=0x80<<((i%4)<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i++)tail[i]=0;}tail[14]=n*8;md5cycle(state,tail);return state;}
    function rhex(n){const hex="0123456789abcdef";let s="";for(let j=0;j<4;j++)s+=hex.charAt((n>>(j*8+4))&0x0F)+hex.charAt((n>>(j*8))&0x0F);return s;}
    function hex(x){for(let i=0;i<x.length;i++)x[i]=rhex(x[i]);return x.join("");}
    return hex(md51(toUtf8(s)));
  }

  async function runEmailIntel(email) {
    const localPart = email.split("@")[0];
    const domain = email.split("@")[1] || "";
    const isGmail = domain === "gmail.com";
    const gravHash = md5(email);

    // ---- Avatar (Gravatar image) ----
    const avatarWrap = document.getElementById("emailAvatarWrap");
    const avatarMeta = document.getElementById("emailAvatarMeta");
    if (avatarWrap) {
      avatarWrap.innerHTML = '<div class="email-avatar-loading"><span class="spinner-border spinner-border-sm text-info" role="status" aria-hidden="true"></span></div>';
      const url = "https://www.gravatar.com/avatar/" + gravHash + "?s=240&d=404";
      const img = new Image();
      img.alt = "Gravatar image for " + email;
      img.onload = () => {
        avatarWrap.innerHTML = "";
        img.className = "email-avatar-img";
        avatarWrap.appendChild(img);
        if (avatarMeta) avatarMeta.innerHTML = 'Gravatar hit • <a href="' + url + '" target="_blank" rel="noopener" class="text-cyan">open image</a>';
      };
      img.onerror = () => {
        avatarWrap.innerHTML = '<div class="email-avatar-fallback"><i class="bi bi-person-slash" aria-hidden="true"></i></div>';
        if (avatarMeta) avatarMeta.textContent = "No public Gravatar found";
      };
      img.src = url;
    }

    // ---- Gravatar profile JSON (real fetch) ----
    let gravProfile = null;
    try {
      const r = await fetch("https://www.gravatar.com/" + gravHash + ".json", { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const j = await r.json();
        if (j && j.entry && j.entry[0]) gravProfile = j.entry[0];
      }
    } catch (_) { /* CORS or network */ }

    // ---- GitHub user search (real fetch) ----
    let ghUsers = [];
    try {
      const q = encodeURIComponent(email + " in:email");
      const r = await fetch("https://api.github.com/search/users?q=" + q + "&per_page=5");
      if (r.ok) {
        const j = await r.json();
        ghUsers = (j.items || []).slice(0, 5);
      }
      // Fallback: try username search
      if (ghUsers.length === 0) {
        const r2 = await fetch("https://api.github.com/users/" + encodeURIComponent(localPart));
        if (r2.ok) {
          const u = await r2.json();
          if (u && u.login) ghUsers = [u];
        }
      }
    } catch (_) { /* network */ }

    // ---- Signals grid ----
    const disposable = /(mailinator|tempmail|guerrilla|10minute|yopmail|trashmail)/.test(domain);
    const mx = isGmail ? "aspmx.l.google.com (Google)" : (domain ? domain.split(".")[0] + "-mx." + domain : "—");
    const signals = [
      ["Address", email, ""],
      ["Provider", isGmail ? "Google (Gmail)" : (domain || "—"), isGmail ? "ok" : ""],
      ["MX (heuristic)", mx, isGmail ? "ok" : ""],
      ["Disposable", disposable ? "Yes" : "No", disposable ? "bad" : "ok"],
      ["Google account signal", isGmail ? "Likely (Gmail domain)" : "Not applicable", isGmail ? "warn" : ""],
      ["Gravatar profile", gravProfile ? "Public profile found" : (gravProfile === null ? "Not public" : "—"), gravProfile ? "ok" : ""],
      ["Gravatar display name", (gravProfile && gravProfile.displayName) || (gravProfile && gravProfile.name && (gravProfile.name.formatted)) || "—", ""],
      ["Gravatar location", (gravProfile && gravProfile.currentLocation) || "—", ""],
      ["GitHub match", ghUsers.length ? ghUsers[0].login : "None found", ghUsers.length ? "ok" : ""],
      ["Username seed", localPart, ""],
    ];
    const sig = document.getElementById("emailSignals");
    if (sig) {
      sig.innerHTML = signals.map(([k, v, cls]) => (
        '<div class="gmail-card"><div class="k">' + k + '</div><div class="v ' + (cls || "") + '">' + escapeHtml(String(v)) + '</div></div>'
      )).join("");
    }

    // ---- Linked accounts / candidate profile URLs ----
    const candidates = [
      ["GitHub", "bi-github", "https://github.com/" + encodeURIComponent(localPart), ghUsers.length ? "confirmed" : "candidate"],
      ["Gravatar profile", "bi-person-badge", "https://www.gravatar.com/" + gravHash, gravProfile ? "confirmed" : "candidate"],
      ["Twitter / X", "bi-twitter-x", "https://x.com/" + encodeURIComponent(localPart), "candidate"],
      ["Instagram", "bi-instagram", "https://instagram.com/" + encodeURIComponent(localPart), "candidate"],
      ["Reddit", "bi-reddit", "https://www.reddit.com/user/" + encodeURIComponent(localPart), "candidate"],
      ["Medium", "bi-medium", "https://medium.com/@" + encodeURIComponent(localPart), "candidate"],
      ["Dev.to", "bi-braces", "https://dev.to/" + encodeURIComponent(localPart), "candidate"],
      ["GitLab", "bi-git", "https://gitlab.com/" + encodeURIComponent(localPart), "candidate"],
      ["Stack Overflow", "bi-stack-overflow", "https://stackoverflow.com/users?tab=Users&search=" + encodeURIComponent(email), "candidate"],
      ["Keybase", "bi-key", "https://keybase.io/" + encodeURIComponent(localPart), "candidate"],
      ["LinkedIn", "bi-linkedin", "https://www.linkedin.com/search/results/all/?keywords=" + encodeURIComponent(email), "candidate"],
      ["HaveIBeenPwned", "bi-shield-exclamation", "https://haveibeenpwned.com/account/" + encodeURIComponent(email), "candidate"],
      ["Google (recovery)", "bi-google", "https://accounts.google.com/signin/v2/usernamerecovery?email=" + encodeURIComponent(email), isGmail ? "candidate" : "n/a"],
      ["OSINT Framework", "bi-diagram-3", "https://osintframework.com/", "reference"],
      ["osint.rocks (email)", "bi-envelope-open", "https://osint.rocks/", "reference"],
    ];
    // If Gravatar profile has verified accounts, promote them
    if (gravProfile && Array.isArray(gravProfile.accounts)) {
      gravProfile.accounts.forEach((a) => {
        candidates.unshift([a.shortname || a.name || "verified", "bi-patch-check", a.url, "confirmed"]);
      });
    }

    const grid = document.getElementById("emailAccounts");
    if (grid) {
      grid.innerHTML = candidates.map(([name, icon, url, state]) => {
        const badge = state === "confirmed"
          ? '<span class="acct-badge ok"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Confirmed</span>'
          : state === "n/a"
            ? '<span class="acct-badge">N/A</span>'
            : state === "reference"
              ? '<span class="acct-badge">Reference</span>'
              : '<span class="acct-badge warn"><i class="bi bi-search" aria-hidden="true"></i> Candidate</span>';
        return (
          '<a class="acct-card ' + state + '" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="acct-head"><i class="bi ' + icon + '" aria-hidden="true"></i><span class="acct-name">' + escapeHtml(name) + '</span></div>' +
          '<div class="acct-url">' + escapeHtml(url.replace(/^https?:\/\//, "")) + '</div>' +
          badge +
          '</a>'
        );
      }).join("");
    }

    const sourcesEl = document.getElementById("emailSources");
    if (sourcesEl) {
      const sources = ["Gravatar (live)", "GitHub API (live)", "OSINT Framework", "osint.rocks", "HaveIBeenPwned", "Google Recovery"];
      sourcesEl.innerHTML =
        '<span class="text-muted-2" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;margin-right:.4rem">Sources referenced:</span>' +
        sources.map((s) => '<span class="gmail-src">' + escapeHtml(s) + '</span>').join("");
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
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
    const gmailCards = Array.from(document.querySelectorAll("#emailSignals .gmail-card"));
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

