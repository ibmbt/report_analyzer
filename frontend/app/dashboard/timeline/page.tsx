"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IGNORED_KEYS = ["reference", "range", "unit", "status", "date", "normal"];

const CustomHoverCard = ({ active, payload, label, selectedMetric }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontWeight: 700, color: '#2D3748', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '8px' }}>
                    Date: {label}
                </p>
                {payload.map((entry: any, index: number) => {
                    if (selectedMetric !== "All" && entry.name !== selectedMetric) return null;

                    return (
                        <p key={index} style={{ color: entry.color, fontSize: '0.9rem', fontWeight: 600, margin: '4px 0' }}>
                            {entry.name}: <span style={{ color: '#2D3748', fontWeight: 800 }}>{entry.value}</span>
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
};

export default function TimelinePage() {
    const [graphData, setGraphData] = useState<any[]>([]);
    const [allKeys, setAllKeys] = useState<string[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<string>("All");

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

        const groupedByDate: Record<string, any> = {};

        [...rawData].reverse().forEach(log => {
            const dateStr = new Date(log.report_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

            if (!groupedByDate[dateStr]) {
                groupedByDate[dateStr] = { date: dateStr };
            }

            for (const [key, value] of Object.entries(log.extracted_metrics)) {
                const lowerKey = key.toLowerCase();
                if (IGNORED_KEYS.some(ignored => lowerKey.includes(ignored))) continue;

                const rawString = String(value);
                const numberMatch = rawString.match(/[\d.]+/);

                if (numberMatch) {
                    const num = parseFloat(numberMatch[0]);
                    if (!isNaN(num)) {
                        groupedByDate[dateStr][key] = num;
                        keys.add(key);
                    }
                }
            }
        });

        setGraphData(Object.values(groupedByDate));
        setAllKeys(Array.from(keys));
    };

    const colors = ["#4A90E2", "#48BB78", "#ED8936", "#9F7AEA", "#F56565", "#38B2AC", "#D53F8C", "#3182CE"];

    return (
        <div>
            <h1 className="pageTitle">Health Trends</h1>
            <p className="pageSubtitle">Track how your numerical metrics change over time. Hover over the lines for exact values.</p>

            {allKeys.length > 0 && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontWeight: 600, color: '#4A5568' }}>Filter Metric:</label>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E0', backgroundColor: '#FFFFFF', color: '#2D3748', outline: 'none', fontWeight: 500, cursor: 'pointer', minWidth: '200px' }}
                    >
                        <option value="All">Show All Metrics</option>
                        {allKeys.map(key => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="card">
                {graphData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="date" stroke="#718096" tick={{ fill: '#718096', fontSize: 12 }} tickMargin={10} />
                                <YAxis stroke="#718096" tick={{ fill: '#718096', fontSize: 12 }} tickMargin={10} />

                                <Tooltip shared={true} content={<CustomHoverCard selectedMetric={selectedMetric} />} cursor={{ stroke: '#CBD5E0', strokeWidth: 2, strokeDasharray: '5 5' }} />

                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                {allKeys.map((key, index) => {
                                    if (selectedMetric !== "All" && key !== selectedMetric) return null;
                                    return (
                                        <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8, stroke: '#FFF', strokeWidth: 2 }} />
                                    );
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