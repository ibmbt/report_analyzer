"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Loader2, LogOut } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  // --- Auth State ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // --- App State ---
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Auth Functions ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setResult(null);
    setFile(null);
  };

  // --- Upload Function ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("report", file);
    // We will send the user's real ID to the backend!
    formData.append("user_id", session.user.id);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to analyze report");

      const data = await res.json();
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Medical Report Analyzer</h1>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && <p className="text-sm text-red-500 font-medium">{authError}</p>}

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                disabled={authLoading}
                className="flex-1 bg-white text-blue-600 border border-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 disabled:text-blue-300 disabled:border-blue-300"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Report Analyzer</h1>
            <p className="mt-1 text-sm text-gray-600">Logged in as {session.user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-lg"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleUpload} className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition">
              <label className="flex flex-col items-center cursor-pointer">
                <UploadCloud className="h-10 w-10 text-blue-500 mb-4" />
                <span className="text-gray-600 font-medium">Click to select a medical report</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {file && <p className="text-sm text-green-600 font-medium">Selected: {file.name}</p>}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Analyzing...</> : "Analyze Report"}
            </button>
          </form>

          {error && <p className="mt-4 text-red-500 text-center font-medium">{error}</p>}
        </div>

        {result && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">AI Summary</h2>
              <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
                {result.ai_summary}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Extracted Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.extracted_metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase tracking-wider">{key}</p>
                    <p className="text-lg font-semibold text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}