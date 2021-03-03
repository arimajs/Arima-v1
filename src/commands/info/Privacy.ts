import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('privacy', {
  aliases: ['privacy', 'data'],
  description: "View Arima's Privacy Policy",
})
export default class DashboardCommand extends Command {
  public run(message: Message): void {
    void message.embed('View Our Privacy Policy', (embed) =>
      embed.setURL('https://arima.fun/privacy')
    );
  }
}
