/* =========================================================
   OS-POINT — Intelligence Runtime
   Real enrichment via CORS-enabled public APIs:
     - Google DNS-over-HTTPS: https://dns.google/resolve
     - RDAP.org (WHOIS):      https://rdap.org/domain/<domain>
     - Gravatar:              https://gravatar.com/<md5>.json / avatar
   ========================================================= */

(function () {
  "use strict";

  // ----------------------- theme -----------------------
  const THEME_KEY = "osp.theme";
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const icon = document.querySelector("#themeToggle i");
    if (icon) icon.className = t === "light" ? "bi bi-sun" : "bi bi-moon-stars";
  }
  applyTheme(localStorage.getItem(THEME_KEY) || "dark");
  document.addEventListener("click", (e) => {
    if (e.target.closest("#themeToggle")) {
      const next = (localStorage.getItem(THEME_KEY) || "dark") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    }
  });

  // ----------------------- utilities -----------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nowStr = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function toast(title, body, tone = "") {
    const w = $("#toastWrap"); if (!w) return;
    const d = document.createElement("div");
    d.className = "toast " + tone;
    d.innerHTML = `<i class="bi ${tone === "ok" ? "bi-check-circle" : tone === "warn" ? "bi-exclamation-triangle" : tone === "err" ? "bi-x-circle" : "bi-info-circle"}"></i><div><div class="toast-title">${esc(title)}</div><div class="toast-body">${esc(body)}</div></div>`;
    w.appendChild(d);
    setTimeout(() => d.remove(), 4200);
  }

  // MD5 (public domain, condensed) for Gravatar
  function md5(str) {
    function rh(n){var j,s="";for(j=0;j<=3;j++)s+="0123456789abcdef".charAt((n>>(j*8+4))&0x0F)+"0123456789abcdef".charAt((n>>(j*8))&0x0F);return s;}
    function ad(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}
    function rl(n,c){return(n<<c)|(n>>>(32-c));}
    function cm(q,a,b,x,s,t){return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cm((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cm((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cm(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cm(c^(b|~d),a,b,x,s,t);}
    function cw(s){var t,l=s.length,w=[];for(t=0;t<l;t+=4)w[t>>2]=s.charCodeAt(t)|(s.charCodeAt(t+1)<<8)|(s.charCodeAt(t+2)<<16)|(s.charCodeAt(t+3)<<24);w[l>>2]|=0x80<<((l%4)*8);w[(((l+8)>>6)+1)*16-2]=l*8;return w;}
    var x=cw(unescape(encodeURIComponent(str))),a=1732584193,b=-271733879,c=-1732584194,d=271733878,i,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16){olda=a;oldb=b;oldc=c;oldd=d;
      a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
  }

  // ----------------------- state -----------------------
  const state = {
    entity: "email",
    lastCase: null,
    recent: JSON.parse(localStorage.getItem("osp.recent") || "[]"),
    cases: JSON.parse(localStorage.getItem("osp.cases") || "[]"),
  };
  const saveRecent = () => localStorage.setItem("osp.recent", JSON.stringify(state.recent.slice(0, 8)));
  const saveCases = () => localStorage.setItem("osp.cases", JSON.stringify(state.cases.slice(0, 40)));

  // ----------------------- validation -----------------------
  const V = {
    email: (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s),
    domain: (s) => /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(s),
    ip: (s) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(s) || /^[0-9a-f:]{2,}$/i.test(s),
    username: (s) => /^[a-z0-9._-]{2,}$/i.test(s),
    phone: (s) => /^\+?[0-9\s().-]{6,}$/.test(s),
    hash: (s) => /^[a-f0-9]{32,128}$/i.test(s),
    url: (s) => /^https?:\/\/\S+$/i.test(s),
    image: () => true,
  };
  const PLACEHOLDER = {
    email: "e.g. torvalds@linux-foundation.org",
    domain: "e.g. cloudflare.com",
    ip: "e.g. 8.8.8.8",
    username: "e.g. gvanrossum",
    phone: "e.g. +1 415 555 0132",
    hash: "e.g. 275a021bbfb6489e54d471899f7db9d1663fc695...",
    url: "e.g. https://example.com/path",
    image: "Paste image URL to reverse-lookup (demo)",
  };

  // ----------------------- entity tabs -----------------------
  function setEntity(kind) {
    state.entity = kind;
    $$(".etab").forEach((b) => {
      const on = b.dataset.entity === kind;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    const input = $("#investigateInput");
    if (input) {
      input.placeholder = PLACEHOLDER[kind] || "Enter indicator…";
      validate();
    }
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-entity]");
    if (!t) return;
    if (t.classList.contains("side-link") || t.classList.contains("etab")) {
      setEntity(t.dataset.entity);
      if (t.classList.contains("side-link")) {
        const target = document.getElementById("investigate");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  function validate() {
    const v = ($("#investigateInput")?.value || "").trim();
    const el = $("#validation"); if (!el) return true;
    if (!v) { el.textContent = ""; el.className = "validation"; return false; }
    const ok = (V[state.entity] || V.username)(v);
    el.textContent = ok ? "✓ Valid " + state.entity : "Invalid " + state.entity + " format";
    el.className = "validation " + (ok ? "ok" : "err");
    return ok;
  }
  document.addEventListener("input", (e) => { if (e.target.id === "investigateInput") validate(); });

  // ----------------------- sidebar -----------------------
  document.addEventListener("click", (e) => {
    if (e.target.closest("#sidebarToggle")) {
      $("#ospSidebar")?.classList.toggle("open");
    } else if (!e.target.closest("#ospSidebar") && !e.target.closest("#sidebarToggle")) {
      $("#ospSidebar")?.classList.remove("open");
    }
  });

  // ----------------------- dashboard boot -----------------------
  function boot() {
    renderRecentChips();
    renderRecentList();
    renderThreatFeed();
    renderMap();
    initCharts();
    setEntity("email");
    if ($("#investigateInput") && !$("#investigateInput").value) {
      $("#investigateInput").value = "torvalds@linux-foundation.org";
      validate();
    }
  }

  function renderRecentChips() {
    const wrap = $("#recentChips"); if (!wrap) return;
    if (!state.recent.length) {
      wrap.innerHTML = `<span class="recent-chip" data-fill="torvalds@linux-foundation.org">torvalds@linux-foundation.org</span><span class="recent-chip" data-fill="cloudflare.com">cloudflare.com</span><span class="recent-chip" data-fill="8.8.8.8">8.8.8.8</span>`;
    } else {
      wrap.innerHTML = state.recent.slice(0, 6).map((r) => `<span class="recent-chip" data-fill="${esc(r.value)}" data-kind="${esc(r.kind)}">${esc(r.value)}</span>`).join("");
    }
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest(".recent-chip"); if (!c) return;
    if (c.dataset.kind) setEntity(c.dataset.kind);
    const inp = $("#investigateInput"); if (inp) { inp.value = c.dataset.fill; validate(); inp.focus(); }
  });

  function renderRecentList() {
    const el = $("#recentList"); if (!el) return;
    const items = state.cases.slice(0, 6);
    if (!items.length) {
      el.innerHTML = `
        <li><span class="li-ico"><i class="bi bi-envelope-at"></i></span><div class="li-main"><div class="li-title">torvalds@linux-foundation.org</div><div class="li-sub">Sample · Email intel · —</div></div><span class="pill pill-muted">Demo</span></li>
        <li><span class="li-ico"><i class="bi bi-globe2"></i></span><div class="li-main"><div class="li-title">cloudflare.com</div><div class="li-sub">Sample · Domain · —</div></div><span class="pill pill-muted">Demo</span></li>
        <li><span class="li-ico"><i class="bi bi-hdd-network"></i></span><div class="li-main"><div class="li-title">8.8.8.8</div><div class="li-sub">Sample · IP · —</div></div><span class="pill pill-muted">Demo</span></li>`;
      return;
    }
    el.innerHTML = items.map((c) => {
      const ic = { email: "bi-envelope-at", domain: "bi-globe2", ip: "bi-hdd-network", username: "bi-at", phone: "bi-telephone", hash: "bi-fingerprint", url: "bi-link-45deg", image: "bi-image" }[c.kind] || "bi-crosshair";
      return `<li data-recase='${esc(JSON.stringify(c))}'><span class="li-ico"><i class="bi ${ic}"></i></span><div class="li-main"><div class="li-title">${esc(c.target)}</div><div class="li-sub">${esc(c.id)} · ${esc(c.kind)} · ${esc(c.time)}</div></div><span class="pill">Risk ${c.risk}</span></li>`;
    }).join("");
  }

  const THREAT_SAMPLES = [
    { sev: "high", msg: "Credential-stuffing spike observed against SaaS logins" },
    { sev: "med", msg: "New phishing kit mirroring corporate MFA prompt" },
    { sev: "low", msg: "Scanner traffic increase from residential ASN" },
    { sev: "med", msg: "Typosquat domain registered for high-value brand" },
    { sev: "high", msg: "Ransomware IoC set updated in threat corpus" },
    { sev: "low", msg: "Benign crawler activity spike across CDN edge" },
    { sev: "med", msg: "DNS tunneling pattern flagged in passive DNS" },
  ];
  function renderThreatFeed() {
    const el = $("#threatFeed"); if (!el) return;
    const pick = () => THREAT_SAMPLES[Math.floor(Math.random() * THREAT_SAMPLES.length)];
    const push = () => {
      const t = pick();
      const li = document.createElement("li");
      li.innerHTML = `<span class="tf-time">${nowStr()}</span><span class="tf-msg">${esc(t.msg)}</span><span class="tf-sev sev-${t.sev}">${t.sev}</span>`;
      el.prepend(li);
      while (el.children.length > 10) el.lastChild.remove();
    };
    for (let i = 0; i < 6; i++) push();
    setInterval(push, 6500);
  }

  function renderMap() {
    const el = $("#mapWrap"); if (!el) return;
    const tones = ["", "warn", "green"];
    for (let i = 0; i < 14; i++) {
      const d = document.createElement("span");
      d.className = "map-ping " + tones[Math.floor(Math.random() * tones.length)];
      d.style.left = (8 + Math.random() * 84) + "%";
      d.style.top = (12 + Math.random() * 76) + "%";
      d.style.animationDelay = (Math.random() * 2) + "s";
      el.appendChild(d);
    }
  }

  function initCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue("--text-dim").trim() || "#9aa7bd";
    Chart.defaults.borderColor = "rgba(148,163,184,.12)";

    const volCtx = $("#volChart");
    if (volCtx) {
      const g = volCtx.getContext("2d").createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, "rgba(34,211,238,.35)"); g.addColorStop(1, "rgba(34,211,238,0)");
      new Chart(volCtx, {
        type: "line",
        data: {
          labels: Array.from({ length: 14 }, (_, i) => "D-" + (13 - i)),
          datasets: [{
            label: "Investigations",
            data: [220,340,290,410,380,520,470,610,540,700,820,760,910,1284],
            borderColor: "#22d3ee", backgroundColor: g, fill: true, tension: .38, borderWidth: 2, pointRadius: 0,
          }],
        },
        options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(148,163,184,.08)" } } } },
      });
    }
    const riskCtx = $("#riskChart");
    if (riskCtx) {
      new Chart(riskCtx, {
        type: "doughnut",
        data: { labels: ["Low", "Medium", "High", "Critical"], datasets: [{ data: [58, 24, 13, 5], backgroundColor: ["#34d399", "#fbbf24", "#f97316", "#f87171"], borderWidth: 0 }] },
        options: { cutout: "68%", plugins: { legend: { position: "bottom" } } },
      });
    }
    const catCtx = $("#catChart");
    if (catCtx) {
      new Chart(catCtx, {
        type: "bar",
        data: { labels: ["Phish", "Malware", "C2", "Scan", "Bot", "Fraud"], datasets: [{ data: [78, 52, 34, 96, 61, 28], backgroundColor: "#22d3ee", borderRadius: 6, borderSkipped: false }] },
        options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } },
      });
    }
    const srcCtx = $("#srcChart");
    if (srcCtx) {
      new Chart(srcCtx, {
        type: "radar",
        data: {
          labels: ["OTX", "Abuse.ch", "CIRCL", "MISP", "Feodo", "GreyNoise"],
          datasets: [{ label: "Freshness", data: [92, 88, 76, 84, 71, 95], borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,.16)", pointBackgroundColor: "#a78bfa" }],
        },
        options: { plugins: { legend: { display: false } }, scales: { r: { grid: { color: "rgba(148,163,184,.16)" }, angleLines: { color: "rgba(148,163,184,.16)" }, pointLabels: { color: "#9aa7bd" }, ticks: { display: false } } } },
      });
    }
  }

  // ----------------------- investigate -----------------------
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "investigateForm") return;
    e.preventDefault();
    runInvestigation();
  });

  async function runInvestigation() {
    if (!validate()) { toast("Invalid input", "Fix the indicator format and retry.", "warn"); return; }
    const value = $("#investigateInput").value.trim();
    const kind = state.entity;
    const caseId = "CASE-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).slice(-3).toUpperCase();

    // reveal results + reset
    const results = $("#results"); results.hidden = false;
    $("#caseKind").textContent = kindLabel(kind);
    $("#targetTitle").textContent = value;
    $("#caseId").textContent = caseId;
    $("#caseTime").textContent = new Date().toLocaleString();
    $("#caseSources").textContent = "0 sources";
    resetViews();
    setScore("riskScore", 0, "warn");
    setScore("confScore", 0, "cyan");
    $("#execSummary").textContent = "Collecting evidence…";
    switchView("identity");
    results.scrollIntoView({ behavior: "smooth", block: "start" });

    const ctx = {
      kind, value, caseId, sources: new Set(), evidence: [], timeline: [],
      risk: 10, confidence: 5,
    };
    tlPush(ctx, `Case ${caseId} opened for ${kind}: ${value}`);

    try {
      if (kind === "email") await pipelineEmail(ctx);
      else if (kind === "domain") await pipelineDomain(ctx);
      else if (kind === "ip") await pipelineIp(ctx);
      else await pipelineGeneric(ctx);
    } catch (err) {
      console.error(err);
      tlPush(ctx, "Pipeline error: " + (err?.message || err));
    }

    finalizeCase(ctx);
  }

  function kindLabel(k) {
    return ({ email: "Email intelligence", domain: "Domain intelligence", ip: "IP intelligence", username: "Username intelligence", phone: "Phone intelligence", hash: "Hash intelligence", url: "URL intelligence", image: "Image intelligence" }[k] || "Intelligence");
  }
  function resetViews() {
    $("#identityAvatarWrap").innerHTML = '<div class="avatar-fallback">?</div>';
    $("#identityName").textContent = "—";
    $("#identitySub").textContent = "No public identity resolved yet";
    $("#identityBadges").innerHTML = "";
    $("#signalGrid").innerHTML = "";
    $("#signalsCount").textContent = "0";
    $("#dnsTable").innerHTML = "";
    $("#dnsCount").textContent = "0";
    $("#authGrid").innerHTML = "";
    $("#whoisGrid").innerHTML = "";
    $("#breachList").innerHTML = "";
    $("#profileGrid").innerHTML = "";
    $("#evidenceList").innerHTML = "";
    $("#evidenceCount").textContent = "0";
    $("#timeline").innerHTML = "";
  }
  function switchView(v) {
    $$(".t2").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    $$(".view").forEach((el) => (el.hidden = el.dataset.view !== v));
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".t2"); if (t) switchView(t.dataset.view);
  });

  function setScore(id, val, tone) {
    const el = document.getElementById(id); if (!el) return;
    el.parentElement.classList.remove("tone-warn","tone-cyan","tone-green","tone-violet");
    el.parentElement.classList.add("tone-" + tone);
    const c = 326.7;
    el.querySelector(".ring-fg").setAttribute("stroke-dashoffset", String(c - c * (Math.max(0, Math.min(100, val)) / 100)));
    el.querySelector(".ring-val").textContent = val + (id === "riskScore" ? "" : "%");
  }

  function tlPush(ctx, msg) {
    const t = nowStr();
    ctx.timeline.push({ t, msg });
    const li = document.createElement("li");
    li.innerHTML = `<span class="tl-time">${t}</span><span class="tl-msg">${esc(msg)}</span>`;
    $("#timeline").appendChild(li);
  }
  function eviPush(ctx, src, msg) {
    ctx.sources.add(src); ctx.evidence.push({ src, msg });
    const el = $("#evidenceList");
    const d = document.createElement("div");
    d.className = "evi";
    d.innerHTML = `<i class="bi bi-check2-square"></i><div>${esc(msg)}</div><span class="e-src">${esc(src)}</span>`;
    el.appendChild(d);
    $("#evidenceCount").textContent = String(ctx.evidence.length);
    $("#caseSources").textContent = ctx.sources.size + " source" + (ctx.sources.size === 1 ? "" : "s");
  }
  function signalPush(label, value, big) {
    const g = $("#signalGrid");
    const d = document.createElement("div");
    d.className = "signal";
    d.innerHTML = `<div class="signal-label">${esc(label)}</div><div class="signal-value ${big ? "mono-lg" : ""}">${value}</div>`;
    g.appendChild(d);
    $("#signalsCount").textContent = String(g.children.length);
  }

  // ---------- DNS helper (Google DoH) ----------
  async function dohQuery(name, type) {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    const r = await fetch(url, { headers: { Accept: "application/dns-json" } });
    if (!r.ok) throw new Error("DoH " + r.status);
    return r.json();
  }

  async function fetchAllDns(domain) {
    const types = ["A", "AAAA", "MX", "NS", "TXT", "CAA"];
    const results = {};
    await Promise.all(types.map(async (t) => {
      try {
        const j = await dohQuery(domain, t);
        results[t] = (j.Answer || []).map((a) => ({ type: t, data: a.data, ttl: a.TTL }));
      } catch { results[t] = []; }
    }));
    return results;
  }
  async function fetchWhois(domain) {
    try {
      const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  function renderDns(records) {
    const el = $("#dnsTable"); el.innerHTML = "";
    const all = Object.values(records).flat();
    $("#dnsCount").textContent = String(all.length);
    if (!all.length) { el.innerHTML = `<div class="dns-row"><span class="dns-val">No records resolved.</span></div>`; return; }
    all.forEach((r) => {
      const row = document.createElement("div");
      row.className = "dns-row";
      row.innerHTML = `<span class="dns-type">${esc(r.type)}</span><span class="dns-val">${esc(r.data)}</span><span class="dns-ttl">TTL ${esc(r.ttl ?? "—")}</span>`;
      el.appendChild(row);
    });
  }

  function analyzeMailAuth(dns) {
    const txt = (dns.TXT || []).map((r) => r.data.replace(/^"|"$/g, ""));
    const mx = dns.MX || [];
    const spf = txt.find((t) => /^v=spf1/i.test(t));
    const dmarc = null; // Requires _dmarc TXT — will fetch separately
    return { spf, dmarc, hasMx: mx.length > 0, mxRecords: mx };
  }

  function detectProvider(dns) {
    const mxData = (dns.MX || []).map((m) => m.data.toLowerCase()).join(" ");
    if (/google|googlemail|aspmx/.test(mxData)) return "Google Workspace";
    if (/outlook|protection\.outlook|office365/.test(mxData)) return "Microsoft 365";
    if (/proofpoint/.test(mxData)) return "Proofpoint";
    if (/mimecast/.test(mxData)) return "Mimecast";
    if (/pphosted/.test(mxData)) return "Proofpoint (pphosted)";
    if (/zoho/.test(mxData)) return "Zoho Mail";
    if (/protonmail|proton/.test(mxData)) return "Proton Mail";
    if (/mailgun|sendgrid|amazonses|mailchimp/.test(mxData)) return "Transactional relay";
    if (mxData) return "Custom / self-hosted";
    return "Unknown";
  }

  function renderAuth(spf, dmarc, mxOk) {
    const el = $("#authGrid"); el.innerHTML = "";
    const cell = (lbl, state, note, icon) => `<div class="auth-cell ${state}"><div class="auth-lbl">${lbl}</div><i class="bi ${icon} auth-icon"></i><div class="auth-note">${esc(note)}</div></div>`;
    el.innerHTML =
      cell("SPF", spf ? "pass" : "fail", spf ? "Published" : "Not found", spf ? "bi-check-circle" : "bi-x-circle") +
      cell("DKIM", "warn", "Selector-based · manual query required", "bi-key") +
      cell("DMARC", dmarc ? "pass" : "warn", dmarc ? "Policy: " + dmarc : "Fetching _dmarc…", dmarc ? "bi-check-circle" : "bi-hourglass-split") +
      "";
    // Add a 4th cell inline via appending wouldn't fit 3-col grid; use signals instead:
    if (!mxOk) {
      const w = document.createElement("div");
      w.className = "auth-cell fail";
      w.innerHTML = `<div class="auth-lbl">MX</div><i class="bi bi-x-circle auth-icon"></i><div class="auth-note">No mail servers</div>`;
      el.appendChild(w);
    }
  }

  function renderWhois(rdap, domain) {
    const el = $("#whoisGrid"); el.innerHTML = "";
    if (!rdap) {
      el.innerHTML = `<div class="whois-cell"><div class="k">Status</div><div class="v">RDAP lookup unavailable for ${esc(domain)}</div></div>`;
      return;
    }
    const evts = rdap.events || [];
    const ev = (a) => evts.find((e) => e.eventAction === a)?.eventDate?.slice(0, 10);
    const registrar = (rdap.entities || []).find((e) => (e.roles || []).includes("registrar"));
    const registrarName = registrar?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3] || rdap.entities?.[0]?.handle || "—";
    const nsList = (rdap.nameservers || []).map((n) => n.ldhName || n.unicodeName).filter(Boolean);
    const cells = [
      ["Registrar", registrarName],
      ["Handle", rdap.handle || "—"],
      ["Registered", ev("registration") || "—"],
      ["Expires", ev("expiration") || "—"],
      ["Last update", ev("last changed") || ev("last update of RDAP database") || "—"],
      ["Nameservers", nsList.slice(0, 4).join(", ") || "—"],
      ["Status", (rdap.status || []).slice(0, 3).join(", ") || "—"],
    ];
    el.innerHTML = cells.map(([k, v]) => `<div class="whois-cell"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("");
  }

  // ---------- PIPELINES ----------
  async function pipelineEmail(ctx) {
    const email = ctx.value.toLowerCase().trim();
    const [local, domain] = email.split("@");

    // 1) normalize + validate
    signalPush("Local-part", esc(local), true);
    signalPush("Domain", `<a href="#" style="color:var(--cyan)">${esc(domain)}</a>`, true);
    signalPush("Normalized", esc(email));
    signalPush("Disposable?", /^(mailinator|guerrillamail|tempmail|10minutemail|yopmail)/i.test(domain) ? "Yes ⚠" : "No");
    tlPush(ctx, `Parsed email · local="${local}" domain="${domain}"`);
    await sleep(150);

    // 2) Gravatar
    const hash = md5(email);
    signalPush("Gravatar hash", `<code>${esc(hash)}</code>`);
    const avatarWrap = $("#identityAvatarWrap");
    avatarWrap.classList.add("loading");
    avatarWrap.innerHTML = "";
    const img = new Image();
    img.alt = "Public avatar for " + email;
    img.onload = () => {
      avatarWrap.classList.remove("loading");
      avatarWrap.innerHTML = "";
      avatarWrap.appendChild(img);
      eviPush(ctx, "gravatar.com", "Public Gravatar avatar retrieved");
      ctx.confidence += 15;
    };
    img.onerror = () => {
      avatarWrap.classList.remove("loading");
      avatarWrap.innerHTML = '<div class="avatar-fallback">' + esc((local[0] || "?").toUpperCase()) + '</div>';
    };
    img.src = `https://www.gravatar.com/avatar/${hash}?s=220&d=404`;

    // Gravatar profile JSON (CORS-friendly)
    try {
      const gr = await fetch(`https://www.gravatar.com/${hash}.json`);
      if (gr.ok) {
        const gj = await gr.json();
        const p = gj.entry?.[0];
        if (p) {
          $("#identityName").textContent = p.displayName || p.name?.formatted || local;
          $("#identitySub").textContent = p.aboutMe || (p.currentLocation ? "Located: " + p.currentLocation : "Public Gravatar profile");
          const badges = $("#identityBadges");
          badges.innerHTML = `<span class="badge-verify"><i class="bi bi-check2-circle"></i> Gravatar verified</span>`;
          eviPush(ctx, "gravatar.com/json", "Gravatar profile metadata retrieved");
          ctx.confidence += 20;
          // Verified accounts
          (p.accounts || []).forEach((a) => addProfile(a.shortname || a.domain || "site", a.url, true));
        }
      }
    } catch {}
    tlPush(ctx, "Gravatar probe complete");

    // 3) Domain enrichment (DNS + WHOIS)
    tlPush(ctx, `Resolving DNS for ${domain} via Google DoH`);
    const dns = await fetchAllDns(domain);
    renderDns(dns);
    eviPush(ctx, "dns.google", `${Object.values(dns).flat().length} DNS records resolved for ${domain}`);
    ctx.confidence += 15;

    // DMARC (_dmarc TXT)
    let dmarcPolicy = null;
    try {
      const d = await dohQuery("_dmarc." + domain, "TXT");
      const rec = (d.Answer || []).map((a) => a.data.replace(/^"|"$/g, "")).find((t) => /^v=DMARC1/i.test(t));
      if (rec) {
        const m = rec.match(/p=(\w+)/i); dmarcPolicy = m ? m[1] : "present";
        eviPush(ctx, "dns.google", `DMARC published · policy=${dmarcPolicy}`);
      }
    } catch {}

    const auth = analyzeMailAuth(dns);
    renderAuth(auth.spf, dmarcPolicy, auth.hasMx);
    signalPush("Mail provider", detectProvider(dns));
    if (auth.spf) eviPush(ctx, "dns.txt", "SPF record present");
    else ctx.risk += 5;
    if (!dmarcPolicy) ctx.risk += 5;
    if (!auth.hasMx) { ctx.risk += 15; tlPush(ctx, "⚠ No MX records — mail delivery unlikely"); }

    tlPush(ctx, `RDAP lookup for ${domain}`);
    const rdap = await fetchWhois(domain);
    renderWhois(rdap, domain);
    if (rdap) { eviPush(ctx, "rdap.org", "Domain WHOIS/RDAP retrieved"); ctx.confidence += 10; }

    // 4) breach panel — cannot query without an authorized key
    renderBreachHeuristics(local, domain);
    ctx.risk += 10; // exposure unknown → cautious
    tlPush(ctx, "Breach lookup skipped — no authorized API key configured");

    // 5) inferred username enumeration (labeled)
    tlPush(ctx, "Running inferred username enumeration on local-part (labeled)");
    inferProfilesFromLocal(local);

    // 6) exec summary
    const summary = [
      `Email routes to ${detectProvider(dns)}.`,
      auth.spf ? "SPF is published." : "No SPF policy detected.",
      dmarcPolicy ? `DMARC policy is ${dmarcPolicy}.` : "DMARC is not published.",
      rdap ? `Domain registered via ${((rdap.entities || []).find((e) => (e.roles || []).includes("registrar"))?.vcardArray?.[1]?.find((v) => v[0] === "fn")?.[3]) || "unknown registrar"}.` : "WHOIS could not be resolved.",
    ].join(" ");
    $("#execSummary").textContent = summary;
  }

  function renderBreachHeuristics(local, domain) {
    const el = $("#breachList");
    // Heuristic placeholders only. Clearly labeled.
    const guesses = [
      { name: "collection-192", meta: "Corpus flagged for " + domain + " (heuristic)", },
      { name: "linkedin-2021", meta: "Common professional network exposure (heuristic)", },
    ];
    el.innerHTML = guesses.map((g) =>
      `<div class="breach-item"><div><div class="b-name">${esc(g.name)}</div><div class="b-meta">${esc(g.meta)}</div></div><span class="pill pill-muted">Unverified</span></div>`
    ).join("");
  }

  const PROFILE_SITES = [
    { key: "github",    name: "GitHub",    icon: "bi-github",     tpl: (u) => `https://github.com/${u}` },
    { key: "twitter",   name: "X / Twitter", icon: "bi-twitter-x", tpl: (u) => `https://x.com/${u}` },
    { key: "reddit",    name: "Reddit",    icon: "bi-reddit",     tpl: (u) => `https://reddit.com/user/${u}` },
    { key: "instagram", name: "Instagram", icon: "bi-instagram",  tpl: (u) => `https://instagram.com/${u}` },
    { key: "linkedin",  name: "LinkedIn",  icon: "bi-linkedin",   tpl: (u) => `https://linkedin.com/in/${u}` },
    { key: "keybase",   name: "Keybase",   icon: "bi-key",        tpl: (u) => `https://keybase.io/${u}` },
    { key: "medium",    name: "Medium",    icon: "bi-medium",     tpl: (u) => `https://medium.com/@${u}` },
    { key: "stackoverflow", name: "Stack Overflow", icon: "bi-stack-overflow", tpl: (u) => `https://stackoverflow.com/users?tab=Reputation&filter=all&search=${u}` },
    { key: "hn",        name: "Hacker News", icon: "bi-newspaper", tpl: (u) => `https://news.ycombinator.com/user?id=${u}` },
    { key: "gitlab",    name: "GitLab",    icon: "bi-git",        tpl: (u) => `https://gitlab.com/${u}` },
  ];
  function inferProfilesFromLocal(local) {
    const u = local.replace(/[^a-z0-9._-]/gi, "");
    if (!u) return;
    PROFILE_SITES.forEach((s) => addProfile(s.name, s.tpl(u), false, s.icon));
  }
  function addProfile(name, url, verified, icon) {
    const g = $("#profileGrid");
    const existing = Array.from(g.children).find((c) => c.dataset.url === url);
    if (existing) {
      if (verified && !existing.dataset.verified) {
        existing.dataset.verified = "1";
        existing.querySelector(".acct-name").innerHTML = esc(name) + ' <span class="badge-verify">Verified</span>';
      }
      return;
    }
    const a = document.createElement("a");
    a.className = "acct-card";
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.dataset.url = url;
    if (verified) a.dataset.verified = "1";
    a.innerHTML = `<span class="acct-icon"><i class="bi ${icon || "bi-globe2"}"></i></span><div class="acct-main"><div class="acct-name">${esc(name)} ${verified ? '<span class="badge-verify">Verified</span>' : '<span class="badge-inferred">Inferred</span>'}</div><div class="acct-url">${esc(url)}</div></div>`;
    g.appendChild(a);
  }

  async function pipelineDomain(ctx) {
    const domain = ctx.value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    signalPush("Domain", esc(domain), true);
    tlPush(ctx, `Resolving DNS for ${domain}`);
    const dns = await fetchAllDns(domain);
    renderDns(dns);
    eviPush(ctx, "dns.google", `${Object.values(dns).flat().length} DNS records resolved`);
    ctx.confidence += 25;

    const auth = analyzeMailAuth(dns);
    let dmarcPolicy = null;
    try {
      const d = await dohQuery("_dmarc." + domain, "TXT");
      const rec = (d.Answer || []).map((a) => a.data.replace(/^"|"$/g, "")).find((t) => /^v=DMARC1/i.test(t));
      if (rec) { const m = rec.match(/p=(\w+)/i); dmarcPolicy = m ? m[1] : "present"; }
    } catch {}
    renderAuth(auth.spf, dmarcPolicy, auth.hasMx);
    signalPush("Mail provider", detectProvider(dns));
    signalPush("Has MX?", auth.hasMx ? "Yes" : "No");
    signalPush("A records", String((dns.A || []).length));
    signalPush("Nameservers", String((dns.NS || []).length));

    const rdap = await fetchWhois(domain);
    renderWhois(rdap, domain);
    if (rdap) { eviPush(ctx, "rdap.org", "Domain WHOIS retrieved"); ctx.confidence += 15; }
    $("#identityName").textContent = domain;
    $("#identitySub").textContent = "Domain infrastructure profile";
    $("#execSummary").textContent = `${domain} resolves ${((dns.A || []).length)} A / ${((dns.AAAA || []).length)} AAAA records. Mail hosted with ${detectProvider(dns)}. ${auth.spf ? "SPF published." : "No SPF."} ${dmarcPolicy ? "DMARC policy: " + dmarcPolicy + "." : "No DMARC."}`;
  }

  async function pipelineIp(ctx) {
    const ip = ctx.value.trim();
    signalPush("IP", esc(ip), true);
    signalPush("Family", ip.includes(":") ? "IPv6" : "IPv4");
    tlPush(ctx, `Reverse DNS lookup via DoH`);
    try {
      const rev = ip.split(".").reverse().join(".") + ".in-addr.arpa";
      const j = await dohQuery(rev, "PTR");
      const ptr = (j.Answer || [])[0]?.data;
      if (ptr) {
        signalPush("PTR", esc(ptr));
        eviPush(ctx, "dns.google", "Reverse DNS resolved to " + ptr);
        ctx.confidence += 30;
        $("#identityName").textContent = ptr;
      } else {
        signalPush("PTR", "No reverse record");
      }
    } catch {}
    $("#execSummary").textContent = `IP ${ip} inspected via passive DNS. Add GreyNoise / IPinfo API keys in Settings for authoritative geolocation and reputation.`;
  }

  async function pipelineGeneric(ctx) {
    signalPush("Target", esc(ctx.value), true);
    signalPush("Type", esc(ctx.kind));
    tlPush(ctx, "Generic enrichment (demo) — connect module API keys for authoritative results");
    if (ctx.kind === "username") inferProfilesFromLocal(ctx.value);
    $("#execSummary").textContent = `Demonstrative enrichment for ${ctx.kind}. Configure authorized APIs in Settings → API keys for real evidence.`;
    ctx.confidence += 5;
  }

  function finalizeCase(ctx) {
    // clamp scores
    ctx.risk = Math.max(5, Math.min(95, ctx.risk));
    ctx.confidence = Math.max(5, Math.min(98, ctx.confidence));
    setScore("riskScore", ctx.risk, ctx.risk > 60 ? "warn" : ctx.risk > 35 ? "warn" : "cyan");
    setScore("confScore", ctx.confidence, "cyan");

    // persist
    const rec = { id: ctx.caseId, kind: ctx.kind, target: ctx.value, risk: ctx.risk, confidence: ctx.confidence, time: new Date().toLocaleString() };
    state.cases.unshift(rec); saveCases();
    state.recent = [{ value: ctx.value, kind: ctx.kind }].concat(state.recent.filter((r) => r.value !== ctx.value)).slice(0, 8);
    saveRecent();
    state.lastCase = { ctx, rec };
    renderRecentChips();
    renderRecentList();
    renderCases();
    tlPush(ctx, `Case ${ctx.caseId} finalized · risk=${ctx.risk} · confidence=${ctx.confidence}%`);
    toast("Investigation complete", `${ctx.caseId} · ${ctx.sources.size} source${ctx.sources.size === 1 ? "" : "s"}`, "ok");
  }

  function renderCases() {
    const el = $("#caseTable"); if (!el) return;
    if (!state.cases.length) return;
    el.innerHTML = state.cases.map((c) => `
      <div class="case-row">
        <div><div class="c-target">${esc(c.target)}</div><div class="c-kind">${esc(c.kind)} · ${esc(c.id)}</div></div>
        <span class="pill">Risk ${c.risk}</span>
        <span class="pill pill-muted">${c.confidence}%</span>
        <span class="c-kind">${esc(c.time)}</span>
        <button class="btn-ghost" style="padding:6px 10px"><i class="bi bi-arrow-up-right"></i></button>
      </div>`).join("");
  }

  // ----------------------- exports -----------------------
  document.addEventListener("click", (e) => {
    if (e.target.closest("#exportJson")) exportJson();
    if (e.target.closest("#exportCsv")) exportCsv();
    if (e.target.closest("#exportPdf")) exportPdf();
  });
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  function currentPayload() {
    if (!state.lastCase) return null;
    const { ctx, rec } = state.lastCase;
    return {
      case: rec,
      signals: $$("#signalGrid .signal").map((s) => ({ label: s.querySelector(".signal-label").textContent, value: s.querySelector(".signal-value").textContent })),
      dns: $$("#dnsTable .dns-row").map((r) => ({ type: r.children[0]?.textContent, data: r.children[1]?.textContent, ttl: r.children[2]?.textContent })),
      whois: $$("#whoisGrid .whois-cell").map((c) => ({ key: c.querySelector(".k").textContent, value: c.querySelector(".v").textContent })),
      profiles: $$("#profileGrid .acct-card").map((a) => ({ name: a.querySelector(".acct-name").textContent.trim(), url: a.dataset.url, verified: !!a.dataset.verified })),
      evidence: ctx.evidence, timeline: ctx.timeline,
      summary: $("#execSummary").textContent,
    };
  }
  function exportJson() { const p = currentPayload(); if (!p) return toast("No case", "Run an investigation first.", "warn"); download(`${p.case.id}.json`, JSON.stringify(p, null, 2), "application/json"); }
  function exportCsv() {
    const p = currentPayload(); if (!p) return toast("No case", "Run an investigation first.", "warn");
    const rows = [["section","key","value"]];
    p.signals.forEach((s) => rows.push(["signal", s.label, s.value]));
    p.dns.forEach((r) => rows.push(["dns", r.type, r.data]));
    p.whois.forEach((w) => rows.push(["whois", w.key, w.value]));
    p.profiles.forEach((pr) => rows.push(["profile", pr.name, pr.url]));
    p.evidence.forEach((e) => rows.push(["evidence", e.src, e.msg]));
    const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    download(`${p.case.id}.csv`, csv, "text/csv");
  }
  function exportPdf() {
    const p = currentPayload(); if (!p) return toast("No case", "Run an investigation first.", "warn");
    if (!window.jspdf) return toast("PDF unavailable", "jsPDF is still loading — try again.", "warn");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    // cover
    doc.setFillColor(11, 17, 32); doc.rect(0, 0, W, 140, "F");
    doc.setTextColor(34, 211, 238); doc.setFontSize(10); doc.text("OS-POINT · CONFIDENTIAL INVESTIGATION REPORT", 40, 46);
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text(p.case.target, 40, 80);
    doc.setFontSize(11); doc.setTextColor(200, 210, 230);
    doc.text(`${p.case.id}  ·  ${p.case.kind.toUpperCase()}  ·  ${p.case.time}`, 40, 104);
    doc.text(`Risk ${p.case.risk}   Confidence ${p.case.confidence}%`, 40, 122);

    let y = 170;
    const section = (title) => { doc.setFontSize(13); doc.setTextColor(20, 30, 60); doc.text(title, 40, y); y += 14; doc.setDrawColor(220); doc.line(40, y, W - 40, y); y += 12; doc.setFontSize(10); doc.setTextColor(40); };
    const line = (t) => { if (y > 780) { doc.addPage(); y = 60; } doc.text(t, 40, y, { maxWidth: W - 80 }); y += 14; };

    section("Executive summary"); line(p.summary || "—");
    section("Signals"); p.signals.forEach((s) => line(`• ${s.label}: ${s.value}`));
    section("DNS records"); p.dns.forEach((r) => line(`• ${r.type}  ${r.data}  (${r.ttl})`));
    section("WHOIS / RDAP"); p.whois.forEach((w) => line(`• ${w.key}: ${w.value}`));
    section("Public profiles"); p.profiles.forEach((pr) => line(`• ${pr.name} ${pr.verified ? "[verified]" : "[inferred]"}  ${pr.url}`));
    section("Evidence"); p.evidence.forEach((e) => line(`• [${e.src}] ${e.msg}`));
    section("Timeline"); p.timeline.forEach((t) => line(`• ${t.t}  ${t.msg}`));

    doc.save(`${p.case.id}.pdf`);
    toast("Report exported", `${p.case.id}.pdf`, "ok");
  }

  // ----------------------- command palette -----------------------
  const CMDS = [
    { i: "bi-envelope-at", label: "Investigate email…", sub: "E", act: () => { setEntity("email"); focusInv(); } },
    { i: "bi-globe2", label: "Investigate domain…", sub: "D", act: () => { setEntity("domain"); focusInv(); } },
    { i: "bi-hdd-network", label: "Investigate IP…", sub: "I", act: () => { setEntity("ip"); focusInv(); } },
    { i: "bi-at", label: "Investigate username…", act: () => { setEntity("username"); focusInv(); } },
    { i: "bi-file-earmark-pdf", label: "Export current report as PDF", act: exportPdf },
    { i: "bi-filetype-json", label: "Export current report as JSON", act: exportJson },
    { i: "bi-moon-stars", label: "Toggle theme", act: () => $("#themeToggle")?.click() },
    { i: "bi-grid-1x2", label: "Go to Dashboard", act: () => location.hash = "#dashboard" },
    { i: "bi-folder2-open", label: "Go to Cases", act: () => location.hash = "#cases" },
    { i: "bi-sliders", label: "Go to Settings", act: () => location.hash = "#settings" },
  ];
  function focusInv() { const el = $("#investigateInput"); if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } }
  function openCmdk() {
    $("#cmdkBackdrop").hidden = false; $("#cmdkInput").value = ""; renderCmdk(""); setTimeout(() => $("#cmdkInput")?.focus(), 20);
  }
  function closeCmdk() { $("#cmdkBackdrop").hidden = true; }
  function renderCmdk(q) {
    const list = $("#cmdkList");
    const filtered = CMDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = `<div class="cmdk-heading">Actions</div>` + filtered.map((c, i) => `<div class="cmdk-item${i === 0 ? " selected" : ""}" data-idx="${i}"><i class="bi ${c.i}"></i><span>${esc(c.label)}</span>${c.sub ? `<span class="cmdk-sub">${esc(c.sub)}</span>` : ""}</div>`).join("");
    list.dataset.filtered = JSON.stringify(filtered.map((c) => CMDS.indexOf(c)));
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#openCmdPalette")) return openCmdk();
    if (e.target.closest("#cmdkBackdrop") && !e.target.closest(".cmdk")) return closeCmdk();
    const item = e.target.closest(".cmdk-item");
    if (item) {
      const idxs = JSON.parse($("#cmdkList").dataset.filtered || "[]");
      const cmd = CMDS[idxs[+item.dataset.idx]]; closeCmdk(); cmd?.act();
    }
  });
  document.addEventListener("input", (e) => { if (e.target.id === "cmdkInput") renderCmdk(e.target.value); });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmdk(); }
    else if (e.key === "Escape" && !$("#cmdkBackdrop").hidden) closeCmdk();
    else if (e.key === "/" && document.activeElement === document.body) { e.preventDefault(); focusInv(); }
    else if (e.key === "Enter" && !$("#cmdkBackdrop").hidden) {
      const sel = $(".cmdk-item.selected"); if (sel) sel.click();
    }
  });

  // ----------------------- boot -----------------------
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
