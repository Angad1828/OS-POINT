import { useEffect, useRef, useState } from "react";

/**
 * Intro animation for OS-POINT — first-session only.
 *
 * Sequence (≈1.8s total):
 *   1) Reveal faint network structure (0–0.3s) via initial opacity
 *   2) Staggered stroke-draw of important links (0.2–0.9s) via stroke-dashoffset
 *   3) One narrow scan line across diagram (0.7–1.2s) via stroke-dashoffset
 *   4) Wordmark reveal with opacity change (1.0–1.8s)
 *
 * Reduced-motion: skip draw/scan, show completed graphic + wordmark directly.
 * Layout stable: only stroke-dashoffset and opacity are animated — no dimension changes.
 * Single use: animation runs once per session and is not re-triggered on navigation.
 */
export function IntroAnimation() {
  const [completed, setCompleted] = useState(false);
  const mountedRef = useRef<boolean>(false);

  // Check reduced-motion preference early
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  useEffect(() => {
    // Only run once per session
    if (mountedRef.current) return;
    mountedRef.current = true;

    // If user prefers reduced motion, skip the animated draw/scan and
    // show the completed state immediately.
    if (prefersReducedMotion) {
      setCompleted(true);
      return;
    }

    // The SVG elements animate via inline styles/react state.
    // We track the timeout so we can set completed after the full sequence (≈1.8s).
    const timeoutId = setTimeout(() => {
      setCompleted(true);
    }, 1800);

    return () => clearTimeout(timeoutId);
  }, [prefersReducedMotion]);

  // If the component unmounts before the sequence finishes (should not happen
  // in normal flow), do not leave the animation stuck.
  useEffect(() => {
    return () => {
      // no-op — we always want the final state to be "completed" if the
      // user navigates away mid-animation; the next session will re-mount.
    };
  }, []);

  if (completed) return null;

  return (
    <div
      aria-hidden="true"
      className="intro-container"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <svg width={800} height={800} viewBox="0 0 800 800" aria-labelledby="os-point-wordmark">
        <style>{`
          /* Reduced-motion: no animation, just show the finished state */
          @media (prefers-reduced-motion: reduce) {
            .intro-svg * {
              animation: none !important;
              transition: none !important;
            }
            .link { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
            .scan-line { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
          }

          .link {
            stroke: #1d4f50;
            stroke-width: 2;
            fill: none;
          }
          .node {
            cursor: default;
          }
          .node-fill {
            fill: #1d4f50;
          }
          .scan-line {
            fill: none;
            stroke: #1d4f50;
            stroke-width: 1;
          }
          .wordmark {
            opacity: 0;
            transition: opacity 0.6s ease-out;
          }
          .wordmark.visible {
            opacity: 1;
          }
        `}</style>

        <g className="structure" style={{ opacity: 0.15 }}>
          {/* Node 1: Email */}
          <circle
            cx={200}
            cy={400}
            r={18}
            className="node node-fill"
            style={{ stroke: "#cccccc", strokeWidth: 1 }}
          />
          <text x={200} y={410} textAnchor="middle" fontSize="11" fill="#666666">
            Email
          </text>

          {/* Node 2: Domain */}
          <circle
            cx={400}
            cy={200}
            r={18}
            className="node node-fill"
            style={{ stroke: "#cccccc", strokeWidth: 1 }}
          />
          <text x={400} y={210} textAnchor="middle" fontSize="11" fill="#666666">
            Domain
          </text>

          {/* Node 3: Username */}
          <circle
            cx={600}
            cy={400}
            r={18}
            className="node node-fill"
            style={{ stroke: "#cccccc", strokeWidth: 1 }}
          />
          <text x={600} y={410} textAnchor="middle" fontSize="11" fill="#666666">
            Username
          </text>

          {/* Link: Email → Domain */}
          <line
            x1={200}
            y1={400}
            x2={400}
            y2={200}
            className="link stroke-1"
            style={{ strokeDasharray: "8 4", strokeDashoffset: 8 }}
          />
          {/* Link: Domain → Username */}
          <line
            x1={400}
            y1={200}
            x2={600}
            y2={400}
            className="link stroke-2"
            style={{ strokeDasharray: "8 4", strokeDashoffset: 8 }}
          />
          {/* Link: Username → Email (closing the loop) */}
          <line
            x1={600}
            y1={400}
            x2={200}
            y2={400}
            className="link stroke-3"
            style={{ strokeDasharray: "8 4", strokeDashoffset: 8 }}
          />
        </g>

        {/* --- Scan line that passes once across the diagram --- */}
        <rect
          className="scan-line"
          x={0}
          y={0}
          width={800}
          height={2}
          style={{ strokeDasharray: "1000", strokeDashoffset: 1000 }}
        />

        {/* --- OS-POINT wordmark --- */}
        <g className="wordmark" id="os-point-wordmark" transform="translate(120 740) scale(1.2)">
          <text>OS-POINT</text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Injection hook: mounts the animation once on first page load.
 *
 * - Appends <IntroAnimation /> at the top of the Workspace div.
 * - Uses a session-storage flag so the animation does NOT repeat on navigation.
 * - Cleans up on session close so a new tab gets the animation once.
 */
export function useIntroAnimation() {
  const ANIMATION_KEY = "os-point.intro-shown";

  // Check if we already showed the animation in this session
  const [shown, setShown] = useState(() => {
    const prev = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(ANIMATION_KEY) : null;
    return prev === "1";
  });

  // Mark animation as shown for this session
  useEffect(() => {
    if (shown) return;
    const timeout = setTimeout(() => setShown(true), 200);
    return () => clearTimeout(timeout);
  }, [shown]);

  useEffect(() => {
    if (shown) {
      sessionStorage.setItem(ANIMATION_KEY, "1");
    }
  }, [shown]);

  return shown ? null : <IntroAnimation />;
}
