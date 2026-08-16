import { useMemo, useRef } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Bot, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChatActionConfirmation,
  ChatComposer,
  ChatMessageBubble,
  ChatQuickActions,
  ChatQueueStatusCardView,
  ChatServiceResultList,
  ChatStatsResultCard,
  ChatTypingIndicator,
} from '@/components/chatbot';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatMessage, ChatSpeakable } from '@/domain/models/chatbot';
import { detectReplyStyle } from '@/domain/models/reply-style';
import { getBusinessChatQuickActions } from '@/features/chatbot/business-quick-actions';
import { useBusinessChat } from '@/features/chatbot/hooks/use-business-chat';
import { useVoiceSession } from '@/features/voice/hooks/use-voice-session';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function BusinessAssistantScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const chat = useBusinessChat();
  const voice = useVoiceSession({
    sendText: chat.sendText,
    canUse: chat.canSend,
    isSending: chat.isSending,
  });
  const quickActions = useMemo(() => getBusinessChatQuickActions(t), [t]);

  const playReply = (result: ChatSpeakable | void) => {
    if (result) void voice.speakAssistant(result);
  };

  const speakMessage = (item: ChatMessage) => {
    if (voice.speakingMessageId === item.id) {
      voice.stopSpeaking();
      return;
    }
    void voice.speakAssistant(
      {
        messageId: item.id,
        text: item.content,
        replyStyle: item.replyStyle ?? detectReplyStyle(item.content),
      },
      { replay: true },
    );
  };

  const confirmClear = () => {
    Alert.alert(t('businessChatbot.clearTitle'), t('businessChatbot.clearBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('businessChatbot.clearConfirm'),
        style: 'destructive',
        onPress: chat.clearConversation,
      },
    ]);
  };

  const isEmpty = chat.messages.length === 0 && !chat.isSending;

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <FlowHeader
            title={t('businessChatbot.title')}
            subtitle={t('businessChatbot.subtitle')}
            onBack={() => router.back()}
          />
        </View>
        {chat.messages.length > 0 ? (
          <Pressable
            onPress={confirmClear}
            disabled={chat.isSending || voice.voiceBusy}
            accessibilityRole="button"
            accessibilityLabel={t('businessChatbot.clearA11y')}
            hitSlop={8}
            style={[styles.clearBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
          >
            <Trash2 size={16} color={theme.textSecondary} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.tints.primary.bg }]}>
            <Bot size={20} color={Colors.primary} strokeWidth={2} />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          style={styles.flex}
          contentContainerStyle={[styles.list, isEmpty && styles.listEmpty]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          onContentSizeChange={() => {
            if (chat.messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Bot size={28} color={Colors.primary} strokeWidth={1.75} />}
              title={t('businessChatbot.emptyTitle')}
              description={t('businessChatbot.emptyDescription')}
            />
          }
          ListFooterComponent={chat.isSending ? <ChatTypingIndicator /> : null}
          renderItem={({ item }) => (
            <View>
              <ChatMessageBubble
                role={item.role}
                content={item.content}
                error={item.error}
                retryable={item.retryable}
                retryDisabled={chat.isSending}
                onRetry={() => {
                  if (chat.isSending) return;
                  void chat.retryLast().then(playReply);
                }}
                speakable={voice.visible && item.role === 'assistant' && !item.error}
                speaking={voice.speakingMessageId === item.id}
                ttsLoading={voice.ttsLoading && voice.speakingMessageId === item.id}
                ttsError={voice.ttsFailedMessageId === item.id}
                ttsErrorMessage={voice.ttsErrorMessage}
                onSpeak={() => speakMessage(item)}
                speakA11y={voice.copy('speakA11y')}
              />
              {item.queueStatus?.map((card) => (
                <ChatQueueStatusCardView key={card.queueId} card={card} />
              ))}
              {item.stats ? <ChatStatsResultCard stats={item.stats} /> : null}
              {item.services?.length ? (
                <ChatServiceResultList services={item.services} />
              ) : null}
              {item.waiting?.map((customer) => (
                <Card key={customer.entryId} style={styles.linkCard}>
                  <Text style={[styles.linkTitle, { color: theme.text }]}>
                    #{customer.ticketNumber}
                  </Text>
                  <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>
                    {customer.serviceName}
                    {customer.status ? ` · ${customer.status}` : ''}
                  </Text>
                </Card>
              ))}
              {item.ownerHistory?.map((visit) => (
                <Card key={visit.id} style={styles.linkCard}>
                  <Text style={[styles.linkTitle, { color: theme.text }]} numberOfLines={1}>
                    #{visit.ticketNumber || visit.id.slice(0, 8)}
                  </Text>
                  <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>
                    {visit.serviceName}
                    {visit.status ? ` · ${visit.status}` : ''}
                  </Text>
                </Card>
              ))}
              {item.pendingAction &&
              (item.pendingAction.status === 'pending' ||
                item.pendingAction.status === 'executing' ||
                item.pendingAction.status === 'error') ? (
                <ChatActionConfirmation
                  action={item.pendingAction}
                  disabled={chat.isSending && item.pendingAction.status !== 'executing'}
                  onConfirm={() => {
                    void chat.confirmPendingAction(item.id);
                  }}
                  onDismiss={() => chat.dismissPendingAction(item.id)}
                />
              ) : null}
            </View>
          )}
        />

        {isEmpty ? (
          <View style={styles.quickWrap}>
            <ChatQuickActions
              actions={quickActions}
              disabled={chat.isSending || voice.voiceBusy}
              onSelect={(action) => {
                void chat.sendText(action.prompt).then(playReply);
              }}
            />
          </View>
        ) : null}

        <View style={{ paddingBottom: Math.max(insets.bottom, Spacing.sm) }}>
          <ChatComposer
            value={chat.draft}
            onChange={chat.setDraft}
            onSend={() => {
              if (!chat.isSending && !voice.voiceBusy) void chat.sendDraft().then(playReply);
            }}
            disabled={chat.isSending || !chat.canSend}
            sending={chat.isSending}
            maxLength={chat.maxLength}
            placeholder={t('businessChatbot.placeholder')}
            sendA11y={t('businessChatbot.sendA11y')}
            typingLabel={t('businessChatbot.typing')}
            voice={voice}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerMain: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexGrow: 1,
  },
  listEmpty: {
    justifyContent: 'center',
  },
  quickWrap: {
    paddingHorizontal: Spacing.md,
  },
  linkCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  linkTitle: {
    ...Typography.bodyMedium,
  },
  linkMeta: {
    ...Typography.small,
  },
});
