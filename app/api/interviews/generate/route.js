import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies as getCookies } from "next/headers";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/* ───────── helper: call Gemini via OpenRouter ───────── */
async function callGemini(prompt) {
  if (!OPENROUTER_API_KEY) return [];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "AI-Recruiter",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro-preview-03-25",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() || "";

  try { return JSON.parse(raw); }
  catch { return []; }
}

async function generateViaGemini({ job, description, types, numQuestions }) {
  const prompt = `
You are an expert recruiter creating interview questions for a ${job} role.

Job description:
${description}

Focus on: ${types.join(", ")}
Generate ${numQuestions} insightful questions.
Return ONLY a JSON array of strings.
  `.trim();

  let qs = await callGemini(prompt);
  if (qs.length === 0) qs = fallbackQuestions(job, types, numQuestions);
  return qs;
}

function fallbackQuestions(job, types, n) {
  const base = [
    `What interests you about the ${job} role?`,
    `Describe a challenging ${job}-related project you worked on.`,
    `How do you keep your ${job} skills current?`,
  ];
  return base.slice(0, n);
}

/* ───────── route handler ───────── */
export async function POST(req) {
  try {
    const body = await req.json();
    const job          = body.job || body.jobTitle;
    const description  = body.description || body.jobDescription;
    const duration     = body.duration     ?? 30;
    const types        = body.types        ?? ["technical"];
    const numQuestions = body.numQuestions ?? 8;

    const questions = await generateViaGemini({ job, description, types, numQuestions });

    const cookieStore = await getCookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    await supabase
      .from("interviews")
      .insert({ job, description, duration, types, questions })
      .throwOnError();

    const { data } = await supabase
      .from("interviews")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ interviewId: data.id, questions });
  } catch (err) {
    console.error("🔴 generate route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
