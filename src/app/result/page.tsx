"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";
import { QuizResult, PersonalityHealth } from "@/lib/quiz-engine";

import { Download, RotateCcw, Share2, BookOpen, Briefcase, ArrowRight, Lock, Crown } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Confetti from "@/components/Confetti";

import { getCurrentSession } from "@/lib/supabase/session";
import { isPremium } from "@/lib/premium";

const colorKeys: ColorKey[] = ["red", "blue", "white", "yellow"];

const healthLabels: Record<PersonalityHealth, { label: string; desc: string; color: string }> = {
  thriving: {
    label: "Thriving",
    desc: "Your personality is well-balanced. You draw from multiple colors naturally.",
    color: "#22c55e",
  },
  growing: {
    label: "Growing",
    desc: "You have a clear dominant style with room to develop other traits.",
    color: "#eab308",
  },
  "at-risk": {
    label: "Focused",
    desc: "You lean heavily on one style. Consider exploring other personality strengths.",
    color: "#ef4444",
  },
};

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  const d = searchParams.get("d") as ColorKey | null;
  const s = searchParams.get("s") as ColorKey | null;
  const sr = searchParams.get("sr");
  const pr = searchParams.get("pr");
  const h = searchParams.get("h") as PersonalityHealth | null;

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (cancelled) return;
      setIsAuthed(Boolean(session));
      setHasPremium(isPremium());
      setAuthChecked(true);
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!d || !s) {
      router.push("/");
      return;
    }

    // Show confetti for everyone who has a result
    setShowConfetti(true);

    // Save result if authed
    if (isAuthed && sr && pr && h) {
      const scores = sr.split(",").map(Number);
      const percentages = pr.split(",").map(Number);
      const savedResult = {
        dominant: d,
        secondary: s,
        scores: Object.fromEntries(["red", "blue", "white", "yellow"].map((k, i) => [k, scores[i]])) as Record<ColorKey, number>,
        percentages: Object.fromEntries(["red", "blue", "white", "yellow"].map((k, i) => [k, percentages[i]])) as Record<ColorKey, number>,
        health: h,
      };

      // Save to database only (no localStorage)
      
      // Also save to database
      import("@/lib/supabase/session").then(async ({ getAccessToken }) => {
        const token = await getAccessToken();
        if (token) {
          fetch("/api/results", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dominant: savedResult.dominant,
              secondary: savedResult.secondary,
              scores: savedResult.scores,
              percentages: savedResult.percentages,
              health: savedResult.health,
            }),
          }).catch(console.error);
        }
      });
    }
  }, [authChecked, isAuthed, d, s, sr, pr, h, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking your session...</p>
      </div>
    );
  }

  if (!d || !s || !sr || !pr || !h) return null;

  const scores = sr.split(",").map(Number);
  const percentages = pr.split(",").map(Number);

  const result: QuizResult = {
    dominant: d,
    secondary: s,
    scores: Object.fromEntries(colorKeys.map((k, i) => [k, scores[i]])) as Record<ColorKey, number>,
    percentages: Object.fromEntries(colorKeys.map((k, i) => [k, percentages[i]])) as Record<ColorKey, number>,
    health: h,
  };

  const profile = personalityProfiles[result.dominant];
  const secondaryProfile = personalityProfiles[result.secondary];
  const healthInfo = healthLabels[result.health];

  const chartData = colorKeys.map((key) => ({
    trait: personalityProfiles[key].name,
    value: result.scores[key],
    fullMark: 20,
  }));

  const handleShare = async () => {
    const text = `I'm a ${profile.name} personality! My color mix: Red ${result.percentages.red}%, Blue ${result.percentages.blue}%, White ${result.percentages.white}%, Yellow ${result.percentages.yellow}%. Discover yours at ColSync!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Personality Color", text, url: window.location.origin });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(text + " " + window.location.origin);
    }
  };

  // Determine if user can see full results
  const canSeeFullResult = isAuthed && hasPremium;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti trigger={showConfetti} />
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto px-6 py-16 pt-24 w-full">
        {/* Hero result -always visible */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            className="relative w-36 h-36 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl opacity-50"
              style={{ backgroundColor: colorHex[result.dominant] }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: colorHex[result.dominant] }}
            >
              <motion.span
                className="text-4xl font-bold"
                style={{ color: result.dominant === "yellow" ? "#1f2937" : "#fff" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {profile.name[0]}
              </motion.span>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Your Dominant Personality
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            {profile.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {profile.summary}
          </motion.p>
        </motion.div>

        {/* Personality Health -always visible */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6 mb-8 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: healthInfo.color }} />
          <div>
            <p className="font-semibold text-foreground">{healthInfo.label}</p>
            <p className="text-sm text-muted-foreground">{healthInfo.desc}</p>
          </div>
        </motion.div>

        {/* Not logged in CTA */}
        {!isAuthed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-gradient-to-r from-personality-blue/10 to-personality-yellow/10 rounded-2xl p-8 mb-8 text-center border border-personality-blue/20">
            <Lock className="w-10 h-10 text-personality-blue mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Sign up to Save & Unlock Full Results</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Create a free account to save your results. Upgrade to see your full chart, strengths, growth areas, and career insights.</p>
            <Link href={`/auth?next=${encodeURIComponent(`/result?${searchParams.toString()}`)}`} className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">
              Login or Sign up <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        )}

        {/* Logged in but free tier */}
        {isAuthed && !hasPremium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-gradient-to-r from-personality-yellow/10 to-personality-red/10 rounded-2xl p-8 mb-8 text-center border border-personality-yellow/20">
            <Crown className="w-10 h-10 text-personality-yellow mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Upgrade to See Full Results</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Your basic result is saved! Unlock detailed charts, strengths, growth areas, career insights, PDF download, and AI career tools.</p>
            <Link href="/dashboard" className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">
              Go to Dashboard & Upgrade <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        )}

        {/* Full results -only for premium users */}
        {canSeeFullResult && (
          <>
            {/* Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-8 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Your Color Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="trait" tick={{ fontSize: 13, fill: "var(--color-muted-foreground)" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 20]} />
                  <Radar dataKey="value" stroke={colorHex[result.dominant]} fill={colorHex[result.dominant]} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {colorKeys.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-16 capitalize">{key}</span>
                    <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.percentages[key]}%` }}
                        transition={{ duration: 1, delay: 1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: colorHex[key] }}
                      />
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground w-8 text-right">{result.scores[key]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Motivation + Secondary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                <h3 className="font-semibold text-foreground mb-1">Core Motivation</h3>
                <p className="text-2xl font-semibold" style={{ color: colorHex[result.dominant] }}>{profile.motive}</p>
              </div>
              <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                <h3 className="font-semibold text-foreground mb-1">Secondary Color</h3>
                <p className="text-2xl font-semibold" style={{ color: colorHex[result.secondary] }}>{secondaryProfile.name}</p>
              </div>
            </motion.div>

            {/* Strengths + Growth */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                <h3 className="font-semibold text-foreground mb-3">Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((s) => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-accent text-foreground font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                <h3 className="font-semibold text-foreground mb-3">Growth Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.limitations.map((l) => (
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full bg-accent text-muted-foreground font-medium">{l}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Next Step CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }} className="bg-gradient-to-r from-personality-blue/10 to-personality-yellow/10 rounded-2xl p-8 mb-8 text-center border border-personality-blue/20">
              <Briefcase className="w-10 h-10 text-personality-blue mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Find Your Ideal Career?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Your personality results are saved. Let our AI agents find jobs that match who you are.</p>
              <Link href="/dashboard/jobs" className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">
                Continue to Career Matching <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </>
        )}

        {/* Blurred preview for free users who are logged in */}
        {isAuthed && !hasPremium && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="relative mb-8">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div className="text-center p-6">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Upgrade to Starter to unlock</p>
              </div>
            </div>
            <div className="opacity-30 pointer-events-none select-none space-y-6">
              <div className="bg-card rounded-xl p-8 h-48" />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl p-6 h-24" />
                <div className="bg-card rounded-xl p-6 h-24" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions -conditionally rendered */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          {canSeeFullResult && (
            <>
              <button
                onClick={async () => {
                  const { generateReport } = await import("@/lib/pdf-generator");
                  generateReport(result);
                }}
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all"
              >
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </button>
              <Link href={`/personality/${result.dominant}`} className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all">
                <BookOpen className="w-4 h-4 mr-2" /> Full Profile
              </Link>
            </>
          )}
          <button onClick={handleShare} className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </button>
          <Link href="/test" className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all">
            <RotateCcw className="w-4 h-4 mr-2" /> Retake
          </Link>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading results...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
