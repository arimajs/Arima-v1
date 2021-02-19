import { CommandOptions, Argument, ArgumentOptions } from 'discord-akairo';
import type { DocumentType } from '@typegoose/typegoose';
import type { Message } from 'discord.js-light';
import { formatDistanceToNowStrict } from 'date-fns';
import type Playlist from '../../lib/database/entities/Playlist';
import Command from '../../lib/structures/Command';
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
  *args(): Generator<ArgumentOptions> {
    const help = yield {
      match: 'flag',
      flag: ['--h', '--help'],
    };

    const playlist = yield {
      type: 'lean-playlist',
      prompt: {
        start: 'What playlist would you like to view',
        retry: 'Please provide the name of one of your custom playlists',
      },
    };

    const index = yield {
      type: Argument.range(
        'number',
        1,
        (playlist as Playlist).track_count,
        true
      ),
      prompt: {
        start: `What's the index of the song to view? (1-${
          (playlist as Playlist).track_count
        })`,
        retry: `That's not a valid index (1-${
          (playlist as Playlist).tracks.length
        })`,
      },
    };

    return { help, playlist, index };
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
