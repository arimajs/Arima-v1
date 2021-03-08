import {
  CommandOptions,
  Argument,
  ArgumentOptions,
  ArgumentTypeCaster,
} from '@arimajs/discord-akairo';
import type { DocumentType } from '@typegoose/typegoose';
import type { Message, GuildMember } from 'discord.js-light';
import { formatDistanceToNowStrict } from 'date-fns';
import Playlist from '../../lib/database/entities/Playlist';
import Command from '../../lib/structures/Command';
import ArimaClient from '../../lib/client/ArimaClient';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  playlist: DocumentType<Playlist>;
  index: number;
}

@ApplyOptions<CommandOptions>('song-info', {
  aliases: ['song-info', 'song'],
  description: "View a song's info",
  usage: '<playlist_name> <index>',
  examples: ['vibing 5', 'classical 3'],
  argDescriptions: [
    {
      id: 'member',
      type: 'memberMention',
      description:
        'The member whose playlist to view (defaults to the command runner)',
    },
    {
      id: 'playlist',
      type: 'custom-playlist',
      description: 'Name of playlist to view songs from',
    },
    {
      id: 'index',
      type: 'number',
      description:
        "The index of the song (use `a!playlist-info` if you're not sure",
    },
  ],
  *args(message, parser): Generator<ArgumentOptions> {
    let { member } = message;
    if (/(<@!?)?\d{17,18}>?/.test(parser.phrases[0].raw))
      member = (yield {
        type: 'memberMention',
        prompt: {
          retry: 'Please provide a valid member mention or id',
        },
      }) as GuildMember;

    const playlist = (yield {
      type: ((message, phrase) =>
        Playlist.resolvePlaylist(
          phrase,
          message.client as ArimaClient,
          member!.id,
          true,
          true
        )) as ArgumentTypeCaster,
      prompt: {
        start: 'What playlist would you like to view?',
        retry: 'Please provide the name of one of your custom playlists',
      },
    }) as Playlist;

    const index = yield {
      type: Argument.range('number', 1, playlist.track_count, true),
      prompt: {
        start: `What's the index of the song to view? (1-${playlist.track_count})`,
        retry: `That's not a valid index (1-${playlist.tracks.length})`,
      },
    };

    return { playlist, index };
  },
})
export default class SongInfoCommand extends Command {
  public run(message: Message, { playlist, index }: Args): void {
    const song = playlist.tracks[index - 1];
    message.embed(`"${song.title}" by ${song.author}`, (embed) =>
      embed
        .setURL(song.url)
        .setColor(song.color as [number, number, number])
        .setThumbnail(song.thumbnail)
        .addField(
          'Song Duration',
          formatDistanceToNowStrict(Date.now() - song.duration)
        )
    );
  }
}
