"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogsPage() {
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) fetchHistory(data.session.user.id);
        });
    }, []);

    const fetchHistory = async (userId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/history?user_id=${userId}`);
            const data = await res.json();
            if (data.status === "success") setHistoryData(data.data);
        } catch (error) {
            console.error("Failed to fetch history");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="pageTitle">Audit Logs</h1>
            <p className="pageSubtitle">Complete history of all processed reports.</p>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                    <thead><tr><th>Date</th><th>AI Summary</th><th>Extracted Raw Data</th></tr></thead>
                    <tbody>

                        {isLoading && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
                                    <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', marginBottom: '8px', color: '#4A90E2' }} />
                                    Loading your history...
                                </td>
                            </tr>
                        )}

                        {!isLoading && historyData.map((log, index) => (
                            <tr key={index}>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                    {new Date(log.report_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                </td>
                                <td style={{ maxWidth: '300px' }}>{log.ai_summary}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#718096', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {JSON.stringify(log.extracted_metrics)}
                                </td>
                            </tr>
                        ))}

                        {!isLoading && historyData.length === 0 && (
                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>No history found. Upload a report to get started.</td></tr>
                        )}

                    </tbody>
                </table>
            </div>
        </div>
    );
}