import { MailTemplate, MailTemplateReady } from '../templates';

const template: MailTemplate = {
  from: () => '"onxzy.dev" <noreply@onxzy.dev>',
  subject: () => 'Réinitialisation du mot de passe',
  html: (name: string, link: string) => `

<h1>Bonjour ${name} !</h1>

Pour réinitialiser votre mot de passe cliquez ici : <a href=${link}>${link}</a>

`,
};

export function passwordResetTemplate(
  name: string,
  link: string,
): MailTemplateReady {
  return {
    from: template.from(),
    subject: template.subject(),
    html: template.html(name, link),
  };
}
