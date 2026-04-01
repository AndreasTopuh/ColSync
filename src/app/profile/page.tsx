"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Crown,
  Sparkles,
  Briefcase,
  Heart,
  GraduationCap,
  Users,
  Baby,
  Edit3,
  Check,
  X,
  Shield,
  Calendar,
  Mail,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  setSubscription,
} from "@/lib/storage";
import {
  personalityProfiles,
  ColorKey,
  colorHex,
} from "@/lib/personality-data";
import {
  getPremiumStatus,
  getPlanLabel,
  getPlanLimit,
  getRemainingCredits,
} from "@/lib/premium";
import {
  fetchServerSubscription,
  fetchUserResults,
  fetchUserProfile,
  updateUserProfile,
  type UserResultRow,
} from "@/lib/premium-api";
import { getCurrentSession } from "@/lib/supabase/session";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function ProfilePage() {
  const router = useRouter();
  const [, setRefreshKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dbResults, setDbResults] = useState<UserResultRow[]>([]);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);

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
      setAuthChecked(true);
    };
    void checkSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authChecked && !isAuthed) router.push("/");
  }, [authChecked, isAuthed, router]);

  useEffect(() => {
    if (!authChecked || !isAuthed) return;
    let cancelled = false;
    const syncData = async () => {
      try {
        const [subscription, results, profile] = await Promise.all([
          fetchServerSubscription(),
          fetchUserResults(),
          fetchUserProfile(),
        ]);
        if (cancelled) return;
        setSubscription({
          tier: subscription.tier,
          creditsUsed: subscription.creditsUsed,
          unlockedAt: subscription.unlockedAt,
        });
        setDbResults(results);
        if (profile.fullName) {
          setProfileName(profile.fullName);
        }
        setRefreshKey((k) => k + 1);
      } catch {
        // keep local fallback
      }
    };
    void syncData();
    return () => { cancelled = true; };
  }, [authChecked, isAuthed]);

  /* ── Loading / auth guard ─────────────────────────── */

  if (!hydrated || !authChecked || !isAuthed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Loading profile…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── Data ──────────────────────────────────────────── */

  const status = getPremiumStatus();
  const tier = status.tier;
  const creditsLeft = getRemainingCredits();
  const planLimit = getPlanLimit(tier);

  const latestDbResult = dbResults[0] || null;
  const dominantColor = (latestDbResult?.dominant_color || null) as ColorKey | null;
  const profile = dominantColor ? personalityProfiles[dominantColor] : null;
  const hasResult = !!latestDbResult;

  // Extract percentages from DB result_data
  const dbResultData = latestDbResult?.result_data as Record<string, unknown> | null;
  const percentages = dbResultData?.percentages as Record<ColorKey, number> | undefined;

  const memberSince = "—";

  const userName = profileName || (userEmail ? userEmail.split("@")[0] : "Guest");
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* ── Handlers ─────────────────────────────────────── */

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === profileName) {
      setEditingName(false);
      return;
    }
    
    setIsSavingName(true);
    try {
      const newName = nameInput.trim();
      await updateUserProfile(newName);
      setProfileName(newName);
      setEditingName(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error("Failed to save name:", e);
      // Optional: show toast error
    } finally {
      setIsSavingName(false);
    }
  };

  const startEditing = () => {
    setNameInput(userName);
    setEditingName(true);
  };

  /* ── Tier badge colour ────────────────────────────── */

  const tierBadgeClass =
    tier === "pro20"
      ? "bg-personality-yellow/20 text-personality-yellow"
      : tier === "starter5"
        ? "bg-personality-blue/20 text-personality-blue"
        : "bg-accent text-muted-foreground";

  /* ── Percentage bars ──────────────────────────────── */
  // percentages already extracted from dbResultData above

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 pt-24">

        {/* ════════  HERO  ════════ */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center mb-10"
        >
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-background"
            style={{
              background: dominantColor
                ? `linear-gradient(135deg, ${colorHex[dominantColor]}, ${colorHex[dominantColor]}cc)`
                : "hsl(var(--accent))",
            }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: dominantColor === "yellow" ? "#1f2937" : "#fff" }}
            >
              {initials}
            </span>
          </div>

          {/* Name (editable) */}
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                autoFocus
                disabled={isSavingName}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="h-10 px-4 rounded-xl bg-accent text-foreground border border-border outline-none text-center font-semibold text-lg disabled:opacity-50"
              />
              <button disabled={isSavingName} onClick={handleSaveName} className="w-8 h-8 rounded-full bg-personality-blue/20 flex items-center justify-center text-personality-blue hover:bg-personality-blue/30 transition-colors disabled:opacity-50">
                {isSavingName ? <div className="w-4 h-4 rounded-full border-2 border-personality-blue border-t-transparent animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button disabled={isSavingName} onClick={() => setEditingName(false)} className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={startEditing} className="group flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{userName}</h1>
              <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <p className="text-sm text-muted-foreground mb-3">{userEmail || "No email"}</p>

          {/* Plan badge */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tierBadgeClass}`}>
            {getPlanLabel(tier)}
          </span>
        </motion.div>

        {/* ════════  ACCOUNT DETAILS  ════════ */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="bg-card rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" /> Account Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
              <span className="text-sm font-medium text-foreground truncate">{userEmail || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Plan</span>
              <span className="text-sm font-medium text-foreground">{getPlanLabel(tier)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Credits</span>
              <span className="text-sm font-medium text-foreground">{tier === "free" ? "—" : `${creditsLeft} / ${planLimit}`}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Member Since</span>
              <span className="text-sm font-medium text-foreground">{memberSince}</span>
            </div>
          </div>
          {tier !== "free" && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className="h-full bg-personality-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${planLimit === 0 ? 0 : (creditsLeft / planLimit) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* ════════  PERSONALITY OVERVIEW  ════════ */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="bg-card rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" /> Personality Overview
          </h2>

          {hasResult && profile && dominantColor ? (
            <>
              {/* Dominant badge */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colorHex[dominantColor] }}
                >
                  <span className="text-lg font-bold" style={{ color: dominantColor === "yellow" ? "#1f2937" : "#fff" }}>
                    {profile.name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{profile.name} — {profile.motive}</h3>
                  <p className="text-sm text-muted-foreground">{profile.summary}</p>
                </div>
              </div>

              {/* Colour distribution */}
              {percentages && (
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground mb-2">Colour Distribution</p>
                  <div className="space-y-2">
                    {(["red", "blue", "white", "yellow"] as ColorKey[]).map((c) => (
                      <div key={c} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorHex[c] }} />
                        <span className="text-xs text-muted-foreground capitalize w-12">{c}</span>
                        <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colorHex[c] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentages[c] ?? 0}%` }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground w-10 text-right">{percentages[c] ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              <div className="mb-2">
                <p className="text-xs text-muted-foreground mb-2">Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {profile.strengths.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${colorHex[dominantColor]}18`,
                        color: colorHex[dominantColor],
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Limitations */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 mt-4">Areas to Grow</p>
                <div className="flex flex-wrap gap-2">
                  {profile.limitations.map((l) => (
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full bg-accent text-muted-foreground font-medium">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4">Take the personality test to see your full profile here.</p>
              <a href="/test" className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-sm transition-all">
                Start the Test
              </a>
            </div>
          )}
        </motion.div>

        {/* ════════  CAREER STYLE  ════════ */}
        {hasResult && profile && dominantColor && (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" /> Career Style
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{profile.careerStyle}</p>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Ideal Roles</p>
              <div className="flex flex-wrap gap-2">
                {profile.idealRoles.map((r) => (
                  <span
                    key={r}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${colorHex[dominantColor]}18`,
                      color: colorHex[dominantColor],
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Work Environment</p>
              <p className="text-sm text-foreground">{profile.workEnvironment}</p>
            </div>
          </motion.div>
        )}

        {/* ════════  RELATIONSHIP INSIGHTS  ════════ */}
        {hasResult && profile && dominantColor && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="bg-card rounded-2xl shadow-card mb-6 overflow-hidden">
            <button
              onClick={() => setRelationshipsOpen(!relationshipsOpen)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-muted-foreground" /> Relationship Insights
              </h2>
              {relationshipsOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {relationshipsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-5">
                    {/* As Parent */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" /> As a Parent
                      </p>
                      <ul className="space-y-1.5">
                        {profile.asParent.map((t) => (
                          <li key={t} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorHex[dominantColor] }} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* As Child */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Baby className="w-3.5 h-3.5 text-muted-foreground" /> As a Child
                      </p>
                      <ul className="space-y-1.5">
                        {profile.asChild.map((t) => (
                          <li key={t} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorHex[dominantColor] }} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* As Spouse */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-muted-foreground" /> As a Spouse
                      </p>
                      <ul className="space-y-1.5">
                        {profile.asSpouse.map((t) => (
                          <li key={t} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorHex[dominantColor] }} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ════════  TEST HISTORY  ════════ */}
        {dbResults.length > 1 && (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="bg-card rounded-2xl shadow-card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" /> Test History
            </h2>
            <div className="space-y-3">
              {dbResults.slice(0, 6).map((r) => {
                const dc = r.dominant_color as ColorKey;
                const pp = personalityProfiles[dc];
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: colorHex[dc], color: dc === "yellow" ? "#1f2937" : "#fff" }}
                      >
                        {pp?.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{pp?.name || dc}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{pp?.motive}</span>
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
