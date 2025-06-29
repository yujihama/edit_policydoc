import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Grid, Stack, Paper, Group, TextInput, Button, Text } from '@mantine/core';
import { IconSave, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Editor from '@monaco-editor/react';
import { Document, SimilarSection } from '@/shared/types';
import { SimilarSectionsPanel } from '../Search/SimilarSectionsPanel';
import { AIPanel } from '../AI/AIPanel';
import { useWebSocket } from '../../hooks/useWebSocket';

interface PolicyEditorProps {
  document: Document;
  onDocumentChange: (document: Document) => void;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  document,
  onDocumentChange,
}) => {
  const editorRef = useRef<any>(null);
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState('');
  const [similarSections, setSimilarSections] = useState<SimilarSection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // WebSocket接続
  const websocket = useWebSocket('ws://localhost:3001', {
    onMessage: (data) => {
      switch (data.type) {
        case 'search:results':
          setSimilarSections(data.results);
          setIsSearching(false);
          break;
        case 'ai:complete':
          insertTextAtCursor(data.content);
          notifications.show({
            title: 'AI生成完了',
            message: 'コンテンツが生成されました',
            color: 'green',
          });
          break;
        case 'error':
          notifications.show({
            title: 'エラー',
            message: data.message,
            color: 'red',
          });
          setIsSearching(false);
          break;
      }
    },
  });

  // 文書内容をテキストに変換
  const documentToText = useCallback((doc: Document): string => {
    return doc.content.sections
      .map((section) => {
        const header = `第${section.number}条（${section.title}）`;
        return `${header}\n${section.content}\n`;
      })
      .join('\n');
  }, []);

  // テキストから文書構造に変換
  const textToDocument = useCallback((text: string): Document => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;
    let sectionContent = '';
    let order = 0;

    for (const line of lines) {
      const sectionMatch = line.match(/^第(\d+)条（(.+)）$/);
      
      if (sectionMatch) {
        // 前のセクションを保存
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: sectionContent.trim(),
            order: order++,
          });
        }
        
        // 新しいセクション開始
        currentSection = {
          id: `section-${sectionMatch[1]}`,
          type: 'article' as const,
          number: sectionMatch[1],
          title: sectionMatch[2],
        };
        sectionContent = '';
      } else if (currentSection && line.trim()) {
        sectionContent += line + '\n';
      }
    }

    // 最後のセクションを保存
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: sectionContent.trim(),
        order: order++,
      });
    }

    return {
      ...document,
      title,
      content: {
        sections,
        format: 'structured',
      },
      metadata: {
        ...document.metadata,
        wordCount: text.replace(/\s+/g, '').length,
      },
      updatedAt: new Date(),
    };
  }, [document, title]);

  // エディターの初期化
  useEffect(() => {
    setTitle(document.title);
    setContent(documentToText(document));
  }, [document, documentToText]);

  // エディターマウント時の処理
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // カスタム言語定義（保険約款用）
    editor.getModel()?.updateOptions({
      tabSize: 2,
      insertSpaces: true,
    });

    // 自動保存の設定
    editor.onDidChangeModelContent(() => {
      const currentContent = editor.getValue();
      setContent(currentContent);
      
      // デバウンス付き自動保存
      clearTimeout((window as any).autoSaveTimeout);
      (window as any).autoSaveTimeout = setTimeout(() => {
        handleSave(currentContent);
      }, 2000);
    });

    // 選択テキストの類似検索
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editor.getModel()?.getValueInRange(selection);
        if (selectedText && selectedText.length > 10) {
          handleSimilarSearch(selectedText);
        }
      }
    });
  };

  // 保存処理
  const handleSave = (currentContent?: string) => {
    const textContent = currentContent || content;
    const updatedDocument = textToDocument(textContent);
    onDocumentChange(updatedDocument);
    
    notifications.show({
      title: '保存完了',
      message: '文書が保存されました',
      color: 'green',
    });
  };

  // 類似検索
  const handleSimilarSearch = (query: string) => {
    if (!websocket.isConnected || query.length < 5) return;

    setIsSearching(true);
    const queryId = Math.random().toString(36).substring(2);
    
    websocket.sendMessage({
      type: 'search:similar',
      text: query,
      documentId: document.id,
      queryId,
    });
  };

  // 手動検索
  const handleManualSearch = () => {
    if (searchQuery.trim()) {
      handleSimilarSearch(searchQuery);
    }
  };

  // テキスト挿入
  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      };
      
      editor.executeEdits('insert-text', [{
        range,
        text: `\n\n${text}\n`,
      }]);
      
      editor.focus();
    }
  };

  return (
    <Stack h="100vh" p={0}>
      {/* ヘッダー */}
      <Paper p="md" withBorder>
        <Group justify="space-between">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文書タイトル"
            style={{ flex: 1 }}
            data-testid="document-title-input"
          />
          <Button
            leftSection={<IconSave size={16} />}
            onClick={() => handleSave()}
            data-testid="save-button"
          >
            保存
          </Button>
        </Group>
      </Paper>

      {/* メインエリア */}
      <Grid flex={1} gutter="md" p="md">
        {/* エディター */}
        <Grid.Col span={6}>
          <Paper withBorder h="100%">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              value={content}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
              }}
            />
          </Paper>
        </Grid.Col>

        {/* サイドパネル */}
        <Grid.Col span={3}>
          <Stack h="100%">
            {/* 検索パネル */}
            <Paper withBorder p="md">
              <Stack gap="sm">
                <Text fw={500} size="sm">類似検索</Text>
                <Group>
                  <TextInput
                    placeholder="検索キーワード"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                    data-testid="search-input"
                  />
                  <Button
                    size="sm"
                    leftSection={<IconSearch size={14} />}
                    onClick={handleManualSearch}
                    loading={isSearching}
                    data-testid="search-button"
                  >
                    検索
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {/* 類似箇所パネル */}
            <div style={{ flex: 1 }}>
              <SimilarSectionsPanel
                sections={similarSections}
                onInsert={insertTextAtCursor}
              />
            </div>
          </Stack>
        </Grid.Col>

        {/* AIパネル */}
        <Grid.Col span={3}>
          <AIPanel
            documentId={document.id}
            onInsert={insertTextAtCursor}
            websocket={websocket}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

