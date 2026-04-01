"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  FileSearch,
  Target,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Crown,
  Check,
  Zap,
  Brain,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { personalityProfiles, ColorKey, colorHex } from "@/lib/personality-data";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const stats = [
  { value: "73%", label: "of workers feel disengaged due to job mismatch", icon: AlertTriangle },
  { value: "85%", label: "choose jobs based on demand, not personal fit", icon: Users },
  { value: "2.5x", label: "more productive when personality aligns with role", icon: Zap },
  { value: "94%", label: "accuracy in our AI career matching system", icon: Target },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(232,121,121,0.12),transparent)]" />
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-personality-blue/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-personality-yellow/6 blur-[100px]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center pt-24 pb-16">
          {/* Left: Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-personality-blue/10 border border-personality-blue/20 text-sm font-medium text-personality-blue mb-8"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Career Discovery
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6"
            >
              Sync Your{" "}
              <span className="bg-gradient-to-r from-personality-red via-personality-blue to-personality-yellow bg-clip-text text-transparent">
                Personality
              </span>
              <br />
              With Your Career
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-10"
            >
              ColSync is not just a personality test — it&apos;s your AI-powered career companion that helps you find work that truly fits who you are.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/test"
                className="inline-flex items-center justify-center h-14 px-10 text-base rounded-2xl bg-gradient-to-r from-personality-red via-personality-blue to-personality-yellow text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                Start Free Test <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => document.getElementById("the-problem")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center h-14 px-10 text-base rounded-2xl border border-border hover:bg-accent font-medium transition-all duration-300"
              >
                Why This Matters
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Free to Start</span>
              <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" /> AI-Powered</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Instant Results</span>
            </motion.div>
          </div>

          {/* Right: Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-personality-red/20 via-personality-blue/20 to-personality-yellow/20 rounded-3xl blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="/images/hero_person.png"
                alt="Professional discovering their career path with ColSync"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Floating stats card */}
              <div className="absolute bottom-6 left-6 right-6 bg-background/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-personality-blue/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-personality-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Career Match</p>
                      <p className="text-sm font-bold text-foreground">94% Accuracy</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {(["red", "blue", "white", "yellow"] as ColorKey[]).map((c) => (
                      <div key={c} className="w-6 h-6 rounded-full border-2 border-background" style={{ backgroundColor: colorHex[c] }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="py-16 px-6 border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <stat.icon className="w-6 h-6 mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-personality-red to-personality-blue bg-clip-text text-transparent mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ PROBLEM SECTION ═══════ */}
      <section id="the-problem" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" /> The Real Problem
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Most People Work Jobs That Don&apos;t Fit Who They Are
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Right now, millions of job seekers are confused about what kind of work truly suits them. They pick careers based on market demand, salary, or family pressure — without ever understanding their own personality.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-personality-red/10 to-personality-blue/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image
                  src="/images/personality_colors_1774245488128.png"
                  alt="Four personality color profiles"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            {/* Comparison cards */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border"
              >
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-foreground">Traditional Approach</h3>
                </div>
                <ul className="space-y-3">
                  {["Take a generic personality quiz", "Get a vague description", "Search for jobs on your own", "No guidance on CV or fit"].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-destructive/50 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-card border-2 border-personality-blue/30 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-personality-blue/20 to-personality-yellow/20 text-xs font-medium rounded-bl-xl text-foreground">
                  ColSync
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-personality-blue" />
                  <h3 className="text-lg font-semibold text-foreground">The ColSync Way</h3>
                </div>
                <ul className="space-y-3">
                  {["Deep personality assessment with career mapping", "AI creates your detailed persona", "AI auto-suggests matching jobs", "CV audit + learning roadmap"].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-personality-blue/80 shrink-0 mt-0.5" /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              From Self-Discovery to{" "}
              <span className="bg-gradient-to-r from-personality-blue to-personality-yellow bg-clip-text text-transparent">Dream Career</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Your journey in 4 simple steps.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "Take the Test", desc: "20-question personality assessment based on the Hartman Color Code. Discover your dominant and secondary colors.", color: colorHex.red, free: true, step: "01" },
              { icon: Target, title: "AI Career Match", desc: "Our AI Profiler creates your career persona and auto-suggests jobs that align with your personality.", color: colorHex.blue, free: false, step: "02" },
              { icon: FileSearch, title: "CV Audit", desc: "Upload your CV and let our AI HR Expert audit it against your matched job descriptions.", color: "#9ca3af", free: false, step: "03" },
              { icon: GraduationCap, title: "Learning Roadmap", desc: "Get a gamified weekly plan with milestones to close your skill gaps and land your dream role.", color: colorHex.yellow, free: false, step: "04" },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative bg-card rounded-2xl p-6 border border-border hover:border-personality-blue/30 hover:shadow-xl transition-all duration-300"
              >
                {!step.free && (
                  <span className="absolute top-4 right-4 text-xs font-medium px-2 py-0.5 rounded-full bg-personality-yellow/20 text-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro
                  </span>
                )}
                <span className="text-5xl font-black text-accent/50 group-hover:text-personality-blue/20 transition-colors absolute top-4 left-6">
                  {step.step}
                </span>
                <div className="relative pt-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: step.color + "18" }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Process illustration */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-personality-red/5 via-personality-blue/5 to-personality-yellow/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
              <Image
                src="/images/career_matching_1774245505445.png"
                alt="AI-powered career matching system connecting personality to jobs"
                width={1200}
                height={500}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ FEATURES SHOWCASE ═══════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Powered by 3 AI Agents
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Specialized AI for accurate, personalized career guidance.
            </p>
          </motion.div>

          {/* Feature 1: The Profiler */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center mb-20"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-personality-red/10 text-personality-red text-xs font-semibold mb-4">
                Agent A
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">The Profiler</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Analyzes your personality test results and creates a detailed career persona. Maps your strengths, motivations, and ideal work environments to matching job categories.
              </p>
              <ul className="space-y-3">
                {["Deep personality analysis", "Career persona creation", "Job category mapping", "Strength identification"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-personality-red shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-personality-red/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image
                  src="/images/hero_illustration_1774245469131.png"
                  alt="AI Profiler analyzing personality data"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>

          {/* Feature 2: The Hunter (reversed) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center mb-20"
          >
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-personality-blue/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image
                  src="/images/cv_audit_illustration_1774245538784.png"
                  alt="AI CV Audit scanning resume for improvement"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-personality-blue/10 text-personality-blue text-xs font-semibold mb-4">
                Agent B
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">The Hunter</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Auto-suggests real jobs that align with your personality — no manual searching needed. Our AI scans and matches opportunities that fit who you truly are.
              </p>
              <ul className="space-y-3">
                {["Auto-suggested job matches", "Personality-aligned results", "Real job listings", "Smart filtering"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-personality-blue shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Feature 3: The HR Expert */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-personality-yellow/10 text-personality-yellow text-xs font-semibold mb-4">
                Agent C
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">The HR Expert</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Audits your CV against job descriptions, identifies keyword gaps, checks ATS compatibility, and creates a personalized weekly learning roadmap to close your skill gaps.
              </p>
              <ul className="space-y-3">
                {["CV vs Job analysis", "ATS compatibility check", "Weekly learning roadmap", "Gamified progress tracking"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-personality-yellow shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-personality-yellow/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image
                  src="/images/learning_roadmap_1774245565366.png"
                  alt="Gamified learning roadmap with milestones"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ PERSONALITY COLORS ═══════ */}
      <section className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              The Four Personality Colors
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Each color represents a core drive that shapes how you work, relate, and thrive.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(personalityProfiles) as ColorKey[]).map((key, i) => {
              const p = personalityProfiles[key];
              return (
                <motion.div
                  key={key}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/personality/${key}`}
                    className="group block bg-card rounded-2xl p-6 border border-border hover:border-opacity-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
                    style={{ ["--hover-color" as string]: colorHex[key] + "30" }}
                  >
                    <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center" style={{ backgroundColor: colorHex[key] + "18" }}>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: colorHex[key] }} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{p.name}</h3>
                    <p className="text-sm font-semibold mb-3" style={{ color: colorHex[key] }}>{p.motive}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.strengths.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: colorHex[key] + "15", color: colorHex[key] }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">Start free, then unlock AI-powered career tools when you&apos;re ready.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-7 border border-border hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Free</h3>
              <p className="text-4xl font-black text-foreground mb-1">$0</p>
              <p className="text-sm text-muted-foreground mb-6">Forever free</p>
              <ul className="space-y-3 mb-8">
                {["Full personality test (20 questions)", "Basic result (dominant & secondary color)"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-personality-blue shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/test" className="block text-center h-12 leading-[3rem] rounded-xl border border-border hover:bg-accent font-medium transition-all">
                Start Free Test
              </Link>
            </motion.div>

            {/* Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-7 border-2 border-personality-blue/30 relative hover:shadow-xl transition-all"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-personality-blue text-xs font-bold text-white">
                POPULAR
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Starter</h3>
              <p className="text-4xl font-black text-foreground mb-1">
                5 <span className="text-base font-normal text-muted-foreground">AI credits</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">Unlock with code</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free",
                  "Full detailed results & chart",
                  "PDF report download",
                  "Full personality profile page",
                  "AI Job Matching",
                  "CV Audit & ATS feedback",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-personality-blue shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="block text-center h-12 leading-[3rem] rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">
                Get Starter
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-7 border-2 border-personality-yellow/30 relative hover:shadow-xl transition-all"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-personality-blue to-personality-yellow text-xs font-bold text-white">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-personality-yellow" /> Pro
              </h3>
              <p className="text-4xl font-black text-foreground mb-1">
                20 <span className="text-base font-normal text-muted-foreground">AI credits</span>
              </p>
              <p className="text-sm text-muted-foreground mb-6">Unlock with code</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Starter",
                  "Personalized learning roadmap",
                  "Gamified progress tracking",
                  "AI feedback on learning notes",
                  "Roadmap updates & skill tracking",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-personality-yellow shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="block text-center h-12 leading-[3rem] rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all">
                Get Pro
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-personality-red/5 via-personality-blue/8 to-personality-yellow/5" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <Image
            src="/logo_trans.png"
            alt="ColSync"
            width={64}
            height={64}
            className="mx-auto mb-8 rounded-full animate-[float_6s_ease-in-out_infinite]"
          />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Ready to Find Your{" "}
            <span className="bg-gradient-to-r from-personality-red via-personality-blue to-personality-yellow bg-clip-text text-transparent">
              True Career Path
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands who have discovered careers that match who they truly are. Start with a free personality test — it only takes 5 minutes.
          </p>
          <Link
            href="/test"
            className="inline-flex items-center justify-center h-16 px-12 text-lg rounded-2xl bg-gradient-to-r from-personality-red via-personality-blue to-personality-yellow text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          >
            Start Your Journey <ArrowRight className="w-5 h-5 ml-3" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
