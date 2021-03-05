import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import { formatDistanceToNowStrict } from 'date-fns';
import { DocumentType } from '@typegoose/typegoose';
import ApplyOptions from '../../lib/utils/ApplyOptions';
import type Playlist from '../../lib/database/entities/Playlist';
import { EnhancedEmbed, Command } from '../../lib/structures';

interface Args {
  playlist: DocumentType<Playlist>;
}

@ApplyOptions<CommandOptions>('playlist-info', {
  aliases: ['playlist-info', 'view-playlist'],
  description: "View a custom playlist's info",
  usage: '<name>',
  examples: ['vibing', 'classical'],
  args: [
    {
      id: 'playlist',
      type: 'lean-playlist',
      match: 'rest',
      description: 'The name of the custom playlist to view',
      prompt: {
        start: 'What playlist would you like to view?',
        retry: 'Please provide the name of one of your custom playlists',
      },
    },
  ],
  clientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
})
export default class PlaylistInfoCommand extends Command {
  public async run(message: Message, { playlist }: Args): Promise<void> {
    if (!playlist.tracks.length)
      return message.error("There's no songs on this playlist");

    const prefix = await this.client.util.prefix(message.guild);

    const chunks = this.client.util.chunk(playlist.tracks, 10);
    EnhancedEmbed.paginate(
      message,
      chunks.map((songs, chunk) =>
        message
          .embed(`Songs in "${playlist.title}"`)
          .setDescription(
            chunks.length
              ? songs
                  .map(
                    (song, idx) =>
                      `${idx + 1 + chunk * 10}. ["**${song.title}**" by ${
                        song.author
                      }](${song.url})`
                  )
                  .join('\n')
              : 'No songs yet :cry:'
          )
          .addFields([
            {
              name: 'Playlist Duration',
              value: formatDistanceToNowStrict(
                Date.now() -
                  playlist.tracks.reduce((ms, song) => ms + song.duration, 0)
              ),
              inline: true,
            },
            {
              name: 'Created',
              value: playlist.createdAt
                ? `${formatDistanceToNowStrict(playlist.createdAt)} ago`
                : 'Unknown',
              inline: true,
            },
            {
              name: 'Updated Last',
              value: playlist.updatedAt
                ? `${formatDistanceToNowStrict(playlist.updatedAt)} ago`
                : 'Unknown',
              inline: true,
            },
          ])
          .setFooter(`Use \`${prefix}song-info <index>\` to view a song's info`)
          .setColor(playlist.color as [number, number, number])
          .setThumbnail(playlist.thumbnail)
      )
    );
  }
}
