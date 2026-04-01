"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { questions, testInstructions } from "@/lib/questions";
import { calculateResult } from "@/lib/quiz-engine";

// Simple explanations for each trait -NO color info shown
const traitExplanations: Record<string, string> = {
  "Ambitious": "You set big goals and work hard to reach them.",
  "Thoughtful": "You think deeply before acting and care about details.",
  "Easygoing": "You stay relaxed and go with the flow in most situations.",
  "Energetic": "You bring excitement and enthusiasm wherever you go.",
  "Results-focused": "You care most about getting things done efficiently.",
  "Detail-oriented": "You pay close attention to accuracy and precision.",
  "Flexible": "You adapt easily to change and different situations.",
  "Spontaneous": "You act on impulse and enjoy surprises.",
  "Takes charge easily": "You naturally step up to lead in group settings.",
  "Cares deeply for others": "You feel strong empathy and concern for people around you.",
  "Goes with the flow": "You prefer to follow rather than lead, keeping things smooth.",
  "Lights up the room": "You have a natural ability to make others feel positive.",
  "Can be too direct": "You sometimes come across as blunt or forceful.",
  "Can be too cautious": "You sometimes overthink and hesitate before acting.",
  "Can be too passive": "You sometimes avoid action when it's needed.",
  "Can be too scattered": "You sometimes lose focus or jump between things.",
  "Makes quick decisions": "You trust your instincts and decide fast.",
  "Stays committed to promises": "You take your word seriously and follow through.",
  "Remains calm under pressure": "You keep your cool when things get stressful.",
  "Finds fun in everything": "You see the lighter side of life in any situation.",
  "Can seem intimidating": "Others sometimes feel nervous around your strong presence.",
  "Worries about what could go wrong": "You tend to anticipate problems before they happen.",
  "Avoids difficult conversations": "You prefer to keep things peaceful rather than confront.",
  "Gets bored with routine": "Repetitive tasks make you feel restless.",
  "Speaks up confidently": "You express your opinions clearly and without hesitation.",
  "Listens before responding": "You take time to understand before giving your answer.",
  "Sees all sides of an issue": "You naturally consider multiple perspectives.",
  "Connects with anyone instantly": "You make friends easily in any situation.",
  "Pushes others to perform": "You motivate people to do their best work.",
  "Holds themselves to high standards": "You expect excellence from yourself.",
  "Lets others take the lead": "You're comfortable supporting rather than leading.",
  "Uses humor to ease tension": "You lighten the mood when things get serious.",
  "Wants to win and achieve": "Success and accomplishment drive you.",
  "Wants to understand and analyze": "You're motivated by learning and deep understanding.",
  "Wants peace and stability": "You value a calm, steady life.",
  "Wants excitement and variety": "You crave new experiences and change.",
  "Points out what's not working": "You quickly notice problems and speak up about them.",
  "Feels things more intensely than most": "Your emotions run deep.",
  "Holds back from sharing opinions": "You keep your thoughts to yourself to avoid conflict.",
  "Talks more than they listen": "You tend to dominate conversations.",
  "Persistent until the goal is reached": "You don't give up until you succeed.",
  "Notices details others miss": "You catch things that slip past most people.",
  "Genuinely interested in others' stories": "You enjoy listening to and learning about people.",
  "The life of the gathering": "You're the center of energy in social situations.",
  "Expects a lot from themselves and others": "You set high bars for everyone.",
  "Struggles to let go of past mistakes": "You replay errors in your head.",
  "Needs a push to get started": "You sometimes need external motivation to begin.",
  "Cares about how others see them": "Public perception matters a lot to you.",
  "Takes ownership of outcomes": "You accept full responsibility for results.",
  "Driven by ideals and principles": "Your values guide your decisions.",
  "Thinks of others before themselves": "You're naturally selfless.",
  "Naturally cheerful and upbeat": "Your default mood is positive.",
  "Frustrated by slow progress": "Delays and inefficiency bother you.",
  "Affected by the mood of others": "Other people's emotions influence yours.",
  "Waits for things to sort themselves out": "You trust that problems resolve on their own.",
  "Acts first, plans later": "You jump into action before thinking it through.",
  "Stands firm on their beliefs": "You don't easily change your mind.",
  "Treats everyone with care and respect": "You're kind to everyone you meet.",
  "Patient even in frustrating situations": "You stay calm when others would lose patience.",
  "Always looking for the next adventure": "You constantly seek new experiences.",
  "Debates to find the best answer": "You enjoy discussing ideas to find the truth.",
  "Sets expectations that may be unreachable": "Your standards can be impossibly high.",
  "Unsure of what direction to take": "You sometimes feel lost about your path.",
  "Jumps into conversations eagerly": "You love joining in and sharing your thoughts.",
  "Thrives under competition": "Rivalry and challenges fuel you.",
  "Values trust above all else": "Loyalty and honesty are your top priorities.",
  "Prefers cooperation over competition": "You'd rather work together than compete.",
  "Brings people together effortlessly": "You're a natural unifier.",
  "Frustrated when others lack drive": "Low motivation in others bothers you.",
  "Disappointed when others break trust": "Betrayal hits you especially hard.",
  "Uncomfortable when pushed too fast": "You prefer to move at your own pace.",
  "Restless when forced to sit still": "You feel uneasy without activity.",
  "Values competence and skill": "Being good at what you do matters most.",
  "Values depth and meaning": "Surface-level things don't satisfy you.",
  "Values kindness and gentleness": "Being caring is your highest priority.",
  "Values laughter and connection": "Joy and relationships drive your life.",
  "Would rather lead than follow": "You prefer being in charge.",
  "Would rather perfect than rush": "Quality matters more than speed to you.",
  "Would rather observe than participate": "You prefer watching before joining in.",
  "Would rather explore than settle": "You choose adventure over stability.",
};

export default function TestPage() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Array<string | null>>(
    Array.from({ length: questions.length }, () => null)
  );
  const [expandedOpt, setExpandedOpt] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const router = useRouter();

  const question = questions[currentQ];
  const selected = answers[currentQ];
  const answeredCount = answers.filter(Boolean).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleSelect = useCallback(
    (key: string) => {
      const next = [...answers];
      next[currentQ] = key;
      setAnswers(next);
      setExpandedOpt(null);
      setFormError("");
    },
    [answers, currentQ]
  );

  const handleNext = useCallback(() => {
    if (!selected) {
      setFormError("Please select an answer before continuing.");
      return;
    }

    if (currentQ + 1 >= questions.length) {
      const completedAnswers = answers.filter((answer): answer is string => Boolean(answer));
      if (completedAnswers.length !== questions.length) {
        setFormError("Masih ada jawaban kosong. Silakan cek kembali.");
        return;
      }

      const result = calculateResult(completedAnswers);
      const params = new URLSearchParams({
        d: result.dominant,
        s: result.secondary,
        sr: Object.values(result.scores).join(","),
        pr: Object.values(result.percentages).join(","),
        h: result.health,
      });
      router.push(`/result?${params.toString()}`);
      return;
    }

    setCurrentQ((q) => q + 1);
  }, [selected, currentQ, answers, router]);

  const handleBackQuestion = useCallback(() => {
    setFormError("");
    setCurrentQ((q) => Math.max(0, q - 1));
  }, []);

  // Instructions screen
  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg text-center"
        >
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-foreground/20 to-foreground/5 mx-auto mb-8 flex items-center justify-center">
            <span className="text-2xl">🧠</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Before You Start
          </h1>
          <p className="text-muted-foreground mb-8">
            Keep these tips in mind for the most accurate results:
          </p>

          <div className="space-y-4 mb-10 text-left">
            {testInstructions.map((instruction, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-card rounded-xl p-4 shadow-card"
              >
                <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{instruction}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center justify-center h-14 px-10 text-base rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all duration-300 w-full sm:w-auto"
          >
            I&apos;m Ready -Start the Test
          </button>

          <Link
            href="/"
            className="block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar -neutral */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-accent z-50">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {currentQ + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 tracking-tight">
                Question {question.id}
              </h2>
              <p className="text-muted-foreground mb-8">
                Which description fits you best?
              </p>

              <div className="space-y-3">
                {question.options.map((opt) => {
                  const explanation = traitExplanations[opt.text];
                  return (
                    <div key={opt.key}>
                      <button
                        onClick={() => handleSelect(opt.key)}
                        className={`w-full text-left px-6 py-4 rounded-xl bg-card shadow-card
                          hover:shadow-card-hover transition-all duration-200 flex items-center gap-4
                          ${
                            selected === opt.key
                              ? "ring-2 ring-foreground/30 bg-accent"
                              : "hover:bg-accent/50"
                          }
                        `}
                      >
                        <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {opt.key}
                        </span>
                        <span className="font-medium text-foreground flex-1">
                          {opt.text}
                        </span>
                        {explanation && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedOpt(expandedOpt === opt.key ? null : opt.key);
                            }}
                            className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 cursor-pointer hover:bg-muted"
                          >
                            {expandedOpt === opt.key ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedOpt === opt.key && explanation && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-6 mt-1 px-4 py-3 rounded-b-xl bg-accent/50 text-xs text-muted-foreground">
                              💡 {explanation}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={handleBackQuestion}
                  disabled={currentQ === 0}
                  className="h-11 px-5 rounded-xl border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="h-11 px-5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all"
                >
                  {currentQ + 1 === questions.length ? "Submit Test" : "Submit & Next"}
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Answered: {answeredCount}/{questions.length}
              </p>
              {formError && <p className="text-xs text-destructive mt-2">{formError}</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
