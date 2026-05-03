import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { query, collection, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

export const Route = createFileRoute("/exam-entry")({
  component: ExamEntry,
  head: () => ({
    meta: [
      { title: "Exam Entry - JCI UNIBEN Recruitment Portal" },
      { name: "description", content: "Enter your credentials to access the JCI UNIBEN entrance examination." },
    ],
  }),
});

function ExamEntry() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [matricNumber, setMatricNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Normalize inputs
      const normalizedCandidateId = candidateId.trim().toUpperCase();
      const normalizedMatricNumber = matricNumber.trim().toLowerCase();

      // Query candidates collection matching both candidateId and matricNumber
      const q = query(
        collection(db, "candidates"),
        where("candidateId", "==", normalizedCandidateId),
        where("matricNumber", "==", normalizedMatricNumber)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("Candidate not found. Check your ID and matric number.");
        setLoading(false);
        return;
      }

      const candidate = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };

      // Check if candidate is approved
      if (candidate.status !== "approved") {
        toast.error("Your registration is not yet approved. Contact a JCI exec.");
        setLoading(false);
        return;
      }

      // Check if exam is active via settings
      const settingsDoc = await getDoc(doc(db, "settings", "exam"));
      if (!settingsDoc.exists() || settingsDoc.data().isActive !== true) {
        toast.error("Exam is not currently active.");
        setLoading(false);
        return;
      }

      // Check if already taken exam
      if (candidate.examTaken) {
        toast.error("You have already taken the exam.");
        setLoading(false);
        return;
      }

      // Success - proceed to exam
      sessionStorage.setItem("jci_candidate_id", candidate.id);
      sessionStorage.setItem("jci_candidate_name", candidate.fullName || "");
      toast.success("Access granted. Starting exam...");
      nav({ to: "/exam" });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to verify candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Exam Portal Entry</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter your Candidate ID and Matric Number to access the exam.
          </p>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Your Candidate ID was provided by a JCI exec after your registration was approved
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md space-y-5"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Candidate ID
            </label>
            <input
              required
              type="text"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              placeholder="e.g., JCI-2025-0042"
              className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Matric Number
            </label>
            <input
              required
              type="text"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              placeholder="e.g., 19/1234"
              className="w-full bg-background/60 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-cyan"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-md bg-cyan text-navy font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner className="w-4 h-4 border-navy" />}
            Access Exam
          </button>
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
