"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";
import {
  getCompatibility,
  CompatibilityResult,
} from "@/lib/compatibility-data";
import {
  Heart,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const colors: ColorKey[] = ["red", "blue", "white", "yellow"];

export default function CompatibilityPage() {
  const [color1, setColor1] = useState<ColorKey | null>(null);
  const [color2, setColor2] = useState<ColorKey | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const handleCheck = () => {
    if (color1 && color2) {
      setResult(getCompatibility(color1, color2));
    }
  };

  const handleReset = () => {
    setColor1(null);
    setColor2(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-16 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-muted-foreground text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            Compatibility Checker
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Color Compatibility
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Discover how two personality colors interact in relationships, teams,
            and friendships.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                    Person 1
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor1(c)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          color1 === c
                            ? "border-foreground shadow-[var(--shadow-hover-val)] scale-[1.02]"
                            : "border-transparent bg-card shadow-[var(--shadow-card-val)] hover:shadow-[var(--shadow-hover-val)]"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: colorHex[c] }}
                        />
                        <p className="text-sm font-medium text-foreground">
                          {personalityProfiles[c].name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {personalityProfiles[c].motive}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                    Person 2
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor2(c)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          color2 === c
                            ? "border-foreground shadow-[var(--shadow-hover-val)] scale-[1.02]"
                            : "border-transparent bg-card shadow-[var(--shadow-card-val)] hover:shadow-[var(--shadow-hover-val)]"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: colorHex[c] }}
                        />
                        <p className="text-sm font-medium text-foreground">
                          {personalityProfiles[c].name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {personalityProfiles[c].motive}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  disabled={!color1 || !color2}
                  onClick={handleCheck}
                  className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Check Compatibility{" "}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: colorHex[color1!],
                      color: color1 === "yellow" ? "#1f2937" : "#fff",
                    }}
                  >
                    {personalityProfiles[color1!].name[0]}
                  </div>
                  <Heart className="w-6 h-6 text-muted-foreground" />
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{
                      backgroundColor: colorHex[color2!],
                      color: color2 === "yellow" ? "#1f2937" : "#fff",
                    }}
                  >
                    {personalityProfiles[color2!].name[0]}
                  </div>
                </div>

                {/* Score ring */}
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={colorHex[color1!]}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.score / 10) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {result.score}/10
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {result.title}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {result.description}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-personality-yellow" />
                    <h3 className="font-semibold text-foreground">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.strengths.map((s) => (
                      <li
                        key={s}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-personality-blue" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-personality-red" />
                    <h3 className="font-semibold text-foreground">
                      Challenges
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {result.challenges.map((c) => (
                      <li
                        key={c}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-personality-red" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-personality-yellow" />
                    <h3 className="font-semibold text-foreground">Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.tips.map((t) => (
                      <li
                        key={t}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-personality-yellow" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center h-14 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all"
                >
                  Try Another Pair
                </button>
                <Link
                  href="/test"
                  className="inline-flex items-center justify-center h-14 px-8 rounded-xl border border-border hover:bg-accent font-medium transition-all"
                >
                  Take the Test
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
