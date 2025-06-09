import React, { useState } from 'react';
import { Stack, Paper, Text, Textarea, Button, Group, Loader, Badge } from '@mantine/core';
import { IconSparkles, IconBulb } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface AIPanelProps {
  documentId: string;
  sectionId?: string;
  onInsert: (text: string) => void;
  websocket?: {
    sendMessage: (data: any) => void;
    isConnected: boolean;
  };
}

export const AIPanel: React.FC<AIPanelProps> = ({
  documentId,
  sectionId,
  onInsert,
  websocket,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      notifications.show({
        title: 'エラー',
        message: 'プロンプトを入力してください',
        color: 'red',
      });
      return;
    }

    setIsGenerating(true);
    setSuggestions([]);

    try {
      if (websocket?.isConnected) {
        // WebSocket経由でリアルタイム生成
        const generationId = Math.random().toString(36).substring(2);
        websocket.sendMessage({
          type: 'ai:generate',
          documentId,
          sectionId,
          prompt,
          generationId,
        });

        // WebSocketレスポンスは別途処理される
      } else {
        // HTTP API経由
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId,
            sectionId,
            prompt,
          }),
        });

        if (!response.ok) {
          throw new Error('AI生成に失敗しました');
        }

        const result = await response.json();
        onInsert(result.content);
        setSuggestions(result.suggestions || []);
        setPrompt('');

        notifications.show({
          title: '生成完了',
          message: 'AI生成が完了しました',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      notifications.show({
        title: 'エラー',
        message: error instanceof Error ? error.message : 'AI生成に失敗しました',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <Paper withBorder h="100%" p="md">
      <Stack h="100%">
        <Group justify="space-between">
          <Text fw={500} size="sm">
            AI生成
          </Text>
          <Badge
            size="xs"
            color={websocket?.isConnected ? 'green' : 'gray'}
            variant="light"
          >
            {websocket?.isConnected ? 'オンライン' : 'オフライン'}
          </Badge>
        </Group>

        <Textarea
          placeholder="生成したい内容を入力してください（例：責任の範囲に関する条項を作成して）"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          minRows={3}
          maxRows={6}
          data-testid="ai-prompt-input"
        />

        <Button
          leftSection={<IconSparkles size={16} />}
          onClick={handleGenerate}
          loading={isGenerating}
          disabled={!prompt.trim()}
          data-testid="ai-generate-button"
        >
          {isGenerating ? '生成中...' : 'AI生成'}
        </Button>

        {suggestions.length > 0 && (
          <Stack gap="xs">
            <Group gap="xs">
              <IconBulb size={16} />
              <Text size="sm" fw={500}>
                提案
              </Text>
            </Group>
            {suggestions.map((suggestion, index) => (
              <Paper
                key={index}
                p="xs"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => handleSuggestionClick(suggestion)}
                data-testid="ai-suggestion"
              >
                <Text size="xs">{suggestion}</Text>
              </Paper>
            ))}
          </Stack>
        )}

        <Stack gap="xs" style={{ marginTop: 'auto' }}>
          <Text size="xs" c="dimmed">
            よく使われるプロンプト:
          </Text>
          {[
            '責任の範囲を明確にする条項',
            '免責事由を列挙する条項',
            '保険金の支払い手続きに関する条項',
            '用語の定義を追加',
          ].map((template, index) => (
            <Button
              key={index}
              size="xs"
              variant="subtle"
              onClick={() => setPrompt(template)}
              data-testid="prompt-template"
            >
              {template}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

