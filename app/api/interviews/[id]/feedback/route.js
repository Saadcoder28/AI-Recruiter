import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req, { params }) {
  const { id } = params;          // interview id
  const { rating, comments } = await req.json();

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase
    .from("interview_feedback")
    .insert({ interview_id: id, rating, comments });

  // store quick numeric rating in parent table
  if (!error && rating) {
    await supabase
      .from("interviews")
      .update({ rating })
      .eq("id", id);
  }

  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ ok: true });
}
