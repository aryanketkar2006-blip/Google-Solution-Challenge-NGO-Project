"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserCircle, LogOut, FileText, Home, Briefcase, Bell } from "lucide-react";

export function Navbar() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/civix.webp" alt="Civix Logo" width={32} height={32} className="h-8 w-auto" priority />
          <span className="text-xl font-bold tracking-tight">Civix</span>
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
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Sign up</Button>
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
