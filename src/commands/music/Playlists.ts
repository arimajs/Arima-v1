import type { CommandOptions } from 'discord-akairo';
import type { Message } from 'discord.js-light';
import { Playlist } from '../../lib/database';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

@ApplyOptions<CommandOptions>('playlists', {
  aliases: ['playlists', 'display-playlists', 'my-playlists'],
  description: 'Display a preview of all your playlists',
})
export default class PlaylistsCommand extends Command {
  public async run(message: Message): Promise<void> {
    const playlists = await Playlist.find({
      id: message.author.id,
    })
      .select('title track_count')
      .lean();

    const prefix = await this.client.util.prefix(message.guild);

    if (!playlists.length)
      return message.error(
        "You don't have any playlists",
        `Use \`${prefix}create-playlist\` to make one`
      );

    const numbers = ['one', 'two', 'three', 'four', 'five'];
    message.embed('Your Playlists', (embed) =>
      embed
        .setDescription(
          playlists
            .sort((a, b) => b.track_count - a.track_count)
            .map(
              (playlist, idx) =>
                `:${numbers[idx]}: "${playlist.title}" • ${playlist.track_count} Tracks`
            )
            .join('\n')
        )
        .setFooter(
          `Use \`${prefix}playlist-info <name>\` to see more about a playlist`
        )
    );
  }
}
