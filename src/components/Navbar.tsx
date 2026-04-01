"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Menu, X, LayoutDashboard, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AuthModal from "./AuthModal";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAccessToken, signOut } from "@/lib/supabase/session";

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const refreshAdminState = async (hasSession: boolean) => {
    if (!hasSession) {
      setIsAdmin(false);
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setIsAdmin(false);
        return;
      }

      const res = await fetch("/api/admin/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json().catch(() => null)) as { isAdmin?: boolean } | null;
      setIsAdmin(Boolean(data?.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      const hasSession = Boolean(data.session);
      setIsAuthed(hasSession);
      void refreshAdminState(hasSession);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const hasSession = Boolean(session);
      setIsAuthed(hasSession);
      void refreshAdminState(hasSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <Image src="/logo_trans.png" alt="ColSync" width={28} height={28} className="rounded-full" />
            ColSync
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/compatibility"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              Compatibility
            </Link>
            {isAuthed && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
            {isAuthed && (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Profile
              </Link>
            )}
            {isAuthed && isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}
            <Link
              href="/test"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Take the Test →
            </Link>
            {!hydrated ? null : isAuthed ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-sm font-medium px-4 py-2 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all"
              >
                Login
              </button>
            )}
            {hydrated ? <ThemeToggle /> : null}
          </div>

          {/* Mobile toggle */}
          <div className="flex sm:hidden items-center gap-2">
            {hydrated ? <ThemeToggle /> : null}
            {hydrated ? (
              <button
                aria-label="Toggle menu"
                onClick={() => setMobileOpen(!mobileOpen)}
                suppressHydrationWarning
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-border bg-background/95 backdrop-blur-lg px-6 py-4 space-y-3">
            <Link
              href="/compatibility"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Heart className="w-4 h-4" />
              Compatibility
            </Link>
            {isAuthed && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            {isAuthed && (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
            )}
            {isAuthed && isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <Link
              href="/test"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Take the Test →
            </Link>
            {isAuthed ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                Login
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
