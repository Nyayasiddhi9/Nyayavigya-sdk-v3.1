import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket, Sparkles, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FounderLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',  // Enable session cookies
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        // Update auth context with user data
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar,
          role: data.user.role,
          subscriptionTier: data.user.subscriptionPlan || 'alpha',
          subscriptionStatus: data.user.subscriptionStatus || 'active'
        });
        
        toast({
          title: "Welcome back!",
          description: "You're now logged in to Wizards Incubator.",
        });
        
        // Router will automatically redirect to /founder-dashboard since user is now authenticated
      } else{
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(222, 47%, 11%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8" style={{ color: "hsl(217, 91%, 60%)" }} />
            <h1 className="text-3xl font-bold text-white">Wizards</h1>
          </div>
          <p className="text-gray-400">Welcome back, founder</p>
        </div>

        <Card style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white">Login to your account</CardTitle>
            <CardDescription className="text-gray-400">
              Continue your journey from idea to MVP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="founder@startup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="button-login"
                className="w-full"
                style={{ background: "hsl(217, 91%, 60%)", color: "white" }}
              >
                {loading ? "Logging in..." : (
                  <>
                    Login <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => setLocation("/founder-signup")}
                  className="text-[hsl(217,91%,60%)] hover:underline"
                  data-testid="link-signup"
                >
                  Sign up as a founder
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>14-Day MVP Launch</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>267+ AI Agents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
