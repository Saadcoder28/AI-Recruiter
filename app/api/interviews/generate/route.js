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
  const raw = data.choices?.[0]?.message?.content?.trim() || "";

  try {
    return JSON.parse(raw);
  } catch {
    // Handle non-JSON responses (markdown, numbered lists, etc.)
    const lines = raw
      .split(/\r?\n/)
      .map(l => l.replace(/^\d+[\.\)]?\s*/, "").trim())
      .filter(Boolean);
    return lines.length ? lines : [];
  }
}

async function generateViaGemini({ job, description, types, numQuestions }) {
  const prompt = `
You are an expert recruiter creating interview questions for a ${job} role.

Job description:
${description}

Focus on: ${types.join(", ")}
Generate exactly ${numQuestions} insightful questions.
Return ONLY a JSON array of strings, like: ["Question 1?", "Question 2?", ...]
  `.trim();

  let qs = await callGemini(prompt);
  if (qs.length === 0 || qs.length < numQuestions) {
    qs = fallbackQuestions(job, types, numQuestions);
  }
  return qs.slice(0, numQuestions);
}

function fallbackQuestions(job, types, n) {
  const base = [
    `What interests you about the ${job} role?`,
    `Describe a challenging ${job}-related project you worked on.`,
    `How do you keep your ${job} skills current?`,
    `Tell me about a time you solved a difficult problem in ${job}.`,
    `What would you do differently in your last ${job} project?`,
    `Which technologies are you most comfortable using for ${job} tasks?`,
    `How do you approach learning new skills in the ${job} domain?`,
    `Can you walk me through your favorite ${job}-related project?`,
    `What's the most innovative solution you've implemented as a ${job}?`,
    `How do you handle tight deadlines in ${job} work?`,
    `Describe your experience with ${types.join(" and ")} in ${job} context.`,
    `What's your approach to collaborating with team members in ${job} projects?`
  ];
  
  // Generate more questions if needed
  while (base.length < n) {
    base.push(`Tell me about your experience with ${job} responsibilities.`);
  }
  
  return base.slice(0, n);
}

/* ───────── route handler ───────── */
export async function POST(req) {
  try {
    const body = await req.json();
    const job = body.job || body.jobTitle;
    const description = body.description || body.jobDescription;
    const duration = body.duration ?? 30;
    const types = body.types ?? ["technical"];
    const numQuestions = body.numQuestions ?? 8;

    console.log(`Generating ${numQuestions} questions for ${job} role`);

    const questions = await generateViaGemini({
      job,
      description,
      types,
      numQuestions,
    });

    console.log(`Generated ${questions.length} questions:`, questions);

    const cookieStore = await getCookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert([
        {
          user_id: user.id,  // ADD THIS LINE - Associate with current user
          job,
          description,
          duration,
          types,
          questions,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }

    console.log(`Interview created with ID: ${data.id}`);

    return NextResponse.json({ interviewId: data.id, questions });
  } catch (err) {
    console.error("🔴 generate route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}