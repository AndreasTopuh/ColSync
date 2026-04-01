"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  Circle,
  BookOpen,
  Crown,
  MessageSquare,
  Zap,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loadData, saveRoadmap, setSubscription } from "@/lib/storage";
import { colorHex } from "@/lib/personality-data";
import { getPremiumStatus, getPlanLabel } from "@/lib/premium";
import { fetchServerSubscription, redeemPremiumCode, requestPremiumCode } from "@/lib/premium-api";
import { getCurrentSession } from "@/lib/supabase/session";

interface AuditRoadmapWeek {
  week: number;
  focus: string;
  resources: string[];
  milestone: string;
}

interface StoredRoadmapWeek {
  week: number;
  focus: string;
  completed: boolean;
  resources?: string[];
  milestone?: string;
  note?: string;
}

function mapAuditRoadmapToStored(weeks: AuditRoadmapWeek[]): StoredRoadmapWeek[] {
  return weeks.map((week) => ({
    week: week.week,
    focus: week.focus,
    completed: false,
    resources: week.resources,
    milestone: week.milestone,
    note: "",
  }));
}

export default function RoadmapPage() {
  const [, setRefreshKey] = useState(0);
  const [premiumCode, setPremiumCode] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [showNoteFor, setShowNoteFor] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (cancelled) return;
      setIsAuthed(Boolean(session));
      setAuthChecked(true);
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authChecked || !isAuthed) return;

    let cancelled = false;

    const syncSubscription = async () => {
      try {
        const subscription = await fetchServerSubscription();
        if (cancelled) return;
        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });
        setRefreshKey((value) => value + 1);
      } catch {
        // Keep local fallback state.
      }
    };

    void syncSubscription();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isAuthed]);

  useEffect(() => {
    if (!authChecked || !isAuthed) return;

    const data = loadData();
    if (data.roadmap?.weeks?.length) return;

    const fallbackAuditRoadmap = (data.cvAudits[0]?.fullResult as { roadmap?: AuditRoadmapWeek[] } | undefined)?.roadmap || [];
    if (fallbackAuditRoadmap.length === 0) return;

    saveRoadmap(mapAuditRoadmapToStored(fallbackAuditRoadmap));
    setRefreshKey((value) => value + 1);
  }, [authChecked, isAuthed]);

  const data = loadData();
  const savedRoadmapWeeks = data.roadmap?.weeks || [];
  const latestAuditRoadmap =
    ((data.cvAudits[0]?.fullResult as { roadmap?: AuditRoadmapWeek[] } | undefined)?.roadmap || []);

  const roadmapWeeks: StoredRoadmapWeek[] =
    savedRoadmapWeeks.length > 0
      ? (savedRoadmapWeeks as StoredRoadmapWeek[])
      : latestAuditRoadmap.length > 0
        ? mapAuditRoadmapToStored(latestAuditRoadmap)
        : [];

  const persistRoadmap = (weeks: StoredRoadmapWeek[]) => {
    saveRoadmap(weeks);
    setRefreshKey((value) => value + 1);
  };

  const toggleWeek = (weekNumber: number) => {
    persistRoadmap(
      roadmapWeeks.map((week) =>
        week.week === weekNumber ? { ...week, completed: !week.completed } : week,
      ),
    );
  };

  const updateWeekNote = (weekNumber: number, note: string) => {
    persistRoadmap(
      roadmapWeeks.map((week) =>
        week.week === weekNumber ? { ...week, note } : week,
      ),
    );
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockError("");
    setRequestMessage("");

    try {
      const subscription = await redeemPremiumCode(premiumCode);
      setSubscription({
        tier: subscription.tier,
        creditsUsed: subscription.creditsUsed,
        unlockedAt: subscription.unlockedAt,
      });
      setPremiumCode("");
      setRequestMessage("Pro plan activated successfully.");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid code";
      setUnlockError(message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleRequestCode = async () => {
    setUnlockError("");
    setRequestMessage("");

    try {
      const result = await requestPremiumCode("pro20", "Requested from roadmap page");
      const adminStatus = result.notifications?.adminEmail;
      const reason = result.notifications?.adminEmailReason;

      if (adminStatus === "sent") {
        setRequestMessage("Request submitted. Admin has been notified and will send your code to your email.");
      } else if (adminStatus === "failed") {
        if (reason === "missing_private_key") {
          setUnlockError("Request saved, but EmailJS strict mode still needs EMAILJS_PRIVATE_KEY.");
        } else {
          setUnlockError("Request saved, but admin email was not confirmed as sent. Please contact contactcolsync@gmail.com.");
        }
      } else {
        setRequestMessage("Request saved. Email notification is not configured yet.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request premium code.";
      setUnlockError(message);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-16 pt-24 text-center">
          <p className="text-muted-foreground">Checking your session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-16 pt-24 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-3">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login to view your personalized career roadmap.</p>
          <Link
            href="/auth?next=%2Fdashboard%2Froadmap"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Login or Sign up
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentTier = getPremiumStatus().tier;
  const isPro = currentTier === "pro20";
  const totalWeeks = roadmapWeeks.length;
  const completedWeeks = roadmapWeeks.filter((week) => week.completed).length;
  const progress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-personality-yellow/15 text-personality-yellow">
              <Crown className="w-4 h-4" /> Pro feature
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">Learning Roadmap</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Weekly milestones, saved notes, and progress tracking are unlocked on the Pro plan.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-3xl border border-personality-yellow/20 bg-linear-to-br from-personality-yellow/10 via-background to-personality-blue/10 p-8">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-personality-yellow/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-personality-blue/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-5 bg-background/80 border border-border/60">
                  <GraduationCap className="w-4 h-4" /> Agent D: The Coach
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">Your AI roadmap becomes actionable here</h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Track completion week by week.</p>
                  <p>Store notes and reflections for each milestone.</p>
                  <p>Revisit learning resources without losing progress.</p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  <span>Current plan: {getPlanLabel(currentTier)}</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-3xl shadow-card p-8 border border-border/70">
              <p className="text-sm font-semibold text-foreground mb-5">Unlock Pro access</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={premiumCode}
                  onChange={(event) => setPremiumCode(event.target.value)}
                  placeholder="Enter Pro unlock code"
                  className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border outline-none text-center tracking-widest font-mono"
                />
                <button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all disabled:opacity-50"
                >
                  {unlocking ? "Activating..." : "Unlock Pro"}
                </button>
                <button
                  onClick={handleRequestCode}
                  className="w-full h-10 rounded-xl border border-border hover:bg-accent font-medium text-sm transition-all"
                >
                  Request Pro Code
                </button>
                {unlockError && <p className="text-xs text-destructive">{unlockError}</p>}
                {requestMessage && <p className="text-xs text-personality-blue">{requestMessage}</p>}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16 pt-24">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: colorHex.yellow + "20", color: "#b5911c" }}
          >
            <GraduationCap className="w-4 h-4" /> Agent D: The Coach
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Your Learning Roadmap</h1>
          <p className="text-muted-foreground max-w-2xl">
            Turn CV feedback into weekly action. Track milestones, keep notes, and finish the roadmap one focused step at a time.
          </p>
        </motion.div>

        {roadmapWeeks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card rounded-3xl shadow-card border border-border/70">
            <GraduationCap className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">Complete a CV Audit to generate your personalized learning roadmap.</p>
            <Link
              href="/dashboard/cv"
              className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
            >
              Start CV Audit <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl shadow-card p-6 border border-border/70"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">Overall Progress</p>
                  <p className="text-sm font-bold text-foreground">{Math.round(progress)}%</p>
                </div>
                <div className="h-3 rounded-full bg-accent overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-personality-blue to-personality-yellow"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{completedWeeks}/{totalWeeks} weeks completed</p>
                  {progress === 100 && <span className="text-xs font-bold text-personality-blue">Complete</span>}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-2xl shadow-card p-6 border border-border/70"
              >
                <p className="text-sm font-medium text-foreground mb-2">Plan Status</p>
                <p className="text-lg font-semibold text-foreground">{getPlanLabel(currentTier)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Notes and completion state are saved automatically in your browser.
                </p>
              </motion.div>
            </div>

            <div className="space-y-4">
              {roadmapWeeks.map((week, index) => {
                const isCompleted = week.completed;
                return (
                  <motion.div
                    key={week.week}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className={`bg-card rounded-2xl shadow-card p-6 border border-border/70 transition-all ${isCompleted ? "opacity-80" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleWeek(week.week)} className="shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-personality-blue" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                            Week {week.week}
                          </span>
                          {isCompleted && <span className="text-xs text-personality-blue">Done</span>}
                        </div>

                        <h3 className={`font-semibold text-foreground mb-2 ${isCompleted ? "line-through" : ""}`}>
                          {week.focus}
                        </h3>

                        {week.milestone && (
                          <p className="text-xs text-muted-foreground mb-3">Milestone: {week.milestone}</p>
                        )}

                        {week.resources && week.resources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {week.resources.map((resource) => (
                              <span
                                key={resource}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent text-muted-foreground"
                              >
                                <BookOpen className="w-3 h-3" />
                                {resource}
                              </span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => setShowNoteFor(showNoteFor === week.week ? null : week.week)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {week.note ? "Edit note" : "Add learning note"}
                        </button>

                        {showNoteFor === week.week && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3">
                            <textarea
                              value={week.note || ""}
                              onChange={(event) => updateWeekNote(week.week, event.target.value)}
                              placeholder="What did you learn this week? Add notes, blockers, and reflections."
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-accent text-foreground placeholder:text-muted-foreground border border-border text-xs outline-none resize-none"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
