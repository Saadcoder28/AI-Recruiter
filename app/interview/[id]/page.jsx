"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Vapi from "@vapi-ai/web";

/* ─── keys & IDs read from environment ─────────────────────────────────── */
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
/* ──────────────────────────────────────────────────────────────────────── */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function CandidatePage() {
  const { id } = useParams();
  const supabase = createClientComponentClient();

  /* ─ state ─ */
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* UI state */
  const [step, setStep] = useState("join"); // join | call | done
  const [name, setName] = useState("");
  const [timer, setTimer] = useState(0);
  const [isStartingCall, setIsStartingCall] = useState(false); // NEW: Prevent double clicks

  /* feedback */
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [sent, setSent] = useState(false);

  const timerRef = useRef(null);
  const qRef = useRef(0);
  const callStarted = useRef(false); // NEW: Track call state

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
            typeof it === "object" && it !== null ? it.question || it.text || String(it) : String(it)
          );
        } else if (typeof qs === "string") {
          try { qs = JSON.parse(qs); } catch {}
          if (!Array.isArray(qs))
            qs = qs.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        }

        console.log("Interview loaded with", qs.length, "questions");
        setInterview({ ...data, questions: qs });
        setLoading(false);
      });
  }, [id, supabase]);

  /* timer helpers */
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /* ─ start Vapi call - FIXED VERSION ─ */
  async function startCall() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    // PREVENT DOUBLE CLICKS
    if (isStartingCall || callStarted.current) {
      console.log("Call already starting or started");
      return;
    }

    if (!interview?.questions?.length) {
      setError("No questions available for this interview");
      return;
    }

    setIsStartingCall(true);
    setError("");
    console.log("Starting call...");

    const onCallStart = async () => {
      console.log("Call started event received");
      vapi.off("call-start", onCallStart);
      callStarted.current = true;
      
      try {
        await wait(500); // Give connection time to stabilize
        await vapi.setMuted(false);
        
        const firstQuestion = interview.questions[0];
        console.log("Asking first question:", firstQuestion);
        vapi.say(`Hello ${name}. Let's begin the interview. ${firstQuestion}`);
        
        qRef.current = 0;
        setStep("call");
        startTimer();
        setIsStartingCall(false);
      } catch (err) {
        console.error("Error in call start handler:", err);
        setError("Failed to start interview properly");
        setIsStartingCall(false);
      }
    };

    const onCallError = (e) => {
      console.error("Call error:", e);
      setError(e?.message || "Voice call failed");
      setIsStartingCall(false);
      callStarted.current = false;
      vapi.off("call-start", onCallStart);
      vapi.off("error", onCallError);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("error", onCallError);

    try {
      await vapi.start(ASSISTANT_ID);
    } catch (e) {
      console.error("Failed to start call:", e);
      vapi.off("call-start", onCallStart);
      vapi.off("error", onCallError);
      setError(e?.message || "Could not start interview");
      setIsStartingCall(false);
      callStarted.current = false;
    }
  }

  /* Vapi events */
  useEffect(() => {
    const onMessage = (msg) => {
      console.log("Vapi message:", msg.type);
      
      if (
        msg.type === "transcript" &&
        msg.transcript?.role === "user" &&
        msg.transcript?.isFinal &&
        step === "call" &&
        interview?.questions
      ) {
        console.log(`User finished speaking. Current question: ${qRef.current + 1}/${interview.questions.length}`);
        
        qRef.current += 1;
        
        if (qRef.current < interview.questions.length) {
          const nextQuestion = interview.questions[qRef.current];
          console.log("Asking next question:", nextQuestion);
          vapi.say(nextQuestion);
        } else {
          console.log("All questions completed");
          vapi.say("Thank you for your time. That completes our interview. Goodbye!", true);
        }
      }
    };

    const onCallEnd = () => {
      console.log("Call ended");
      stopTimer();
      setStep("done");
      callStarted.current = false; // RESET CALL STATE
      setIsStartingCall(false);
    };

    const onError = (e) => {
      console.error("[vapi error]", e);
      setError(e.message || "Voice call error occurred");
      setIsStartingCall(false);
      callStarted.current = false;
    };

    vapi.on("message", onMessage);
    vapi.on("call-end", onCallEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("message", onMessage);
      vapi.off("call-end", onCallEnd);
      vapi.off("error", onError);
    };
  }, [step, interview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (callStarted.current) {
        vapi.stop();
      }
    };
  }, []);

  /* clock */
  const Clock = () => {
    const m = String(Math.floor(timer / 60)).padStart(2, "0");
    const s = String(timer % 60).padStart(2, "0");
    return <span className="text-xl font-mono">⏰ {m}:{s}</span>;
  };

  /* feedback submit */
  async function submitFeedback() {
    try {
      await fetch(`/api/interviews/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comments, candidate_name: name }),
      });
      setSent(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError("Failed to submit feedback");
    }
  }

  /* guards */
  if (loading) return <p className="p-8">Loading interview...</p>;
  if (error && !interview) return <p className="p-8 text-red-600">{error}</p>;

  /* JOIN screen */
  if (step === "join") {
    return (
      <div className="max-w-md mx-auto p-8 space-y-6 shadow rounded-lg bg-white">
        <h1 className="text-2xl font-bold text-center">AIcruiter</h1>
        <div className="w-64 h-40 mx-auto grid place-items-center text-6xl">🎤</div>

        {interview && (
          <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Position:</strong> {interview.job}</p>
            <p><strong>Questions:</strong> {interview.questions?.length || 0}</p>
            <p><strong>Duration:</strong> ~{interview.duration || 30} minutes</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Your full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg"
            placeholder="Enter your full name"
            disabled={isStartingCall}
          />
        </div>

        <button
          onClick={startCall}
          disabled={!name.trim() || isStartingCall || !interview?.questions?.length}
          className="w-full py-3 bg-sky-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isStartingCall ? "Starting interview..." : "Join Interview"}
        </button>

        {!interview?.questions?.length && (
          <p className="text-sm text-red-600 text-center">
            This interview has no questions available.
          </p>
        )}
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

        <div className="text-center bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">
            Question {qRef.current + 1} of {interview?.questions?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Speak your answer and wait for the next question
          </p>
        </div>

        <div className="flex justify-end"><Clock /></div>

        <button
          onClick={() => {
            vapi.stop();
            setStep("done");
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          End Interview
        </button>
      </div>
    );
  }

  /* DONE + feedback */
  return (
    <div className="p-8 space-y-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold">Interview Complete! 🎉</h1>
      <p className="text-gray-600">You answered {qRef.current} questions in {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</p>

      {sent ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800">Thank you for your feedback, {name}!</p>
        </div>
      ) : (
        <>
          <p>Please rate your interview experience:</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-3xl transition-colors ${s <= rating ? "text-amber-400" : "text-gray-300 hover:text-amber-200"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Optional feedback about your interview experience..."
            className="w-full border rounded-lg p-3 h-24 resize-none"
          />
          <button
            disabled={rating === 0}
            onClick={submitFeedback}
            className="w-full py-3 bg-sky-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Submit Feedback
          </button>
        </>
      )}
    </div>
  );
}