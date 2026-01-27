import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Templates() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Project Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>Templates will be available here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Browse our collection of project templates.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}