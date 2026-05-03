import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc, serverTimestamp, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/exam")({
  component: Exam,
  head: () => ({
    meta: [
      { title: "Entrance Exam - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Take the JCI UNIBEN entrance examination for membership recruitment." },
    ],
  }),
});

type Question = {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  category?: string;
};

const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const EXAM_SECONDS = 10 * 60; // 10 minutes

function Exam() {
  const nav = useNavigate();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "questions"), orderBy("question"));
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setQuestions(fetched);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // shuffled questions, with shuffled options for multiple choice
  const shuffled = useMemo<(Question & { shuffledOptions?: string[] })[]>(() => {
    return shuffle(questions).map((q) => {
      if (q.type === "multiple_choice" && q.options) {
        const shuffledOptions = shuffle(q.options);
        return { ...q, shuffledOptions };
      }
      return q;
    });
  }, [questions]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ score: number; total: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);

  useEffect(() => {
    const id = sessionStorage.getItem("jci_candidate_id");
    const name = sessionStorage.getItem("jci_candidate_name") || "";
    if (!id) {
      toast.error("Please register first.");
      nav({ to: "/register" });
      return;
    }
    setCandidateId(id);
    setCandidateName(name);
  }, [nav]);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const handleSubmit = async (auto = false) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    let score = 0;
    shuffled.forEach((q) => {
      const userAnswer = answers[q.id]?.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      if (userAnswer === correctAnswer) score++;
    });
    try {
      if (candidateId) {
        await updateDoc(doc(db, "candidates", candidateId), {
          examTaken: true,
          score,
          totalQuestions: shuffled.length,
          submittedAt: serverTimestamp(),
          status: "completed",
        });
      }
      setSubmitted({ score, total: shuffled.length });
      if (auto) toast.message("Time up — exam auto-submitted.");
      else toast.success("Exam submitted.");
    } catch (e: any) {
      toast.error(e?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!candidateId || loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-32"><Spinner /></div>
      </PageShell>
    );
  }

  if (submitted) {
    const pct = Math.round((submitted.score / submitted.total) * 100);
    return (
      <PageShell>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="p-10 rounded-2xl border border-gold/30 bg-card/60 backdrop-blur-md">
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Exam Complete</div>
            <h1 className="text-4xl font-bold mt-3">Thank you, {candidateName.split(" ")[0]}!</h1>
            <div className="my-10">
              <div className="text-6xl font-bold text-cyan">{pct}%</div>
              <div className="text-muted-foreground mt-2">
                {submitted.score} / {submitted.total} correct
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Results have been saved. The JCI UNIBEN exec team will contact you about next steps.
            </p>
            <Link
              to="/"
              className="mt-8 inline-block px-6 py-3 rounded-md bg-cyan text-navy font-semibold"
            >
              Return Home
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const q = shuffled[idx];
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.keys(answers).length;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Entrance Exam</div>
            <div className="text-sm text-muted-foreground">{candidateName}</div>
          </div>
          <div className={`px-4 py-2 rounded-md border ${secondsLeft < 60 ? "border-destructive text-destructive animate-pulse" : "border-cyan/40 text-cyan"} font-mono text-lg`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>

        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-cyan transition-all"
            style={{ width: `${((idx + 1) / shuffled.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md">
          <div className="text-xs text-muted-foreground mb-2">
            Question {idx + 1} of {shuffled.length}
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-6">{q.question}</h2>
          
          {q.type === "multiple_choice" && q.shuffledOptions && (
            <div className="space-y-3">
              {q.shuffledOptions.map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={`w-full text-left p-4 rounded-md border transition-all ${
                      selected
                        ? "border-cyan bg-cyan/10 text-foreground"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "true_false" && (
            <div className="grid grid-cols-2 gap-4">
              {["True", "False"].map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={`p-6 rounded-md border transition-all text-lg font-semibold ${
                      selected
                        ? "border-cyan bg-cyan/10 text-foreground"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "fill_blank" && (
            <div>
              <input
                type="text"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Type your answer here"
                className="w-full bg-background/60 border border-white/10 rounded-md px-4 py-3 focus:outline-none focus:border-cyan"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              disabled={idx === 0}
              onClick={() => setIdx((i) => i - 1)}
              className="px-5 py-2 rounded-md border border-white/10 disabled:opacity-30"
            >
              ← Previous
            </button>
            <div className="text-xs text-muted-foreground">
              {answeredCount}/{shuffled.length} answered
            </div>
            {idx < shuffled.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="px-5 py-2 rounded-md bg-cyan text-navy font-semibold"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-5 py-2 rounded-md bg-gold text-navy font-semibold flex items-center gap-2"
              >
                {submitting && <Spinner className="w-4 h-4 border-navy" />}
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
