"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchAdminUsers, fetchReferralCodes, fetchCodeRequests, approveCodeRequest, type AdminUserSummary, type ReferralCodeRow, type CodeRequestRow } from "@/lib/admin-api";
import { getCurrentSession } from "@/lib/supabase/session";
import { toast } from "sonner";

const TIER_LABELS: Record<string, string> = {
  starter5: "Starter (5 credits)",
  pro20: "Pro (20 credits)",
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [codes, setCodes] = useState<ReferralCodeRow[]>([]);
  const [requests, setRequests] = useState<CodeRequestRow[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")).reverse();
  }, [users]);

  const pendingRequests = useMemo(() => requests.filter(r => r.status === "pending"), [requests]);
  const approvedRequests = useMemo(() => requests.filter(r => r.status === "approved"), [requests]);

  const loadAdminData = async () => {
    try {
      const [usersData, codesData, requestsData] = await Promise.all([
        fetchAdminUsers(),
        fetchReferralCodes(),
        fetchCodeRequests(),
      ]);
      setUsers(usersData);
      setCodes(codesData);
      setRequests(requestsData);
      setAllowed(true);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load admin data";
      setError(message);
      setAllowed(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const session = await getCurrentSession();
        if (!session) {
          if (!cancelled) {
            setError("Please login first.");
            setLoading(false);
          }
          return;
        }

        await loadAdminData();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleApprove = async (request: CodeRequestRow) => {
    const tier = (request.requested_tier === "pro20" ? "pro20" : "starter5") as "starter5" | "pro20";
    setApprovingId(request.id);
    try {
      const result = await approveCodeRequest({
        requestId: request.id,
        tier,
      });
      if (result.emailStatus === "sent") {
        toast.success(
          `Code ${result.codeMasked} generated and emailed to ${result.sentTo || request.email}! (${TIER_LABELS[tier]})`,
          { duration: 15000 }
        );
      } else if (result.emailReason === "already_approved") {
        toast.message(
          `Request already approved. Existing code: ${result.codeMasked} for ${result.sentTo || request.email}.`,
          { duration: 12000 }
        );
      } else if (result.emailReason === "missing_code_template" || result.emailReason === "missing_contact_template") {
        toast.error(
          `Code generated: ${result.codeMasked}. Email template not configured - send code manually to ${result.sentTo || request.email}.`,
          { duration: 20000 }
        );
      } else {
        toast.success(
          `Code generated: ${result.codeMasked} (${TIER_LABELS[tier]}).\nEmail was not confirmed as sent - please verify ${result.sentTo || request.email} manually.`,
          { duration: 20000 }
        );
      }
      await loadAdminData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve request";
      toast.error(message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto px-6 py-16 pt-24 w-full">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage users and premium code requests.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Back to dashboard</Link>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading admin data...</p>}
        {!loading && error && <p className="text-sm text-destructive mb-6">{error}</p>}

        {!loading && !allowed && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <p className="text-sm text-muted-foreground">You are not allowed to access admin panel. Add your email to ADMIN_EMAILS in environment variables.</p>
          </div>
        )}
 
        {!loading && allowed && (
          <div className="space-y-8">
            {/* Pending Code Requests */}
            <section className="bg-card rounded-xl shadow-card p-6 border-2 border-personality-yellow/30">
              <h2 className="text-lg font-semibold text-foreground mb-4">⚡ Pending Code Requests ({pendingRequests.length})</h2>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((r) => (
                    <div key={r.id} className="bg-accent rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{r.email}</p>
                        <p className="text-xs text-personality-blue font-semibold mt-0.5">
                          Requested: {TIER_LABELS[r.requested_tier || "starter5"] || r.requested_tier}
                        </p>
                        {r.note && <p className="text-xs text-muted-foreground mt-1">Note: {r.note}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleApprove(r)}
                        disabled={approvingId === r.id}
                        className="h-10 px-6 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-all whitespace-nowrap"
                      >
                        {approvingId === r.id ? "Generating..." : `Approve & Generate Code`}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Approved Requests + Generated Codes */}
            {approvedRequests.length > 0 && (
              <section className="bg-card rounded-xl shadow-card p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">✅ Approved Requests ({approvedRequests.length})</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Pack</th>
                        <th className="py-2 pr-3">Generated Code</th>
                        <th className="py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRequests.map((r) => (
                        <tr key={r.id} className="border-b border-border/60">
                          <td className="py-2 pr-3 text-foreground">{r.email}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{TIER_LABELS[r.requested_tier || "starter5"] || "-"}</td>
                          <td className="py-2 pr-3 font-mono text-personality-blue font-semibold">{r.generated_code || "-"}</td>
                          <td className="py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Users */}
            <section className="bg-card rounded-xl shadow-card p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Registered Users ({sortedUsers.length})</h2>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Created</th>
                      <th className="py-2 pr-3">Last Sign In</th>
                      <th className="py-2">User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-foreground">{u.email || "-"}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : "-"}</td>
                        <td className="py-2 text-muted-foreground text-xs">{u.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Existing Codes */}
            {codes.length > 0 && (
              <section className="bg-card rounded-xl shadow-card p-6 border border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Premium Codes ({codes.length})</h2>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3">Code</th>
                        <th className="py-2 pr-3">Tier</th>
                        <th className="py-2 pr-3">Used</th>
                        <th className="py-2 pr-3">Expires</th>
                        <th className="py-2">Created by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((c) => (
                        <tr key={c.id} className="border-b border-border/60">
                          <td className="py-2 pr-3 text-foreground font-mono">{c.code}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{TIER_LABELS[c.tier] || c.tier}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{c.usedCount}/{c.maxUses}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleString() : "No expiry"}</td>
                          <td className="py-2 text-muted-foreground">{c.createdBy || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
