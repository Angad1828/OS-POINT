import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { THEME_INIT_SCRIPT } from "../lib/theme";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="standalone">
      <div className="panel" style={{ maxWidth: 460, width: "100%" }}>
        <div className="panel-body">
          <div className="eyebrow">404</div>
          <h1 className="page-title" style={{ fontSize: 26 }}>
            This page does not exist
          </h1>
          <p className="page-sub">
            The route is not part of the investigation workspace. Return to the workspace to
            continue.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <Link to="/" className="btn btn-primary">
              Go to workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="standalone">
      <div className="panel" style={{ maxWidth: 480, width: "100%" }}>
        <div className="panel-body">
          <div className="eyebrow">Unexpected error</div>
          <h1 className="page-title" style={{ fontSize: 26 }}>
            This view failed to load
          </h1>
          <p className="page-sub">
            The interface hit an error. Existing cases remain in this browser; you can retry or
            return to the workspace.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void router.invalidate();
                reset();
              }}
            >
              Try again
            </button>
            <a href="/" className="btn">
              Go to workspace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OS-POINT — Investigation workspace" },
      {
        name: "description",
        content:
          "OS-POINT is an evidence-first digital investigation workspace for authorized OSINT: email and domain checks with source attribution, explicit limitations and reproducible cases.",
      },
      { name: "theme-color", content: "#0e1013" },
      { name: "color-scheme", content: "dark light" },
      { property: "og:title", content: "OS-POINT — Investigation workspace" },
      {
        property: "og:description",
        content:
          "Collect attributable email and domain evidence, record failures honestly, and export reproducible investigation cases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
