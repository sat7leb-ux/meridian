import { createPublicClient } from "@/lib/supabase/public";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    const sb = createPublicClient();
    if (!sb) redirect("/login?error=Database not configured");

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-teal flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl">Meridian</span>
          </Link>
          <h1 className="text-2xl font-display font-bold mb-2">Welcome back</h1>
          <p className="text-mute">Sign in to manage your bookings</p>
        </div>

        <div className="card p-6">
          <form action={login} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <Field name="email" label="Email" type="email" placeholder="you@example.com" required className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <Field name="password" label="Password" type="password" placeholder="••••••••" required className="pl-10" />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-teal hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-mute">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-teal font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
