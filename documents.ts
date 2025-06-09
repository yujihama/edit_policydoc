import { Router } from 'express';
import { DocumentService } from '../services/DocumentService.js';

export default function createDocumentRoutes(documentService: DocumentService) {
  const router = Router();

  // 文書一覧取得
  router.get('/', async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;
      const result = await documentService.getDocuments({
        search: search as string,
        limit: Number(limit),
        offset: Number(offset),
      });
      res.json(result);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 文書詳細取得
  router.get('/:id', async (req, res) => {
    try {
      const document = await documentService.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 文書作成
  router.post('/', async (req, res) => {
    try {
      const document = await documentService.createDocument(req.body);
      res.status(201).json(document);
    } catch (error) {
      console.error('Create document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 文書更新
  router.put('/:id', async (req, res) => {
    try {
      const document = await documentService.updateDocument(req.params.id, req.body);
      res.json(document);
    } catch (error) {
      console.error('Update document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 文書削除
  router.delete('/:id', async (req, res) => {
    try {
      await documentService.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

