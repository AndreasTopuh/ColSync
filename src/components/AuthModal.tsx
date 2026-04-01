"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  resendSignupVerification,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/supabase/session";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function AuthModal({ isOpen, onClose, redirectTo }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        onClose();
        router.push(redirectTo || "/dashboard");
        router.refresh();
      } else {
        const { data, error: signUpError } = await signUpWithEmailPassword(email.trim(), password);
        if (signUpError) throw signUpError;
        if (data.session) {
          onClose();
          router.push(redirectTo || "/dashboard");
          router.refresh();
          return;
        }
        setSuccess("Signup success! Check your email for verification, then login.");
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
      setSuccess("Verification email sent! Check your inbox/spam then login again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const resetAndClose = () => {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setMode("login");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={resetAndClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative bg-card rounded-2xl shadow-card-hover p-8 max-w-md w-full border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Login to access your dashboard and premium features."
                  : "Create an account to save your data across devices."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-personality-blue/50 transition-colors"
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
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-personality-blue/50 transition-colors"
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
                  className="w-full h-11 rounded-xl border border-border hover:bg-accent text-sm font-medium transition-all disabled:opacity-50"
                >
                  {resending ? "Sending verification..." : "Resend verification email"}
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-50 transition-all"
              >
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 text-sm text-muted-foreground text-center">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === "login" ? "signup" : "login"));
                  setError("");
                  setSuccess("");
                }}
                className="text-foreground font-medium hover:underline"
              >
                {mode === "login" ? "Sign up" : "Login"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
