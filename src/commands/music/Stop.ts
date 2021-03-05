import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('stop', {
  aliases: ['stop', 'end'],
  description: 'Stop a game in progress',
  game: true,
})
export default class StopCommand extends Command {
  public run(message: Message): void {
    if (message.author.id !== message.guild!.game!.host.id)
      return message.error(
        `Only the host, ${
          message.guild!.game!.host.user.tag
        }, can end this game`,
        'Alternatively, the game will end if you kick me from the voice channel or everyone else leaves'
      );

    message.guild!.game!.end('end');
  }
}
