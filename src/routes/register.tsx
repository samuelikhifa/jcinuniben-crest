import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({
    meta: [
      { title: "Register - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Register as a candidate for JCI UNIBEN membership recruitment." },
    ],
  }),
});

function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    matricNumber: "",
    faculty: "",
    department: "",
    level: "",
    motivation: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // check duplicate email/matric
      const q1 = query(collection(db, "candidates"), where("email", "==", form.email.toLowerCase()));
      const snap = await getDocs(q1);
      if (!snap.empty) {
        toast.error("A candidate with this email already exists.");
        setLoading(false);
        return;
      }
      const docRef = await addDoc(collection(db, "candidates"), {
        ...form,
        email: form.email.toLowerCase(),
        matricNumber: form.matricNumber.trim().toLowerCase(),
        status: "pending",
        examTaken: false,
        score: null,
        createdAt: serverTimestamp(),
      });
      toast.success("Registration successful! Please wait for exec approval before taking the exam.");
      // Clear form
      setForm({
        fullName: "",
        email: "",
        phone: "",
        matricNumber: "",
        faculty: "",
        department: "",
        level: "",
        motivation: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; type?: string; full?: boolean; textarea?: boolean }[] = [
    { key: "fullName", label: "Full Name", full: true },
    { key: "email", label: "Email Address", type: "email" },
    { key: "phone", label: "Phone Number" },
    { key: "matricNumber", label: "Matriculation Number" },
    { key: "level", label: "Level (e.g., 200)" },
    { key: "faculty", label: "Faculty" },
    { key: "department", label: "Department" },
    { key: "motivation", label: "Why do you want to join JCI UNIBEN?", full: true, textarea: true },
  ];

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Step 1 of 2</div>
          <h1 className="text-4xl font-bold mt-2">Candidate Registration</h1>
          <p className="text-muted-foreground mt-2">
            Fill the form. You'll proceed to the entrance exam after submission.
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="grid md:grid-cols-2 gap-5 p-6 md:p-8 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md"
        >
          {fields.map((f) => (
            <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {f.label}
              </label>
              {f.textarea ? (
                <textarea
                  required
                  rows={4}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan transition-colors"
                />
              ) : (
                <input
                  required
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan transition-colors"
                />
              )}
            </div>
          ))}
          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-cyan">
              ← Back
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-md bg-cyan text-navy font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Spinner className="w-4 h-4 border-navy" />}
              Submit & Start Exam
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
