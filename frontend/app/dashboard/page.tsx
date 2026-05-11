"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REFERENCE_DATA = [
    { metric: "Heart Rate", normal: "60 - 100 bpm" },
    { metric: "Blood Pressure", normal: "90/60 - 120/80 mmHg" },
    { metric: "Fasting Sugar", normal: "70 - 100 mg/dL" },
    { metric: "Hemoglobin", normal: "12.0 - 17.5 g/dL" },
];

export default function DashboardHome() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id || null));
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !userId) return;
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("report", file);
        formData.append("user_id", userId);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/analyze", { method: "POST", body: formData });
            const data = await res.json();
            setResult(data.data);
        } catch (err: any) {
            alert("Upload failed. Make sure Python is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="pageTitle">Overview</h1>
            <p className="pageSubtitle">Upload new reports or check standard reference ranges.</p>

            <div className="grid">
                <div className="card">
                    <h2 className="cardTitle">Analyze New Report</h2>
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="dropzone">
                            <UploadCloud size={40} color="#4A90E2" style={{ marginBottom: '1rem' }} />
                            <span style={{ fontWeight: 600, color: '#4A5568' }}>Click to select medical image</span>
                            <input type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>
                        {file && <p style={{ textAlign: 'center', color: '#4A90E2', fontWeight: 600 }}>{file.name}</p>}
                        <button type="submit" disabled={!file || loading} className="btnPrimary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {loading ? <><Loader2 className="animate-spin" style={{ marginRight: '8px' }} /> Processing...</> : "Extract Data"}
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h2 className="cardTitle">Standard References</h2>
                    <table className="table">
                        <thead><tr><th>Metric</th><th>Normal Range</th></tr></thead>
                        <tbody>
                            {REFERENCE_DATA.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, color: '#2D3748' }}>{item.metric}</td>
                                    <td>{item.normal}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {result && (
                <div className="card" style={{ marginTop: '2rem', borderColor: '#4A90E2' }}>
                    <h2 className="cardTitle">Latest Analysis</h2>
                    <p style={{ backgroundColor: '#F4F6F8', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', lineHeight: 1.6 }}>{result.ai_summary}</p>
                    <div className="metricsGrid">
                        {Object.entries(result.extracted_metrics).map(([key, value]) => (
                            <div key={key} className="metricBox">
                                <p className="metricLabel">{key}</p>
                                <p className="metricValue">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}