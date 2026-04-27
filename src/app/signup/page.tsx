"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, User, ChevronDown } from "lucide-react";
import { UserRole } from "@/models/types";

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: UserRole.USER },
  });

  const saveUserToFirestore = async (uid: string, name: string, email: string, role: UserRole) => {
    await setDoc(doc(db, "users", uid), { id: uid, name, email, role, createdAt: new Date().toISOString() });
    if (role === UserRole.NGO) {
      await setDoc(doc(db, "ngos", uid), { id: uid, name, categories: [], location: "" });
    }
  };

  const onSubmit = async (data: SignupValues) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await saveUserToFirestore(userCredential.user.uid, data.name, data.email, data.role);
      toast.success("Account created successfully!");
      router.push(data.role === UserRole.NGO ? "/ngo-dashboard" : "/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user.uid, result.user.displayName || "User", result.user.email || "", UserRole.USER);
      toast.success("Signed in with Google!");
      router.push("/dashboard");
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

  const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#4D9EFF";
    e.target.style.boxShadow = "0 0 0 3px rgba(77,158,255,0.15)";
  };
  const onBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.12)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#16172A" }}>

      {/* ─── Left Pane ─── */}
      <div className="flex flex-col w-full lg:w-1/2 min-h-screen px-8 md:px-16 py-8">

        {/* Brand bar */}
        <div className="auth-brand flex items-center justify-between pb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/supportsync-logo.jpg" alt="SupportSync Logo" width={40} height={40}
              className="rounded-full" style={{ width: 40, height: 40, objectFit: "cover" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
              SupportSync
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">Home</Link>
            <Link href="/login" style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">Login</Link>
          </nav>
        </div>

        {/* Form area */}
        <div className="flex flex-col justify-center flex-1 max-w-[420px] w-full mx-auto">

          <p className="auth-eyebrow" style={{ color: "#4D9EFF", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            START FOR FREE
          </p>

          <h1 className="auth-heading" style={{ color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.75rem)", lineHeight: 1.15, marginBottom: "1rem" }}>
            Create new account<span style={{ color: "#4D9EFF" }}>.</span>
          </h1>

          <p className="auth-subtext" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            Already a member?{" "}
            <Link href="/login" style={{ color: "#4D9EFF", fontWeight: 600, textDecoration: "none" }}>Log In</Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Full Name */}
              <div className="auth-field" style={{ animationDelay: "0.38s" }}>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input placeholder="John Doe" autoComplete="name" {...field}
                          style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                        <User size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                      </div>
                    </FormControl>
                    <FormMessage style={{ color: "#FF6B6B" }} />
                  </FormItem>
                )} />
              </div>

              {/* Email */}
              <div className="auth-field" style={{ animationDelay: "0.45s" }}>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input placeholder="your@email.com" type="email" autoComplete="email" {...field}
                          style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
                        <Mail size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                      </div>
                    </FormControl>
                    <FormMessage style={{ color: "#FF6B6B" }} />
                  </FormItem>
                )} />
              </div>

              {/* Password */}
              <div className="auth-field" style={{ animationDelay: "0.52s" }}>
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} autoComplete="new-password"
                          placeholder="Min. 6 characters" {...field}
                          style={inputStyle} onFocus={onFocusInput} onBlur={onBlurInput} />
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
                )} />
              </div>

              {/* Role */}
              <div className="auth-field" style={{ animationDelay: "0.59s" }}>
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>I am signing up as</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select {...field}
                          style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                          onFocus={onFocusInput} onBlur={onBlurInput}
                        >
                          <option value={UserRole.USER} style={{ background: "#16172A" }}>Citizen (Report Issues)</option>
                          <option value={UserRole.NGO} style={{ background: "#16172A" }}>NGO Point of Contact (Resolve Issues)</option>
                        </select>
                        <ChevronDown size={16} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                      </div>
                    </FormControl>
                    <FormMessage style={{ color: "#FF6B6B" }} />
                  </FormItem>
                )} />
              </div>

              {/* Action buttons */}
              <div className="auth-actions" style={{ display: "flex", gap: "12px", marginTop: "8px", animationDelay: "0.66s" }}>
                <button type="button" onClick={handleGoogleSignup} disabled={loading}
                  style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "13px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "background 0.2s, transform 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Google
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, background: "linear-gradient(135deg, #4D9EFF 0%, #2563EB 100%)", color: "#fff", border: "none", borderRadius: "10px", padding: "13px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s", boxShadow: "0 4px 20px rgba(77,158,255,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(77,158,255,0.45)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(77,158,255,0.35)"; }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Create account
                </button>
              </div>

            </form>
          </Form>
        </div>

        <div style={{ height: 48 }} />
      </div>

      {/* ─── Right Pane ─── */}
      <div className="auth-image-pane hidden lg:block lg:w-1/2 relative overflow-hidden"
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
