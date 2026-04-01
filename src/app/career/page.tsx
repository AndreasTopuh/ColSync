"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Lightbulb,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Bot,
} from "lucide-react";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";
import { getCareerInsight } from "@/lib/career-data";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


function CareerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dominant = searchParams.get("d") as ColorKey | null;
  const secondary = searchParams.get("s") as ColorKey | null;

  if (!dominant || !personalityProfiles[dominant]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Take the personality test first to see your career insights.
          </p>
          <Link
            href="/test"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Take the Test
          </Link>
        </div>
      </div>
    );
  }

  const profile = personalityProfiles[dominant];
  const insight = getCareerInsight(dominant);
  const secondaryProfile = secondary ? personalityProfiles[secondary] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-16 pt-24">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-muted-foreground text-sm font-medium mb-6">
            <Briefcase className="w-4 h-4" />
            Career Insights
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Careers for{" "}
            <span style={{ color: colorHex[dominant] }}>{profile.name}</span>{" "}
            Personalities
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {insight.workStyle}
          </p>
          {secondaryProfile && (
            <p className="text-sm text-muted-foreground mt-3">
              With{" "}
              <span
                className="font-medium"
                style={{ color: colorHex[secondary!] }}
              >
                {secondaryProfile.name}
              </span>{" "}
              as your secondary color, you also bring{" "}
              {secondaryProfile.strengths.slice(0, 3).join(", ").toLowerCase()}{" "}
              to your work.
            </p>
          )}
        </motion.div>

        {/* Work Environment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-8 mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">
              Ideal Work Environment
            </h2>
          </div>
          <p className="text-muted-foreground">{insight.idealEnvironment}</p>
        </motion.div>

        {/* Natural Strengths + Development */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-personality-yellow" />
              <h3 className="font-semibold text-foreground">
                Natural Work Strengths
              </h3>
            </div>
            <ul className="space-y-2">
              {insight.naturalStrengths.map((s) => (
                <li
                  key={s}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: colorHex[dominant] }}
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-personality-blue" />
              <h3 className="font-semibold text-foreground">
                Development Areas
              </h3>
            </div>
            <ul className="space-y-2">
              {insight.developmentAreas.map((d) => (
                <li
                  key={d}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-muted-foreground/40" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Career Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Recommended Career Paths
          </h2>

          <div className="space-y-6">
            {insight.categories.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" style={{ color: colorHex[dominant] }} />
                  <h3 className="text-lg font-semibold text-foreground">
                    {cat.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {cat.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Ideal Roles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.roles.map((r) => (
                        <span
                          key={r}
                          className="text-xs px-3 py-1.5 rounded-full bg-accent text-foreground font-medium"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Key Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-3 py-1.5 rounded-full bg-accent text-muted-foreground font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Agent CTA -Future feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-personality-blue/10 via-card to-personality-yellow/10 rounded-2xl p-8 md:p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
            <Bot className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            AI Career Matching
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Our AI agent will search real job listings that match your personality, review your CV, and create a personalized learning roadmap.
          </p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Find Matching Jobs
          </Link>
        </motion.div>

        <div className="text-center mt-12">
          <Link
            href="/test"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl border border-border hover:bg-accent font-medium transition-all"
          >
            Retake the Test
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CareerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading career insights...</p>
        </div>
      }
    >
      <CareerContent />
    </Suspense>
  );
}
