import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function FounderSignup() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: 'include',  // Enable session cookies
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Please try again.");
      }

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
          title: "Welcome to Wizards!",
          description: "Your founder account has been created.",
        });

        // Navigate using SPA routing
        setLocation("/founder-onboarding");
      } else {
        toast({
          title: "Signup failed",
          description: data.message || "Unable to create account",
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(222, 47%, 11%)" }}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8" style={{ color: "hsl(217, 91%, 60%)" }} />
            <h1 className="text-3xl font-bold text-white">Wizards Incubator</h1>
          </div>
          <p className="text-xl text-gray-300 mb-2">Transform Your Idea into an MVP in 14 Days</p>
          <p className="text-gray-400">Join the world's first AI-native accelerator</p>
        </div>

        <Card style={{ background: "hsl(222, 47%, 15%)", border: "1px solid hsl(222, 35%, 20%)" }}>
          <CardHeader>
            <CardTitle className="text-white">Create your founder account</CardTitle>
            <CardDescription className="text-gray-400">
              Get started with 267+ AI agents ready to build your startup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Alex"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    data-testid="input-firstName"
                    className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Chen"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    data-testid="input-lastName"
                    className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="founder@startup.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  minLength={8}
                  data-testid="input-password"
                  className="bg-[hsl(222,35%,20%)] border-[hsl(222,35%,30%)] text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              <div className="pt-4 space-y-3" style={{ background: "hsl(222, 35%, 18%)", padding: "16px", borderRadius: "8px" }}>
                <p className="text-sm font-medium text-gray-300">What you'll get:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access to 10 specialized AI studios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>14-day structured workflow to MVP</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>267+ autonomous AI agents</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Investor matching & pitch deck generation</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="button-signup"
                className="w-full"
                style={{ background: "hsl(217, 91%, 60%)", color: "white" }}
              >
                {loading ? "Creating account..." : (
                  <>
                    Create Account <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => setLocation("/founder-login")}
                  className="text-[hsl(217,91%,60%)] hover:underline"
                  data-testid="link-login"
                >
                  Login here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
