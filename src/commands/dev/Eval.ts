import { inspect } from 'util';
import type { CommandOptions } from '@arimajs/discord-akairo';
import { Message } from 'discord.js-light';
import { ApplyOptions, Logger } from '../../lib/utils';
import Command from '../../lib/structures/Command';

interface Args {
  code: string;
  silent: boolean;
}

@ApplyOptions<CommandOptions>('eval', {
  aliases: ['eval', 'evaluate'],
  description: 'Evaluate Javascript code',
  ownerOnly: true,
  args: [
    { id: 'code', match: 'rest' },
    { id: 'silent', match: 'flag', flag: ['-s', '--silent'] },
  ],
})
export default class EvalCommand extends Command {
  public async run(message: Message, args: Args): Promise<unknown> {
    const tokenRegex = new RegExp(
      `${this.client
        .token!.split('')
        .join('[^]{0,2}')}|${this.client
        .token!.split('')
        .reverse()
        .join('[^]{0,2}')}`,
      'g'
    );

    const cb = '```';

    try {
      // eslint-disable-next-line no-eval
      const result = (await Promise.resolve(eval(args.code))) as unknown;
      let output = (typeof result === 'string'
        ? result
        : inspect(result, { depth: 0 })
      ).replace(tokenRegex, '[TOKEN]');

      if (args.silent) {
        message.delete();
        return Logger.info('Eval results: ', output);
      }

      if (args.code.length > 1014) args.code = 'Input too long...';

      if (output.length > 1014) {
        Logger.info(
          'Eval output too long; sending in console instead: ',
          output
        );
        output = 'Output too long...';
      }

      message.embed(`Eval Results`, (embed) =>
        embed.addFields([
          { name: '📥 Input', value: `${cb}js\n${args.code}\n${cb}` },
          { name: '📤 Output', value: `${cb}js\n${output}\n${cb}` },
        ])
      );
    } catch (err) {
      if (args.silent) {
        message.delete();
        return Logger.info(`Eval error: ${err}`);
      }

      if (args.code.length > 1014) args.code = 'Input too long...';

      if (`${err}`.length > 1014) {
        Logger.info(`Eval error too long; sending in console instead: ${err}`);
        // eslint-disable-next-line no-ex-assign
        err = 'Error too long...';
      }

      message.embed(`Eval Results`, (embed) =>
        embed
          .addFields([
            { name: '📥 Input', value: `${cb}js\n${args.code}\n${cb}` },
            { name: '☠ Error', value: `${cb}js\n${err}\n${cb}` },
          ])
          .setColor('RED')
      );
    }
  }
}
