import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, addDoc, updateDoc, getDoc, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    meta: [
      { title: "Admin Dashboard - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Administrator dashboard for managing JCI UNIBEN recruitment candidates and exam results." },
    ],
  }),
});

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  matricNumber: string;
  faculty: string;
  department: string;
  level: string;
  motivation: string;
  status: string;
  examTaken: boolean;
  score: number | null;
  totalQuestions?: number;
  candidateId?: string;
  createdAt?: any;
};

type Question = {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  category?: string;
};

type Settings = {
  isActive: boolean;
  timeLimitMinutes: number;
};

function Admin() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"candidates" | "questions">("candidates");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<Settings>({ isActive: false, timeLimitMinutes: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [selected, setSelected] = useState<Candidate | null>(null);
  
  // Question form state
  const [questionForm, setQuestionForm] = useState({
    type: "multiple_choice" as "multiple_choice" | "true_false" | "fill_blank",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    category: "",
  });
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [user, authLoading, nav]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "candidates"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCandidates(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (err) => {
        toast.error(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Fetch questions
    const q = query(collection(db, "questions"), orderBy("question"));
    const unsubQuestions = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    // Fetch settings
    const unsubSettings = onSnapshot(doc(db, "settings", "exam"), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as Settings);
      }
    });
    return () => {
      unsubQuestions();
      unsubSettings();
    };
  }, [user]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (filter === "completed" && !c.examTaken) return false;
      if (filter === "pending" && c.examTaken) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.fullName?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.matricNumber?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [candidates, search, filter]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter((c) => c.examTaken).length;
    const avg =
      completed > 0
        ? Math.round(
            (candidates
              .filter((c) => c.examTaken && c.score != null)
              .reduce((acc, c) => acc + (c.score || 0), 0) /
              completed) *
              10
          ) / 10
        : 0;
    return { total, completed, pending: total - completed, avg };
  }, [candidates]);

  const exportCsv = () => {
    const headers = ["Name", "Email", "Phone", "Matric", "Faculty", "Department", "Level", "Score", "Total", "Status"];
    const rows = candidates.map((c) =>
      [c.fullName, c.email, c.phone, c.matricNumber, c.faculty, c.department, c.level, c.score ?? "", c.totalQuestions ?? "", c.status]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jci-uniben-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeCandidate = async (id: string) => {
    if (!confirm("Delete this candidate? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "candidates", id));
      toast.success("Candidate deleted");
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const approveCandidate = async (candidate: Candidate) => {
    if (!confirm(`Approve ${candidate.fullName}? This will generate a Candidate ID.`)) return;
    try {
      // Count total documents in candidates collection
      const snap = await getDocs(collection(db, "candidates"));
      const count = snap.size;
      // Generate Candidate ID: JCI-2025-XXXX (padded count)
      const year = new Date().getFullYear();
      const candidateId = `JCI-${year}-${String(count + 1).padStart(4, "0")}`.trim().toUpperCase();
      
      // Update candidate with ID and approved status
      await updateDoc(doc(db, "candidates", candidate.id), {
        candidateId,
        status: "approved",
      });
      
      toast.success(`Candidate approved! ID: ${candidateId}`);
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const questionData: any = {
        type: questionForm.type,
        question: questionForm.question,
        correctAnswer: questionForm.correctAnswer,
        category: questionForm.category,
      };

      if (questionForm.type === "multiple_choice") {
        questionData.options = [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD];
      }

      if (editingQuestion) {
        await updateDoc(doc(db, "questions", editingQuestion.id), questionData);
        toast.success("Question updated");
        setEditingQuestion(null);
      } else {
        await addDoc(collection(db, "questions"), questionData);
        toast.success("Question added");
      }
      setQuestionForm({
        type: "multiple_choice",
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        category: "",
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteDoc(doc(db, "questions", id));
      toast.success("Question deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const editQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({
      type: q.type,
      question: q.question,
      optionA: q.options?.[0] || "",
      optionB: q.options?.[1] || "",
      optionC: q.options?.[2] || "",
      optionD: q.options?.[3] || "",
      correctAnswer: q.correctAnswer,
      category: q.category || "",
    });
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "exam"), settings);
      toast.success("Settings saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (authLoading || !user) {
    return (
      <PageShell>
        <div className="flex justify-center py-32"><Spinner /></div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Exec Dashboard</div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Panel</h1>
            <div className="text-sm text-muted-foreground mt-1">Signed in as {user.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => setTab("candidates")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              tab === "candidates" ? "bg-cyan text-navy" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Candidates
          </button>
          <button
            onClick={() => setTab("questions")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              tab === "questions" ? "bg-cyan text-navy" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Exam Manager
          </button>
        </div>

        {tab === "candidates" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div className="flex-1">
                <input
                  placeholder="Search name, email, matric..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                />
              </div>
              <div className="flex gap-1 p-1 rounded-md border border-white/10 bg-card/40">
                {(["all", "completed", "pending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-sm capitalize ${
                      filter === f ? "bg-cyan text-navy font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCsv}
                className="px-5 py-2 rounded-md border border-gold/40 text-gold hover:bg-gold/10"
              >
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Candidates", value: stats.total, color: "text-cyan" },
                { label: "Exam Completed", value: stats.completed, color: "text-gold" },
                { label: "Pending", value: stats.pending, color: "text-foreground" },
                { label: "Avg. Score", value: stats.avg, color: "text-cyan" },
              ].map((s) => (
                <div key={s.label} className="p-5 rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16"><Spinner /></div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="mx-auto w-32 h-32 opacity-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-gold">
                      <pattern id="afpat" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                      </pattern>
                      <rect width="100" height="100" fill="url(#afpat)" />
                    </svg>
                  </div>
                  <div className="mt-4 text-muted-foreground">No candidates yet.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left p-4">Full Name</th>
                        <th className="text-left p-4">Matric No</th>
                        <th className="text-left p-4">Department</th>
                        <th className="text-left p-4">Level</th>
                        <th className="text-left p-4">Phone</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Candidate ID</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                          <td className="p-4 font-medium">{c.fullName}</td>
                          <td className="p-4">{c.matricNumber}</td>
                          <td className="p-4 text-muted-foreground">{c.department}</td>
                          <td className="p-4 text-muted-foreground">{c.level}</td>
                          <td className="p-4 text-muted-foreground">{c.phone}</td>
                          <td className="p-4 text-muted-foreground">{c.email}</td>
                          <td className="p-4">
                            {c.status === "approved" ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-cyan/20 text-cyan">Approved</span>
                            ) : c.status === "pending" ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-gold/20 text-gold">Pending</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-muted-foreground">{c.status}</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-xs">{c.candidateId || "—"}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelected(c)}
                              className="text-cyan hover:underline text-sm"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "questions" && (
          <>
            {/* Exam Settings */}
            <div className="p-6 rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm mb-8">
              <h2 className="text-xl font-bold mb-4">Exam Settings</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.timeLimitMinutes}
                    onChange={(e) => setSettings({ ...settings, timeLimitMinutes: parseInt(e.target.value) || 10 })}
                    className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.isActive}
                      onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-background/60"
                    />
                    <span className="text-sm">Exam Active</span>
                  </label>
                </div>
              </div>
              <button
                onClick={saveSettings}
                className="mt-4 px-4 py-2 rounded-md bg-cyan text-navy font-semibold"
              >
                Save Settings
              </button>
            </div>

            {/* Add/Edit Question Form */}
            <div className="p-6 rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm mb-8">
              <h2 className="text-xl font-bold mb-4">{editingQuestion ? "Edit Question" : "Add Question"}</h2>
              <form onSubmit={saveQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Question Type
                  </label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as any })}
                    className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True or False</option>
                    <option value="fill_blank">Fill in the Blank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Question
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    placeholder={questionForm.type === "fill_blank" ? "Use ___ for the blank (e.g., The capital of Nigeria is ___)" : ""}
                    className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Category (optional)
                  </label>
                  <input
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                    className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                  />
                </div>
                
                {questionForm.type === "multiple_choice" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Option A
                      </label>
                      <input
                        required
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                        className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Option B
                      </label>
                      <input
                        required
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                        className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Option C
                      </label>
                      <input
                        required
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                        className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Option D
                      </label>
                      <input
                        required
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                        className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Correct Answer
                  </label>
                  {questionForm.type === "multiple_choice" ? (
                    <select
                      required
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                    >
                      <option value="">Select correct option</option>
                      <option value={questionForm.optionA}>Option A</option>
                      <option value={questionForm.optionB}>Option B</option>
                      <option value={questionForm.optionC}>Option C</option>
                      <option value={questionForm.optionD}>Option D</option>
                    </select>
                  ) : questionForm.type === "true_false" ? (
                    <select
                      required
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                    >
                      <option value="">Select answer</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      placeholder="Enter the exact answer"
                      className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
                    />
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-cyan text-navy font-semibold"
                  >
                    {editingQuestion ? "Update Question" : "Add Question"}
                  </button>
                  {editingQuestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(null);
                        setQuestionForm({
                          type: "multiple_choice",
                          question: "",
                          optionA: "",
                          optionB: "",
                          optionC: "",
                          optionD: "",
                          correctAnswer: "",
                          category: "",
                        });
                      }}
                      className="px-4 py-2 rounded-md border border-white/10"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Questions List */}
            <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
              </div>
              {questions.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">No questions yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {questions.map((q) => (
                    <div key={q.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{q.question}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {q.type === "multiple_choice" && q.options && (
                            q.options.map((opt, i) => (
                              <span key={i} className={opt === q.correctAnswer ? "text-cyan font-medium" : ""}>
                                {opt === q.correctAnswer ? "✓ " : ""}{["A", "B", "C", "D"][i]}. {opt}
                              </span>
                            ))
                          )}
                          {q.type === "true_false" && (
                            <span className="text-cyan font-medium">Correct: {q.correctAnswer}</span>
                          )}
                          {q.type === "fill_blank" && (
                            <span className="text-cyan font-medium">Answer: {q.correctAnswer}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Type: {q.type.replace("_", " ")}
                          {q.category && <> • Category: {q.category}</>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editQuestion(q)}
                          className="px-3 py-1 rounded border border-white/10 text-sm hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="px-3 py-1 rounded border border-destructive/40 text-destructive text-sm hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-w-lg w-full rounded-2xl border border-white/10 bg-card p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold">{selected.fullName}</h3>
                <div className="text-sm text-muted-foreground">{selected.email}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["Phone", selected.phone],
                ["Matric", selected.matricNumber],
                ["Faculty", selected.faculty],
                ["Department", selected.department],
                ["Level", selected.level],
                ["Status", selected.status],
                ["Candidate ID", selected.candidateId || "Not assigned"],
                ["Score", selected.score != null ? `${selected.score}/${selected.totalQuestions}` : "Not taken"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-white/5 pb-1">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v as any}</dd>
                </div>
              ))}
              <div>
                <dt className="text-muted-foreground mb-1">Motivation</dt>
                <dd className="text-foreground bg-white/5 p-3 rounded">{selected.motivation}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-3">
              {selected.status === "pending" && (
                <button
                  onClick={() => approveCandidate(selected)}
                  className="px-4 py-2 rounded-md bg-gold text-navy font-semibold"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => removeCandidate(selected.id)}
                className="px-4 py-2 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-md bg-cyan text-navy font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
}
