import { MailTemplate, MailTemplateReady } from '../templates';

const template: MailTemplate = {
  from: () => '"onxzy.dev" <noreply@onxzy.dev>',
  subject: () => 'Bienvenue sur onxzy.dev !',
  html: (name: string) => `

<h1>Bienvenue ${name} !</h1>

`,
};

export function welcomeTemplate(name: string): MailTemplateReady {
  return {
    from: template.from(),
    subject: template.subject(),
    html: template.html(name),
  };
}
