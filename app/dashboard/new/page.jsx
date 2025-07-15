"use client";

/*
  ────────────────────────────────────────────────────────
  CREATE‑INTERVIEW FORM (Client Component)
  --------------------------------------------------------
  Fields
    • Job Position (input)
    • Job Description (textarea)
    • Interview Duration (select)
    • Interview Type (multi‑select pills)
    • Generate Questions (submits form)

  On submit it POSTs to /api/interviews/generate (placeholder)
  and navigates to /dashboard/interviews/{id} when done.
──────────────────────────────────────────────────────────*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiArrowNarrowLeft } from "react-icons/hi";
import clsx from "clsx";

export default function CreateInterviewPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [duration, setDuration] = useState(30); // Default 30 minutes
  const [interviewTypes, setInterviewTypes] = useState(["technical"]); // Default to technical
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Toggle interview type selection
  const toggleInterviewType = (type) => {
    if (interviewTypes.includes(type)) {
      setInterviewTypes(interviewTypes.filter(t => t !== type));
    } else {
      setInterviewTypes([...interviewTypes, type]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/interviews/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          numQuestions: parseInt(numQuestions),
          duration: parseInt(duration),
          types: interviewTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate interview questions");
      }

      const data = await response.json();
      console.log("Generated questions:", data);
      
      // Show success and redirect to the interview detail page
      alert("Interview questions generated successfully!");
      router.push(`/dashboard/interviews/${data.interviewId}`);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top Nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sky-600 hover:text-sky-500 mb-6"
      >
        <HiArrowNarrowLeft /> Back
      </button>

      <h1 className="text-2xl font-bold mb-8">Create New Interview</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g. Frontend Developer"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg h-40"
            placeholder="Paste the job description here..."
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              min="1"
              max="15"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interview Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interview Type
          </label>
          <div className="flex flex-wrap gap-2">
            {["technical", "behavioral", "cultural", "problem-solving"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleInterviewType(type)}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  interviewTypes.includes(type)
                    ? "bg-sky-100 text-sky-800 border-sky-200 border"
                    : "bg-gray-100 text-gray-700 border-gray-200 border hover:bg-gray-200"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || interviewTypes.length === 0}
          className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Interview Questions"}
        </button>
      </form>
    </div>
  );
}
