import { Router } from 'express';
import { AIService } from '../services/AIService.js';

export default function createAIRoutes(aiService: AIService) {
  const router = Router();

  // コンテンツ生成
  router.post('/generate', async (req, res) => {
    try {
      const result = await aiService.generateContent(req.body);
      res.json(result);
    } catch (error) {
      console.error('AI generate error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 類似検索
  router.post('/search', async (req, res) => {
    try {
      const { query, threshold, maxResults, excludeDocumentId } = req.body;
      const results = await aiService.searchSimilarSections(query, {
        threshold,
        maxResults,
        excludeDocumentId,
      });
      res.json({ results });
    } catch (error) {
      console.error('AI search error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

