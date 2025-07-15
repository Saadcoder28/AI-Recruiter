"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AllInterviewsPage() {
  const supabase = createClientComponentClient();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("interviews")
      /* ← NO spaces inside the select list */
      .select("id,job,created_at,rating,scheduled_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data);
      });
  }, [supabase]);

  if (error)  return <p className="p-8 text-red-600">{error}</p>;
  if (!rows)  return <p className="p-8">Loading…</p>;
  if (rows.length === 0) return <p className="p-8">No interviews yet.</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">All Interviews</h1>

      <table className="w-full text-left border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2">Job</th>
            <th className="p-2">Created</th>
            <th className="p-2">Rating</th>
            <th className="p-2">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.job}</td>
              <td className="p-2">
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td className="p-2">{r.rating ?? "—"}</td>
              <td className="p-2">
                <Link
                  href={`/dashboard/interviews/${r.id}`}
                  className="text-sky-600 underline"
                >
                  open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
