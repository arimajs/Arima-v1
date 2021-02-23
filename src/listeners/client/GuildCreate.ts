import { commaListsAnd } from 'common-tags';
import { Listener, ListenerOptions } from '@arimajs/discord-akairo';
import type { Guild } from 'discord.js-light';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<ListenerOptions>('guildCreate', {
  event: 'guildCreate',
  emitter: 'client',
})
export default class Command extends Listener {
  public async exec(guild: Guild): Promise<void> {
    const owner = await this.client.users.fetch(guild.ownerID, false);
    const missing = guild.me!.permissions.missing(11889728);
    owner
      .send(
        this.client.util
          .embed()
          .personalize(owner)
          .setTitle('Thank you for inviting me!')
          .setDescription(
            `${
              missing.length
                ? commaListsAnd`Unfortunately, I noticed I didn't have all the permissions I require. It is highly recommended you kick me and invite me back through [this link](https://discord.com/api/oauth2/authorize?client_id=${
                    this.client.user!.id
                  }&permissions=3492928&scope=bot), or grant me my missing permissions(${missing.map(
                    (perm) => `\`${perm}\``
                  )})\n\n`
                : ''
            }If you have any ${
              missing.length ? 'other ' : ''
            }issues or want to suggest a feature, please feel free to join my [support server](${
              process.env.SUPPORT_SERVER_INVITE
            })`
          )
      )
      .catch(() => {});
    this.client.prom.metrics.serversJoined.inc();

    // TODO update top.gg listing
  }
}
