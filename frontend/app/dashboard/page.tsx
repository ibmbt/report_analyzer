"use client";

import { useState, useEffect } from "react";
import { UploadCloud, Loader2, Send } from "lucide-react";
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

    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: string, text: string }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id || null));

        const savedResult = sessionStorage.getItem("currentReport");
        const savedChat = sessionStorage.getItem("currentChat");
        if (savedResult) setResult(JSON.parse(savedResult));
        if (savedChat) setChatHistory(JSON.parse(savedChat));
    }, []);

    useEffect(() => {
        if (chatHistory.length > 0) {
            sessionStorage.setItem("currentChat", JSON.stringify(chatHistory));
        }
    }, [chatHistory]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !userId) return;
        setLoading(true);

        setResult(null);
        setChatHistory([]);
        sessionStorage.removeItem("currentReport");
        sessionStorage.removeItem("currentChat");

        const formData = new FormData();
        formData.append("report", file);
        formData.append("user_id", userId);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, { method: "POST", body: formData });
            const data = await res.json();
            setResult(data.data);
            sessionStorage.setItem("currentReport", JSON.stringify(data.data));
        } catch (err: any) {
            alert("Upload failed. Make sure Python is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !result?.raw_text) return;

        const userQuestion = chatMessage;
        setChatMessage("");
        setChatHistory(prev => [...prev, { role: "user", text: userQuestion }]);
        setChatLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: userQuestion, context: result.raw_text })
            });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { role: "ai", text: "Sorry, I couldn't process that right now." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div>
            <h1 className="pageTitle">Overview</h1>
            <p className="pageSubtitle">Upload a PDF or Image report to analyze and ask questions.</p>

            <div className="grid">
                <div className="card">
                    <h2 className="cardTitle">Analyze New Report</h2>
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label className="dropzone">
                            <UploadCloud size={40} color="#4A90E2" style={{ marginBottom: '1rem' }} />
                            <span style={{ fontWeight: 600, color: '#4A5568' }}>Click to select Image or PDF</span>
                            <input type="file" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }}>
                    <div className="card" style={{ borderColor: '#4A90E2' }}>
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

                    <div className="card">
                        <h2 className="cardTitle">Ask about this report</h2>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {chatHistory.length === 0 && <p style={{ color: '#A0AEC0', textAlign: 'center' }}>Ask a question like "What does my hemoglobin mean?"</p>}

                            {chatHistory.map((msg, idx) => (
                                <div key={idx} style={{ alignSelf: msg.role === "user" ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                    <div style={{
                                        backgroundColor: msg.role === "user" ? '#4A90E2' : '#F4F6F8',
                                        color: msg.role === "user" ? '#FFF' : '#2D3748',
                                        padding: '12px 16px', borderRadius: '12px', lineHeight: 1.5
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && <div style={{ alignSelf: 'flex-start', backgroundColor: '#F4F6F8', padding: '12px 16px', borderRadius: '12px' }}><Loader2 className="animate-spin" size={20} color="#4A90E2" /></div>}
                        </div>

                        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Ask your AI assistant..."
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E0', outline: 'none' }}
                            />
                            <button type="submit" disabled={chatLoading || !chatMessage.trim()} style={{ backgroundColor: '#4A90E2', color: '#FFF', padding: '0 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}