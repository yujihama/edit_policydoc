import OpenAI from 'openai';
import { EmbeddingService } from './EmbeddingService.js';
import { GenerateContentRequest, GenerateContentResponse, AIInteraction } from '@/shared/types';
import { Database } from '../models/Database.js';

export class AIService {
  constructor(
    private embeddingService: EmbeddingService,
    private database: Database,
    private openai?: OpenAI
  ) {}

  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const { documentId, sectionId, prompt, options = {} } = request;
    
    if (!this.openai) {
      // OpenAI未設定の場合はダミーレスポンス
      return {
        id: this.generateId(),
        content: `【AI生成コンテンツ】\n${prompt}に基づいて生成された条項です。\n\n第X条（生成された条項）\n当会社は、適切な条項を生成いたします。`,
        suggestions: ['関連する条項を確認してください', '法的な妥当性を検証してください'],
      };
    }

    try {
      // コンテキスト取得
      const context = await this.getDocumentContext(documentId, sectionId);
      
      // プロンプト構築
      const systemPrompt = this.buildSystemPrompt(context);
      
      // OpenAI API呼び出し（gpt-4.1を使用）
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 1000,
      });

      const content = completion.choices[0].message.content || '';
      
      // 履歴保存
      await this.saveInteraction({
        documentId,
        sectionId,
        prompt,
        response: content,
        model: 'gpt-4.1',
        tokensUsed: completion.usage?.total_tokens || 0,
      });

      return {
        id: this.generateId(),
        content,
        suggestions: await this.generateSuggestions(content),
      };
    } catch (error) {
      console.error('AI content generation failed:', error);
      throw new Error(`AI生成に失敗しました: ${error.message}`);
    }
  }

  async searchSimilarSections(query: string, options: any = {}): Promise<any> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    return this.embeddingService.findSimilar(queryEmbedding, {
      threshold: options.threshold || 0.7,
      maxResults: options.maxResults || 10,
      excludeDocumentId: options.excludeDocumentId,
    });
  }

  private async getDocumentContext(documentId: string, sectionId?: string): Promise<string> {
    const document = await this.database.get(
      'SELECT title, content FROM documents WHERE id = ?',
      [documentId]
    );
    
    if (!document) return '';
    
    const content = JSON.parse(document.content);
    const sections = content.sections || [];
    
    // 文書の概要を作成
    let context = `文書タイトル: ${document.title}\n\n`;
    
    if (sectionId) {
      const targetSection = sections.find((s: any) => s.id === sectionId);
      if (targetSection) {
        context += `対象セクション: 第${targetSection.number}条（${targetSection.title}）\n`;
        context += `内容: ${targetSection.content}\n\n`;
      }
    }
    
    // 他のセクションの概要
    context += '文書の構成:\n';
    sections.slice(0, 5).forEach((section: any) => {
      context += `- 第${section.number}条: ${section.title}\n`;
    });
    
    return context;
  }

  private buildSystemPrompt(context: string): string {
    return `
あなたは保険約款作成の専門家です。日本の保険業法および関連法規に準拠した条項を作成してください。

基本原則:
- 法的に正確で有効な表現を使用
- 明確で理解しやすい日本語
- 保険業界の標準的な用語を使用
- 消費者保護の観点を考慮

文書コンテキスト:
${context}

出力形式:
条項番号: 第○条（条項名）
条項内容: （具体的な条項文）

注意事項:
- 既存の条項との整合性を保つ
- 曖昧な表現を避ける
- 必要に応じて例外事項を明記する
`;
  }

  private async generateSuggestions(content: string): Promise<string[]> {
    const suggestions = [
      '生成された条項の法的妥当性を確認してください',
      '他の条項との整合性を検証してください',
      '用語の定義が適切か確認してください',
    ];

    // 内容に応じた具体的な提案を追加
    if (content.includes('責任')) {
      suggestions.push('責任の範囲と限度額を明確にしてください');
    }
    if (content.includes('免責')) {
      suggestions.push('免責事由が適切に列挙されているか確認してください');
    }
    if (content.includes('補償')) {
      suggestions.push('補償対象と除外事項を明確にしてください');
    }

    return suggestions;
  }

  private async saveInteraction(interaction: Omit<AIInteraction, 'id' | 'createdAt'>): Promise<void> {
    const id = this.generateId();
    const createdAt = new Date();

    await this.database.run(
      `INSERT INTO ai_interactions 
       (id, document_id, section_id, prompt, response, model_used, tokens_used, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        interaction.documentId,
        interaction.sectionId || null,
        interaction.prompt,
        interaction.response,
        interaction.model,
        interaction.tokensUsed,
        createdAt.toISOString(),
      ]
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

