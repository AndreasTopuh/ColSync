"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";
import { ArrowLeft, Users, Baby, Heart, Briefcase } from "lucide-react";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const allColors: ColorKey[] = ["red", "blue", "white", "yellow"];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const key = params.color as ColorKey;
  const profile = personalityProfiles[key];

  useEffect(() => {
    if (!profile) router.push("/");
  }, [profile, router]);

  if (!profile) return null;

  const sectionAnim = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-16 pt-24">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <motion.div {...sectionAnim(0)} className="text-center mb-16">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ backgroundColor: colorHex[key] }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colorHex[key] }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: key === "yellow" ? "#1f2937" : "#fff" }}
              >
                {profile.name[0]}
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Personality Profile
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
            {profile.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {profile.summary}
          </p>
        </motion.div>

        {/* Motivation */}
        <motion.div
          {...sectionAnim(0.1)}
          className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-8 mb-8 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Core Motivation</p>
          <p className="text-3xl font-bold" style={{ color: colorHex[key] }}>
            {profile.motive}
          </p>
        </motion.div>

        {/* Strengths & Limitations */}
        <motion.div
          {...sectionAnim(0.2)}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <h3 className="font-semibold text-foreground mb-4">Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent text-foreground font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <h3 className="font-semibold text-foreground mb-4">Growth Areas</h3>
            <div className="flex flex-wrap gap-2">
              {profile.limitations.map((l) => (
                <span
                  key={l}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent text-muted-foreground font-medium"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Needs & Wants */}
        <motion.div
          {...sectionAnim(0.3)}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <h3 className="font-semibold text-foreground mb-3">Core Needs</h3>
            <ul className="space-y-2">
              {profile.needs.map((n) => (
                <li
                  key={n}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: colorHex[key] }}
                  />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <h3 className="font-semibold text-foreground mb-3">What You Want</h3>
            <ul className="space-y-2">
              {profile.wants.map((w) => (
                <li
                  key={w}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: colorHex[key] }}
                  />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Career Style */}
        <motion.div
          {...sectionAnim(0.35)}
          className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Career Style</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {profile.careerStyle}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.idealRoles.map((r) => (
              <span
                key={r}
                className="text-xs px-3 py-1.5 rounded-full bg-accent text-foreground font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Relationship roles */}
        <motion.div
          {...sectionAnim(0.4)}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">As a Parent</h3>
            </div>
            <ul className="space-y-1.5">
              {profile.asParent.map((t) => (
                <li key={t} className="text-sm text-muted-foreground">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">As a Child</h3>
            </div>
            <ul className="space-y-1.5">
              {profile.asChild.map((t) => (
                <li key={t} className="text-sm text-muted-foreground">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-[var(--shadow-card-val)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">As a Spouse</h3>
            </div>
            <ul className="space-y-1.5">
              {profile.asSpouse.map((t) => (
                <li key={t} className="text-sm text-muted-foreground">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Other colors */}
        <motion.div {...sectionAnim(0.5)}>
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            Explore Other Colors
          </h3>
          <div className="flex justify-center gap-4">
            {allColors
              .filter((c) => c !== key)
              .map((c) => (
                <Link
                  key={c}
                  href={`/personality/${c}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card shadow-[var(--shadow-card-val)] hover:shadow-[var(--shadow-hover-val)] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{ backgroundColor: colorHex[c] }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {personalityProfiles[c].name}
                  </span>
                </Link>
              ))}
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <Link
            href="/test"
            className="inline-flex items-center justify-center h-14 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
          >
            Take the Test
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
