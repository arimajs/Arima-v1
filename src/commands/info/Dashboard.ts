import type { CommandOptions } from 'discord-akairo';
import type { Message } from 'discord.js-light';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('dashboard', {
  aliases: ['dashboard', 'dash'],
  description: 'View my dashboard',
})
export default class DashboardCommand extends Command {
  public run(message: Message): void {
    message.embed('Coming Soon!', true);
  }
}
