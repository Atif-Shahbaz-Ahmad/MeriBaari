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
  ChatBusinessResultCard,
  ChatComposer,
  ChatMessageBubble,
  ChatQuickActions,
  ChatTicketResultCard,
  ChatTypingIndicator,
} from '@/components/chatbot';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlowHeader } from '@/components/ui/FlowHeader';
import { organizationCategoryLabelKey } from '@/constants/organization-categories';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import type { ChatMessage, ChatSpeakable } from '@/domain/models/chatbot';
import { detectReplyStyle } from '@/domain/models/reply-style';
import { useCustomerChat } from '@/features/chatbot/hooks/use-customer-chat';
import { useVoiceSession } from '@/features/voice/hooks/use-voice-session';
import { getChatQuickActions } from '@/features/chatbot/quick-actions';
import { pushDepartments, pushOrganization } from '@/features/queue/navigation';
import { pushTicketDetail } from '@/features/tickets/navigation';
import { useJoinQueueStore } from '@/store/join-queue-store';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function CustomerAssistantScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const selectOrganization = useJoinQueueStore((s) => s.selectOrganization);
  const chat = useCustomerChat();
  const voice = useVoiceSession({
    sendText: chat.sendText,
    canUse: chat.canSend,
    isSending: chat.isSending,
  });
  const quickActions = useMemo(() => getChatQuickActions(t), [t]);

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

  const openOrganization = (organizationId: string) => {
    selectOrganization(organizationId);
    pushOrganization(organizationId);
  };

  const joinOrganization = (organizationId: string) => {
    selectOrganization(organizationId);
    pushDepartments(organizationId);
  };

  const confirmClear = () => {
    Alert.alert(t('chatbot.clearTitle'), t('chatbot.clearBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chatbot.clearConfirm'),
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
            title={t('chatbot.title')}
            subtitle={t('chatbot.subtitle')}
            onBack={() => router.back()}
          />
        </View>
        {chat.messages.length > 0 ? (
          <Pressable
            onPress={confirmClear}
            disabled={chat.isSending || voice.voiceBusy}
            accessibilityRole="button"
            accessibilityLabel={t('chatbot.clearA11y')}
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
          contentContainerStyle={[
            styles.list,
            isEmpty && styles.listEmpty,
          ]}
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
              title={t('chatbot.emptyTitle')}
              description={t('chatbot.emptyDescription')}
            />
          }
          ListFooterComponent={
            chat.isSending ? <ChatTypingIndicator /> : null
          }
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
              {item.cards?.map((card) => (
                <ChatBusinessResultCard
                  key={card.id}
                  card={card}
                  onView={() => openOrganization(card.id)}
                  onJoinQueue={() => joinOrganization(card.id)}
                />
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
              {item.ticket ? (
                <ChatTicketResultCard
                  ticket={item.ticket}
                  onOpen={() => pushTicketDetail(item.ticket!.id)}
                />
              ) : null}
              {item.favorites?.map((fav) => (
                <Card key={fav.id} style={styles.linkCard}>
                  <Text style={[styles.linkTitle, { color: theme.text }]} numberOfLines={1}>
                    {fav.name}
                  </Text>
                  <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>
                    {t(organizationCategoryLabelKey(fav.category))}
                    {fav.city ? ` · ${fav.city}` : ''}
                  </Text>
                  <Button
                    title={t('chatbot.viewBusiness')}
                    onPress={() => openOrganization(fav.id)}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    style={styles.linkAction}
                  />
                </Card>
              ))}
              {item.history?.map((visit) => (
                <Card key={visit.id} style={styles.linkCard}>
                  <Text style={[styles.linkTitle, { color: theme.text }]} numberOfLines={1}>
                    {visit.organizationName}
                  </Text>
                  <Text style={[styles.linkMeta, { color: theme.textSecondary }]}>
                    {visit.serviceName}
                    {visit.status ? ` · ${visit.status}` : ''}
                  </Text>
                  <Button
                    title={t('chatbot.viewTicket')}
                    onPress={() => pushTicketDetail(visit.id)}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    style={styles.linkAction}
                  />
                </Card>
              ))}
              {item.locationRequired ? (
                <Button
                  title={t('chatbot.enableLocation')}
                  onPress={() => {
                    if (!chat.isSending) void chat.requestLocationAndRetry().then(playReply);
                  }}
                  disabled={chat.isSending || voice.voiceBusy}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  style={styles.locationBtn}
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
                void (async () => {
                  let coords = chat.location.coords;
                  if (action.id === 'nearby' && !coords) {
                    coords = await chat.location.request();
                  }
                  await chat.sendText(action.prompt, coords).then(playReply);
                })();
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
  linkAction: {
    marginTop: Spacing.sm,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  locationBtn: {
    marginBottom: Spacing.sm,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
});
