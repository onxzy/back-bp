export type MailTemplate = {
  from: (...args: string[]) => string;
  subject: (...args: string[]) => string;
  html: (...args: string[]) => string;
};

export type MailTemplateReady = {
  from: string;
  subject: string;
  html: string;
};
