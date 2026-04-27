"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Clock, CheckCircle, CheckCircle2, Plus, FileText, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Report, ReportStatus } from "@/models/types";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const q = query(
        collection(db, "reports"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData: Report[] = [];
        snapshot.forEach((doc) => {
          reportsData.push({ id: doc.id, ...doc.data() } as Report);
        });
        setReports(reportsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen" style={{ background: "#0F1117" }}>
        <Loader2 className="animate-spin h-10 w-10" style={{ color: "#4D9EFF" }} />
      </div>
    );
  }

  const pending = reports.filter(r => r.status === ReportStatus.PENDING).length;
  const accepted = reports.filter(r => r.status === ReportStatus.ACCEPTED).length;
  const resolved = reports.filter(r => r.status === ReportStatus.RESOLVED).length;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case ReportStatus.PENDING:
        return { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: <Clock size={12} /> };
      case ReportStatus.ACCEPTED:
        return { label: "Accepted", color: "#4D9EFF", bg: "rgba(77,158,255,0.12)", icon: <CheckCircle size={12} /> };
      case ReportStatus.RESOLVED:
        return { label: "Resolved", color: "#22C55E", bg: "rgba(34,197,94,0.12)", icon: <CheckCircle2 size={12} /> };
      default:
        return { label: status, color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", icon: null };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F1117", color: "#fff", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(15,17,23,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 64,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/supportsync-logo.jpg" alt="SupportSync" width={36} height={36}
            style={{ borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.3px" }}>SupportSync</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/report"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#4D9EFF,#2563EB)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", textDecoration: "none", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <Plus size={15} /> Report Issue
          </Link>
          <button onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 300, display: "flex", alignItems: "center" }}>
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/hero-landscape.png')", backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(15,17,23,0.92) 0%, rgba(15,17,23,0.65) 60%, rgba(15,17,23,0.4) 100%)" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "56px 40px 56px", maxWidth: 680 }}>
          <p style={{ color: "#4D9EFF", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            YOUR IMPACT DASHBOARD
          </p>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(1.8rem, 3.5vw, 2.75rem)", lineHeight: 1.18, marginBottom: "0.9rem", color: "#fff" }}>
            For the People &amp; <br />Causes You Care About<span style={{ color: "#4D9EFF" }}>.</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", maxWidth: 480, lineHeight: 1.6, marginBottom: "1.75rem" }}>
            Every report you submit connects help with hope. Track the journey of your issues right here.
          </p>
          <Link href="/report"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0F1117", border: "none", borderRadius: 50, padding: "13px 28px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", textDecoration: "none", transition: "transform 0.15s, box-shadow 0.2s", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
          >
            Report an Issue <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ background: "linear-gradient(90deg,#1A3DAB,#2EAA4A)", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>
          Your Small Actions Make the World Better!
        </p>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "Total Reports", value: reports.length, color: "#fff" },
            { label: "Pending", value: pending, color: "#FCD34D" },
            { label: "Accepted", value: accepted, color: "#93C5FD" },
            { label: "Resolved", value: resolved, color: "#86EFAC" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reports Grid ── */}
      <div style={{ padding: "48px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.35rem", color: "#fff" }}>My Reports</h2>
          {reports.length > 0 && (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>{reports.length} issue{reports.length !== 1 ? "s" : ""} submitted</span>
          )}
        </div>

        {reports.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: "center", padding: "80px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(77,158,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <FileText size={28} style={{ color: "#4D9EFF" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20, fontSize: "1rem" }}>
              You haven&apos;t reported any issues yet.
            </p>
            <Link href="/report"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#4D9EFF,#2563EB)", color: "#fff", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", transition: "opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <Plus size={16} /> Report an Issue
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {reports.map((report) => {
              const status = getStatusConfig(report.status);
              return (
                <Link key={report.id} href={`/reports/${report.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.borderColor = "rgba(77,158,255,0.4)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(77,158,255,0.12)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Card image */}
                    {report.imageUrl ? (
                      <div style={{ width: "100%", height: 180, position: "relative", flexShrink: 0 }}>
                        <Image src={report.imageUrl} alt={report.category} fill style={{ objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,17,23,0.7) 0%, transparent 60%)" }} />
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: 100, background: "linear-gradient(135deg,rgba(26,61,171,0.25),rgba(46,170,74,0.15))", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
                      </div>
                    )}

                    {/* Card body */}
                    <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      {/* Category + Status */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {report.category}
                        </h3>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: status.bg, color: status.color,
                          border: `1px solid ${status.color}33`,
                          borderRadius: 50, padding: "3px 10px",
                          fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {report.description}
                      </p>

                      {/* Meta */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.38)", fontSize: "0.8rem" }}>
                          <MapPin size={13} />
                          <span>{report.location.city ? `${report.location.city}, ${report.location.state}` : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.38)", fontSize: "0.8rem" }}>
                          <Calendar size={13} />
                          <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
