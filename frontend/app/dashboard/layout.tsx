"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, LineChart as ChartIcon, History, Activity, User } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.push("/");
            else setSession(session);
        });
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (!session) return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading Secure Dashboard...</div>;

    return (
        <div className="container">
            <aside className="sidebar">
                <div>
                    {/* Webapp Name */}
                    <div className="sidebarHeader">
                        <Activity color="#4A90E2" /> MedAnalyzer
                    </div>

                    <nav className="navMenu">
                        <Link href="/dashboard" className={`navItem ${pathname === "/dashboard" ? "navItemActive" : ""}`}>
                            <LayoutDashboard size={20} /> Dashboard
                        </Link>
                        <Link href="/dashboard/timeline" className={`navItem ${pathname === "/dashboard/timeline" ? "navItemActive" : ""}`}>
                            <ChartIcon size={20} /> Timeline
                        </Link>
                        <Link href="/dashboard/logs" className={`navItem ${pathname === "/dashboard/logs" ? "navItemActive" : ""}`}>
                            <History size={20} /> History
                        </Link>
                    </nav>
                </div>

                <div className="sidebarFooter">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: '#F0F7FF', border: '1px solid #4A90E2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={20} color="#4A90E2" />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#4A5568', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {session.user.email}
                        </span>
                    </div>

                    <button onClick={handleSignOut} className="signOutBtn">
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="mainContent">
                {children}
            </main>
        </div>
    );
}