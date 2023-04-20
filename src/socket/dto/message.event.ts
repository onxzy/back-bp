export type EventMessageDataRaw = {
  b: {
    t: string;
  };
}

export function eventMessageData_RawHandler(raw: EventMessageDataRaw) {
 return {
  body: {
    text: raw.b.t,
  },
 };
}

export type EventMessageData = ReturnType<typeof eventMessageData_RawHandler>;