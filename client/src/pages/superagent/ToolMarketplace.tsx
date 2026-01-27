import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Zap, Copy, Check, Code2, BookOpen, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { WAI_TOOLS, TOOL_CATEGORIES, WAITool } from '@/data/wai-tools';

interface ToolWithEnabled extends WAITool {
  enabled: boolean;
}

export default function SuperAgentToolMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTool, setSelectedTool] = useState<ToolWithEnabled | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolWithEnabled[]>(
    WAI_TOOLS.map(tool => ({ ...tool, enabled: true }))
  );
  const { toast } = useToast();

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleTool = (toolId: string) => {
    setTools(tools.map((tool) =>
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  };

  const copyCode = async (code: string, label: string = 'code') => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    if (!Icon) {
      return Icons.Zap;
    }
    return Icon;
  };

  return (
    <div className="h-full flex bg-[hsl(222,47%,11%)]">
      {/* Sidebar - Categories */}
      <div className="w-64 bg-[hsl(222,47%,15%)] border-r border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Categories
        </h3>
        <div className="space-y-1">
          {TOOL_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              data-testid={`category-${category.id}`}
            >
              <span className="text-sm">{category.label}</span>
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                {category.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-white/10 bg-[hsl(222,47%,13%)]">
          <div className="max-w-4xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 102 tools..."
                className="pl-10 bg-[hsl(222,47%,15%)] border-white/10 text-white placeholder:text-gray-500"
                data-testid="input-search-tools"
              />
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => {
                const Icon = getIcon(tool.icon);
                return (
                  <Card
                    key={tool.id}
                    className="bg-[hsl(222,47%,15%)] border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
                    onClick={() => setSelectedTool(tool)}
                    data-testid={`card-tool-${tool.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-base">{tool.name}</CardTitle>
                            <CardDescription className="text-gray-400 text-sm mt-1 line-clamp-2">
                              {tool.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={(e) => {
                            e.stopPropagation();
                            toggleTool(tool.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`switch-tool-${tool.id}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        variant="outline"
                        className="border-white/20 text-gray-300 text-xs"
                      >
                        {TOOL_CATEGORIES.find((c) => c.id === tool.category)?.label || tool.category}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No tools found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Tool Detail Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="bg-[hsl(222,47%,13%)] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedTool && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    {(() => {
                      const Icon = getIcon(selectedTool.icon);
                      return <Icon className="w-8 h-8 text-blue-400" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl text-white">{selectedTool.name}</DialogTitle>
                    <DialogDescription className="text-gray-400 mt-1">
                      {selectedTool.description}
                    </DialogDescription>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-gray-300">
                    {TOOL_CATEGORIES.find((c) => c.id === selectedTool.category)?.label}
                  </Badge>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="bg-[hsl(222,47%,15%)] border-b border-white/10 w-full justify-start rounded-none flex-shrink-0">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500/20" data-testid={`tab-overview-${selectedTool.id}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="examples" className="data-[state=active]:bg-blue-500/20" data-testid={`tab-examples-${selectedTool.id}`}>
                    <Code2 className="w-4 h-4 mr-2" />
                    Examples {selectedTool.examples && `(${selectedTool.examples.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="usecases" className="data-[state=active]:bg-blue-500/20" data-testid={`tab-usecases-${selectedTool.id}`}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Use Cases
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="space-y-4 p-4">
                    {/* Parameters Table */}
                    {selectedTool.parameters && selectedTool.parameters.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Parameters</h4>
                        <div className="border border-white/10 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[hsl(222,47%,15%)] hover:bg-[hsl(222,47%,15%)]">
                                <TableHead className="text-gray-300">Name</TableHead>
                                <TableHead className="text-gray-300">Type</TableHead>
                                <TableHead className="text-gray-300">Required</TableHead>
                                <TableHead className="text-gray-300">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedTool.parameters.map((param, idx) => (
                                <TableRow key={idx} className="border-white/10">
                                  <TableCell className="font-mono text-blue-300">{param.name}</TableCell>
                                  <TableCell className="font-mono text-sm text-green-300">{param.type}</TableCell>
                                  <TableCell>
                                    <Badge variant={param.required ? 'destructive' : 'secondary'} className="text-xs">
                                      {param.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-gray-400 text-sm">
                                    {param.description}
                                    {param.defaultValue && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Default: <code className="text-purple-300">{param.defaultValue}</code>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[hsl(222,47%,15%)] border border-white/10 rounded-lg p-6">
                        <p className="text-gray-400 text-sm text-center">
                          API documentation for this tool is being prepared. Check the Examples tab for usage patterns.
                        </p>
                      </div>
                    )}
                    
                    {/* Return Type */}
                    {selectedTool.returnType && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-2">Return Type</h4>
                        <div className="bg-[hsl(222,47%,15%)] border border-white/10 rounded-lg p-4">
                          <code className="text-green-300 font-mono">{selectedTool.returnType}</code>
                          {selectedTool.returnDescription && (
                            <p className="text-gray-400 text-sm mt-2">{selectedTool.returnDescription}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-4 p-4">
                    {selectedTool.examples?.map((example, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{example.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{example.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20"
                            onClick={() => copyCode(example.code, example.title)}
                            data-testid={`button-copy-example-${selectedTool.id}-${idx}`}
                          >
                            {copiedCode === example.code ? (
                              <><Check className="w-3 h-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                        <pre className="px-4 py-3 bg-[hsl(222,47%,8%)] border border-white/10 rounded-lg text-sm text-gray-300 overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                    ))}
                    
                    {(!selectedTool.examples || selectedTool.examples.length === 0) && (
                      <div className="text-center py-8">
                        <Code2 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400 mb-2">Code examples for this tool are being prepared.</p>
                        <p className="text-sm text-gray-500 mb-4">In the meantime, here's a basic usage template:</p>
                        <div className="max-w-lg mx-auto">
                          <div className="flex items-center justify-end mb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20"
                              onClick={() => copyCode(
                                `import { ${selectedTool.id.replace(/-/g, '_')} } from '@wai/tools';\n\n// Use the ${selectedTool.name} tool\nconst result = await ${selectedTool.id.replace(/-/g, '_')}({\n  // Add your parameters here\n});`,
                                'Template code'
                              )}
                              data-testid={`button-copy-template-${selectedTool.id}`}
                            >
                              {copiedCode?.includes(selectedTool.id) ? (
                                <><Check className="w-3 h-3 mr-1" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3 mr-1" /> Copy Template</>
                              )}
                            </Button>
                          </div>
                          <pre className="px-4 py-3 bg-[hsl(222,47%,8%)] border border-white/10 rounded-lg text-sm text-gray-300 overflow-x-auto text-left">
                            <code>{`import { ${selectedTool.id.replace(/-/g, '_')} } from '@wai/tools';\n\n// Use the ${selectedTool.name} tool\nconst result = await ${selectedTool.id.replace(/-/g, '_')}({\n  // Add your parameters here\n});`}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="usecases" className="space-y-3 p-4">
                    {selectedTool.useCases && selectedTool.useCases.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedTool.useCases.map((useCase, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-[hsl(222,47%,15%)] border border-white/10 rounded-lg hover:border-blue-500/30 transition-colors"
                            data-testid={`usecase-${selectedTool.id}-${idx}`}
                          >
                            <div className="flex items-start gap-3">
                              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300">{useCase}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400 mb-2">Use cases for this tool are being compiled.</p>
                        <p className="text-sm text-gray-500">Check back soon or refer to the tool description and examples.</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
