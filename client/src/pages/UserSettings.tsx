import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye, EyeOff, Key, Settings, CreditCard, User, Shield } from 'lucide-react';

interface UserApiKey {
  id: number;
  provider: string;
  keyName: string;
  encryptedKey: string;
  isActive: boolean;
  createdAt: string;
}

interface UserSettings {
  theme: string;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  defaultLlmProvider: string;
  maxConcurrentProjects: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: string;
  currency: string;
  billingCycle: string;
  features: string[];
  limits: any;
}

export default function UserSettings() {
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('alpha');
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState({ provider: '', keyName: '', apiKey: '' });
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load API keys, settings, and subscription plans
      const [keysRes, settingsRes, plansRes] = await Promise.all([
        fetch('/api/user/api-keys', {
          headers: { Authorization: 'Bearer mock-token' }
        }),
        fetch('/api/user/settings', {
          headers: { Authorization: 'Bearer mock-token' }
        }),
        fetch('/api/subscription-plans')
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.data || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.data);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setSubscriptionPlans(plansData.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addApiKey = async () => {
    if (!newApiKey.provider || !newApiKey.keyName || !newApiKey.apiKey) {
      toast({
        title: "Error", 
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify(newApiKey)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API key added successfully"
        });
        setNewApiKey({ provider: '', keyName: '', apiKey: '' });
        setShowNewKeyForm(false);
        loadUserData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add API key",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add API key",
        variant: "destructive"
      });
    }
  };

  const deleteApiKey = async (keyId: number) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API key deleted successfully"
        });
        loadUserData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete API key",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
    }
  };

  const updateSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings updated successfully"
        });
        setSettings({ ...settings!, ...updatedSettings });
      } else {
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  const upgradePlan = async (planId: string) => {
    try {
      const response = await fetch('/api/user/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token'
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully upgraded to ${planId} plan`
        });
        setCurrentPlan(planId);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to upgrade subscription",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade subscription",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading user settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences, API keys, and subscription plan</p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Management</CardTitle>
              <CardDescription>
                Securely store your API keys for various providers. Keys are encrypted and never exposed in full.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewKeyForm ? (
                <Button onClick={() => setShowNewKeyForm(true)}>Add New API Key</Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="provider">Provider</Label>
                      <Select value={newApiKey.provider} onValueChange={(value) => setNewApiKey({...newApiKey, provider: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="hubspot">HubSpot</SelectItem>
                          <SelectItem value="salesforce">Salesforce</SelectItem>
                          <SelectItem value="pipedrive">Pipedrive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Production Key"
                        value={newApiKey.keyName}
                        onChange={(e) => setNewApiKey({...newApiKey, keyName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your API key"
                        value={newApiKey.apiKey}
                        onChange={(e) => setNewApiKey({...newApiKey, apiKey: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addApiKey}>Add Key</Button>
                    <Button variant="outline" onClick={() => setShowNewKeyForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                {apiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No API keys configured yet</p>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{key.provider}</Badge>
                        <div>
                          <div className="font-medium">{key.keyName}</div>
                          <div className="text-sm text-muted-foreground">{key.encryptedKey}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your WAI DevStudio experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select 
                        value={settings.theme} 
                        onValueChange={(value) => updateSettings({ theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(value) => updateSettings({ language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={settings.timezone} 
                        onValueChange={(value) => updateSettings({ timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="defaultLlm">Default LLM Provider</Label>
                      <Select 
                        value={settings.defaultLlmProvider} 
                        onValueChange={(value) => updateSettings({ defaultLlmProvider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google Gemini</SelectItem>
                          <SelectItem value="grok">X.AI Grok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about your projects</p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Choose the plan that best fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`border rounded-lg p-4 ${currentPlan === plan.id ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg">{plan.displayName}</h3>
                      <div className="text-2xl font-bold text-primary">
                        {plan.price === 'Contact Us' ? plan.price : `$${plan.price}`}
                        {plan.price !== 'Contact Us' && (
                          <span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Shield className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <div className="text-xs text-muted-foreground">
                          +{plan.features.length - 4} more features
                        </div>
                      )}
                    </div>

                    {currentPlan === plan.id ? (
                      <Badge className="w-full justify-center">Current Plan</Badge>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => upgradePlan(plan.id)}
                        variant={plan.id === 'enterprise' ? 'outline' : 'default'}
                      >
                        {plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value="user@example.com" disabled />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value="testuser" disabled />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Profile information is managed through your authentication provider
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}