"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const checkRoleAndRedirect = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        router.push(role === "NGO" ? "/ngo-dashboard" : "/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching role during login:", error);
      router.push("/dashboard");
    }
  };

  const onSubmit = async (data: LoginValues) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success("Logged in successfully!");
      await checkRoleAndRedirect(userCredential.user.uid);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid email or password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google!");
      await checkRoleAndRedirect(result.user.uid);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in with Google";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#fff",
    padding: "13px 44px 13px 16px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#16172A" }}>

      {/* ─── Left Pane ─── */}
      <div className="flex flex-col w-full lg:w-1/2 min-h-screen px-8 md:px-16 py-8">

        {/* Brand bar */}
        <div className="auth-brand flex items-center justify-between pb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/supportsync-logo.jpg"
              alt="SupportSync Logo"
              width={40} height={40}
              className="rounded-full"
              style={{ width: 40, height: 40, objectFit: "cover" }}
            />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
              SupportSync
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">Home</Link>
            <Link href="/signup" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">Join</Link>
          </nav>
        </div>

        {/* Form area */}
        <div className="flex flex-col justify-center flex-1 max-w-[420px] w-full mx-auto">

          <p className="auth-eyebrow" style={{ color: "#4D9EFF", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            WELCOME BACK
          </p>

          <h1 className="auth-heading" style={{ color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.15, marginBottom: "1rem" }}>
            Sign in to your<br />account<span style={{ color: "#4D9EFF" }}>.</span>
          </h1>

          <p className="auth-subtext" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Not a member?{" "}
            <Link href="/signup" style={{ color: "#4D9EFF", fontWeight: 600, textDecoration: "none" }}>Sign Up</Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Email field */}
              <div className="auth-field" style={{ animationDelay: "0.38s" }}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <input
                            placeholder="your@email.com"
                            type="email"
                            autoComplete="email"
                            {...field}
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = "#4D9EFF"; e.target.style.boxShadow = "0 0 0 3px rgba(77,158,255,0.15)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                          />
                          <Mail size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                        </div>
                      </FormControl>
                      <FormMessage style={{ color: "#FF6B6B" }} />
                    </FormItem>
                  )}
                />
              </div>

              {/* Password field */}
              <div className="auth-field" style={{ animationDelay: "0.46s" }}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            {...field}
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = "#4D9EFF"; e.target.style.boxShadow = "0 0 0 3px rgba(77,158,255,0.15)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                          />
                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, transition: "color 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage style={{ color: "#FF6B6B" }} />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action buttons */}
              <div className="auth-actions" style={{ display: "flex", gap: "12px", marginTop: "8px", animationDelay: "0.54s" }}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "13px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "background 0.2s, border-color 0.2s, transform 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Google
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1, background: "linear-gradient(135deg, #4D9EFF 0%, #2563EB 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "13px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s", boxShadow: "0 4px 20px rgba(77,158,255,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(77,158,255,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(77,158,255,0.35)"; }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Sign in
                </button>
              </div>

            </form>
          </Form>
        </div>

        <div style={{ height: 48 }} />
      </div>

      {/* ─── Right Pane ─── */}
      <div
        className="auth-image-pane hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{ backgroundImage: "url('/hero-landscape.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(22,23,42,0.78) 0%, rgba(22,23,42,0.28) 100%)" }} />
        <div style={{ position: "absolute", bottom: 32, right: 32, display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/supportsync-logo.jpg" alt="SupportSync" width={36} height={36} style={{ borderRadius: "50%", opacity: 0.85 }} />
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.2px" }}>SupportSync</span>
        </div>
      </div>

    </div>
  );
}
