import type { CommandOptions, ArgumentOptions } from '@arimajs/discord-akairo';
import type { GuildMember, Message } from 'discord.js-light';
import { formatDistanceToNowStrict } from 'date-fns';
import { DocumentType } from '@typegoose/typegoose';
import { commaListsAnd } from 'common-tags';
import { ArgumentTypeCaster } from '@arimajs/discord-akairo';
import ApplyOptions from '../../lib/utils/ApplyOptions';
import Playlist from '../../lib/database/entities/Playlist';
import ArimaClient from '../../lib/client/ArimaClient';
import { EnhancedEmbed, Command } from '../../lib/structures';

interface Args {
  member: GuildMember;
  playlist: DocumentType<Playlist>;
}

@ApplyOptions<CommandOptions>('playlist-info', {
  aliases: ['playlist-info', 'view-playlist'],
  description: "View a custom playlist's info",
  usage: '<name>',
  examples: ['vibing', '@Lioness100 classical'],
  channel: 'guild',
  argDescriptions: [
    {
      id: 'member',
      type: 'memberMention',
      description:
        'The member whose playlist to view (defaults to the command runner)',
    },
    {
      id: 'playlist',
      type: 'playlist',
      match: 'rest',
      description: 'The name of the custom playlist to view',
    },
  ],
  clientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
  *args(message, parser): Generator<ArgumentOptions> {
    let { member } = message;
    if (/(<@!?)?\d{17,18}>?/.test(parser.phrases[0].raw))
      member = (yield {
        type: 'memberMention',
        prompt: {
          retry: 'Please provide a valid member mention or id',
        },
      }) as GuildMember;

    const playlist = yield {
      type: ((message, phrase) => {
        const playlist = Playlist.resolvePlaylist(
          phrase,
          message.client as ArimaClient,
          member!.id,
          true,
          true
        );

        return typeof playlist === 'string' ? null : playlist;
      }) as ArgumentTypeCaster,
      match: 'rest',
      prompt: {
        start: 'What playlist would you like to view?',
        retry: `Please provide the name of one of ${
          member!.id === message.author.id ? 'your' : `${member!.user.tag}'s`
        } custom playlists`,
      },
    };

    return { member, playlist };
  },
})
export default class PlaylistInfoCommand extends Command {
  public async run(
    message: Message,
    { member, playlist }: Args
  ): Promise<void> {
    if (!playlist.tracks.length)
      return message.error("There's no songs on this playlist");

    const prefix = await this.client.util.prefix(message.guild);
    const collaborators = commaListsAnd`${playlist.collaborators!.map(
      (collaborator) => `<@${collaborator}>`
    )}`;
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
            {
              name: 'Collaborators',
              value:
                collaborators.length > 2048
                  ? `There are ${playlist.collaborators!.length} collaborators`
                  : collaborators,
            },
          ])
          .setFooter(
            `Use \`${prefix}song-info ${
              member.id === message.author.id ? '' : `@${member.user.tag}`
            } ${
              playlist.title.split(' ').length > 1
                ? `"${playlist.title}"`
                : playlist.title
            } <index>\` to view a song's info`
          )
          .setColor(playlist.color as [number, number, number])
          .setThumbnail(playlist.thumbnail)
      )
    );
  }
}
