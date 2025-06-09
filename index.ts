// 基本的なドメインモデル
export interface Document {
  id: string;
  title: string;
  content: DocumentContent;
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentContent {
  sections: Section[];
  format: 'structured' | 'plain';
}

export interface Section {
  id: string;
  type: 'article' | 'clause' | 'paragraph' | 'note';
  number?: string;
  title: string;
  content: string;
  order: number;
  children?: Section[];
}

export interface DocumentMetadata {
  category: string;
  version: string;
  tags: string[];
  language: 'ja' | 'en';
  wordCount: number;
  lastEditedBy?: string;
}

export interface SimilarSection {
  sectionId: string;
  documentId: string;
  title: string;
  content: string;
  similarity: number;
  context: {
    beforeText: string;
    afterText: string;
  };
}

export interface AIInteraction {
  id: string;
  documentId: string;
  sectionId?: string;
  prompt: string;
  response: string;
  model: string;
  tokensUsed: number;
  createdAt: Date;
}

// API型定義
export interface CreateDocumentRequest {
  title: string;
  content: DocumentContent;
  metadata?: Partial<DocumentMetadata>;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: DocumentContent;
  metadata?: Partial<DocumentMetadata>;
}

export interface GenerateContentRequest {
  documentId: string;
  sectionId?: string;
  prompt: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface GenerateContentResponse {
  id: string;
  content: string;
  suggestions?: string[];
}

export interface SearchSimilarRequest {
  text: string;
  documentId?: string;
  threshold?: number;
  maxResults?: number;
}

export interface SearchSimilarResponse {
  results: SimilarSection[];
}

// WebSocket イベント型
export interface ClientEvents {
  'search:similar': {
    text: string;
    documentId: string;
    cursorPosition: number;
    queryId: string;
  };
  'ai:generate': {
    prompt: string;
    documentId: string;
    sectionId?: string;
    generationId: string;
  };
  'document:subscribe': {
    documentId: string;
  };
}

export interface ServerEvents {
  'search:results': {
    results: SimilarSection[];
    queryId: string;
  };
  'ai:progress': {
    generationId: string;
    progress: number;
    status: 'generating' | 'complete' | 'error';
  };
  'ai:complete': {
    generationId: string;
    content: string;
    suggestions?: string[];
  };
  'error': {
    message: string;
    code: string;
  };
}

