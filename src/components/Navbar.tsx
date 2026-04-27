"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { UserCircle, LogOut, FileText, Home, Briefcase, Bell } from "lucide-react";

export function Navbar() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  if (pathname === "/welcome" || pathname === "/login" || pathname === "/signup" || pathname === "/dashboard" || pathname === "/report" || pathname.startsWith("/ngo-dashboard")) return null;

  return (
    <header className="sticky top-0 w-full px-4 md:px-8" style={{ zIndex: 100, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(26, 61, 171, 0.08)' }}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/supportsync-logo.jpg" alt="SupportSync Logo" width={32} height={32} className="h-8 w-auto" priority />
          <span style={{ fontFamily: "'Nunito', 'Inter', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#1A3DAB", letterSpacing: "-0.3px" }}>SupportSync</span>
        </Link>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  {role === "NGO" ? (
                    <>
                      <Link href="/ngo-dashboard">
                        <Button variant="ghost" className="gap-2">
                          <Home className="h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/ngo-dashboard/accepted">
                        <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
                          <Briefcase className="h-4 w-4" />
                          My Tasks
                        </Button>
                      </Link>
                      <Link href="/notifications">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard">
                        <Button variant="ghost" className="gap-2">
                          <UserCircle className="h-4 w-4" />
                          My Reports
                        </Button>
                      </Link>
                      <Link href="/report">
                        <Button variant="default" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Report Issue
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button variant="outline" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" style={{ color: '#1A3DAB', fontWeight: 500, background: 'transparent', border: 'none', padding: '10px 20px', borderRadius: '8px', transition: 'background 0.2s' }} className="hover:bg-[rgba(26,61,171,0.08)]">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <Button style={{ background: '#2EAA4A', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 600, transition: 'background 0.2s, transform 0.15s' }} className="hover:bg-[#258F3E] hover:scale-[1.03]">Sign up</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
