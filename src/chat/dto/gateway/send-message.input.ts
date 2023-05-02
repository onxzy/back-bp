export const SEND_MESSAGE_EVENT = 'SEND_MESSAGE_EVENT';
export class SendMessageDto {
  chatId: string;
  replyToId?: number;
  body: {
    txt: string;
  };
}
