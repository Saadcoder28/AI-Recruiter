"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { HiArrowNarrowLeft, HiClipboardCopy, HiCheck } from "react-icons/hi";

export default function InterviewLinkPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Generate the interview link
  const interviewLink = `${process.env.NEXT_PUBLIC_SITE_URL}/interview/${id}`;
  
  useEffect(() => {
    async function fetchInterview() {
      try {
        const { data, error } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) {
          setError(error.message);
        } else {
          setInterview(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInterview();
  }, [id, supabase]);
  
  // Handle copy with native clipboard API
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      alert("Unable to copy. Please copy manually.");
    }
  };
  
  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!interview) return <p className="p-8">Interview not found</p>;
  
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <button 
        onClick={() => router.push(`/dashboard/interviews/${id}`)}
        className="flex items-center text-sky-600 hover:text-sky-800"
      >
        <HiArrowNarrowLeft className="mr-2" /> Back to Interview
      </button>
      
      <h1 className="text-3xl font-bold">Share Interview Link</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Interview Details</h2>
          <p><span className="font-medium">Position:</span> {interview.job}</p>
          <p><span className="font-medium">Duration:</span> {interview.duration} minutes</p>
          <p><span className="font-medium">Types:</span> {interview.types.join(", ")}</p>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Share with Candidate</h2>
          <p className="mb-4">Send this link to the candidate to start the AI interview:</p>
          
          <div className="flex items-center">
            <input
              type="text"
              value={interviewLink}
              readOnly
              className="flex-grow p-3 border rounded-l-lg bg-gray-50"
            />
            <button 
              onClick={handleCopy}
              className="bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-r-lg flex items-center"
            >
              {copied ? (
                <>
                  <HiCheck className="mr-2" /> Copied
                </>
              ) : (
                <>
                  <HiClipboardCopy className="mr-2" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions for Candidates</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The candidate should open the link in a modern browser (Chrome recommended)</li>
            <li>They will need to allow microphone and camera access</li>
            <li>The AI interviewer will guide them through the process</li>
            <li>The interview will last approximately {interview.duration} minutes</li>
            <li>You'll receive a summary of the interview once completed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
