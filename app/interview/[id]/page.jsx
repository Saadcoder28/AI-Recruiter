"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Vapi from "@vapi-ai/web";

/* ─── keys & IDs read from environment ─────────────────────────────────── */
const vapi         = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
/* ──────────────────────────────────────────────────────────────────────── */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function CandidatePage() {
  const { id }      = useParams();
  const supabase    = createClientComponentClient();

  /* ─ state ─ */
  const [interview, setInterview] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  /* UI state */
  const [step, setStep] = useState("join"); // join | call | done
  const [name, setName] = useState("");
  const [timer, setTimer] = useState(0);

  /* feedback */
  const [rating,   setRating]   = useState(0);
  const [comments, setComments] = useState("");
  const [sent,     setSent]     = useState(false);

  const timerRef = useRef(null);
  const qRef     = useRef(0);

  /* ─ fetch interview row ─ */
  useEffect(() => {
    supabase
      .from("interviews")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) { setError(error.message); setLoading(false); return; }

        /* normalise questions → simple string[] */
        let qs = data.questions;
        if (Array.isArray(qs)) {
          qs = qs.map((it) =>
            typeof it === "object" && it !== null ? it.question : it
          );
        } else if (typeof qs === "string") {
          try { qs = JSON.parse(qs); } catch {}
          if (!Array.isArray(qs))
            qs = qs.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        }

        setInterview({ ...data, questions: qs });
        setLoading(false);
      });
  }, [id, supabase]);

  /* timer helpers */
  const startTimer = () => {
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };
  const stopTimer  = () => clearInterval(timerRef.current);

  /* ─ start Vapi call ─ */
  async function startCall() {
    if (!name.trim()) return;

    const onCallStart = async () => {
      vapi.off("call-start", onCallStart);
      await wait(200);
      await vapi.setMuted(false);
      vapi.say(`Hello ${name}. Let's begin. ${interview.questions[0]}`);
      qRef.current = 0;
      setStep("call");
      startTimer();
    };

    vapi.on("call-start", onCallStart);

    try {
      await vapi.start(ASSISTANT_ID);
    } catch (e) {
      vapi.off("call-start", onCallStart);
      setError(e?.message || "Could not start interview");
    }
  }

  /* Vapi events */
  useEffect(() => {
    const onMessage = (msg) => {
      if (
        msg.type === "transcript" &&
        msg.transcript?.role === "user" &&
        msg.transcript?.isFinal &&
        step === "call"
      ) {
        qRef.current += 1;
        if (qRef.current < interview.questions.length) {
          vapi.say(interview.questions[qRef.current]);
        } else {
          vapi.say("Thank you for your time. Goodbye!", true);
        }
      }
    };

    vapi.on("message",  onMessage);
    vapi.on("call-end", () => { stopTimer(); setStep("done"); });
    vapi.on("error",    (e) => { console.error("[vapi]", e); setError(e.message); });

    return () => vapi.off("message", onMessage);
  }, [step, interview]);

  /* clock */
  const Clock = () => {
    const m = String(Math.floor(timer / 60)).padStart(2, "0");
    const s = String(timer % 60).padStart(2, "0");
    return <span className="text-xl font-mono">⏰ {m}:{s}</span>;
  };

  /* feedback submit */
  async function submitFeedback() {
    await fetch(`/api/interviews/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comments }),
    });
    setSent(true);
  }

  /* guards */
  if (loading) return <p className="p-8">Loading…</p>;
  if (error)   return <p className="p-8 text-red-600">{error}</p>;

  /* JOIN screen */
  if (step === "join") {
    return (
      <div className="max-w-md mx-auto p-8 space-y-6 shadow rounded-lg bg-white">
        <h1 className="text-2xl font-bold text-center">AIcruiter</h1>
        <div className="w-64 h-40 mx-auto grid place-items-center text-6xl">🎤</div>

        <label className="block text-sm font-medium">Your full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg"
        />

        <button
          onClick={startCall}
          className="w-full py-2 bg-sky-600 text-white rounded-lg"
        >
          Join Interview
        </button>
      </div>
    );
  }

  /* CALL screen */
  if (step === "call") {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-bold">AI Interview Session</h1>

        <div className="flex gap-8">
          <div className="flex-1 bg-gray-50 rounded-lg grid place-items-center p-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-sky-100 grid place-items-center text-3xl mx-auto mb-2">🤖</div>
              <p>AI Recruiter</p>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg grid place-items-center p-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-sky-600 text-white grid place-items-center text-3xl mx-auto mb-2">
                {name.charAt(0).toUpperCase()}
              </div>
              <p>{name}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end"><Clock /></div>

        <button
          onClick={() => { vapi.stop(); setStep("done"); }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          End Interview
        </button>
      </div>
    );
  }

  /* DONE + feedback */
  return (
    <div className="p-8 space-y-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold">Interview complete 🎉</h1>

      {sent ? (
        <p>Thank you for your feedback, {name}!</p>
      ) : (
        <>
          <p>Please rate your experience.</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1,2,3,4,5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-3xl ${s <= rating ? "text-amber-400" : "text-gray-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional comments…"
            className="w-full border rounded-lg p-2 h-24"
          />
          <button
            disabled={rating === 0}
            onClick={submitFeedback}
            className="w-full py-2 bg-sky-600 text-white rounded-lg disabled:opacity-50 mt-2"
          >
            Submit feedback
          </button>
        </>
      )}
    </div>
  );
}
