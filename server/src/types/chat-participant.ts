import { GroupMemberRole } from "./group.ts"

export type InsertedChatParticipant = {
  chatId: number;
  userId: number;
  role: GroupMemberRole | null;
}
