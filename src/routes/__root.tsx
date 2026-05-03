import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-cyan px-4 py-2 text-sm font-medium text-navy hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Official JCI Nigeria UNIBEN Chapter recruitment and examination portal. Register, verify and take your membership exam." },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "JCI UNIBEN Recruitment Portal" },
      { property: "og:description", content: "Official JCI Nigeria UNIBEN Chapter recruitment and examination portal. Register, verify and take your membership exam." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/607fcdce-d65f-4e0b-a338-8a494529e82f/id-preview-a0d6e8c0--7a6aa4e0-4bd8-491a-bb7b-bd1c8bb9949b.lovable.app-1777771642403.png" },
      { name: "twitter:title", content: "JCI UNIBEN Recruitment Portal" },
      { name: "twitter:description", content: "Official JCI Nigeria UNIBEN Chapter recruitment and examination portal. Register, verify and take your membership exam." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/607fcdce-d65f-4e0b-a338-8a494529e82f/id-preview-a0d6e8c0--7a6aa4e0-4bd8-491a-bb7b-bd1c8bb9949b.lovable.app-1777771642403.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
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
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
