import { Command, Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { Message } from 'discord.js-light';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('commandError', {
  emitter: 'commandHandler',
  event: 'error',
})
export default class CommandErrorListener extends Listener {
  public exec(error: Error, message: Message, command?: Command): void {
    Logger.error(
      `Error occurred with command: '${command?.id ?? 'N/A'}': ${
        error.stack || error
      }`
    );
    if (message.author) {
      message.error(
        'An unexpected error occurred!',
        `This should never happen. Please show the following error message in our [support server](${process.env.SUPPORT_SERVER_INVITE})\n\`\`\`js\n${error}\n\`\`\``
      );
    }
  }
}
