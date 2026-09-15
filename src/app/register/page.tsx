import { createPublicClient } from "@/lib/supabase/public";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

export default function RegisterPage() {
  async function register(formData: FormData) {
    "use server";
    const sb = createPublicClient();
    if (!sb) redirect("/register?error=Database not configured");

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      redirect(`/register?error=${encodeURIComponent(error.message)}`);
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
          <h1 className="text-2xl font-display font-bold mb-2">Create your account</h1>
          <p className="text-mute">Start booking in under three minutes</p>
        </div>

        <div className="card p-6">
          <form action={register} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <Field name="name" label="Full Name" placeholder="John Doe" required className="pl-10" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <Field name="email" label="Email" type="email" placeholder="you@example.com" required className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <Field name="password" label="Password" type="password" placeholder="Min 8 characters" required minLength={8} className="pl-10" />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-mute">
          Already have an account?{" "}
          <Link href="/login" className="text-teal font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
