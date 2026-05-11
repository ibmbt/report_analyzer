"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TimelinePage() {
    const [graphData, setGraphData] = useState<any[]>([]);
    const [graphKeys, setGraphKeys] = useState<string[]>([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) fetchHistory(data.session.user.id);
        });
    }, []);

    const fetchHistory = async (userId: string) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/history?user_id=${userId}`);
            const data = await res.json();
            if (data.status === "success") prepareGraphData(data.data);
        } catch (error) {
            console.error("Failed to fetch history");
        }
    };

    const prepareGraphData = (rawData: any[]) => {
        const keys = new Set<string>();
        const formattedData = [...rawData].reverse().map(log => {
            const point: any = { date: new Date(log.report_date).toLocaleDateString() };
            for (const [key, value] of Object.entries(log.extracted_metrics)) {
                const num = parseFloat(String(value));
                if (!isNaN(num)) {
                    point[key] = num;
                    keys.add(key);
                }
            }
            return point;
        });
        setGraphData(formattedData);
        setGraphKeys(Array.from(keys));
    };

    return (
        <div>
            <h1 className="pageTitle">Health Trends</h1>
            <p className="pageSubtitle">Track how your numerical metrics change over time.</p>
            <div className="card">
                {graphData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="date" stroke="#718096" />
                                <YAxis stroke="#718096" />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                {graphKeys.map((key, index) => {
                                    const colors = ["#4A90E2", "#48BB78", "#ED8936", "#9F7AEA"];
                                    return <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />;
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0' }}>
                        No numerical data found to graph yet.
                    </div>
                )}
            </div>
        </div>
    );
}