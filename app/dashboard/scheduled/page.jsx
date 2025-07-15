"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ScheduledInterviewsPage() {
  const supabase = createClientComponentClient();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("interviews")
      /* ← NO spaces inside the select list */
      .select("id,job,scheduled_at")
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data);
      });
  }, [supabase]);

  if (error)  return <p className="p-8 text-red-600">{error}</p>;
  if (!rows)  return <p className="p-8">Loading…</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Scheduled Interviews</h1>

      {rows.length === 0 ? (
        <p>No upcoming interviews.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="border p-4 rounded-lg">
              <p className="font-semibold">{r.job}</p>
              <p className="text-sm text-gray-600">
                {new Date(r.scheduled_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
