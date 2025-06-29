import React from 'react';
import { Stack, Paper, Text, Button, Group, Badge, ScrollArea } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { SimilarSection } from '@/shared/types';

interface SimilarSectionsPanelProps {
  sections: SimilarSection[];
  onInsert: (text: string) => void;
}

export const SimilarSectionsPanel: React.FC<SimilarSectionsPanelProps> = ({
  sections,
  onInsert,
}) => {
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.9) return 'red';
    if (similarity > 0.7) return 'orange';
    return 'green';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity > 0.9) return '高';
    if (similarity > 0.7) return '中';
    return '低';
  };

  return (
    <Paper withBorder h="100%" p="md">
      <Stack h="100%">
        <Group justify="space-between">
          <Text fw={500} size="sm">
            類似箇所
          </Text>
          <Badge size="xs" variant="light">
            {sections.length}件
          </Badge>
        </Group>

        <ScrollArea flex={1} data-testid="similar-sections">
          <Stack gap="sm">
            {sections.map((section, index) => (
              <Paper
                key={`${section.documentId}-${section.sectionId}-${index}`}
                p="sm"
                withBorder
                data-testid="similar-section-item"
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Text size="xs" fw={500} lineClamp={1}>
                      {section.title}
                    </Text>
                    <Badge
                      size="xs"
                      color={getSimilarityColor(section.similarity)}
                      variant="light"
                    >
                      {getSimilarityLabel(section.similarity)} {(section.similarity * 100).toFixed(0)}%
                    </Badge>
                  </Group>

                  <Text size="xs" lineClamp={3} c="dimmed">
                    {section.content}
                  </Text>

                  <Button
                    size="xs"
                    variant="light"
                    rightSection={<IconArrowRight size={12} />}
                    onClick={() => onInsert(section.content)}
                    data-testid="insert-similar-button"
                  >
                    挿入
                  </Button>
                </Stack>
              </Paper>
            ))}
            {sections.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                類似箇所が見つかりません
              </Text>
            )}
          </Stack>
        </ScrollArea>
      </Stack>
    </Paper>
  );
};

