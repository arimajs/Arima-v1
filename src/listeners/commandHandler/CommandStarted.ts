import { Command, Listener, ListenerOptions } from 'discord-akairo';
import { Message } from 'discord.js-light';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('commandStarted', {
  emitter: 'commandHandler',
  event: 'commandStarted',
})
export default class CommandStartedListener extends Listener {
  public exec(message: Message, command: Command): void {
    this.client.prom.metrics.commandCounter.labels(command.aliases[0]).inc();
    Logger.debug(`${message.author.tag} triggered command '${command.id}'`);
  }
}
