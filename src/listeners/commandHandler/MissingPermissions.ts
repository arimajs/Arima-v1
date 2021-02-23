import { Command, Listener, ListenerOptions } from '@arimajs/discord-akairo';
import { Message } from 'discord.js-light';
import { commaListsAnd } from 'common-tags';
import { ApplyOptions, Logger } from '../../lib/utils';

@ApplyOptions<ListenerOptions>('missingPermissions', {
  emitter: 'commandHandler',
  event: 'missingPermissions',
})
export default class MissingPermissionsListener extends Listener {
  public exec(
    message: Message,
    command: Command,
    type: 'user' | 'client',
    missing: string[] | string
  ): void {
    if (type === 'user') {
      Logger.debug(
        `${message.author.tag} lacked permissions when executing command '${command.id}'`
      );
      message.error(
        typeof missing === 'string'
          ? missing
          : 'Sorry, you have insufficient permissions'
      );
    } else {
      Logger.debug(
        commaListsAnd`I lacked the permissions ${missing} when someone attempted to use command '${command.id}'`
      );
      if (
        !(missing as string[]).some((perm) =>
          ['SEND_MESSAGES', 'EMBED_LINKS'].includes(perm)
        )
      )
        message.error(
          "I don't have enough permissions",
          commaListsAnd`Please grant me the permissions ${(missing as string[]).map(
            (perm) => `\`${perm}\``
          )} or reinvite me using [this link](https://discord.com/api/oauth2/authorize?client_id=${
            this.client.user!.id
          }&permissions=34929288&scope=bot)`
        );
    }
  }
}
