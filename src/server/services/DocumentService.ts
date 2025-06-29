import { Database } from '../models/Database.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '@/shared/types';

interface GetDocumentsOptions {
  search?: string;
  limit: number;
  offset: number;
}

interface GetDocumentsResult {
  documents: Document[];
  total: number;
}

export class DocumentService {
  constructor(
    private db: Database,
    private embeddingService: EmbeddingService
  ) {}

  async getDocuments(options: GetDocumentsOptions): Promise<GetDocumentsResult> {
    const { search, limit, offset } = options;
    
    let query = 'SELECT * FROM documents';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const documents = await this.db.all(query, params);
    const total = await this.getDocumentsCount(search);
    
    return {
      documents: documents.map(this.mapToDocument),
      total,
    };
  }

  async getDocument(id: string): Promise<Document | null> {
    const row = await this.db.get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToDocument(row);
  }

  async createDocument(request: CreateDocumentRequest): Promise<Document> {
    const id = this.generateId();
    const now = new Date();
    
    const document: Document = {
      id,
      title: request.title,
      content: request.content,
      metadata: {
        category: request.metadata?.category || '一般',
        version: request.metadata?.version || '1.0',
        tags: request.metadata?.tags || [],
        language: request.metadata?.language || 'ja',
        wordCount: this.calculateWordCount(request.content),
        lastEditedBy: request.metadata?.lastEditedBy,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.db.run(
      'INSERT INTO documents (id, title, content, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        document.id,
        document.title,
        JSON.stringify(document.content),
        JSON.stringify(document.metadata),
        document.createdAt.toISOString(),
        document.updatedAt.toISOString(),
      ]
    );

    // 埋め込みベクトルの生成
    await this.embeddingService.indexDocument(document);

    return document;
  }

  async updateDocument(id: string, updates: UpdateDocumentRequest): Promise<Document> {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error('Document not found');
    }

    const updatedDocument: Document = {
      ...document,
      ...updates,
      metadata: {
        ...document.metadata,
        ...updates.metadata,
        wordCount: updates.content ? this.calculateWordCount(updates.content) : document.metadata.wordCount,
      },
      updatedAt: new Date(),
    };
    
    await this.db.run(
      'UPDATE documents SET title = ?, content = ?, metadata = ?, updated_at = ? WHERE id = ?',
      [
        updatedDocument.title,
        JSON.stringify(updatedDocument.content),
        JSON.stringify(updatedDocument.metadata),
        updatedDocument.updatedAt.toISOString(),
        id,
      ]
    );

    // 埋め込みベクトルの更新
    if (updates.content) {
      await this.embeddingService.indexDocument(updatedDocument);
    }

    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.db.run('DELETE FROM documents WHERE id = ?', [id]);
    await this.db.run('DELETE FROM document_embeddings WHERE document_id = ?', [id]);
    await this.db.run('DELETE FROM ai_interactions WHERE document_id = ?', [id]);
  }

  private async getDocumentsCount(search?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM documents';
    const params: any[] = [];
    
    if (search) {
      query += ' WHERE title LIKE ? OR content LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const result = await this.db.get<{ count: number }>(query, params);
    return result?.count || 0;
  }

  private mapToDocument(row: any): Document {
    return {
      id: row.id,
      title: row.title,
      content: JSON.parse(row.content),
      metadata: JSON.parse(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private calculateWordCount(content: any): number {
    const text = content.sections
      .map((section: any) => `${section.title} ${section.content}`)
      .join(' ');
    return text.replace(/\s+/g, '').length;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

