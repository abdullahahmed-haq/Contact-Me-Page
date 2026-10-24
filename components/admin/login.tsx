"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Languages, ArrowUpRight } from "lucide-react";
export function Login() {
  const [ready, setReady] = useState(false);
  const [ar, setAr] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    document.documentElement.lang = ar ? "ar" : "en";
    document.documentElement.dir = ar ? "rtl" : "ltr";
  }, [ar]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (!r.ok) {
        setError(
          ar
            ? "تعذر تسجيل الدخول. راجع بياناتك أو حاول لاحقًا."
            : "Couldn’t sign in. Check your credentials or wait before trying again.",
        );
        return;
      }
      window.location.assign("/admin/dashboard");
    } catch {
      setError(
        ar
          ? "تعذر الاتصال بالخادم. حاول مرة أخرى."
          : "Couldn’t reach the server. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main data-ready={ready} className="admin-login" dir={ar ? "rtl" : "ltr"}>
      <div className="login-top">
        <Link href="/connect">
          Connect <ArrowUpRight size={16} />
        </Link>
        <button className="admin-button quiet" onClick={() => setAr(!ar)}>
          <Languages size={18} />
          {ar ? "English" : "العربية"}
        </button>
      </div>
      <section className="login-panel">
        <span className="studio-mark">
          <LockKeyhole size={24} />
        </span>
        <h1>{ar ? "أهلًا بك في الاستوديو" : "Welcome to your studio"}</h1>
        <p>
          {ar
            ? "مساحة واحدة لإدارة هويتك وروابطك وكل طرق التواصل معك."
            : "One place for your profile, your links, and every way to connect."}
        </p>
        <form method="post" action="/api/auth/sign-in/email/" onSubmit={login}>
          <label>
            {ar ? "البريد الإلكتروني للمالك" : "Owner email"}
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              maxLength={254}
              dir="ltr"
            />
          </label>
          <label>
            {ar ? "كلمة المرور" : "Password"}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
              dir="ltr"
            />
          </label>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <button className="admin-button primary" disabled={busy || !ready}>
            {busy
              ? ar
                ? "جارٍ تسجيل الدخول…"
                : "Signing in…"
              : ar
                ? "تسجيل الدخول"
                : "Sign in"}
            <ArrowRight size={18} />
          </button>
        </form>
        <details>
          <summary>
            {ar ? "تحتاج إلى استعادة الوصول؟" : "Need to recover access?"}
          </summary>
          <p>
            {ar
              ? "الاستعادة متاحة للمالك من الخادم باستخدام أمر owner:reset الموضح في دليل التشغيل. لا توجد حسابات تسجيل عامة."
              : "Use the documented owner:reset command on the server to recover your owner account and revoke all sessions. There is no public registration."}
          </p>
        </details>
      </section>
      <p className="login-foot">
        {ar
          ? "استوديو خاص · اتصال آمن بالمالك"
          : "Private studio · Owner access only"}
      </p>
    </main>
  );
}
