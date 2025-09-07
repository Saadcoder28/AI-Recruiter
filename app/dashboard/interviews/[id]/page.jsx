"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function InterviewDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  /* fetch one row with user verification */
  useEffect(() => {
    async function fetchInterviewWithAuth() {
      try {
        // Get current user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session?.user) {
          setError("Please sign in to view this interview");
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Fetch interview for this specific user only
        const { data, error } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id) // ONLY SHOW USER'S OWN INTERVIEWS
          .single();

        if (error) {
          setError("Interview not found or you don't have access to it");
          setLoading(false);
          return;
        }

        let qs = data.questions;
        if (typeof qs === "string") {
          try { qs = JSON.parse(qs); }
          catch { qs = qs.split(/\r?\n/).map(l => l.trim()).filter(Boolean); }
        }
        
        setInterview({ ...data, questions: qs });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching interview:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    if (id) {
      fetchInterviewWithAuth();
    }
  }, [id, supabase]);

  if (loading) return <p className="p-8">Loading…</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">{interview.job}</h1>
        {user && (
          <span className="text-sm text-gray-500">Created by: {user.email}</span>
        )}
      </div>

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

      <div className="flex gap-4">
        <button
          onClick={() => {
            const interviewLink = `${window.location.origin}/interview/${id}`;
            navigator.clipboard.writeText(interviewLink);
            alert("Interview link copied to clipboard!");
          }}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
        >
          Copy Interview Link
        </button>

        <button
          onClick={() => router.push(`/interview/${id}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Test Interview
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}