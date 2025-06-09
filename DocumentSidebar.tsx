import React from 'react';
import { Stack, Button, Text, Loader, ScrollArea, Paper, Group, Badge } from '@mantine/core';
import { IconPlus, IconFileText } from '@tabler/icons-react';
import { Document } from '@/shared/types';

interface DocumentSidebarProps {
  documents: Document[];
  loading: boolean;
  onDocumentSelect: (document: Document) => void;
  onNewDocument: () => void;
  currentDocumentId?: string;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documents,
  loading,
  onDocumentSelect,
  onNewDocument,
  currentDocumentId,
}) => {
  if (loading) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Loader size="md" />
        <Text size="sm" c="dimmed">読み込み中...</Text>
      </Stack>
    );
  }

  return (
    <Stack h="100%">
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={onNewDocument}
        variant="filled"
        data-testid="new-document-button"
      >
        新しい文書
      </Button>

      <Text size="sm" fw={500} c="dimmed">
        文書一覧 ({documents.length})
      </Text>

      <ScrollArea flex={1} data-testid="document-list">
        <Stack gap="xs">
          {documents.map((document) => (
            <Paper
              key={document.id}
              p="sm"
              withBorder
              style={{
                cursor: 'pointer',
                backgroundColor: currentDocumentId === document.id ? '#f0f8ff' : undefined,
                borderColor: currentDocumentId === document.id ? '#1976d2' : undefined,
              }}
              onClick={() => onDocumentSelect(document)}
            >
              <Group gap="xs" align="flex-start">
                <IconFileText size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} lineClamp={2}>
                    {document.title}
                  </Text>
                  <Group gap="xs">
                    <Badge size="xs" variant="light">
                      {document.metadata.category}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {document.metadata.wordCount}文字
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {new Date(document.updatedAt).toLocaleDateString('ja-JP')}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ))}
          {documents.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              文書がありません
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};

