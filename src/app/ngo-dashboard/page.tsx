"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MapPin, Clock, CheckCircle, CheckCircle2, X, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Report, ReportStatus, ReportPriority, UserRole } from "@/models/types";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 0.5 - Math.cos(dLat) / 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos(dLon)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const glass: React.CSSProperties = {
  background: "rgba(12, 18, 30, 0.52)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 14,
};

const inputGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#fff",
  borderRadius: 8,
  width: "100%",
  padding: "8px 12px",
  fontSize: "0.875rem",
  outline: "none",
};

export default function NGODashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [ngoLocation, setNgoLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>(ReportStatus.PENDING);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterNearMe, setFilterNearMe] = useState<boolean>(false);
  const [filterRadius, setFilterRadius] = useState<number>(5);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  useEffect(() => {
    if (!authLoading && (!user || role !== UserRole.NGO)) { router.push("/dashboard"); return; }
    if (user && role === UserRole.NGO) {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
        setLoading(false);
      }, () => setLoading(false));
      return () => unsub();
    }
  }, [user, role, authLoading, router]);

  const filteredReports = useMemo(() => reports.filter(r => {
    if (!(r.status === ReportStatus.PENDING || r.assignedNgoId === user?.uid)) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    if (filterCity && !r.location.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (filterNearMe && ngoLocation && calculateDistance(ngoLocation.lat, ngoLocation.lng, r.location.lat, r.location.lng) > filterRadius) return false;
    const rd = new Date(r.createdAt);
    if (filterStartDate && rd < new Date(filterStartDate)) return false;
    if (filterEndDate && rd > new Date(filterEndDate)) return false;
    return true;
  }), [reports, filterStatus, filterPriority, filterCity, filterNearMe, ngoLocation, filterRadius, filterStartDate, filterEndDate, user?.uid]);

  const resetFilters = () => { setFilterStatus(ReportStatus.PENDING); setFilterPriority("all"); setFilterCity(""); setFilterNearMe(false); setFilterRadius(5); setFilterStartDate(""); setFilterEndDate(""); };

  const handleToggleNearMe = () => {
    if (!filterNearMe && !ngoLocation) {
      navigator.geolocation?.getCurrentPosition(
        pos => { setNgoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setFilterNearMe(true); toast.success("Location acquired!"); },
        () => toast.error("Could not get location.")
      );
    } else { setFilterNearMe(v => !v); }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus.ACCEPTED | ReportStatus.RESOLVED) => {
    try {
      const upd: Partial<Report> = { status: newStatus };
      if (newStatus === ReportStatus.ACCEPTED) upd.assignedNgoId = user?.uid;
      await updateDoc(doc(db, "reports", reportId), upd);
      toast.success(`Report marked as ${newStatus}`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed to update"); }
  };

  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  if (authLoading || loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0E1A" }}>
      <Loader2 className="animate-spin h-10 w-10" style={{ color: "#4D9EFF" }} />
    </div>
  );

  const statusConfig = (s: string) => {
    if (s === ReportStatus.PENDING) return { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", icon: <Clock size={11} /> };
    if (s === ReportStatus.ACCEPTED) return { label: "Accepted", color: "#4D9EFF", bg: "rgba(77,158,255,0.15)", icon: <CheckCircle size={11} /> };
    if (s === ReportStatus.RESOLVED) return { label: "Resolved", color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <CheckCircle2 size={11} /> };
    return { label: s, color: "#9CA3AF", bg: "rgba(156,163,175,0.15)", icon: null };
  };

  const priorityConfig = (p: string) => {
    if (p === ReportPriority.HIGH) return { label: "HIGH", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
    if (p === ReportPriority.MEDIUM) return { label: "MED", color: "#F97316", bg: "rgba(249,115,22,0.15)" };
    return { label: "LOW", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" };
  };

  const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#fff", position: "relative" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "url('/hero-landscape.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "linear-gradient(160deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.55) 100%)" }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Navbar */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, ...glass, borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/supportsync-logo.jpg" alt="SupportSync" width={36} height={36} style={{ borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>SupportSync</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/ngo-dashboard/accepted" style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>My Tasks</Link>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 16px", fontWeight: 500, fontSize: "0.875rem", cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </header>

        <div style={{ padding: "32px 40px", maxWidth: 1280, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <p style={{ color: "#4D9EFF", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>NGO PORTAL</p>
              <h1 style={{ fontWeight: 800, fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#fff", margin: 0 }}>Operations Dashboard</h1>
            </div>
            <button onClick={resetFilters} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 16px", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer" }}>
              <X size={14} /> Reset Filters
            </button>
          </div>

          {/* Filters */}
          <div style={{ ...glass, padding: "20px 24px", marginBottom: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger style={{ ...inputGlass, border: "1px solid rgba(255,255,255,0.18)" }}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={ReportStatus.PENDING}>Open (Pending)</SelectItem>
                  <SelectItem value={ReportStatus.ACCEPTED}>Accepted</SelectItem>
                  <SelectItem value={ReportStatus.RESOLVED}>Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>Priority</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger style={{ ...inputGlass, border: "1px solid rgba(255,255,255,0.18)" }}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value={ReportPriority.HIGH}>High</SelectItem>
                  <SelectItem value={ReportPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={ReportPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div>
              <label style={labelStyle}>Location / City</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)" }} />
                <input placeholder="Search City..." value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ ...inputGlass, paddingLeft: 30 }} />
              </div>
            </div>

            {/* Near Me */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
              <label style={labelStyle}>Proximity</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleToggleNearMe} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: filterNearMe ? "rgba(77,158,255,0.3)" : "rgba(255,255,255,0.08)", color: filterNearMe ? "#4D9EFF" : "rgba(255,255,255,0.7)", border: `1px solid ${filterNearMe ? "#4D9EFF" : "rgba(255,255,255,0.18)"}`, borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  <MapPin size={13} /> {filterNearMe ? "Active" : "Near Me"}
                </button>
                {filterNearMe && (
                  <Select value={filterRadius.toString()} onValueChange={v => setFilterRadius(parseInt(v))}>
                    <SelectTrigger style={{ ...inputGlass, width: 90, border: "1px solid rgba(255,255,255,0.18)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5","10","15","20","30","50"].map(v => <SelectItem key={v} value={v}>{v} km</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Date Range</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} style={{ ...inputGlass, flex: 1, colorScheme: "dark" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>to</span>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} style={{ ...inputGlass, flex: 1, colorScheme: "dark" }} />
              </div>
            </div>
          </div>

          {/* Count */}
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", marginBottom: 16 }}>
            {filteredReports.length} issue{filteredReports.length !== 1 ? "s" : ""} found
          </p>

          {/* Reports */}
          {filteredReports.length === 0 ? (
            <div style={{ ...glass, textAlign: "center", padding: "64px 24px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Search size={24} style={{ color: "rgba(255,255,255,0.3)" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>No issues found</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", marginBottom: 20 }}>Try adjusting your filters to find relevant civic issues.</p>
              <button onClick={resetFilters} style={{ background: "rgba(77,158,255,0.15)", color: "#4D9EFF", border: "1px solid rgba(77,158,255,0.3)", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
              {filteredReports.map(report => {
                const sc = statusConfig(report.status);
                const pc = priorityConfig(report.priority);
                return (
                  <div key={report.id} style={{ ...glass, display: "flex", flexDirection: "column", overflow: "hidden", transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(77,158,255,0.35)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(77,158,255,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <Link href={`/reports/${report.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                      {/* Image */}
                      {report.imageUrl ? (
                        <div style={{ width: "100%", height: 160, position: "relative" }}>
                          <Image src={report.imageUrl} alt={report.category} fill style={{ objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,12,24,0.8) 0%, transparent 55%)" }} />
                          <span style={{ position: "absolute", top: 10, left: 12, background: pc.bg, color: pc.color, border: `1px solid ${pc.color}44`, borderRadius: 50, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{pc.label}</span>
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: 80, background: "linear-gradient(135deg, rgba(26,61,171,0.2), rgba(46,170,74,0.12))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <span style={{ position: "absolute", top: 8, left: 10, background: pc.bg, color: pc.color, border: `1px solid ${pc.color}44`, borderRadius: 50, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{pc.label}</span>
                        </div>
                      )}

                      {/* Body */}
                      <div style={{ padding: "14px 16px 12px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", margin: 0, lineHeight: 1.3 }}>{report.category}</h3>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}33`, borderRadius: 50, padding: "3px 9px", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>
                            {sc.icon} {sc.label}
                          </span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.83rem", lineHeight: 1.55, margin: "0 0 12px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{report.description}</p>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.38)", fontSize: "0.78rem" }}>
                            <MapPin size={12} style={{ color: "#4D9EFF" }} />
                            <span>{report.location.city ? `${report.location.city}, ${report.location.state}` : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.38)", fontSize: "0.78rem" }}>
                            <Clock size={12} style={{ color: "#4D9EFF" }} />
                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Action footer */}
                    <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      {report.status === ReportStatus.PENDING && (
                        <button onClick={() => handleUpdateStatus(report.id, ReportStatus.ACCEPTED)}
                          style={{ width: "100%", background: "linear-gradient(135deg,#4D9EFF,#2563EB)", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", transition: "opacity 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >Accept Issue</button>
                      )}
                      {report.status === ReportStatus.ACCEPTED && report.assignedNgoId === user?.uid && (
                        <button onClick={() => handleUpdateStatus(report.id, ReportStatus.RESOLVED)}
                          style={{ width: "100%", background: "linear-gradient(135deg,#2EAA4A,#16803C)", color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", transition: "opacity 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >Mark as Resolved</button>
                      )}
                      {report.status === ReportStatus.RESOLVED && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#22C55E", fontSize: "0.875rem", fontWeight: 600, padding: "8px" }}>
                          <CheckCircle2 size={15} /> Resolved
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
