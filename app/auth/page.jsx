'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * Landing page for the AI‑Recruiter app.
 * ▸ Full‑screen gradient hero
 * ▸ Google OAuth sign‑in via Supabase
 * ▸ Tailwind CSS + Framer Motion animations
 */
export default function HomePage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  useEffect(() => {
    async function getUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error);
          return;
        }
        
        if (data.user) {
          setUser(data.user);
          // Redirect to dashboard if user is already logged in
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
      }
    }
    
    getUser();
  }, [supabase, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          // Try to sign up if login fails
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
          });
          
          if (signUpError) {
            setError(signUpError.message);
          } else {
            setError('Check your email to confirm your account');
          }
        } else {
          setError(error.message);
        }
      } else {
        // Successful login
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user is signed in, show a welcome message
  if (user) {
    return (
      <main className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-sky-900 to-slate-900 text-white overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 backdrop-blur-lg/30">
          <h1 className="text-2xl font-extrabold tracking-wide">
            AI<span className="text-sky-400">Recruiter</span>
          </h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 transition-all shadow-lg"
          >
            Sign Out
          </button>
        </header>

        <section className="flex-1 grid place-items-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl"
          >
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
              Welcome, <span className="text-sky-400">{user.email || 'User'}</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-slate-300">
              You're now signed in to AI-Recruiter. Your AI-powered interview dashboard is coming soon!
            </p>
          </motion.div>
        </section>

        <footer className="px-6 py-4 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} AI Recruiter. Built with Next.js, Supabase &amp; Vapi.
        </footer>
      </main>
    );
  }

  // Otherwise show the landing page
  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-sky-900 to-slate-900 text-white overflow-hidden">
      {/* ───────────────────────── HEADER */}
      <header className="flex items-center justify-between px-6 py-4 backdrop-blur-lg/30">
        <h1 className="text-2xl font-extrabold tracking-wide">
          AI<span className="text-sky-400">Recruiter</span>
        </h1>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 transition-all shadow-lg disabled:opacity-60"
        >
          {loading ? "Redirecting…" : "Sign in with Google"}
        </button>
      </header>

      {/* ───────────────────────── HERO */}
      <section className="flex-1 grid place-items-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
            Hire <span className="text-sky-400">faster</span> with an
            <br /> AI‑powered Voice&nbsp;Agent
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-300">
            Let candidates interview 24/7, anywhere in the world. Our voice
            agent asks role‑specific questions, evaluates answers with LLMs, and
            surfaces top talent instantly.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="px-6 py-3 rounded-full bg-sky-500 hover:bg-sky-400 shadow-xl text-lg font-medium transition-all w-64 disabled:opacity-60"
            >
              {loading ? "Redirecting…" : "Start interviewing free"}
            </button>
            <a
              href="#features"
              className="text-sky-300 hover:text-sky-400 underline"
            >
              See how it works →
            </a>
          </div>

          {showEmailForm && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg">
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-2 bg-white/20 rounded-md text-white placeholder:text-white/60"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  className="w-full px-3 py-2 bg-white/20 rounded-md text-white placeholder:text-white/60"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 rounded-md transition-colors"
                >
                  {loading ? 'Processing...' : 'Sign In / Sign Up'}
                </button>
              </form>
            </div>
          )}

          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="text-sky-300 underline mt-2"
          >
            {showEmailForm ? 'Hide email form' : 'Use email instead'}
          </button>
        </motion.div>
      </section>

      {/* ───────────────────────── FOOTER */}
      <footer className="px-6 py-4 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} AI Recruiter. Built with Next.js, Supabase &amp; Vapi.
      </footer>

      {/* Decorative floating blob */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1.2, rotate: 45 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/30 blur-3xl rounded-full pointer-events-none"
      />
    </main>
  );
}
