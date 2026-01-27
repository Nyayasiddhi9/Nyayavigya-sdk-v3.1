import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Auth() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" data-testid="page-auth">
      <Card className="w-[400px]" data-testid="card-auth">
        <CardHeader>
          <CardTitle data-testid="text-auth-title">Authentication</CardTitle>
          <CardDescription data-testid="text-auth-description">Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" data-testid="button-signin">
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}