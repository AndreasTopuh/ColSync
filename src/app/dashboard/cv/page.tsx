"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileSearch,
  Upload,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Zap,
  Bot,
  Brain,
  Search,
  ListChecks,
  Sparkles,
  Check,
  Target,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loadData, saveCVAudit, saveRoadmap, setSubscription } from "@/lib/storage";
import { colorHex } from "@/lib/personality-data";
import { getPremiumStatus, getRemainingCredits, getPlanLabel } from "@/lib/premium";
import { fetchServerSubscription } from "@/lib/premium-api";
import { useAuth } from "@/hooks/useAuth";
import PremiumGate from "@/components/PremiumGate";

interface Gap {
  area: string;
  importance: string;
  suggestion: string;
}

interface Improvement {
  original: string;
  improved: string;
  reason: string;
}

interface AuditRoadmapWeek {
  week: number;
  focus: string;
  resources: string[];
  milestone: string;
}

interface AuditResult {
  matchScore: number;
  atsScore: number;
  strengths: string[];
  gaps: Gap[];
  sentenceImprovements: Improvement[];
  missingKeywords: string[];
  roadmap: AuditRoadmapWeek[];
}

interface UploadedDocument {
  name: string;
  mimeType: string;
  base64: string;
}

const CV_LOADING_STEPS = [
  { icon: Upload, label: "Reading your CV document...", duration: 2000 },
  { icon: Brain, label: "Reviewing your experience...", duration: 3000 },
  { icon: Search, label: "Scanning ATS keywords and structure...", duration: 3000 },
  { icon: ListChecks, label: "Comparing CV against target roles...", duration: 4000 },
  { icon: Bot, label: "Generating stronger bullet points...", duration: 3000 },
  { icon: Sparkles, label: "Building your learning roadmap...", duration: 2000 },
];

function parseRolesInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function CVAuditContent() {
  const searchParams = useSearchParams();
  const jobsParam = searchParams.get("jobs");
  const selectedJobsFromQuery = useMemo(
    () => (jobsParam ? jobsParam.split(",").map(decodeURIComponent).filter(Boolean) : []),
    [jobsParam],
  );

  const [cvText, setCvText] = useState("");
  const [targetRolesInput, setTargetRolesInput] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [tier, setTier] = useState<"free" | "starter5" | "pro20">("free");
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const { isAuthed, authChecked } = useAuth();

  useEffect(() => {
    const data = loadData();
    const storedSuggestions = (
      (data.jobSearches[0]?.results?.jobs as Array<{ title?: string }> | undefined) || []
    )
      .map((job) => job.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 6);

    setSuggestedRoles(storedSuggestions);
    setTier(getPremiumStatus().tier);
    setCreditsLeft(getRemainingCredits());

    if (selectedJobsFromQuery.length > 0) {
      setTargetRolesInput(selectedJobsFromQuery.join(", "));
    } else if (storedSuggestions.length > 0) {
      setTargetRolesInput(storedSuggestions.slice(0, 3).join(", "));
    }
  }, [selectedJobsFromQuery]);

  useEffect(() => {
    if (!authChecked || !isAuthed) return;

    let cancelled = false;

    const syncData = async () => {
      try {
        const subscription = await fetchServerSubscription();
        if (cancelled) return;

        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });

        setTier(subscription.tier);
        setCreditsLeft(getRemainingCredits());
      } catch {
        // Keep local fallback state.
      }
    };

    void syncData();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isAuthed]);

  useEffect(() => {
    if (!loading) return;

    setLoadingStep(0);
    let currentStep = 0;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const advanceStep = () => {
      currentStep += 1;
      if (currentStep < CV_LOADING_STEPS.length) {
        setLoadingStep(currentStep);
        timers.push(setTimeout(advanceStep, CV_LOADING_STEPS[currentStep].duration));
      }
    };

    timers.push(setTimeout(advanceStep, CV_LOADING_STEPS[0].duration));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [loading]);

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
          <p className="text-muted-foreground mb-6">Please login before using CV Audit.</p>
          <Link
            href="/auth?next=%2Fdashboard%2Fcv"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Login or Sign up
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result;
        if (typeof content !== "string") {
          reject(new Error("Could not read file."));
          return;
        }

        const base64 = content.split(",")[1];
        if (!base64) {
          reject(new Error("Could not encode file."));
          return;
        }

        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const readTextFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read text file."));
      reader.readAsText(file);
    });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setError("");
    setExtractingFile(true);

    try {
      const mimeType = file.type || "application/octet-stream";

      if (mimeType.startsWith("text/")) {
        const text = await readTextFile(file);
        setCvText(text);
        setUploadedDoc(null);
      } else {
        const base64 = await toBase64(file);
        setUploadedDoc({
          name: file.name,
          mimeType,
          base64,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process file.";
      setError(message);
      setUploadedDoc(null);
    } finally {
      setExtractingFile(false);
    }
  };

  const addSuggestedRole = (role: string) => {
    const existingRoles = parseRolesInput(targetRolesInput);
    if (existingRoles.includes(role)) return;
    setTargetRolesInput([...existingRoles, role].join(", "));
  };

  const handleAudit = async () => {
    if (!cvText.trim() && !uploadedDoc) return;

    setLoading(true);
    setError("");
    setResult(null);

    const normalizedRoles = parseRolesInput(targetRolesInput);
    const jobDescription =
      normalizedRoles.length > 0
        ? `Target positions: ${normalizedRoles.join(", ")}. Evaluate the CV for fit with these roles and suggest improvements.`
        : "Run a general CV audit for modern digital and knowledge-work roles. Identify strengths, gaps, ATS issues, and a practical learning roadmap.";

    try {
      const { getAccessToken } = await import("@/lib/supabase/session");
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Please login first to use this feature.");
      }

      const res = await fetch("/api/cv-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cvText: cvText.trim(),
          jobDescription,
          uploadedDoc,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "API request failed");
      }

      const data = (await res.json()) as AuditResult;
      setResult(data);

      saveCVAudit(
        data.matchScore || 0,
        data.atsScore || 0,
        normalizedRoles[0] || "General CV Audit",
        data as unknown as Record<string, unknown>,
      );

      const existingRoadmapWeeks = loadData().roadmap?.weeks || [];
      saveRoadmap(
        (data.roadmap || []).map((week) => {
          const existing = existingRoadmapWeeks.find((item) => item.week === week.week);
          return {
            week: week.week,
            focus: week.focus,
            resources: week.resources,
            milestone: week.milestone,
            completed: existing?.completed ?? false,
            note: existing?.note ?? "",
          };
        }),
      );

      try {
        const subscription = await fetchServerSubscription();
        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });
        setTier(subscription.tier);
        setCreditsLeft(getRemainingCredits());
      } catch {
        // Keep local fallback state.
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to audit CV. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#eab308";
    return "#ef4444";
  };

  const normalizedRoles = parseRolesInput(targetRolesInput);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-6 py-16 pt-24 w-full">
        <Link
          href="/dashboard/jobs"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Search
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ backgroundColor: colorHex.red + "20", color: colorHex.red }}
          >
            <FileSearch className="w-4 h-4" /> Agent C: The HR Expert
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">CV Audit and Analysis</h1>
          <p className="text-muted-foreground max-w-2xl">
            Upload or paste your resume, choose your target roles, and get a sharper ATS review plus a concrete learning roadmap.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Plan: {getPlanLabel(tier)} | Credits left: {creditsLeft}</span>
          </div>
        </motion.div>

        <PremiumGate
          tier={tier}
          onUnlock={(newTier, newCredits) => {
            setTier(newTier);
            setCreditsLeft(newCredits);
          }}
          message="CV Audit requires premium credits."
        >
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 max-w-lg mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-personality-red/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-personality-red animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">AI Agent is Working</h2>
                <p className="text-sm text-muted-foreground">Agent C is reviewing your CV against your target roles.</p>
              </div>

              <div className="space-y-3">
                {CV_LOADING_STEPS.map((item, index) => {
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
                          ? "bg-personality-red/10 border border-personality-red/20"
                          : isDone
                            ? "bg-accent/50"
                            : "opacity-40"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-personality-red/20"
                            : isDone
                              ? "bg-personality-red/10"
                              : "bg-accent"
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 text-personality-red" />
                        ) : isActive ? (
                          <item.icon className="w-4 h-4 text-personality-red animate-pulse" />
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
                  className="h-full bg-gradient-to-r from-personality-red to-personality-yellow"
                  initial={{ width: 0 }}
                  animate={{ width: `${((loadingStep + 1) / CV_LOADING_STEPS.length) * 100}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Step {loadingStep + 1} of {CV_LOADING_STEPS.length}
              </p>
            </motion.div>
          )}

          {!result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl shadow-card p-6 border border-border/70">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-personality-blue" />
                      <h3 className="font-semibold text-foreground">Target roles</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add one or more roles separated by commas. This page now works even if you open it directly without coming from Job Matching.
                    </p>
                    <input
                      type="text"
                      value={targetRolesInput}
                      onChange={(event) => setTargetRolesInput(event.target.value)}
                      placeholder="Frontend Developer, Product Designer, Data Analyst"
                      className="w-full h-12 px-4 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border focus:border-personality-blue/50 outline-none transition-colors"
                    />

                    {normalizedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {normalizedRoles.map((role) => (
                          <span
                            key={role}
                            className="text-sm px-3 py-1.5 rounded-full bg-personality-blue/10 font-medium"
                            style={{ color: colorHex.blue }}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card rounded-2xl shadow-card p-6 border border-border/70">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      <Upload className="w-3.5 h-3.5 inline mr-1" /> Your CV or Resume
                    </label>
                    <textarea
                      value={cvText}
                      onChange={(event) => setCvText(event.target.value)}
                      placeholder="Paste your full CV text here..."
                      rows={12}
                      className="w-full px-4 py-3 rounded-xl bg-accent text-foreground placeholder:text-muted-foreground border border-border focus:border-personality-blue/50 outline-none transition-colors resize-y text-sm"
                    />

                    <div className="mt-4">
                      <label className="text-xs text-muted-foreground block mb-1">Or upload file (PDF, image, TXT)</label>
                      <input
                        type="file"
                        accept=".pdf,image/*,.txt,.md"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-muted-foreground file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-border file:bg-card file:text-foreground"
                      />
                      {extractingFile && <p className="text-xs text-muted-foreground mt-2">Preparing file...</p>}
                      {uploadedDoc && (
                        <p className="text-xs text-personality-blue mt-2">
                          File ready: {uploadedDoc.name} ({uploadedDoc.mimeType})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-2xl border border-personality-red/20 bg-linear-to-br from-personality-red/10 via-background to-personality-yellow/10 p-6">
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-personality-red/10 blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-personality-yellow/10 blur-2xl" />
                    <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Output</p>
                    <div className="relative mt-4 space-y-4">
                      <div className="rounded-xl bg-background/80 p-4 border border-border/60">
                        <p className="text-sm font-semibold text-foreground">Match score</p>
                        <p className="mt-1 text-sm text-muted-foreground">See how close your CV is to the roles you want.</p>
                      </div>
                      <div className="rounded-xl bg-background/80 p-4 border border-border/60">
                        <p className="text-sm font-semibold text-foreground">ATS fixes</p>
                        <p className="mt-1 text-sm text-muted-foreground">Missing keywords, weak bullets, and structure gaps.</p>
                      </div>
                      <div className="rounded-xl bg-background/80 p-4 border border-border/60">
                        <p className="text-sm font-semibold text-foreground">Roadmap</p>
                        <p className="mt-1 text-sm text-muted-foreground">A multi-week learning plan saved automatically for the roadmap page.</p>
                      </div>
                    </div>
                  </div>

                  {suggestedRoles.length > 0 && (
                    <div className="bg-card rounded-2xl shadow-card p-6 border border-border/70">
                      <p className="text-sm font-semibold text-foreground mb-3">Suggested roles from your last search</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => addSuggestedRole(role)}
                            className="text-xs px-3 py-2 rounded-full bg-accent hover:bg-personality-blue/10 hover:text-personality-blue transition-colors"
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">{error}</div>}

              <button
                onClick={handleAudit}
                disabled={loading || extractingFile || (!cvText.trim() && !uploadedDoc)}
                className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-40 transition-all"
              >
                <FileSearch className="w-4 h-4 mr-2" /> Audit My CV
              </button>
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl shadow-card p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Match Score</p>
                  <p className="text-5xl font-bold" style={{ color: scoreColor(result.matchScore) }}>
                    {result.matchScore}%
                  </p>
                </div>
                <div className="bg-card rounded-xl shadow-card p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">ATS Score</p>
                  <p className="text-5xl font-bold" style={{ color: scoreColor(result.atsScore) }}>
                    {result.atsScore}%
                  </p>
                </div>
              </div>

              {result.strengths?.length > 0 && (
                <div className="bg-card rounded-xl shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-personality-blue" />
                    <h3 className="font-semibold text-foreground">What your CV already does well</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.strengths.map((strength) => (
                      <li key={strength} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-personality-blue/60 shrink-0 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.gaps?.length > 0 && (
                <div className="bg-card rounded-xl shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h3 className="font-semibold text-foreground">Gaps to address</h3>
                  </div>
                  <div className="space-y-4">
                    {result.gaps.map((gap) => (
                      <div key={`${gap.area}-${gap.importance}`} className="bg-accent rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              gap.importance === "high"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-personality-yellow/20 text-foreground"
                            }`}
                          >
                            {gap.importance}
                          </span>
                          <p className="text-sm font-medium text-foreground">{gap.area}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{gap.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.missingKeywords?.length > 0 && (
                <div className="bg-card rounded-xl shadow-card p-6">
                  <h3 className="font-semibold text-foreground mb-3">Missing keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.sentenceImprovements?.length > 0 && (
                <div className="bg-card rounded-xl shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-personality-blue" />
                    <h3 className="font-semibold text-foreground">Sentence improvements</h3>
                  </div>
                  <div className="space-y-4">
                    {result.sentenceImprovements.map((improvement, index) => (
                      <div key={`${improvement.original}-${index}`} className="bg-accent rounded-lg p-4">
                        <p className="text-xs text-destructive line-through mb-1">{improvement.original}</p>
                        <p className="text-sm text-foreground font-medium mb-1">{improvement.improved}</p>
                        <p className="text-xs text-muted-foreground">{improvement.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setResult(null)}
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all"
                >
                  Audit Another CV
                </button>
                <Link
                  href="/dashboard/roadmap"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                >
                  Continue to Roadmap <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>
          )}
        </PremiumGate>
      </div>
      <Footer />
    </div>
  );
}

export default function CVAuditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CVAuditContent />
    </Suspense>
  );
}
