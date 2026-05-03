import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Exec Login - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Executive login for JCI UNIBEN recruitment portal administrators." },
    ],
  }),
});

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, pw);
        toast.success("Welcome back, exec.");
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
        toast.success("Account created.");
      }
      nav({ to: "/admin" });
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        toast.error("Wrong email or password.");
      } else if (code === "auth/wrong-password") {
        toast.error("Wrong password.");
      } else if (code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (code === "auth/network-request-failed") {
        toast.error("Network error. Please check your connection.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(err?.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Exec Portal</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Restricted to JCI UNIBEN executives.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="p-8 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md space-y-5"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Password
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-md bg-cyan text-navy font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner className="w-4 h-4 border-navy" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "First exec setup?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-cyan hover:underline"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Create exec account" : "Sign in"}
            </button>
          </div>
          <div className="text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-cyan">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
