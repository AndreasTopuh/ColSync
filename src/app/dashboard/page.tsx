"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  FileSearch,
  GraduationCap,
  User,
  BarChart3,
  ChevronRight,
  Sparkles,
  Crown,
  Lock,
  X,
  Send,
  Loader2,
  Mail,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { setSubscription, ensureUserScope } from "@/lib/storage";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";
import { getPremiumStatus, getPlanLabel, getPlanLimit, getRemainingCredits } from "@/lib/premium";
import { fetchServerSubscription, redeemPremiumCode, requestPremiumCode, fetchUserResults, type UserResultRow } from "@/lib/premium-api";
import { getCurrentSession } from "@/lib/supabase/session";

export default function DashboardPage() {
  const router = useRouter();
  const [, setRefreshKey] = useState(0);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [premiumCode, setPremiumCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeInfo, setCodeInfo] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestTier, setRequestTier] = useState<"starter5" | "pro20">("starter5");
  const [requestNote, setRequestNote] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestResult, setRequestResult] = useState("");
  const [requestError, setRequestError] = useState("");
  const [dbResults, setDbResults] = useState<UserResultRow[]>([]);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (cancelled) return;
      setIsAuthed(Boolean(session));
      if (session?.email) setUserEmail(session.email);
      if (session?.id) ensureUserScope(session.id);
      setAuthChecked(true);
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect to homepage if not authenticated
  useEffect(() => {
    if (authChecked && !isAuthed) {
      router.push("/");
    }
  }, [authChecked, isAuthed, router]);

  useEffect(() => {
    if (!authChecked || !isAuthed) return;

    let cancelled = false;

    const syncData = async () => {
      try {
        const [subscription, results] = await Promise.all([
          fetchServerSubscription(),
          fetchUserResults(),
        ]);
        if (cancelled) return;
        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });
        setDbResults(results);
        setRefreshKey((k) => k + 1);
      } catch {
        // User not logged in yet; keep local fallback state.
      }
    };

    void syncData();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isAuthed]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16 pt-24">
          <div className="h-8 w-44 rounded bg-accent animate-pulse mb-6" />
          <div className="h-28 rounded-xl bg-accent animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!authChecked || !isAuthed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Checking your session...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const status = getPremiumStatus();
  const tier = status.tier;
  const creditsLeft = getRemainingCredits();

  const handleUnlockPremium = async () => {
    setUnlocking(true);
    setCodeError("");
    setCodeInfo("");
    try {
      const subscription = await redeemPremiumCode(premiumCode);
      setSubscription({
        tier: subscription.tier,
        creditsUsed: subscription.creditsUsed,
        unlockedAt: subscription.unlockedAt,
      });
      setCodeInfo("Plan activated successfully!");
      setPremiumCode("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to activate code.";
      setCodeError(message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleRequestCode = async () => {
    setRequesting(true);
    setRequestError("");
    setRequestResult("");
    try {
      const note = requestNote.trim() || `Requested ${requestTier === "pro20" ? "Pro (6 credits)" : "Starter (3 credits)"} from dashboard`;
      await requestPremiumCode(requestTier, note);
      setRequestResult("Request submitted. Admin will review it, generate your code, and send it to your email. Then you can activate the plan from this dashboard.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request a code.";
      setRequestError(message);
    } finally {
      setRequesting(false);
    }
  };

  // Use DB results only (no localStorage fallback)
  const latestDbResult = dbResults[0] || null;
  const dominantColor = (latestDbResult?.dominant_color || null) as ColorKey | null;
  const personalityProfile = dominantColor ? personalityProfiles[dominantColor] : null;
  const hasTestResult = !!latestDbResult;

  // Extract percentages from DB result_data
  const resultData = latestDbResult?.result_data as Record<string, unknown> | null;
  const dbPercentages = resultData?.percentages as Record<ColorKey, number> | undefined;

  const isPaidPlan = tier !== "free";

  const flowSteps = [
    { icon: Sparkles, title: "Personality Test", desc: "Discover your color", href: "/test", done: hasTestResult, free: true },
    { icon: Briefcase, title: "Job Matching", desc: "AI finds jobs for you", href: "/dashboard/jobs", done: false, free: false },
    { icon: FileSearch, title: "CV Audit", desc: "AI reviews your CV", href: "/dashboard/cv", done: false, free: false },
    { icon: GraduationCap, title: "Roadmap", desc: "Weekly learning plan", href: "/dashboard/roadmap", done: false, free: false },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16 pt-24">

        {/* Request Code Modal */}
        <AnimatePresence>
          {requestModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4"
              onClick={() => { setRequestModalOpen(false); setRequestResult(""); setRequestError(""); }}
            >
              <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="relative bg-card rounded-2xl shadow-card-hover p-8 max-w-md w-full border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setRequestModalOpen(false); setRequestResult(""); setRequestError(""); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-personality-yellow/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-personality-yellow" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Request Premium Code</h2>
                    <p className="text-xs text-muted-foreground">Choose your pack and submit a request</p>
                  </div>
                </div>

                {!requestResult ? (
                  <>
                    {/* Pack Selection */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-foreground block mb-2">Choose Pack</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRequestTier("starter5")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${requestTier === "starter5" ? "border-personality-blue bg-personality-blue/5" : "border-border hover:border-personality-blue/40"}`}
                        >
                          <p className="text-sm font-semibold text-foreground">Starter</p>
                          <p className="text-xs text-muted-foreground mt-0.5">3 AI credits</p>
                          <p className="text-xs text-muted-foreground">Results, Jobs, CV</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRequestTier("pro20")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${requestTier === "pro20" ? "border-personality-yellow bg-personality-yellow/5" : "border-border hover:border-personality-yellow/40"}`}
                        >
                          <p className="text-sm font-semibold text-foreground">Pro</p>
                          <p className="text-xs text-muted-foreground mt-0.5">6 AI credits</p>
                          <p className="text-xs text-muted-foreground">Everything + Roadmap</p>
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-foreground block mb-1.5">Note (optional)</label>
                      <textarea
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                        placeholder="Any additional information..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-personality-blue/50 transition-colors resize-none text-sm"
                      />
                    </div>
                    {requestError && <p className="text-sm text-destructive mb-4">{requestError}</p>}
                    <button
                      onClick={handleRequestCode}
                      disabled={requesting}
                      className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {requesting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Request {requestTier === "pro20" ? "Pro (6)" : "Starter (3)"} Code</>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-personality-blue/20 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-5 h-5 text-personality-blue" />
                    </div>
                    <p className="text-sm text-foreground mb-4">{requestResult}</p>
                    <button
                      onClick={() => { setRequestModalOpen(false); setRequestResult(""); setRequestNote(""); }}
                      className="h-10 px-6 rounded-xl border border-border hover:bg-accent font-medium text-sm transition-all"
                    >
                      Close
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">{displayName ? `Welcome back, ${displayName}!` : "Your ColSync career journey at a glance."}</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-card rounded-xl shadow-card p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayName || "Guest User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || "No email"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
              <p className="text-sm font-semibold text-foreground">{getPlanLabel(tier)}</p>
            </div>
          </div>
        </motion.div>

        {/* Premium Status + Unlock */}
        {!isPaidPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-linear-to-r from-personality-yellow/10 to-personality-blue/10 rounded-xl p-6 mb-8 border border-personality-yellow/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-personality-yellow" />
                <div>
                  <p className="font-semibold text-foreground">Upgrade Plan</p>
                  <p className="text-xs text-muted-foreground">Starter: 3 AI credits, Pro: 6 AI credits</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input type="text" value={premiumCode} onChange={(e) => setPremiumCode(e.target.value)} placeholder="Enter code" className="h-10 px-4 rounded-lg bg-card text-foreground placeholder:text-muted-foreground border border-border outline-none text-center font-mono flex-1 sm:w-36" />
                <button onClick={handleUnlockPremium} disabled={unlocking} className="h-10 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium text-sm transition-all disabled:opacity-50">
                  {unlocking ? "Activating..." : "Activate"}
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button onClick={() => setRequestModalOpen(true)} className="text-xs text-foreground/80 hover:text-foreground underline underline-offset-2">
                Request code
              </button>
              <a href="mailto:contactcolsync@gmail.com?subject=Premium%20Code%20Request%20-%20ColSync" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Email support
              </a>
            </div>
            {codeError && <p className="text-xs text-destructive mt-2">{codeError}</p>}
            {codeInfo && <p className="text-xs text-personality-blue mt-2">{codeInfo}</p>}
          </motion.div>
        )}

        {isPaidPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl shadow-card p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold text-foreground">{getPlanLabel(tier)}</p>
                <p className="text-sm text-muted-foreground">AI Credits: {creditsLeft} / {getPlanLimit(tier)}</p>
              </div>
              <div className="w-full sm:w-64">
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <motion.div
                    className="h-full bg-personality-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${getPlanLimit(tier) === 0 ? 0 : (creditsLeft / getPlanLimit(tier)) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Personality Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl shadow-card p-8 mb-8">
          {hasTestResult && personalityProfile && dominantColor ? (
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: colorHex[dominantColor] }}>
                <span className="text-xl font-bold" style={{ color: dominantColor === "yellow" ? "#1f2937" : "#fff" }}>{personalityProfile.name[0]}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Your Dominant Color</p>
                <h2 className="text-2xl font-semibold text-foreground mb-2">{personalityProfile.name} - {personalityProfile.motive}</h2>
                <p className="text-sm text-muted-foreground mb-4">{personalityProfile.summary}</p>
                {dbPercentages && (
                  <div className="flex flex-wrap gap-4">
                    {(["red", "blue", "white", "yellow"] as ColorKey[]).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex[k] }} />
                        <span className="text-xs text-muted-foreground capitalize">{k}: {dbPercentages[k] ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Take the personality test to see your profile.</p>
              <Link href="/test" className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">Start the Test</Link>
            </div>
          )}
        </motion.div>

        {/* Flow Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Your Journey</h3>
          <div className="space-y-3">
            {flowSteps.map((step) => {
              const isLocked = !step.free && !isPaidPlan;
              return (
                <Link
                  key={step.title}
                  href={isLocked ? "#" : step.href}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    step.done ? "bg-accent/50" : isLocked ? "bg-accent/30 opacity-60 cursor-not-allowed" : "hover:bg-accent"
                  }`}
                  onClick={(e) => isLocked && e.preventDefault()}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.done ? "bg-personality-blue/20" : "bg-accent"}`}>
                    {isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <step.icon className={`w-5 h-5 ${step.done ? "text-personality-blue" : "text-muted-foreground"}`} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      {step.title}
                      {!step.free && <span className="text-xs px-1.5 py-0.5 rounded bg-personality-yellow/20 text-personality-yellow font-medium">Credit</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  <div className="shrink-0">
                    {step.done ? <span className="text-xs font-medium text-personality-blue">Done ✓</span> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>



        {/* Recent Results from Database */}
        {dbResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-muted-foreground" /><h3 className="font-semibold text-foreground">Recent Results</h3></div>
            <div className="space-y-3">
              {dbResults.slice(0, 5).map((r) => {
                const dominant = r.dominant_color as ColorKey;
                const pProfile = personalityProfiles[dominant];
                const resultData = r.result_data as Record<string, unknown> | null;
                const health = (resultData && 'health' in resultData ? resultData.health : null) as string | null;
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: colorHex[dominant], color: dominant === "yellow" ? "#1f2937" : "#fff" }}>
                        {pProfile?.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{pProfile?.name || dominant}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {health && <span className="text-xs text-muted-foreground capitalize">{health}</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
