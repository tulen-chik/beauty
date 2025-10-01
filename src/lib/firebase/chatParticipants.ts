import { get, ref } from 'firebase/database';

import { createOperation, deleteOperation, updateOperation } from './crud';
import { db } from './init';
import { chatParticipantSchema } from './schemas';

import type { ChatParticipant } from '@/types/database';

export const chatParticipantOperations = {
  add: (chatId: string, participantId: string, data: Omit<ChatParticipant, 'id'>) =>
    createOperation(`chatParticipants/${chatId}/${participantId}`, data, chatParticipantSchema),

  remove: (chatId: string, participantId: string) =>
    deleteOperation(`chatParticipants/${chatId}/${participantId}`),

  updateStatus: (chatId: string, participantId: string, data: Partial<ChatParticipant>) =>
    updateOperation(`chatParticipants/${chatId}/${participantId}`, data, chatParticipantSchema),

  getByChat: async (chatId: string): Promise<ChatParticipant[]> => {
    try {
      const snapshot = await get(ref(db, `chatParticipants/${chatId}`));
      if (!snapshot.exists()) return [];
      const participants = snapshot.val() as Record<string, ChatParticipant>;
      return Object.entries(participants)
        .map(([id, participant]) => ({ ...participant, id }));
    } catch (_) {
      return [];
    }
  }
};
