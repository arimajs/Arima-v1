import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('donate', {
  aliases: ['patreon', 'donate'],
  description: 'Donate to Arima!',
})
export default class DashboardCommand extends Command {
  public run(message: Message): void {
    void message.embed("Here's my Patreon!", (embed) =>
      embed
        .setURL('https://patreon.com/ArimaBot')
        .setDescription('Any donation would really help me out ^w^')
    );
  }
}
