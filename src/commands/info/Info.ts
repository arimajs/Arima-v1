import type { CommandOptions } from 'discord-akairo';
import type { Message } from 'discord.js-light';
import { getColor } from 'colorthief';
import { formatDistanceToNowStrict } from 'date-fns';
import { commaListsAnd } from 'common-tags';
import { User } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('info', {
  aliases: ['info', 'bot-info', 'arima', 'arima-info'],
  description: 'View my info',
})
export default class InfoCommand extends Command {
  public async run(message: Message): Promise<void> {
    const avatar = this.client.user!.displayAvatarURL({ size: 4096 });
    const emote = User.getEmoji('legendary', message.channel);
    void message.channel.send(
      this.client.util
        .embed()
        .personalize(this.client.user!)
        .setThumbnail(avatar)
        .setColor(await getColor(avatar).catch(() => 'BLUE'))
        .setDescription(
          commaListsAnd`Hi! I'm **Arima**, the ${emote} Music Quiz Discord Bot ${emote} made by ${[
            this.client.ownerID,
          ]
            .flat()
            .map(
              (id) => `<@${id}>`
            )}. I will play 30 seconds snippets of songs from playlists **you** provide, and you'll try to guess them!\n\nTo view/change my prefix, use \`@Arima prefix\`. I've been online for **${formatDistanceToNowStrict(
            Date.now() - this.client.uptime!
          )}** and am currently playing **${this.client.games.size} games**!`
        )
        .addFields()
    );
  }
}
