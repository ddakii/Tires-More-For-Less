import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api";
import { useAuth } from "../../auth";
import { useToast } from "../../toast";
import { Button, Input, Loading } from "../../components/ui";
import { SHOP_IMAGES } from "../../lib/constants";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@tiresmoreforless.demo");
  const [password, setPassword] = useState("Demo123!");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/admin", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <Loading label="Loading..." />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast("Email and password are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast("Welcome back");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <img src={SHOP_IMAGES.showroom} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
      <div className="absolute inset-0 bg-brand/80" aria-hidden />
      <div className="relative w-full max-w-md animate-fade-up rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl font-bold uppercase tracking-wide text-brand">Tires & More For Less</p>
          <p className="mt-1 text-sm text-muted">Admin CRM Login</p>
        </div>

        <div className="mb-6 rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
          <p className="font-semibold text-ink">Demo credentials</p>
          <p className="mt-1 text-ink/80">
            Email: <span className="font-mono text-ink">admin@tiresmoreforless.demo</span>
          </p>
          <p className="text-ink/80">
            Password: <span className="font-mono text-ink">Demo123!</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
