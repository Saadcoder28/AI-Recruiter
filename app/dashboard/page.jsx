"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  console.log("Rendering dashboard home page");
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      <p className="text-gray-600">
        👋 Welcome! Choose "Create New Interview" or explore the menu.
      </p>
    </section>
  );
} 