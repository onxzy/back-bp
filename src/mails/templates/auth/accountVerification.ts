import { MailTemplate, MailTemplateReady } from '../templates';

const template: MailTemplate = {
  from: () => '"onxzy.dev" <noreply@onxzy.dev>',
  subject: () => 'Bienvenue sur onxzy.dev !',
  html: (name: string, link: string) => `

<h1>Bienvenue ${name} !</h1>

Merci de vérifier ton adresse mail en cliquant ici : <a href=${link}>${link}</a>

`,
};

export function accountVerificationTemplate(
  name: string,
  link: string,
): MailTemplateReady {
  return {
    from: template.from(),
    subject: template.subject(),
    html: template.html(name, link),
  };
}
