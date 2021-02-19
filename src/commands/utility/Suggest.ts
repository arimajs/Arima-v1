import type { CommandOptions } from 'discord-akairo';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('suggest', {
  aliases: ['suggest', 'report', 'support'],
  description: 'Suggest a feature',
})
export default class SuggestCommand extends Command {
  public run(message: Message): void {
    message.embed('Join my support server!', (embed) =>
      embed.setURL(process.env.SUPPORT_SERVER_INVITE!)
    );
  }
}
