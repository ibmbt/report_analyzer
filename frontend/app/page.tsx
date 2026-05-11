"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, [router]);

  const handleAuth = async (action: 'signin' | 'signup', e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (action === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) router.push("/dashboard");
      else alert(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (!error) router.push("/dashboard");
      else alert(error.message);
    }
    setAuthLoading(false);
  };

  return (
    <main className="loginWrapper">
      <div className="loginCard">
        <h1 className="loginTitle">Medical Report Analyzer</h1>
        <form>
          <div className="inputGroup">
            <label className="label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="patient@example.com" />
          </div>
          <div className="inputGroup">
            <label className="label">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
          </div>
          <div className="buttonGroup">
            <button onClick={(e) => handleAuth('signin', e)} disabled={authLoading} className="btnPrimary">Sign In</button>
            <button onClick={(e) => handleAuth('signup', e)} disabled={authLoading} className="btnSecondary">Sign Up</button>
          </div>
        </form>
      </div>
    </main>
  );
}