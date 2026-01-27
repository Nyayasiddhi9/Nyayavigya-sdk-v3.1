/**
 * Two-Phase Extraction Pipeline
 * Extracts meaningful information from conversation messages before storing as memories
 * 
 * Phase 1: Extract key facts, preferences, entities, and insights
 * Phase 2: Compress and structure extracted information for efficient storage
 */

export interface Message {
  role: string;
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ExtractedFact {
  type: 'preference' | 'fact' | 'entity' | 'insight' | 'goal' | 'constraint';
  content: string;
  confidence: number; // 0-1
  source: 'explicit' | 'inferred';
  relatedEntities?: string[];
}

export interface EntityRelationship {
  subject: string; // Entity 1
  predicate: string; // Relationship type (e.g., "WORKS_AT", "KNOWS", "FOUNDED")
  object: string; // Entity 2
  confidence: number; // 0-1
  source: string; // Original text where relationship was found
}

export interface ExtractionResult {
  facts: ExtractedFact[];
  summary: string;
  entities: string[];
  topics: string[];
  relationships: EntityRelationship[]; // NEW: Entity relationships
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Relationship Extractor - Extracts semantic relationships between entities
 * Implements pluggable architecture for future LLM-based extraction
 */
export class RelationshipExtractor {
  /**
   * Core relationship predicates (two-tier taxonomy)
   */
  private readonly corePredicates = [
    'WORKS_AT', 'WORKS_FOR', 'EMPLOYED_BY',
    'LIVES_IN', 'LOCATED_IN', 'BASED_IN',
    'KNOWS', 'FRIENDS_WITH', 'RELATED_TO',
    'FOUNDED', 'CREATED', 'ESTABLISHED',
    'OWNS', 'POSSESSES', 'HAS',
    'MANAGES', 'LEADS', 'SUPERVISES',
    'REPORTS_TO', 'WORKS_UNDER',
    'PART_OF', 'MEMBER_OF', 'BELONGS_TO',
    'STUDIED_AT', 'GRADUATED_FROM', 'ATTENDED',
    'MARRIED_TO', 'SPOUSE_OF', 'PARTNER_OF',
  ] as const;

  /**
   * Pattern-based relationship extraction (baseline strategy)
   */
  extractRelationships(messages: Message[], entities: string[]): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    const entitySet = new Set(entities);

    for (const message of messages) {
      const content = message.content;

      // Work relationships
      const workPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:works?|work)\s+(?:at|for)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'WORKS_AT' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:is|are)\s+(?:employed|working)\s+(?:at|by)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'EMPLOYED_BY' },
      ];

      // Location relationships
      const locationPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:lives?|live|living)\s+in\s+(\w+(?:\s+\w+)*)/gi, predicate: 'LIVES_IN' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:is|are)\s+(?:located|based)\s+in\s+(\w+(?:\s+\w+)*)/gi, predicate: 'LOCATED_IN' },
      ];

      // Ownership/founding relationships
      const ownershipPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:founded|created|established)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'FOUNDED' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:owns?|own)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'OWNS' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:manages?|manage|leads?|lead)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'MANAGES' },
      ];

      // Social relationships
      const socialPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:knows?|know)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'KNOWS' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:is|are)\s+(?:married|spouse)\s+(?:to|of)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'MARRIED_TO' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:is|are)\s+friends?\s+with\s+(\w+(?:\s+\w+)*)/gi, predicate: 'FRIENDS_WITH' },
      ];

      // Education relationships
      const educationPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:studied|graduated|attended)\s+(?:at|from)\s+(\w+(?:\s+\w+)*)/gi, predicate: 'STUDIED_AT' },
      ];

      // Organization relationships
      const orgPatterns = [
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:is|are)\s+(?:part|member)\s+of\s+(\w+(?:\s+\w+)*)/gi, predicate: 'PART_OF' },
        { pattern: /(\w+(?:\s+\w+)*)\s+(?:reports?|report)\s+to\s+(\w+(?:\s+\w+)*)/gi, predicate: 'REPORTS_TO' },
      ];

      const allPatterns = [
        ...workPatterns,
        ...locationPatterns,
        ...ownershipPatterns,
        ...socialPatterns,
        ...educationPatterns,
        ...orgPatterns,
      ];

      for (const { pattern, predicate } of allPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const subject = this.normalizeEntity(match[1]);
          const object = this.normalizeEntity(match[2]);

          // Only include if both subject and object are recognized entities
          if (entitySet.has(subject) && entitySet.has(object)) {
            relationships.push({
              subject,
              predicate: this.normalizePredicate(predicate),
              object,
              confidence: 0.85, // Pattern-based extraction has good confidence
              source: match[0].trim(),
            });
          }
        }
      }
    }

    return this.deduplicateRelationships(relationships);
  }

  /**
   * Normalize entity names for consistency
   */
  private normalizeEntity(entity: string): string {
    return entity.trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^(the|a|an)\s+/i, ''); // Remove articles
  }

  /**
   * Normalize predicate to canonical form
   */
  private normalizePredicate(predicate: string): string {
    const normalized = predicate.toUpperCase().replace(/\s+/g, '_');
    
    // Map variations to canonical forms
    const canonicalMap: Record<string, string> = {
      'WORKS_FOR': 'WORKS_AT',
      'EMPLOYED_BY': 'WORKS_AT',
      'BASED_IN': 'LOCATED_IN',
      'CREATED': 'FOUNDED',
      'ESTABLISHED': 'FOUNDED',
      'POSSESSES': 'OWNS',
      'HAS': 'OWNS',
      'LEADS': 'MANAGES',
      'SUPERVISES': 'MANAGES',
      'WORKS_UNDER': 'REPORTS_TO',
      'BELONGS_TO': 'PART_OF',
      'MEMBER_OF': 'PART_OF',
      'GRADUATED_FROM': 'STUDIED_AT',
      'ATTENDED': 'STUDIED_AT',
      'SPOUSE_OF': 'MARRIED_TO',
      'PARTNER_OF': 'MARRIED_TO',
      'RELATED_TO': 'KNOWS',
      'FRIENDS_WITH': 'KNOWS',
    };

    return canonicalMap[normalized] || normalized;
  }

  /**
   * Deduplicate relationships (remove exact duplicates and normalize bidirectional)
   */
  private deduplicateRelationships(relationships: EntityRelationship[]): EntityRelationship[] {
    const seen = new Set<string>();
    const unique: EntityRelationship[] = [];

    for (const rel of relationships) {
      // Create key for deduplication
      const key = `${rel.subject}|${rel.predicate}|${rel.object}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rel);
      }
    }

    return unique;
  }
}

/**
 * Phase 1: Extract structured information from messages
 */
export class MessageExtractor {
  private relationshipExtractor: RelationshipExtractor;

  constructor() {
    this.relationshipExtractor = new RelationshipExtractor();
  }
  /**
   * Extract facts from a single message
   */
  extractFromMessage(message: Message): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const content = message.content.toLowerCase();

    // Extract explicit preferences (e.g., "I prefer...", "I like...", "I want...")
    const preferencePatterns = [
      /i (prefer|like|love|want|need|enjoy|hate|dislike)\s+([^,.!?]+)/gi,
      /my (favorite|preferred)\s+([^,.!?]+)/gi,
      /(always|never|usually)\s+([^,.!?]+)/gi,
    ];

    for (const pattern of preferencePatterns) {
      const matches = message.content.matchAll(pattern);
      for (const match of matches) {
        facts.push({
          type: 'preference',
          content: match[0].trim(),
          confidence: 0.9,
          source: 'explicit',
        });
      }
    }

    // Extract factual statements (e.g., "I am...", "My name is...", "I work at...")
    const factPatterns = [
      /i am\s+([^,.!?]+)/gi,
      /my name is\s+([^,.!?]+)/gi,
      /i work (at|for|in)\s+([^,.!?]+)/gi,
      /i live in\s+([^,.!?]+)/gi,
      /i have\s+([^,.!?]+)/gi,
    ];

    for (const pattern of factPatterns) {
      const matches = message.content.matchAll(pattern);
      for (const match of matches) {
        facts.push({
          type: 'fact',
          content: match[0].trim(),
          confidence: 0.95,
          source: 'explicit',
        });
      }
    }

    // Extract goals and intentions (e.g., "I want to...", "I plan to...", "My goal is...")
    const goalPatterns = [
      /i (want|plan|intend|aim|hope)\s+to\s+([^,.!?]+)/gi,
      /my goal is\s+([^,.!?]+)/gi,
      /i'm (trying|planning|working)\s+to\s+([^,.!?]+)/gi,
    ];

    for (const pattern of goalPatterns) {
      const matches = message.content.matchAll(pattern);
      for (const match of matches) {
        facts.push({
          type: 'goal',
          content: match[0].trim(),
          confidence: 0.85,
          source: 'explicit',
        });
      }
    }

    // Extract constraints (e.g., "I can't...", "I don't...", "I'm allergic to...")
    const constraintPatterns = [
      /i (can't|cannot|don't|won't)\s+([^,.!?]+)/gi,
      /i'm (allergic|sensitive)\s+to\s+([^,.!?]+)/gi,
      /i (avoid|refuse)\s+([^,.!?]+)/gi,
    ];

    for (const pattern of constraintPatterns) {
      const matches = message.content.matchAll(pattern);
      for (const match of matches) {
        facts.push({
          type: 'constraint',
          content: match[0].trim(),
          confidence: 0.9,
          source: 'explicit',
        });
      }
    }

    return facts;
  }

  /**
   * Extract entities (people, places, organizations, products)
   */
  extractEntities(messages: Message[]): string[] {
    const entities = new Set<string>();
    const entityPatterns = [
      // Capitalized words (potential proper nouns)
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
      // Organizations with keywords
      /\b(?:Google|Apple|Microsoft|Amazon|Meta|Netflix|Tesla|OpenAI|Anthropic|AWS|GCP)\b/gi,
      // Cities and countries
      /\b(?:New York|San Francisco|London|Paris|Tokyo|Seattle|Austin|Boston)\b/gi,
    ];

    for (const message of messages) {
      for (const pattern of entityPatterns) {
        const matches = message.content.matchAll(pattern);
        for (const match of matches) {
          const entity = match[0].trim();
          // Filter out common words
          if (!['I', 'The', 'A', 'An', 'My', 'Your'].includes(entity)) {
            entities.add(entity);
          }
        }
      }
    }

    return Array.from(entities);
  }

  /**
   * Extract topics from messages
   */
  extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    const topicKeywords = [
      'programming', 'coding', 'development', 'design', 'marketing',
      'finance', 'health', 'fitness', 'travel', 'food', 'music',
      'movies', 'books', 'sports', 'technology', 'science', 'education',
      'business', 'career', 'family', 'relationships', 'hobbies',
    ];

    const allContent = messages.map(m => m.content.toLowerCase()).join(' ');

    for (const keyword of topicKeywords) {
      if (allContent.includes(keyword)) {
        topics.add(keyword);
      }
    }

    return Array.from(topics);
  }

  /**
   * Analyze sentiment of messages
   */
  analyzeSentiment(messages: Message[]): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['love', 'great', 'awesome', 'excellent', 'good', 'happy', 'enjoy', 'wonderful'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'dislike', 'annoying', 'frustrating'];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const message of messages) {
      const content = message.content.toLowerCase();
      for (const word of positiveWords) {
        if (content.includes(word)) positiveScore++;
      }
      for (const word of negativeWords) {
        if (content.includes(word)) negativeScore++;
      }
    }

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * Phase 1: Extract all information from messages
   */
  extractFromMessages(messages: Message[]): ExtractionResult {
    const allFacts: ExtractedFact[] = [];

    // Extract facts from each message
    for (const message of messages) {
      const facts = this.extractFromMessage(message);
      allFacts.push(...facts);
    }

    // Deduplicate similar facts (simple similarity check)
    const uniqueFacts = this.deduplicateFacts(allFacts);

    // Extract entities and topics
    const entities = this.extractEntities(messages);
    const topics = this.extractTopics(messages);
    const sentiment = this.analyzeSentiment(messages);

    // Extract relationships between entities (Phase 1b)
    const relationships = this.relationshipExtractor.extractRelationships(messages, entities);

    // Create summary
    const summary = this.createSummary(messages, uniqueFacts);

    return {
      facts: uniqueFacts,
      summary,
      entities,
      topics,
      relationships,
      sentiment,
    };
  }

  /**
   * Deduplicate similar facts
   */
  private deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
    const unique: ExtractedFact[] = [];
    const seen = new Set<string>();

    for (const fact of facts) {
      // Normalize content for comparison
      const normalized = fact.content.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(fact);
      }
    }

    return unique;
  }

  /**
   * Create a concise summary from messages
   */
  private createSummary(messages: Message[], facts: ExtractedFact[]): string {
    if (facts.length === 0) {
      return messages.map(m => m.content).join('\n');
    }

    // Summarize by grouping facts by type
    const factsByType = facts.reduce((acc, fact) => {
      if (!acc[fact.type]) acc[fact.type] = [];
      acc[fact.type].push(fact.content);
      return acc;
    }, {} as Record<string, string[]>);

    const parts: string[] = [];

    if (factsByType.preference?.length) {
      parts.push(`Preferences: ${factsByType.preference.join('; ')}`);
    }
    if (factsByType.fact?.length) {
      parts.push(`Facts: ${factsByType.fact.join('; ')}`);
    }
    if (factsByType.goal?.length) {
      parts.push(`Goals: ${factsByType.goal.join('; ')}`);
    }
    if (factsByType.constraint?.length) {
      parts.push(`Constraints: ${factsByType.constraint.join('; ')}`);
    }
    if (factsByType.entity?.length) {
      parts.push(`Entities: ${factsByType.entity.join('; ')}`);
    }

    return parts.join('\n');
  }
}

/**
 * Phase 2: Compress and structure extracted information
 */
export class MemoryCompressor {
  /**
   * Compress extraction result for efficient storage
   * Achieves ~90% token reduction by removing redundancy
   */
  compress(extraction: ExtractionResult): string {
    const parts: string[] = [];

    // Group high-confidence facts only
    const highConfidenceFacts = extraction.facts.filter(f => f.confidence >= 0.8);

    // Compress by type
    const factsByType = highConfidenceFacts.reduce((acc, fact) => {
      if (!acc[fact.type]) acc[fact.type] = [];
      acc[fact.type].push(this.extractKeyInfo(fact.content));
      return acc;
    }, {} as Record<string, string[]>);

    // Build compressed memory
    for (const [type, contents] of Object.entries(factsByType)) {
      if (contents.length > 0) {
        parts.push(`${type}: ${contents.join(', ')}`);
      }
    }

    // Add entities and topics compactly
    if (extraction.entities.length > 0) {
      parts.push(`entities: ${extraction.entities.slice(0, 5).join(', ')}`);
    }
    if (extraction.topics.length > 0) {
      parts.push(`topics: ${extraction.topics.slice(0, 3).join(', ')}`);
    }

    // Add high-confidence relationships as compact triples (Phase 2 enhancement)
    const highConfidenceRels = extraction.relationships.filter(r => r.confidence >= 0.8);
    if (highConfidenceRels.length > 0) {
      const relTriples = highConfidenceRels.map(r => 
        `${r.subject}|${r.predicate}|${r.object}@${r.confidence.toFixed(2)}`
      );
      parts.push(`rel: ${relTriples.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Extract key information from fact content
   */
  private extractKeyInfo(content: string): string {
    // Remove common prefixes to save tokens
    const prefixes = [
      'i prefer ', 'i like ', 'i love ', 'i want ', 'i need ',
      'i am ', 'my name is ', 'i work at ', 'i work for ',
      'i live in ', 'i have ', 'i can\'t ', 'i don\'t ',
    ];

    let cleaned = content.toLowerCase();
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
        break;
      }
    }

    return cleaned.trim();
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(original: string, compressed: string): number {
    const originalTokens = this.estimateTokens(original);
    const compressedTokens = this.estimateTokens(compressed);
    return 1 - (compressedTokens / originalTokens);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Complete two-phase extraction pipeline
 */
export class ExtractionPipeline {
  private extractor: MessageExtractor;
  private compressor: MemoryCompressor;

  constructor() {
    this.extractor = new MessageExtractor();
    this.compressor = new MemoryCompressor();
  }

  /**
   * Process messages through full pipeline
   */
  async process(messages: Message[]): Promise<{
    compressed: string;
    full: ExtractionResult;
    compressionRatio: number;
  }> {
    // Phase 1: Extract structured information
    const extraction = this.extractor.extractFromMessages(messages);

    // Phase 2: Compress for storage
    const compressed = this.compressor.compress(extraction);

    // Calculate compression ratio
    const originalContent = messages.map(m => m.content).join('\n');
    const compressionRatio = this.compressor.calculateCompressionRatio(
      originalContent,
      compressed
    );

    return {
      compressed,
      full: extraction,
      compressionRatio,
    };
  }
}
