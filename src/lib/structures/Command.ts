import {
  Command,
  CommandOptions,
  ArgumentOptions,
} from '@arimajs/discord-akairo';
import { Message } from 'discord.js-light';

export default abstract class ArimaCommand extends Command {
  public game?: boolean;

  public examples?: string[];

  public hidden?: boolean;

  public usage?: string;

  public argDescriptions: ArgumentOptions[];

  public constructor(id: string, options: CommandOptions = {}) {
    const {
      examples,
      hidden,
      usage,
      args = [],
      clientPermissions = [],
      argDescriptions,
      game,
    } = options;

    // every command needs these permissions
    (clientPermissions as string[]).push('SEND_MESSAGES', 'EMBED_LINKS');

    super(id, { ...options, args });

    // args for the help command if you're using a generator
    this.argDescriptions =
      argDescriptions || (args as ArgumentOptions[]).slice(1);
    this.examples = examples;
    this.hidden = this.ownerOnly || hidden;
    this.usage = usage;

    // `false` if a game must be in session, `true` if a game must *not* be in
    // session
    this.game = game;

    // if the `game` option is set it's safe to assume the command should only
    // be used in guilds
    this.channel = this.game === undefined ? this.channel : 'guild';
  }

  public async exec(
    message: Message,
    args: Record<string, unknown>
  ): Promise<void> {
    const handle = (err: unknown): unknown =>
      this.client.listenerHandler.modules
        .get('error')!
        .exec(err, message, this);

    // handle promise
    try {
      await Promise.resolve(this.run(message, args)).catch(handle);
    } catch (err) {
      handle(err);
    }
  }

  public abstract run(message: Message, args: unknown): unknown;
}
