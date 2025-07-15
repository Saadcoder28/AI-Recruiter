"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function InterviewDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  /* fetch one row */
  useEffect(() => {
    supabase
      .from("interviews")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          let qs = data.questions;
          if (typeof qs === "string") {
            try { qs = JSON.parse(qs); }
            catch { qs = qs.split(/\r?\n/).map(l => l.trim()).filter(Boolean); }
          }
          setInterview({ ...data, questions: qs });
        }
        setLoading(false);
      });
  }, [id, supabase]);

  if (loading) return <p className="p-8">Loading…</p>;
  if (error)   return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">{interview.job}</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Job Description</h2>
        <p className="whitespace-pre-line">{interview.description}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Generated Questions ({interview.questions.length})
        </h2>
        <ol className="list-decimal pl-6 space-y-2">
          {interview.questions.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </section>

      <button
        onClick={() => router.push(`/dashboard/interviews/${id}/link`)}
        className="px-4 py-2 bg-sky-600 text-white rounded-lg"
      >
        Get interview link →
      </button>

      <button
        onClick={() => router.push("/dashboard")}
        className="ml-4 px-4 py-2 bg-gray-200 rounded-lg"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}