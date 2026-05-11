"use client";

import { useState, useEffect } from "react";
import {
  UploadCloud, Loader2, LogOut, LayoutDashboard,
  LineChart, History, Activity
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Standard Reference Data ---
const REFERENCE_DATA = [
  { metric: "Heart Rate", normal: "60 - 100 bpm", description: "Resting beats per minute" },
  { metric: "Blood Pressure", normal: "90/60 - 120/80 mmHg", description: "Systolic / Diastolic" },
  { metric: "Fasting Blood Sugar", normal: "70 - 100 mg/dL", description: "Glucose after fasting" },
  { metric: "Hemoglobin (Male)", normal: "13.8 - 17.2 g/dL", description: "Oxygen-carrying protein" },
  { metric: "Hemoglobin (Female)", normal: "12.1 - 15.1 g/dL", description: "Oxygen-carrying protein" },
];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // 1. Session Management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchHistory(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchHistory(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch History
  const fetchHistory = async (userId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/history?user_id=${userId}`);
      const data = await res.json();
      if (data.status === "success") {
        setHistoryData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  // 3. Upload Function
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("report", file);
    formData.append("user_id", session.user.id);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data.data);
      fetchHistory(session.user.id);
    } catch (err: any) {
      alert("Upload failed. Make sure your Python backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (action: 'signin' | 'signup', e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (action === 'signin') {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
    setAuthLoading(false);
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl"><Activity className="text-white h-8 w-8" /></div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6">Medical Report Analyzer</h1>
          <form className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Email Address" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Password" required />
            <div className="flex gap-4 pt-2">
              <button onClick={(e) => handleAuth('signin', e)} disabled={authLoading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Sign In</button>
              <button onClick={(e) => handleAuth('signup', e)} disabled={authLoading} className="flex-1 bg-white text-blue-600 border-2 border-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">Sign Up</button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between fixed h-full">
        <div>
          <div className="p-6 flex items-center gap-3">
            <Activity className="text-blue-600 h-6 w-6" />
            <span className="font-bold text-lg text-slate-900">MedAnalyzer</span>
          </div>
          <nav className="px-4 space-y-2 mt-4">
            <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <LayoutDashboard className="h-5 w-5" /> Dashboard
            </button>
            <button onClick={() => setActiveTab("timeline")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === "timeline" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <LineChart className="h-5 w-5" /> Timeline Graph
            </button>
            <button onClick={() => setActiveTab("logs")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${activeTab === "logs" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <History className="h-5 w-5" /> Audit Logs
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-4 px-2 truncate">{session.user.email}</p>
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition">
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">

        {activeTab === "dashboard" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
            <header>
              <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
              <p className="text-slate-600 mt-1">Upload a new report or review standard medical references.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Analyze New Report</h2>
                <form onSubmit={handleUpload} className="flex flex-col space-y-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 cursor-pointer transition">
                    <UploadCloud className="h-10 w-10 text-blue-500 mb-3" />
                    <span className="text-slate-600 font-medium">Select a medical image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  {file && <p className="text-sm text-green-600 font-medium text-center">{file.name}</p>}
                  <button type="submit" disabled={!file || loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center">
                    {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing via AI...</> : "Analyze Report"}
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Standard References</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Metric</th>
                        <th className="px-4 py-3 rounded-tr-lg">Normal Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {REFERENCE_DATA.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.metric}</td>
                          <td className="px-4 py-3 text-slate-600">{item.normal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {result && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                <h2 className="text-xl font-bold text-blue-900">Latest Analysis</h2>
                <p className="text-blue-800 bg-white p-4 rounded-xl shadow-sm">{result.ai_summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(result.extracted_metrics).map(([key, value]) => (
                    <div key={key} className="bg-white p-4 rounded-xl shadow-sm">
                      <p className="text-xs text-slate-500 uppercase truncate">{key}</p>
                      <p className="font-bold text-slate-900">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-bold text-slate-900">Health Timeline</h1>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[500px] flex items-center justify-center">
              {historyData.length > 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  {/* Note: In a real app, you filter the historyData for a specific metric (like Hemoglobin) and pass it to Recharts here */}
                  <LineChart className="h-12 w-12 mb-4 text-slate-300" />
                  <p>Chart Engine Ready.</p>
                  <p className="text-sm">Found {historyData.length} records. (Data parsing for graph in next step)</p>
                </div>
              ) : (
                <p className="text-slate-500">No reports found. Upload a report to generate your timeline.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-bold text-slate-900">Audit History</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">AI Summary</th>
                    <th className="px-6 py-4">Extracted Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyData.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(log.report_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-900 max-w-md truncate">
                        {log.ai_summary}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                        {JSON.stringify(log.extracted_metrics).substring(0, 50)}...
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}