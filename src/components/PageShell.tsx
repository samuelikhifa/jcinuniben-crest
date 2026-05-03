import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function JCIShield({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 5 L95 25 L95 70 Q95 100 50 115 Q5 100 5 70 L5 25 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <text
        x="50"
        y="65"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="serif"
      >
        JCI
      </text>
      <text x="50" y="85" textAnchor="middle" fontSize="9" fill="currentColor">
        UNIBEN
      </text>
    </svg>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Watermark */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.05] z-0">
        <JCIShield className="w-[80vmin] h-[80vmin] text-gold" />
      </div>
      {/* Pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-gold) 0 1px, transparent 1px 24px), repeating-linear-gradient(-45deg, var(--color-cyan) 0 1px, transparent 1px 24px)",
        }}
      />
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-navy/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <JCIShield className="w-8 h-10 text-gold" />
            <div>
              <div className="text-sm font-bold tracking-wide text-white">
                JCI UNIBEN
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-cyan">
                Recruitment Portal
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-cyan transition-colors">Home</Link>
            <Link to="/register" className="hover:text-cyan transition-colors">Apply</Link>
            {user ? (
              <>
                <Link to="/admin" className="hover:text-cyan transition-colors">Admin</Link>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1 rounded border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 rounded border border-cyan/40 text-cyan hover:bg-cyan/10 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
