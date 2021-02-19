import { Command, Listener, ListenerOptions } from 'discord-akairo';
import { Message } from 'discord.js-light';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('commandBlocked', {
  emitter: 'commandHandler',
  event: 'commandBlocked',
})
export default class CommandBlockedListener extends Listener {
  public exec(message: Message, command: Command, reason: string): void {
    Logger.debug(
      `${message.author.tag} was blocked from using the command '${command.id}' with reason '${reason}'`
    );

    if (['dm', 'guild'].includes(reason))
      message.error(`You can only use this command in a ${reason}`);
  }
}
