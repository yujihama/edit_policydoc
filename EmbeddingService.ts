import OpenAI from 'openai';
import { Database } from '../models/Database.js';
import { SimilarSection } from '../../shared/types/index.js';

interface DocumentChunk {
  id: string;
  documentId: string;
  sectionId: string;
  index: number;
  text: string;
  metadata: {
    sectionTitle: string;
    sectionType: string;
    sectionNumber?: string;
    chunkIndex?: number;
    isPartial?: boolean;
  };
}

interface SimilaritySearchOptions {
  threshold?: number;
  maxResults?: number;
  excludeDocumentId?: string;
  sectionTypes?: string[];
}

export class EmbeddingService {
  private vectorCache = new Map<string, number[]>();
  
  constructor(
    private database: Database,
    private openai?: OpenAI
  ) {}

  // テキストの埋め込みベクトル生成
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.getCacheKey(text);
    
    // キャッシュチェック
    if (this.vectorCache.has(cacheKey)) {
      return this.vectorCache.get(cacheKey)!;
    }

    if (!this.openai) {
      // OpenAI未設定の場合はダミーベクトルを返す
      const dummyVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      this.vectorCache.set(cacheKey, dummyVector);
      return dummyVector;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: this.preprocessText(text),
      });

      const embedding = response.data[0].embedding;
      
      // キャッシュに保存
      this.vectorCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // エラー時はダミーベクトルを返す
      const dummyVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      this.vectorCache.set(cacheKey, dummyVector);
      return dummyVector;
    }
  }

  // 文書全体のインデックス化
  async indexDocument(document: any): Promise<void> {
    const chunks = this.chunkDocument(document);
    
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.text);
      
      await this.database.run(
        `INSERT OR REPLACE INTO document_embeddings 
         (id, document_id, section_id, chunk_index, content, embedding, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chunk.id,
          document.id,
          chunk.sectionId,
          chunk.index,
          chunk.text,
          JSON.stringify(embedding),
          JSON.stringify(chunk.metadata),
          new Date().toISOString(),
        ]
      );
    }
  }

  // 文書のチャンク分割（境界情報を失わないように）
  private chunkDocument(document: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const chunkSize = 500; // 文字数
    const overlap = 100; // オーバーラップ

    document.content.sections.forEach((section: any, sectionIndex: number) => {
      const sectionText = `${section.title}\n${section.content}`;
      
      if (sectionText.length <= chunkSize) {
        // セクション全体が1チャンクに収まる場合
        chunks.push({
          id: `${document.id}-${section.id}-0`,
          documentId: document.id,
          sectionId: section.id,
          index: chunks.length,
          text: sectionText,
          metadata: {
            sectionTitle: section.title,
            sectionType: section.type,
            sectionNumber: section.number,
          },
        });
      } else {
        // セクションを複数チャンクに分割
        let startPos = 0;
        let chunkIndex = 0;

        while (startPos < sectionText.length) {
          const endPos = Math.min(startPos + chunkSize, sectionText.length);
          const chunkText = sectionText.substring(startPos, endPos);

          chunks.push({
            id: `${document.id}-${section.id}-${chunkIndex}`,
            documentId: document.id,
            sectionId: section.id,
            index: chunks.length,
            text: chunkText,
            metadata: {
              sectionTitle: section.title,
              sectionType: section.type,
              sectionNumber: section.number,
              chunkIndex,
              isPartial: true,
            },
          });

          startPos += chunkSize - overlap;
          chunkIndex++;
        }
      }
    });

    return chunks;
  }

  // 類似検索実行
  async findSimilar(
    queryEmbedding: number[],
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarSection[]> {
    const {
      threshold = 0.7,
      maxResults = 10,
      excludeDocumentId,
    } = options;

    // データベースから全ての埋め込みベクトルを取得
    let query = `
      SELECT e.*, d.title as document_title
      FROM document_embeddings e
      JOIN documents d ON e.document_id = d.id
    `;
    const params: any[] = [];

    if (excludeDocumentId) {
      query += ' WHERE e.document_id != ?';
      params.push(excludeDocumentId);
    }

    const embeddings = await this.database.all(query, params);

    // コサイン類似度計算
    const similarities = embeddings
      .map((row: any) => ({
        ...row,
        embedding: JSON.parse(row.embedding),
        similarity: this.cosineSimilarity(queryEmbedding, JSON.parse(row.embedding)),
      }))
      .filter((item: any) => item.similarity >= threshold)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, maxResults);

    // 結果をSimilarSection形式に変換
    return similarities.map((item: any) => ({
      sectionId: item.section_id,
      documentId: item.document_id,
      title: item.document_title,
      content: item.content,
      similarity: item.similarity,
      context: {
        beforeText: '', // 必要に応じて前後のテキストを取得
        afterText: '',
      },
      metadata: JSON.parse(item.metadata || '{}'),
    }));
  }

  // コサイン類似度計算
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // テキスト前処理
  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 連続する空白を1つに
      .replace(/[（）]/g, '') // 全角括弧を除去
      .trim();
  }

  private getCacheKey(text: string): string {
    return Buffer.from(text).toString('base64').substring(0, 32);
  }
}

