/**
 * Meta Tag Generator Tool
 * Generate SEO meta tags for web pages
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Meta Tag Generator Tool Definition
 */
export const metaTagGeneratorTool: Tool = {
  id: 'meta_tag_generator',
  name: 'Meta Tag Generator',
  description: 'Generate SEO meta tags: title, description, Open Graph, Twitter Cards, JSON-LD schema',
  parameters: [
    {
      name: 'content',
      type: 'object',
      description: 'Content data (title, description, image, type, etc.)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Generation options (includeOG, includeTwitter, includeSchema, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Generated meta tags in HTML format',
  },
  examples: [
    {
      input: {
        content: {
          title: 'My Article Title',
          description: 'Article description text',
          image: 'https://example.com/image.jpg',
          type: 'article',
        },
        options: { includeOG: true, includeTwitter: true },
      },
      output: {
        success: true,
        html: '<meta name="description" content="Article description text">...',
      },
    },
  ],
};

/**
 * Generate basic meta tags
 */
const generateBasicTags = (content: any): string[] => {
  const tags: string[] = [];

  if (content.title) {
    tags.push(`<title>${escapeHtml(content.title)}</title>`);
  }

  if (content.description) {
    tags.push(`<meta name="description" content="${escapeHtml(content.description)}">`);
  }

  if (content.keywords) {
    const keywords = Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords;
    tags.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
  }

  if (content.author) {
    tags.push(`<meta name="author" content="${escapeHtml(content.author)}">`);
  }

  if (content.robots) {
    tags.push(`<meta name="robots" content="${content.robots}">`);
  }

  tags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  tags.push(`<meta charset="UTF-8">`);

  return tags;
};

/**
 * Generate Open Graph tags
 */
const generateOGTags = (content: any): string[] => {
  const tags: string[] = [];

  if (content.title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(content.title)}">`);
  }

  if (content.description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(content.description)}">`);
  }

  if (content.image) {
    tags.push(`<meta property="og:image" content="${content.image}">`);
  }

  if (content.url) {
    tags.push(`<meta property="og:url" content="${content.url}">`);
  }

  const type = content.type || 'website';
  tags.push(`<meta property="og:type" content="${type}">`);

  if (content.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(content.siteName)}">`);
  }

  if (content.locale) {
    tags.push(`<meta property="og:locale" content="${content.locale}">`);
  }

  return tags;
};

/**
 * Generate Twitter Card tags
 */
const generateTwitterTags = (content: any): string[] => {
  const tags: string[] = [];

  const cardType = content.twitterCard || 'summary_large_image';
  tags.push(`<meta name="twitter:card" content="${cardType}">`);

  if (content.title) {
    tags.push(`<meta name="twitter:title" content="${escapeHtml(content.title)}">`);
  }

  if (content.description) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(content.description)}">`);
  }

  if (content.image) {
    tags.push(`<meta name="twitter:image" content="${content.image}">`);
  }

  if (content.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${content.twitterSite}">`);
  }

  if (content.twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${content.twitterCreator}">`);
  }

  return tags;
};

/**
 * Generate JSON-LD schema
 */
const generateSchema = (content: any): string => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': content.schemaType || 'WebPage',
  };

  if (content.title) schema.name = content.title;
  if (content.description) schema.description = content.description;
  if (content.image) schema.image = content.image;
  if (content.url) schema.url = content.url;
  if (content.author) {
    schema.author = {
      '@type': 'Person',
      name: content.author,
    };
  }
  if (content.datePublished) schema.datePublished = content.datePublished;
  if (content.dateModified) schema.dateModified = content.dateModified;

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
};

/**
 * Escape HTML entities
 */
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Meta Tag Generator Executor
 */
export const metaTagGeneratorExecutor: ToolExecutor = async (params) => {
  const { content, options = {} } = params;

  if (!content || typeof content !== 'object') {
    return {
      success: false,
      error: 'content must be an object with page data',
    };
  }

  try {
    const tags: string[] = [];

    // Basic meta tags
    tags.push(...generateBasicTags(content));

    // Open Graph tags
    if (options.includeOG !== false) {
      tags.push(...generateOGTags(content));
    }

    // Twitter Card tags
    if (options.includeTwitter !== false) {
      tags.push(...generateTwitterTags(content));
    }

    // JSON-LD schema
    let schema = '';
    if (options.includeSchema) {
      schema = generateSchema(content);
    }

    const html = tags.join('\n');
    const fullHtml = schema ? `${html}\n${schema}` : html;

    return {
      success: true,
      html: fullHtml,
      tags: {
        basic: generateBasicTags(content),
        openGraph: options.includeOG !== false ? generateOGTags(content) : [],
        twitter: options.includeTwitter !== false ? generateTwitterTags(content) : [],
        schema: options.includeSchema ? schema : null,
      },
      tagCount: tags.length + (schema ? 1 : 0),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
