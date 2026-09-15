"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

const ADMIN_EMAIL = "eliekhachane@meridian.com";
const ADMIN_PASSWORD = "@cc3pt3D2026";
const AUTH_KEY = "meridian_admin_auth";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ email, loggedIn: true, timestamp: Date.now() }));
        router.push("/admin");
      } else {
        setError("Invalid email or password");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-teal flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl">Meridian Admin</span>
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Sign in</h1>
          <p className="text-mute">Access the admin portal</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-field border border-hairline bg-surface px-3 py-2 pl-10 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-field border border-hairline bg-surface px-3 py-2 pl-10 pr-10 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-stop">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-mute">
          Demo credentials: eliekhachane@meridian.com
        </p>
      </div>
    </div>
  );
}
