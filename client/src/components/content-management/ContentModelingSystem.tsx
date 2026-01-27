
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Database, Settings, Users, Eye, Edit3, Trash2, 
  FileText, Image, Video, Calendar, Link, Hash, ToggleLeft,
  Layout, Code, Globe, ChevronRight, Save, X, Copy, ExternalLink,
  Sparkles, Zap, Shield, Key, Layers, Workflow, CheckCircle2,
  AlertTriangle, Info, HelpCircle, BookOpen, Target, Award,
  Crown, Rocket, Wand2, Star, TrendingUp, Clock, Activity
} from 'lucide-react';

interface ContentType {
  id: string;
  name: string;
  description: string;
  fields: ContentField[];
  permissions: string[];
  status: 'draft' | 'published';
  createdAt: string;
  category?: string;
  icon?: string;
  color?: string;
  usage?: {
    totalItems: number;
    recentActivity: number;
    popularFields: string[];
  };
}

interface ContentField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'image' | 'video' | 'url' | 'relation' | 'json' | 'select' | 'multiselect';
  required: boolean;
  validation?: any;
  defaultValue?: any;
  description?: string;
  options?: string[];
  placeholder?: string;
}

export function ContentModelingSystem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('types');
  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch content types
  const { data: contentTypes, isLoading } = useQuery<ContentType[]>({
    queryKey: ['/api/content-types'],
    initialData: [
      {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Rich blog content with SEO optimization',
        category: 'Content Marketing',
        icon: 'FileText',
        color: 'from-blue-500 to-cyan-500',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true, description: 'SEO-friendly title' },
          { id: '2', name: 'content', type: 'textarea', required: true, description: 'Main blog content' },
          { id: '3', name: 'featured_image', type: 'image', required: false, description: 'Hero image' },
          { id: '4', name: 'published_date', type: 'date', required: true },
          { id: '5', name: 'tags', type: 'multiselect', required: false, options: ['technology', 'business', 'marketing'] }
        ],
        permissions: ['admin', 'editor', 'author'],
        status: 'published',
        createdAt: '2024-01-15',
        usage: {
          totalItems: 45,
          recentActivity: 12,
          popularFields: ['title', 'content', 'featured_image']
        }
      },
      {
        id: 'product',
        name: 'Product',
        description: 'E-commerce product catalog',
        category: 'E-commerce',
        icon: 'Package',
        color: 'from-green-500 to-emerald-500',
        fields: [
          { id: '1', name: 'name', type: 'text', required: true },
          { id: '2', name: 'description', type: 'textarea', required: true },
          { id: '3', name: 'price', type: 'number', required: true },
          { id: '4', name: 'images', type: 'image', required: true },
          { id: '5', name: 'in_stock', type: 'boolean', required: true, defaultValue: true }
        ],
        permissions: ['admin', 'product_manager'],
        status: 'published',
        createdAt: '2024-01-10',
        usage: {
          totalItems: 128,
          recentActivity: 23,
          popularFields: ['name', 'price', 'images']
        }
      },
      {
        id: 'event',
        name: 'Event',
        description: 'Event management and listings',
        category: 'Events',
        icon: 'Calendar',
        color: 'from-purple-500 to-violet-500',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true },
          { id: '2', name: 'description', type: 'textarea', required: true },
          { id: '3', name: 'start_date', type: 'date', required: true },
          { id: '4', name: 'end_date', type: 'date', required: false },
          { id: '5', name: 'location', type: 'text', required: true },
          { id: '6', name: 'featured', type: 'boolean', required: false, defaultValue: false }
        ],
        permissions: ['admin', 'event_manager'],
        status: 'draft',
        createdAt: '2024-01-20',
        usage: {
          totalItems: 15,
          recentActivity: 5,
          popularFields: ['title', 'start_date', 'location']
        }
      }
    ]
  });

  // Create content type mutation
  const createContentTypeMutation = useMutation({
    mutationFn: (contentType: Omit<ContentType, 'id' | 'createdAt'>) =>
      apiRequest('/api/content-types', 'POST', contentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-types'] });
      setIsCreating(false);
      toast({
        title: "✨ Content Type Created",
        description: "Your content type has been created successfully with auto-generated APIs."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create content type.",
        variant: "destructive"
      });
    }
  });

  const fieldTypes = [
    { id: 'text', name: 'Text', icon: FileText, description: 'Short text input' },
    { id: 'textarea', name: 'Long Text', icon: FileText, description: 'Multi-line text area' },
    { id: 'number', name: 'Number', icon: Hash, description: 'Numeric input' },
    { id: 'boolean', name: 'Boolean', icon: ToggleLeft, description: 'True/false toggle' },
    { id: 'date', name: 'Date', icon: Calendar, description: 'Date picker' },
    { id: 'image', name: 'Image', icon: Image, description: 'Image upload' },
    { id: 'video', name: 'Video', icon: Video, description: 'Video upload' },
    { id: 'url', name: 'URL', icon: Link, description: 'Web link' },
    { id: 'select', name: 'Select', icon: ChevronRight, description: 'Dropdown selection' },
    { id: 'multiselect', name: 'Multi-Select', icon: Layers, description: 'Multiple selections' },
    { id: 'json', name: 'JSON', icon: Code, description: 'Structured data' },
    { id: 'relation', name: 'Relation', icon: Link, description: 'Link to other content' }
  ];

  const categories = [
    { id: 'content-marketing', name: 'Content Marketing', color: 'bg-blue-100 text-blue-800' },
    { id: 'e-commerce', name: 'E-commerce', color: 'bg-green-100 text-green-800' },
    { id: 'events', name: 'Events', color: 'bg-purple-100 text-purple-800' },
    { id: 'portfolio', name: 'Portfolio', color: 'bg-pink-100 text-pink-800' },
    { id: 'documentation', name: 'Documentation', color: 'bg-gray-100 text-gray-800' },
    { id: 'social', name: 'Social Media', color: 'bg-orange-100 text-orange-800' }
  ];

  const ContentTypeCard = ({ type }: { type: ContentType }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="group cursor-pointer"
      onClick={() => setSelectedType(type)}
    >
      <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="p-0">
          <div className={`h-32 bg-gradient-to-br ${type.color} relative rounded-t-lg`}>
            <div className="absolute inset-0 bg-black/10 rounded-t-lg" />
            <div className="absolute top-4 left-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <Badge variant={type.status === 'published' ? 'default' : 'secondary'} className="bg-white/20 text-white backdrop-blur-sm">
                {type.status}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white mb-1">{type.name}</h3>
              <p className="text-white/80 text-sm">{type.category}</p>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {type.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {type.fields.length} fields
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {type.permissions.length} roles
              </span>
              {type.usage && (
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {type.usage.totalItems} items
                </span>
              )}
            </div>
            
            {type.usage && type.usage.popularFields && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Popular fields:</p>
                <div className="flex flex-wrap gap-1">
                  {type.usage.popularFields.slice(0, 3).map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                  {type.usage.popularFields.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{type.usage.popularFields.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                setEditingType(type);
              }}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                // Copy API endpoint
                navigator.clipboard.writeText(`/api/content/${type.id}`);
                toast({
                  title: "API endpoint copied",
                  description: `Copied /api/content/${type.id} to clipboard`
                });
              }}>
                <Code className="h-4 w-4 mr-1" />
                API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ContentTypeBuilder = ({ type, onSave, onCancel }: {
    type?: ContentType;
    onSave: (contentType: any) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: type?.name || '',
      description: type?.description || '',
      category: type?.category || '',
      fields: type?.fields || [],
      permissions: type?.permissions || ['admin', 'editor'],
      status: type?.status || 'draft'
    });

    const addField = () => {
      const newField: ContentField = {
        id: `field_${Date.now()}`,
        name: '',
        type: 'text',
        required: false,
        description: '',
        placeholder: ''
      };
      setFormData(prev => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
    };

    const updateField = (index: number, field: Partial<ContentField>) => {
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
      }));
    };

    const removeField = (index: number) => {
      setFormData(prev => ({
        ...prev,
        fields: prev.fields.filter((_, i) => i !== index)
      }));
    };

    const getFieldIcon = (type: string) => {
      const fieldType = fieldTypes.find(ft => ft.id === type);
      return fieldType ? fieldType.icon : FileText;
    };

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {type ? 'Edit Content Type' : 'Create New Content Type'}
          </h2>
          <p className="text-gray-600">
            Define the structure and behavior of your content with custom fields and validation
          </p>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Content Type Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Blog Post, Product, Event"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used in your API endpoints</p>
              </div>
              
              <div>
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${cat.color.split(' ')[0]}`} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this content type is for and how it will be used..."
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger className="mt-1 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Draft
                    </div>
                  </SelectItem>
                  <SelectItem value="published">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Published
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Fields */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-600" />
                Content Fields
                <Badge variant="secondary">{formData.fields.length} fields</Badge>
              </CardTitle>
              <Button onClick={addField} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fields yet</h3>
                <p className="text-gray-500 mb-4">Add your first field to define the content structure</p>
                <Button onClick={addField} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Field
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {formData.fields.map((field, index) => {
                    const Icon = getFieldIcon(field.type);
                    return (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="grid grid-cols-12 gap-4 items-start">
                          <div className="col-span-12 md:col-span-3">
                            <Label className="text-sm font-medium">Field Name *</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              placeholder="field_name"
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-2">
                            <Label className="text-sm font-medium">Type</Label>
                            <Select value={field.type} onValueChange={(value) => updateField(index, { type: value as any })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(ft => {
                                  const TypeIcon = ft.icon;
                                  return (
                                    <SelectItem key={ft.id} value={ft.id}>
                                      <div className="flex items-center gap-2">
                                        <TypeIcon className="h-4 w-4" />
                                        {ft.name}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-12 md:col-span-3">
                            <Label className="text-sm font-medium">Description</Label>
                            <Input
                              value={field.description || ''}
                              onChange={(e) => updateField(index, { description: e.target.value })}
                              placeholder="Field description"
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-2">
                            <Label className="text-sm font-medium">Options</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <label className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(index, { required: e.target.checked })}
                                  className="rounded"
                                />
                                Required
                              </label>
                            </div>
                          </div>
                          
                          <div className="col-span-12 md:col-span-2 flex items-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeField(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Field specific options */}
                        {(field.type === 'select' || field.type === 'multiselect') && (
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm font-medium">Options (comma-separated)</Label>
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(index, { 
                                options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                              })}
                              placeholder="option1, option2, option3"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Access Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['admin', 'editor', 'author', 'contributor', 'viewer'].map(role => (
                <label key={role} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          permissions: [...prev.permissions, role]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          permissions: prev.permissions.filter(p => p !== role)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium capitalize">{role}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                Auto-generated REST API
              </span>
              <span className="flex items-center gap-1">
                <Code className="h-4 w-4 text-blue-500" />
                GraphQL schema
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                Role-based security
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={() => onSave(formData)} 
              disabled={!formData.name || formData.fields.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {type ? 'Update' : 'Create'} Content Type
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Content Modeling System
            </h1>
            <Badge variant="secondary" className="mt-1">
              <Crown className="h-3 w-3 mr-1" />
              Enterprise CMS
            </Badge>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Create dynamic content types with custom fields, automatic API generation, and advanced permissions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{contentTypes?.length || 0}</div>
            <div className="text-sm text-blue-700">Content Types</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-4 text-center">
            <Code className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{(contentTypes?.length || 0) * 2}</div>
            <div className="text-sm text-green-700">Auto APIs</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-4 text-center">
            <Layers className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {contentTypes?.reduce((sum, type) => sum + type.fields.length, 0) || 0}
            </div>
            <div className="text-sm text-purple-700">Total Fields</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {contentTypes?.reduce((sum, type) => sum + (type.usage?.totalItems || 0), 0) || 0}
            </div>
            <div className="text-sm text-orange-700">Content Items</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-2 h-auto p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <TabsTrigger value="types" className="flex items-center gap-2 p-3">
            <Database className="h-4 w-4" />
            Content Types
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2 p-3">
            <Wand2 className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2 p-3">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2 p-3">
            <Code className="h-4 w-4" />
            API Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Content Types</h2>
              <p className="text-gray-600">Manage your content structure and schemas</p>
            </div>
            <Button onClick={() => setActiveTab('builder')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Content Type
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contentTypes && contentTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentTypes.map((type) => (
                <ContentTypeCard key={type.id} type={type} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <Database className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                <CardTitle className="text-2xl mb-4">No Content Types Yet</CardTitle>
                <CardDescription className="text-lg mb-6 max-w-md mx-auto">
                  Create your first content type to start building your dynamic content management system with auto-generated APIs.
                </CardDescription>
                <Button onClick={() => setActiveTab('builder')} size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Rocket className="h-5 w-5 mr-2" />
                  Create Your First Content Type
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder">
          <Card className="max-w-6xl mx-auto">
            <CardContent className="p-8">
              <ContentTypeBuilder
                type={editingType || undefined}
                onSave={(data) => {
                  if (editingType) {
                    // Update logic would go here
                    setEditingType(null);
                  } else {
                    createContentTypeMutation.mutate(data);
                  }
                  setActiveTab('types');
                }}
                onCancel={() => {
                  setEditingType(null);
                  setActiveTab('types');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-green-600" />
                Role-Based Permissions
              </CardTitle>
              <CardDescription>
                Configure granular permissions for content types and operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Permission System</h3>
                <p className="text-gray-600 mb-4">
                  Fine-grained access control with role-based permissions coming soon
                </p>
                <Button variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-6 w-6 text-blue-600" />
                Auto-Generated APIs
              </CardTitle>
              <CardDescription>
                REST and GraphQL endpoints automatically created for each content type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contentTypes && contentTypes.length > 0 ? (
                  <div className="space-y-4">
                    {contentTypes.map(type => (
                      <Card key={type.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{type.name} API</h4>
                            <p className="text-sm text-gray-600">RESTful endpoints for {type.name.toLowerCase()} operations</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">REST</Badge>
                            <Badge variant="outline">GraphQL</Badge>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <div>GET /api/content/{type.id}</div>
                          <div>POST /api/content/{type.id}</div>
                          <div>PUT /api/content/{type.id}/[id]</div>
                          <div>DELETE /api/content/{type.id}/[id]</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No APIs Yet</h3>
                    <p className="text-gray-600">Create content types to automatically generate REST and GraphQL APIs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
