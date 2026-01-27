import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, DollarSign, FileText, Settings } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
}

export default function PolicyManagementConsole() {
  const { data: policies } = useQuery({
    queryKey: ['/api/v9/policies/list'],
  });

  const productionPolicies = policies?.policies?.production || [];
  const developmentPolicies = policies?.policies?.development || [];

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'budget-enforcement':
        return <DollarSign className="w-5 h-5" />;
      case 'regulatory-compliance':
        return <FileText className="w-5 h-5" />;
      case 'production-control':
        return <Settings className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-policy-console">Policy Management Console</h1>
          <p className="text-muted-foreground">Parlant Framework - Production Controls & Compliance</p>
        </div>
        <Badge variant="outline" className="text-lg">
          <Shield className="w-4 h-4 mr-2" />
          {productionPolicies.length + developmentPolicies.length} Policies
        </Badge>
      </div>

      <Tabs defaultValue="production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="production" data-testid="tab-production">Production Policies</TabsTrigger>
          <TabsTrigger value="development" data-testid="tab-development">Development Policies</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productionPolicies.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No production policies configured
              </div>
            ) : (
              productionPolicies.map((policy: Policy) => (
                <Card key={policy.id} data-testid={`card-policy-${policy.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPolicyIcon(policy.type)}
                        <span>{policy.name}</span>
                      </div>
                      <Badge variant={policy.enabled ? "default" : "outline"}>
                        {policy.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="capitalize">{policy.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(policy.config, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {developmentPolicies.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No development policies configured
              </div>
            ) : (
              developmentPolicies.map((policy: Policy) => (
                <Card key={policy.id} data-testid={`card-dev-policy-${policy.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPolicyIcon(policy.type)}
                        <span>{policy.name}</span>
                      </div>
                      <Badge variant={policy.enabled ? "default" : "outline"}>
                        {policy.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="capitalize">{policy.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(policy.config, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Audit Log</CardTitle>
              <CardDescription>Track policy enforcement and violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Audit log interface - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
