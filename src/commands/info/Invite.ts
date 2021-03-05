import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('invite', {
  aliases: ['invite', 'support'],
  description: 'Invite me to your server!',
})
export default class DashboardCommand extends Command {
  public run(message: Message): void {
    message.embed('Hey There!', (embed) =>
      embed.setDescription(
        `[Invite Me](https://discord.com/api/oauth2/authorize?client_id=${
          this.client.user!.id
        }&permissions=3492928&scope=bot) • [Support Server](${
          process.env.SUPPORT_SERVER_INVITE
        })`
      )
    );
  }
}
