import { Message } from "../../chat.service";

export const SEND_MESSAGE_EVENT = 'SEND_MESSAGE_EVENT';
export class SendMessageDto {
  chatId: string;
  replyToId?: number;
  body: Message<'STANDARD'>['body'];
}
