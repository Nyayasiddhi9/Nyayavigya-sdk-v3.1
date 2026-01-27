import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Mail, Lock, Github, Chrome } from 'lucide-react';
import { ErrorFallback } from '@/components/ErrorFallback';
import { handleError, logError } from '@/lib/errorHandler';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

interface OAuthProviders {
  google: boolean;
  github: boolean;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [oauthProviders, setOAuthProviders] = useState<OAuthProviders>({ google: false, github: false });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndProviders = async () => {
      try {
        // Check OAuth providers availability
        const providersRes = await fetch('/api/auth/providers');
        if (providersRes.ok) {
          const data = await providersRes.json();
          setOAuthProviders({
            google: data.google || false,
            github: data.github || false
          });
        }

        // Check if user is already authenticated
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.user) {
            onLoginSuccess({
              id: String(data.user.id),
              name: data.user.name || data.user.email,
              email: data.user.email,
              avatar: data.user.avatarUrl,
              role: data.user.role,
              subscriptionTier: 'alpha',
              subscriptionStatus: 'active'
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuthAndProviders();
  }, [onLoginSuccess]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(isSignup && { name: formData.name })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `${isSignup ? 'Signup' : 'Login'} failed`);
      }

      toast({
        title: isSignup ? "Account created!" : "Welcome back!",
        description: isSignup ? "You've successfully signed up." : "You've successfully logged in.",
      });

      onLoginSuccess({
        id: String(data.user.id),
        name: data.user.name || data.user.email,
        email: data.user.email,
        avatar: data.user.avatarUrl,
        role: data.user.role,
        subscriptionTier: 'alpha',
        subscriptionStatus: 'active'
      });
    } catch (error: any) {
      const errorInfo = handleError(error);
      setError(errorInfo.message || `${isSignup ? 'Signup' : 'Login'} failed. Please try again.`);
      logError(error, `Email ${isSignup ? 'Signup' : 'Login'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  if (error && error.includes('critical')) {
    return <ErrorFallback error={new Error(error)} context="Login Page" />;
  }

  const hasOAuthProviders = oauthProviders.google || oauthProviders.github;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(270,75%,20%)] to-[hsl(217,91%,25%)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-[hsl(217,91%,60%)] border bg-[hsl(222,47%,15%)] backdrop-blur-sm" data-testid="card-login">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] p-1"
            >
              <div className="w-full h-full rounded-full bg-[hsl(222,47%,15%)] flex items-center justify-center">
                <span className="text-3xl font-bold bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] bg-clip-text text-transparent">
                  W
                </span>
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-[hsl(0,0%,98%)]">
              {isSignup ? 'Create Your Account' : 'Welcome to Wizards Incubator'}
            </CardTitle>
            <CardDescription className="text-[hsl(220,9%,65%)]">
              {isSignup ? 'Join the AI-powered startup accelerator' : 'Transform ideas into MVPs in 14 days'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-[hsl(0,84%,60%)]/10 border border-[hsl(0,84%,60%)]/30 rounded-lg"
                data-testid="alert-error"
              >
                <p className="text-sm text-[hsl(0,84%,60%)]">{error}</p>
              </motion.div>
            )}

            {hasOAuthProviders && (
              <>
                <div className="space-y-3">
                  {oauthProviders.google && (
                    <Button
                      onClick={() => handleOAuthLogin('google')}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full gap-3 h-11 border-[hsl(220,9%,46%)] bg-[hsl(222,35%,20%)] hover:bg-[hsl(222,35%,25%)] text-[hsl(0,0%,98%)]"
                      data-testid="button-oauth-google"
                    >
                      <Chrome className="h-5 w-5 text-[hsl(217,91%,60%)]" />
                      Continue with Google
                    </Button>
                  )}

                  {oauthProviders.github && (
                    <Button
                      onClick={() => handleOAuthLogin('github')}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full gap-3 h-11 border-[hsl(220,9%,46%)] bg-[hsl(222,35%,20%)] hover:bg-[hsl(222,35%,25%)] text-[hsl(0,0%,98%)]"
                      data-testid="button-oauth-github"
                    >
                      <Github className="h-5 w-5" />
                      Continue with GitHub
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-[hsl(220,9%,46%)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[hsl(222,47%,15%)] px-2 text-[hsl(220,9%,65%)]">Or continue with email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[hsl(0,0%,98%)]">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-11 bg-[hsl(222,35%,20%)] border-[hsl(220,9%,46%)] text-[hsl(0,0%,98%)] placeholder:text-[hsl(220,9%,46%)]"
                    data-testid="input-name"
                    required={isSignup}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[hsl(0,0%,98%)]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(220,9%,46%)]" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-11 bg-[hsl(222,35%,20%)] border-[hsl(220,9%,46%)] text-[hsl(0,0%,98%)] placeholder:text-[hsl(220,9%,46%)]"
                    data-testid="input-email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[hsl(0,0%,98%)]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(220,9%,46%)]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-11 bg-[hsl(222,35%,20%)] border-[hsl(220,9%,46%)] text-[hsl(0,0%,98%)] placeholder:text-[hsl(220,9%,46%)]"
                    data-testid="input-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-[hsl(220,9%,65%)]"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] hover:from-[hsl(217,91%,55%)] to-[hsl(270,75%,60%)] text-white"
                data-testid="button-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignup ? 'Creating Account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-[hsl(220,9%,65%)]">
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold text-[hsl(217,91%,60%)] hover:text-[hsl(217,91%,55%)]"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}
                data-testid="button-toggle-mode"
              >
                {isSignup ? 'Sign in' : 'Sign up for free'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-[hsl(220,9%,65%)]">
          By {isSignup ? 'signing up' : 'signing in'}, you agree to our{' '}
          <a href="/terms" className="text-[hsl(217,91%,60%)] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-[hsl(217,91%,60%)] hover:underline">Privacy Policy</a>
        </div>
      </motion.div>
    </div>
  );
}
