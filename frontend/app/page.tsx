"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("report", file);

    try {
      // Sending the file to your FastAPI backend
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Medical Report Analyzer</h1>
          <p className="mt-2 text-gray-600">Upload your lab results for a simple, AI-powered explanation.</p>
        </div>

        {/* Upload Card */}
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

        {/* Results Section */}
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