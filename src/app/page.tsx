"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, AlertTriangle, MapPin, Building2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { WelcomeScreen } from "./welcome/WelcomeScreen";

export default function Home() {
  const { user, role, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("hasSeenWelcome")) {
      setShowWelcome(false);
    }
  }, []);

  const handleWelcomeExit = () => {
    sessionStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[100] bg-background overflow-hidden">
        <WelcomeScreen onExit={handleWelcomeExit} />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Hero Section */}
      <section className="w-full relative z-10 flex flex-col justify-center items-center min-h-screen pt-24" style={{ backgroundImage: "url('/hero-landscape.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="container px-4 md:px-6 flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Image src="/supportsync-logo.jpg" alt="SupportSync Logo" width={120} height={120} className="mb-6" style={{ width: 'auto', height: 'clamp(60px, 8vw, 90px)' }} priority />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-sm text-sm font-medium mb-6 text-[#1C1C2E]">
              <span className="w-2 h-2 rounded-full bg-[#F5A623]"></span> Connecting Help with Hope
            </div>

            <div className="space-y-6 mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-[#1C1C2E] leading-[1.1] max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
                Empowering Communities, <br /> One Report at a Time
              </h1>
              <p className="mx-auto max-w-[700px] text-[#1C1C2E]/80 md:text-xl font-medium">
                Civix bridges the gap between citizens and NGOs. Report civic issues instantly and track their resolution in real-time.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', minHeight: '60px', marginTop: '1rem' }}>
              {!loading && (
                <>
                  {(!user || role === "USER") && (
                    <Link href="/report">
                      <Button style={{ background: 'rgba(28,28,46,0.9)', color: '#FFFFFF', border: 'none', borderRadius: '9999px', padding: '16px 36px', fontWeight: 500, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }} className="gap-2 hover:bg-[#1C1C2E] hover:scale-[1.02] shadow-lg">
                        Report an Issue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}

                  {!user && (
                    <Link href="/signup">
                      <Button variant="outline" style={{ background: '#FFFFFF', color: '#1C1C2E', border: 'none', borderRadius: '9999px', padding: '16px 36px', fontWeight: 500, fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.05)' }} className="gap-2 hover:bg-gray-50 hover:scale-[1.02]">
                        Join as NGO
                      </Button>
                    </Link>
                  )}

                  {role === "NGO" && (
                    <Link href="/ngo-dashboard">
                      <Button size="lg" variant="outline" className="gap-2">
                        Go to Operations Dashboard <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-24 pb-8 w-full relative z-20">
          <p className="text-center text-sm font-medium text-[#1C1C2E]/80 mb-6">Trusted by communities across the globe</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale">
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full border-[3px] border-[#1C1C2E]" /><span className="font-bold text-lg tracking-tight">EcoHelp</span></div>
            <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-[#1C1C2E] rotate-45" /><span className="font-bold text-lg italic">CityCare</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#1C1C2E]" /><span className="font-bold text-lg uppercase tracking-widest text-sm">GlobalTrust</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border-[3px] border-[#1C1C2E]" /><div className="w-4 h-4 rounded-full border-[3px] border-[#1C1C2E] -ml-2" /><span className="font-bold text-lg tracking-tight">NextGen</span></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 relative z-10">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Report Issues</h3>
              <p className="text-muted-foreground">
                Easily report potholes, garbage, broken streetlights, and more with exact coordinates.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">NGO Integration</h3>
              <p className="text-muted-foreground">
                Issues are routed to relevant local NGOs who have the resources to resolve them.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Track Progress</h3>
              <p className="text-muted-foreground">
                Get real-time updates as NGOs accept and resolve your reported issues.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
