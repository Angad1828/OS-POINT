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

  ready(() => {
    initCursorGlow();
    initParticles();
    initBinaryRain();
    initTyped();
    initAOS();
    initCounters();
    initTabs();
    initSearch();
    initCharts();
    initLiveFeed();
    initRelGraph();
    initTilt();
    initReveal();
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
    email: "j.morgan@blacksite-ops.io",
    ip: "185.220.101.47",
    username: "gh0st_analyst",
    face: "img_9241.jpg",
    domain: "quantum-recon.io",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4"
  };

  function initTabs() {
    const tabs = document.querySelectorAll(".dash-tab");
    const input = document.getElementById("searchInput");
    tabs.forEach((t) => {
      t.addEventListener("click", () => {
        tabs.forEach((x) => x.classList.remove("active"));
        t.classList.add("active");
        const kind = t.dataset.kind;
        if (input) input.placeholder = "Enter " + t.textContent.trim().toLowerCase() + " target...";
        if (input) input.value = DEMO_TARGETS[kind] || "";
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
})();
