import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, JCIShield } from "@/components/PageShell";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Home - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Join JCI UNIBEN - Register, verify and take your membership exam to become an active citizen." },
    ],
  }),
});

function Landing() {
  return (
    <PageShell>
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/40 text-gold text-xs uppercase tracking-[0.2em] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Applications Open
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Become an{" "}
              <span className="text-cyan">Active Citizen</span>
              <br />
              of <span className="text-gold">JCI UNIBEN</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Join a global movement of young leaders driving impact across
              business, community, and international cooperation. Register, take
              the entrance exam, and earn your place.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/exam-entry"
                className="px-7 py-3 rounded-md bg-cyan text-navy font-semibold hover:shadow-[0_0_30px_rgba(0,194,203,0.4)] transition-all"
              >
                Take Exam
              </Link>
              <Link
                to="/register"
                className="px-7 py-3 rounded-md border border-gold/50 text-gold hover:bg-gold/10 transition-all"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="px-7 py-3 rounded-md border border-cyan/50 text-cyan hover:bg-cyan/10 transition-all"
              >
                Admin Login
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { n: "10K+", l: "Members" },
                { n: "120+", l: "Countries" },
                { n: "1944", l: "Founded" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-cyan">{s.n}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/20 via-transparent to-gold/20 blur-3xl" />
            <JCIShield className="relative w-72 md:w-96 text-gold drop-shadow-[0_0_40px_rgba(201,168,76,0.4)]" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-center mb-12">
          The <span className="text-cyan">Recruitment Journey</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Register", body: "Submit your application with academic and personal details." },
            { step: "02", title: "Take the Exam", body: "Sit a timed JCI knowledge & aptitude test. Questions shuffle per candidate." },
            { step: "03", title: "Get Inducted", body: "Top scorers are invited to the induction ceremony." },
          ].map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm hover:border-cyan/40 transition-colors"
            >
              <div className="text-gold text-sm font-mono">{s.step}</div>
              <div className="mt-2 text-xl font-semibold">{s.title}</div>
              <div className="mt-3 text-sm text-muted-foreground">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 py-10 text-center text-xs text-muted-foreground border-t border-white/10 mt-10">
        © {new Date().getFullYear()} JCI UNIBEN. Service to humanity is the best work of life.
      </footer>
    </PageShell>
  );
}
