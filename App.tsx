import React, { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PolicyEditor } from './components/Editor/PolicyEditor';
import { DocumentSidebar } from './components/Common/DocumentSidebar';
import { useDocuments } from './hooks/useDocuments';
import { Document } from '@/shared/types';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const { documents, loading, createDocument, updateDocument } = useDocuments();

  const handleDocumentSelect = (document: Document) => {
    setCurrentDocument(document);
  };

  const handleDocumentChange = async (document: Document) => {
    setCurrentDocument(document);
    try {
      await updateDocument(document.id, {
        title: document.title,
        content: document.content,
        metadata: document.metadata,
      });
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const handleNewDocument = async () => {
    try {
      const newDoc = await createDocument({
        title: '新しい約款',
        content: {
          sections: [
            {
              id: 'section-1',
              type: 'article',
              number: '1',
              title: '目的',
              content: 'この約款は、新しい保険商品について定めます。',
              order: 0,
            },
          ],
          format: 'structured',
        },
        metadata: {
          category: '一般',
          version: '1.0',
          tags: [],
          language: 'ja',
          wordCount: 0,
        },
      });
      setCurrentDocument(newDoc);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  // 初期文書の選択
  useEffect(() => {
    if (!currentDocument && documents.length > 0) {
      setCurrentDocument(documents[0]);
    }
  }, [documents, currentDocument]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>保険約款エディター</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <DocumentSidebar
          documents={documents}
          loading={loading}
          onDocumentSelect={handleDocumentSelect}
          onNewDocument={handleNewDocument}
          currentDocumentId={currentDocument?.id}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {currentDocument ? (
          <PolicyEditor
            document={currentDocument}
            onDocumentChange={handleDocumentChange}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#666',
            fontSize: '18px',
          }}>
            {loading ? '読み込み中...' : '文書を選択してください'}
          </div>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

export default App;

