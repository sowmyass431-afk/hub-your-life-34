import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Student Hub" },
      {
        name: "description",
        content: "Sign in to Student Hub to sync your timetable, attendance, notes and more across devices.",
      },
      { property: "og:title", content: "Sign in — Student Hub" },
      {
        property: "og:description",
        content: "Your college life, synced everywhere. Sign in to Student Hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const submit = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setCheckEmail(true);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return; // browser is navigating to Google
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="hero-gradient grid size-12 place-items-center rounded-2xl">
            <GraduationCap className="size-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Student Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to sync your college life on every device.
          </p>
        </div>

        {checkEmail ? (
          <div className="text-center">
            <p className="text-sm font-medium">Check your inbox</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-medium">{email}</span>. Open it to
              finish creating your account, then sign in.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                setCheckEmail(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
              Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password" className="mb-1.5 block text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
