import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Key, Brain, Globe, Palette } from 'lucide-react';

export default function SuperAgentSettings() {
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="h-full overflow-y-auto bg-[hsl(222,47%,11%)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your AI Super Agent preferences</p>
        </div>

        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="bg-[hsl(222,47%,15%)] border border-white/10">
            <TabsTrigger value="api" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Brain className="w-4 h-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="language" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Globe className="w-4 h-4 mr-2" />
              Language
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-4">
            <Card className="bg-[hsl(222,47%,15%)] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">LLM Provider API Keys</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure API keys for 23+ LLM providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'OpenAI API Key', placeholder: 'sk-...', name: 'openai' },
                  { label: 'Anthropic API Key', placeholder: 'sk-ant-...', name: 'anthropic' },
                  { label: 'Google API Key', placeholder: 'AIza...', name: 'google' },
                  { label: 'ElevenLabs API Key', placeholder: 'el_...', name: 'elevenlabs' },
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-white">{field.label}</Label>
                    <Input
                      id={field.name}
                      type="password"
                      placeholder={field.placeholder}
                      className="bg-[hsl(222,47%,20%)] border-white/10 text-white"
                      data-testid={`input-api-key-${field.name}`}
                    />
                  </div>
                ))}
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-api-keys">
                  <Save className="w-4 h-4 mr-2" />
                  Save API Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Preferences */}
          <TabsContent value="models" className="space-y-4">
            <Card className="bg-[hsl(222,47%,15%)] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Default Models</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose your preferred models for different tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chat-model" className="text-white">Chat Model</Label>
                  <Select defaultValue="gpt-4o">
                    <SelectTrigger id="chat-model" className="bg-[hsl(222,47%,20%)] border-white/10 text-white" data-testid="select-chat-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code-model" className="text-white">Code Model</Label>
                  <Select defaultValue="claude-3.5-sonnet">
                    <SelectTrigger id="code-model" className="bg-[hsl(222,47%,20%)] border-white/10 text-white" data-testid="select-code-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Settings */}
          <TabsContent value="language" className="space-y-4">
            <Card className="bg-[hsl(222,47%,15%)] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Multi-Lingual Support</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose your preferred language for the interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-white">Interface Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language" className="bg-[hsl(222,47%,20%)] border-white/10 text-white" data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    🌐 Multi-lingual support is optimized for the Indian market with 6 regional languages
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="bg-[hsl(222,47%,15%)] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Appearance & Behavior</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize how the Super Agent looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="text-white">Dark Mode</Label>
                    <p className="text-sm text-gray-400">Use dark theme for the interface</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    data-testid="switch-dark-mode"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save" className="text-white">Auto-save Conversations</Label>
                    <p className="text-sm text-gray-400">Automatically save chat history</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                    data-testid="switch-auto-save"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
