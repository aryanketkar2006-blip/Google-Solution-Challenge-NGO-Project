"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, AlertTriangle, MapPin, Building2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

export default function Home() {
  const { user, role, loading } = useAuth();

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Image src="/civix.webp" alt="Civix Logo" width={80} height={80} className="h-20 w-auto mb-4" priority />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Empowering Communities, <br /> One Report at a Time
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Civix bridges the gap between citizens and NGOs. Report civic issues instantly and track their resolution in real-time.
              </p>
            </div>
            <div className="space-x-4 min-h-[50px]">
              {!loading && (
                <>
                  {(!user || role === "USER") && (
                    <Link href="/report">
                      <Button size="lg" className="gap-2">
                        Report an Issue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  
                  {!user && (
                    <Link href="/signup">
                      <Button size="lg" variant="outline" className="gap-2">
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
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
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
