import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { toggleTheme } from "@/lib/theme";

interface NavItem {
  to: string;
  label: string;
  note?: string;
}

const WORKSPACE_NAV: NavItem[] = [{ to: "/", label: "Workspace" }];

const INTELLIGENCE_NAV: NavItem[] = [
  { to: "/email", label: "Email", note: "Live" },
  { to: "/domain", label: "Domain", note: "Live" },
  { to: "/username", label: "Username", note: "Live" },
];

const ALL_NAV = [...WORKSPACE_NAV, ...INTELLIGENCE_NAV];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/" || pathname.startsWith("/cases");
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="rail-group">
      <div className="rail-label">{label}</div>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="nav-link"
          aria-current={isActive(pathname, item.to) ? "page" : undefined}
        >
          <span>{item.label}</span>
          {item.note ? <span className="nav-note">{item.note}</span> : null}
        </Link>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="btn btn-quiet btn-icon"
      aria-label="Switch colour theme"
      title="Switch colour theme"
      onClick={() => toggleTheme()}
    >
      <Sun size={16} className="theme-icon theme-icon--sun" aria-hidden="true" />
      <Moon size={16} className="theme-icon theme-icon--moon" aria-hidden="true" />
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isMobile = useMediaQuery("(max-width: 900px)");
  const [open, setOpen] = useState(false);
  const section = ALL_NAV.find((item) => isActive(pathname, item.to))?.label ?? "Workspace";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const drawerHidden = isMobile && !open;

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="menu-btn"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={17} aria-hidden="true" />
          </button>
          <Link to="/" className="brand" aria-label="OS-POINT workspace">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-text">
              <span className="brand-name">OS-POINT</span>
              <span className="brand-sub">Investigation console</span>
            </span>
          </Link>
          <span className="topbar-context" aria-hidden="true">
            {section}
          </span>
        </div>

        <div className="topbar-right">
          <ThemeToggle />
        </div>
      </header>

      <div className="shell">
        {open && isMobile ? (
          <button
            type="button"
            className="scrim"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <aside
          id="primary-navigation"
          className={`rail${open ? " is-open" : ""}`}
          aria-label="Primary navigation"
          inert={drawerHidden}
        >
          <button
            type="button"
            className="btn btn-quiet btn-icon rail-close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={16} aria-hidden="true" />
          </button>

          <nav>
            <NavGroup label="Workspace" items={WORKSPACE_NAV} pathname={pathname} />
            <div className="rail-gap" />
            <NavGroup label="Intelligence" items={INTELLIGENCE_NAV} pathname={pathname} />
          </nav>

          <div className="rail-foot">
            <dl>
              <dt>Sources</dt>
              <dd>Google Public DNS · RDAP · Gravatar · GitHub</dd>
              <dt>Storage</dt>
              <dd>Cases stay in this browser</dd>
            </dl>
            <p>
              No breach, exposure or AI services are queried. Username discovery covers GitHub only.
            </p>
          </div>
        </aside>

        <main id="main" className="main">
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  );
}
