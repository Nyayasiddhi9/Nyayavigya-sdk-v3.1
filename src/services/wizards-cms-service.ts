
interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  author: string;
  views?: number;
  metadata?: Record<string, any>;
}

interface ContentType {
  id: string;
  name: string;
  description: string;
  fields: any[];
  permissions: string[];
  status: 'draft' | 'published';
  createdAt: string;
  itemCount?: number;
}

class WizardsCMSService {
  private content: Map<string, ContentItem> = new Map();
  private contentTypes: Map<string, ContentType> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Initialize default content
    const defaultContent: ContentItem[] = [
      {
        id: '1',
        title: 'Getting Started with WAI DevStudio',
        type: 'blog-post',
        status: 'published',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        author: 'John Doe',
        views: 1250,
        metadata: { featured: true, category: 'tutorial' }
      },
      {
        id: '2',
        title: 'Advanced AI Assistant Configuration',
        type: 'documentation',
        status: 'draft',
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
        author: 'Jane Smith',
        views: 890,
        metadata: { difficulty: 'advanced', category: 'guide' }
      }
    ];

    defaultContent.forEach(item => {
      this.content.set(item.id, item);
    });

    // Initialize default content types
    const defaultContentTypes: ContentType[] = [
      {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Rich blog content with SEO optimization',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true },
          { id: '2', name: 'content', type: 'textarea', required: true }
        ],
        permissions: ['admin', 'editor', 'author'],
        status: 'published',
        createdAt: '2024-01-15',
        itemCount: 15
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Technical documentation and guides',
        fields: [
          { id: '1', name: 'title', type: 'text', required: true },
          { id: '2', name: 'content', type: 'textarea', required: true }
        ],
        permissions: ['admin', 'editor'],
        status: 'published',
        createdAt: '2024-01-10',
        itemCount: 8
      }
    ];

    defaultContentTypes.forEach(type => {
      this.contentTypes.set(type.id, type);
    });
  }



  async createContent(contentData: Partial<ContentItem>): Promise<ContentItem> {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const content: ContentItem = {
      id: contentId,
      title: contentData.title || 'Untitled',
      type: contentData.type || 'blog-post',
      status: contentData.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: contentData.author || 'System',
      views: 0,
      metadata: contentData.metadata || {}
    };

    this.content.set(contentId, content);
    return content;
  }

  async updateContent(contentId: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const content = this.content.get(contentId);
    if (!content) return null;

    const updatedContent = { 
      ...content, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.content.set(contentId, updatedContent);
    return updatedContent;
  }

  async deleteContent(contentId: string): Promise<boolean> {
    return this.content.delete(contentId);
  }

  async getAllContent(filters: {
    type?: string;
    status?: string;
    tags?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ContentItem[]> {
    const allContent = Array.from(this.content.values());
    
    let filtered = allContent.filter(item => {
      if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
      if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
      return true;
    });

    // Sort content
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof ContentItem] as any;
        const bVal = b[filters.sortBy as keyof ContentItem] as any;
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        return aVal > bVal ? order : -order;
      });
    }

    // Apply pagination
    const start = filters.offset || 0;
    const end = start + (filters.limit || 20);
    return filtered.slice(start, end);
  }

  async searchContentWithAI(query: string, enhancement: any): Promise<ContentItem[]> {
    // Simple search implementation that can be enhanced with AI
    const allContent = Array.from(this.content.values());
    return allContent.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.metadata?.description && item.metadata.description.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getContentById(contentId: string): Promise<ContentItem | null> {
    return this.content.get(contentId) || null;
  }

  async createContentType(typeData: {
    name: string;
    description: string;
    fields?: any[];
  }): Promise<ContentType> {
    const typeId = typeData.name.toLowerCase().replace(/\s+/g, '-');
    
    const contentType: ContentType = {
      id: typeId,
      name: typeData.name,
      description: typeData.description,
      fields: typeData.fields || [
        { id: '1', name: 'title', type: 'text', required: true },
        { id: '2', name: 'content', type: 'textarea', required: true }
      ],
      permissions: ['admin', 'editor'],
      status: 'published',
      createdAt: new Date().toISOString(),
      itemCount: 0
    };

    this.contentTypes.set(typeId, contentType);
    return contentType;
  }

}

export const wizardsCMSService = new WizardsCMSService();
