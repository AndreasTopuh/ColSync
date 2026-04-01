"use client";

import { FormEvent, useState, useSyncExternalStore, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  resendSignupVerification,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/supabase/session";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isEmailNotConfirmed = error.toLowerCase().includes("email not confirmed");

  const normalizeAuthError = (raw: string) => {
    const msg = raw.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return "Incorrect email or password. Please try again or create a new account.";
    }
    if (msg.includes("email not confirmed")) {
      return "Email not verified. Please verify your email or click resend verification.";
    }
    return raw;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: loginError } = await signInWithEmailPassword(email.trim(), password);
        if (loginError) throw loginError;
        const redirectTo = searchParams.get("next") || "/dashboard";
        router.push(redirectTo);
        router.refresh();
      } else {
        const { data, error: signUpError } = await signUpWithEmailPassword(email.trim(), password);
        if (signUpError) throw signUpError;
        if (data.session) {
          const redirectTo = searchParams.get("next") || "/dashboard";
          router.push(redirectTo);
          router.refresh();
          return;
        }
        setSuccess("Signup success. Check your email verification (if enabled), then login.");
        setMode("login");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(normalizeAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Please enter your email to resend verification.");
      return;
    }

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const { error: resendError } = await resendSignupVerification(email.trim());
      if (resendError) throw resendError;
      setSuccess("Verification email sent. Silakan cek inbox/spam lalu login kembali.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center justify-center">
      <div className="max-w-md mx-auto px-6 py-16 pt-24">
        <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {mode === "login" ? "Login" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Login to sync dashboard data and premium features."
              : "Create an account to save your data across devices."}
          </p>

          {!hydrated ? (
            <div className="space-y-3">
              <div className="h-12 rounded-xl bg-accent animate-pulse" />
              <div className="h-12 rounded-xl bg-accent animate-pulse" />
              <div className="h-12 rounded-xl bg-accent animate-pulse" />
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                suppressHydrationWarning
                className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  suppressHydrationWarning
                  className="w-full h-12 px-4 pr-12 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-personality-blue">{success}</p>}

            {isEmailNotConfirmed && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                suppressHydrationWarning
                className="w-full h-11 rounded-xl border border-border hover:bg-accent text-sm font-medium transition-all disabled:opacity-50"
              >
                {resending ? "Sending verification..." : "Resend verification email"}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-50 transition-all"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
          )}

          <div className="mt-6 text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "login" ? "signup" : "login"));
                setError("");
                setSuccess("");
              }}
              suppressHydrationWarning
              className="text-foreground font-medium hover:underline"
            >
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </div>

          <Link href="/dashboard" className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground">
            Back to Dashboard
          </Link>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
