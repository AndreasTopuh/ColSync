"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Sparkles,
  Check,
  ChevronRight,
  Zap,
  Bot,
  Brain,
  Search,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loadData, saveJobSearch, setSubscription, ensureUserScope } from "@/lib/storage";
import { personalityProfiles, colorHex, ColorKey } from "@/lib/personality-data";
import { getPremiumStatus, getRemainingCredits, getPlanLabel } from "@/lib/premium";
import { fetchServerSubscription, fetchUserResults } from "@/lib/premium-api";
import { useAuth } from "@/hooks/useAuth";
import PremiumGate from "@/components/PremiumGate";

interface Job {
  title: string;
  company_type: string;
  seniority: string;
  salary_range: string;
  personalityFit: number;
  whyItFits: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  searchTip: string;
}

const AI_LOADING_STEPS = [
  { icon: Brain, label: "Analyzing your personality profile...", duration: 2000 },
  { icon: Search, label: "Scanning job markets worldwide...", duration: 3000 },
  { icon: Bot, label: "Matching personality to realistic roles...", duration: 4000 },
  { icon: ListChecks, label: "Ranking the strongest opportunities...", duration: 3000 },
  { icon: Sparkles, label: "Finalizing recommendations...", duration: 2000 },
];

const NO_IDEA_CONTEXT =
  "I don't have a specific field in mind yet. Please suggest jobs based on my personality.";
const STUDYING_PREFIX = "I am currently studying/learning: ";
const WORKING_PREFIX = "I am currently working in/experienced with: ";

function restoreContext(interests: string): {
  contextType: "studying" | "working" | "noIdea";
  context: string;
} {
  if (interests.startsWith(STUDYING_PREFIX)) {
    return {
      contextType: "studying",
      context: interests.replace(STUDYING_PREFIX, ""),
    };
  }

  if (interests.startsWith(WORKING_PREFIX)) {
    return {
      contextType: "working",
      context: interests.replace(WORKING_PREFIX, ""),
    };
  }

  return {
    contextType: "noIdea",
    context: "",
  };
}

export default function JobSearchPage() {
  const [step, setStep] = useState<"context" | "loading" | "results">("context");
  const [context, setContext] = useState("");
  const [contextType, setContextType] = useState<"studying" | "working" | "noIdea">("noIdea");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [marketInsight, setMarketInsight] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dominant, setDominant] = useState<ColorKey | null>(null);
  const [secondary, setSecondary] = useState<ColorKey | null>(null);
  const [planTier, setPlanTier] = useState<"free" | "starter5" | "pro20">("free");
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const { isAuthed, authChecked, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step !== "loading") return;

    setLoadingStep(0);
    let currentStep = 0;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const advanceStep = () => {
      currentStep += 1;
      if (currentStep < AI_LOADING_STEPS.length) {
        setLoadingStep(currentStep);
        timers.push(setTimeout(advanceStep, AI_LOADING_STEPS[currentStep].duration));
      }
    };

    timers.push(setTimeout(advanceStep, AI_LOADING_STEPS[0].duration));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [step]);

  useEffect(() => {
    if (!mounted || !isAuthed || !user) return;

    // Clear stale localStorage data if a different user logged in
    ensureUserScope(user.id);

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

        setPlanTier(subscription.tier);
        setCreditsLeft(getRemainingCredits());

        if (results.length > 0) {
          const dbResult = results[0];
          setDominant(dbResult.dominant_color as ColorKey);
          setSecondary(dbResult.secondary_color as ColorKey);

          // Restore cached jobs only after confirming this user has a personality result
          const data = loadData();
          const latestSearch = data.jobSearches[0];

          if (latestSearch?.query?.interests) {
            const restored = restoreContext(latestSearch.query.interests);
            setContextType(restored.contextType);
            setContext(restored.context);
          }

          const storedJobs = Array.isArray(latestSearch?.results?.jobs)
            ? (latestSearch.results.jobs as Job[])
            : [];
          const storedMarketInsight =
            typeof latestSearch?.results?.marketInsight === "string"
              ? latestSearch.results.marketInsight
              : "";

          if (storedJobs.length > 0) {
            setJobs(storedJobs);
            setMarketInsight(storedMarketInsight);
            setStep("results");
          }
        } else {
          // No DB results for this user — clear any stale cached data
          setDominant(null);
          setSecondary(null);
        }
      } catch {
        // Keep local fallback state.
      }
    };

    void syncData();

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthed, user]);

  const handleSearch = async () => {
    if (!dominant || !secondary) return;

    setStep("loading");
    setLoading(true);
    setError("");
    setJobs([]);
    setSelectedJobs([]);

    const contextText =
      contextType === "noIdea"
        ? NO_IDEA_CONTEXT
        : contextType === "studying"
          ? `${STUDYING_PREFIX}${context}`
          : `${WORKING_PREFIX}${context}`;

    try {
      const { getAccessToken } = await import("@/lib/supabase/session");
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Please login first to use this feature.");
      }

      const res = await fetch("/api/job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dominant,
          secondary,
          interests: contextText,
          location: "Remote / Global",
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "API request failed");
      }

      const data = await res.json();
      setJobs(data.jobs || []);
      setMarketInsight(data.marketInsight || "");
      saveJobSearch({ interests: contextText, location: "Remote" }, data);

      try {
        const subscription = await fetchServerSubscription();
        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });
        setPlanTier(subscription.tier);
        setCreditsLeft(getRemainingCredits());
      } catch {
        // Keep local fallback state.
      }

      setStep("results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search jobs. Please try again.";
      setError(message);
      setStep("context");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobSelection = (index: number) => {
    setSelectedJobs((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : prev.length < 3
          ? [...prev, index]
          : prev,
    );
  };

  const resetSearch = () => {
    setError("");
    setSelectedJobs([]);
    setStep("context");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-6 py-16 pt-24">
          <div className="h-8 w-48 rounded bg-accent animate-pulse mb-6" />
          <div className="h-28 rounded-xl bg-accent animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Checking session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-3">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login before using AI Job Matching.</p>
          <Link
            href="/auth?next=%2Fdashboard%2Fjobs"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Login or Sign up
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dominant) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-4">Take the Test First</h1>
          <p className="text-muted-foreground mb-8">
            Complete the personality test to get personalized job recommendations.
          </p>
          <Link
            href="/test"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Start the Test
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-6 py-16 pt-24 w-full">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{
              backgroundColor: colorHex[dominant || "blue"] + "20",
              color: colorHex[dominant || "blue"],
            }}
          >
            <Briefcase className="w-4 h-4" /> Agent B: The Hunter
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">AI Job Matching</h1>
          <p className="text-muted-foreground max-w-2xl">
            Based on your{" "}
            <span
              className="font-medium"
              style={{ color: colorHex[dominant || "blue"] }}
            >
              {personalityProfiles[dominant || "blue"].name}
            </span>{" "}
            personality, we will find roles that fit how you work, communicate, and grow.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Plan: {getPlanLabel(planTier)} | Credits left: {creditsLeft}</span>
          </div>
        </motion.div>

        <PremiumGate
          tier={planTier}
          onUnlock={(newTier, newCredits) => {
            setPlanTier(newTier);
            setCreditsLeft(newCredits);
            setStep(jobs.length > 0 ? "results" : "context");
          }}
          message="AI Job Matching requires premium credits."
        >
          {step === "context" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="bg-card rounded-2xl shadow-card p-6 border border-border/70">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Tell us about yourself</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Add a bit of context so Agent B can rank roles that fit both your personality and your current direction.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        key: "studying" as const,
                        label: "Studying",
                        desc: "Currently learning or in school",
                      },
                      {
                        key: "working" as const,
                        label: "Working",
                        desc: "Already have practical experience",
                      },
                      {
                        key: "noIdea" as const,
                        label: "Not sure",
                        desc: "Need broader recommendations",
                      },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setContextType(option.key)}
                        className={`p-4 rounded-xl text-center transition-all border ${
                          contextType === option.key
                            ? "border-personality-blue/50 bg-personality-blue/5 shadow-card"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <p className="text-sm font-semibold text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                      </button>
                    ))}
                  </div>

                  {contextType !== "noIdea" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <input
                        type="text"
                        value={context}
                        onChange={(event) => setContext(event.target.value)}
                        placeholder={
                          contextType === "studying"
                            ? "Computer Science, Marketing, Design..."
                            : "Software Development, Sales, Teaching..."
                        }
                        className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border focus:border-personality-blue/50 outline-none transition-colors"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-personality-blue/20 bg-linear-to-br from-personality-blue/10 via-background to-personality-yellow/10 p-6">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-personality-blue/10 blur-2xl" />
                  <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-personality-yellow/10 blur-2xl" />
                  <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    What you get
                  </p>
                  <div className="relative mt-4 space-y-4">
                    <div className="rounded-xl bg-background/80 p-4 border border-border/60">
                      <p className="text-sm font-semibold text-foreground">15 job paths</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ranked by personality fit, work style, and realistic market demand.
                      </p>
                    </div>
                    <div className="rounded-xl bg-background/80 p-4 border border-border/60">
                      <p className="text-sm font-semibold text-foreground">Selected-job handoff</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pick up to 3 targets and continue straight into CV Audit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">{error}</div>}

              <button
                onClick={handleSearch}
                disabled={loading || (contextType !== "noIdea" && !context.trim())}
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-40 transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Find Jobs That Fit My Personality
              </button>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 max-w-lg mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-personality-blue/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-personality-blue animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">AI Agent is Working</h2>
                <p className="text-sm text-muted-foreground">
                  Agent B is searching for roles that fit your {personalityProfiles[dominant || "blue"].name} profile.
                </p>
              </div>

              <div className="space-y-3">
                {AI_LOADING_STEPS.map((item, index) => {
                  const isActive = index === loadingStep;
                  const isDone = index < loadingStep;

                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-personality-blue/10 border border-personality-blue/20"
                          : isDone
                            ? "bg-accent/50"
                            : "opacity-40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-personality-blue/20"
                            : isDone
                              ? "bg-personality-blue/10"
                              : "bg-accent"
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 text-personality-blue" />
                        ) : isActive ? (
                          <item.icon className="w-4 h-4 text-personality-blue animate-pulse" />
                        ) : (
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6 h-2 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-personality-blue to-personality-yellow"
                  initial={{ width: 0 }}
                  animate={{ width: `${((loadingStep + 1) / AI_LOADING_STEPS.length) * 100}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Step {loadingStep + 1} of {AI_LOADING_STEPS.length}
              </p>
            </motion.div>
          )}

          {step === "results" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="bg-personality-blue/5 rounded-xl p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-personality-blue shrink-0" />
                  <p className="text-sm text-foreground">
                    Found <strong>{jobs.length} job types</strong>. Select up to <strong>3</strong> to continue to CV Audit.
                  </p>
                </div>

                <button
                  onClick={resetSearch}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-border hover:bg-accent font-medium transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Search
                </button>
              </div>

              {marketInsight && (
                <div className="bg-card rounded-xl shadow-card p-6">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Market Insight:</strong> {marketInsight}
                  </p>
                </div>
              )}

              {jobs.length === 0 ? (
                <div className="bg-card rounded-xl shadow-card p-6 text-sm text-muted-foreground">
                  No job matches were returned. Try a broader context or run the search again.
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 scroll-smooth">
                    {jobs.map((job, index) => {
                      const isSelected = selectedJobs.includes(index);

                      return (
                        <motion.div
                          key={`${job.title}-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleJobSelection(index)}
                          className={`bg-card rounded-xl shadow-card p-6 cursor-pointer transition-all border-2 ${
                            isSelected
                              ? "border-personality-blue/50 shadow-card-hover"
                              : "border-transparent hover:border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected ? "bg-personality-blue" : "bg-accent"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {job.company_type} | {job.seniority}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div
                                className="text-xl font-bold"
                                style={{ color: colorHex[dominant || "blue"] }}
                              >
                                {job.personalityFit}%
                              </div>
                              <p className="text-xs text-muted-foreground">fit</p>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{job.whyItFits}</p>

                          {job.salary_range && (
                            <p className="text-xs text-muted-foreground mb-3">Salary: {job.salary_range}</p>
                          )}

                          {job.requiredSkills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.requiredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs px-2 py-1 rounded-full bg-accent text-muted-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {selectedJobs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="sticky bottom-6 bg-card rounded-xl shadow-card-hover p-4 flex items-center justify-between border border-border gap-4"
                    >
                      <p className="text-sm text-foreground font-medium">{selectedJobs.length}/3 jobs selected</p>
                      <Link
                        href={`/dashboard/cv?jobs=${selectedJobs.map((index) => encodeURIComponent(jobs[index].title)).join(",")}`}
                        className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                      >
                        Proceed to CV Audit <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </PremiumGate>
      </div>
      <Footer />
    </div>
  );
}
