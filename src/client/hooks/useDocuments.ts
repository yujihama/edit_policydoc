import { useState, useEffect } from 'react';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '@/shared/types';

interface UseDocumentsResult {
  documents: Document[];
  loading: boolean;
  error: string | null;
  createDocument: (request: CreateDocumentRequest) => Promise<Document>;
  updateDocument: (id: string, updates: UpdateDocumentRequest) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export const useDocuments = (): UseDocumentsResult => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (request: CreateDocumentRequest): Promise<Document> => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const document = await response.json();
      setDocuments(prev => [document, ...prev]);
      return document;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw new Error(error);
    }
  };

  const updateDocument = async (id: string, updates: UpdateDocumentRequest): Promise<Document> => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      const document = await response.json();
      setDocuments(prev => prev.map(doc => doc.id === id ? document : doc));
      return document;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw new Error(error);
    }
  };

  const deleteDocument = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setError(error);
      throw new Error(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
};

