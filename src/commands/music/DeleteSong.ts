import {
  CommandOptions,
  Argument,
  ArgumentOptions,
} from '@arimajs/discord-akairo';
import type { DocumentType } from '@typegoose/typegoose';
import type { Message } from 'discord.js-light';
import type Playlist from '../../lib/database/entities/Playlist';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  playlist: DocumentType<Playlist>;
  index: number;
}

@ApplyOptions<CommandOptions>('delete-song', {
  aliases: [
    'delete-song',
    'remove-song',
    'remove-from-playlist',
    'delete-from-playlist',
  ],
  description: 'Delete a song from your playlist (by index)',
  usage: '<playlist_name> <index>',
  cooldown: 3000,
  examples: ['vibing 5', 'classical 3'],
  argDescriptions: [
    {
      id: 'playlist',
      type: 'custom-playlist',
      description: 'Name of playlist to delete from',
    },
    {
      id: 'index',
      type: 'number',
      description:
        "The index of the song (use `a!playlist-info` if you're not sure",
    },
  ],
  clientPermissions: [
    'ADD_REACTIONS',
    'READ_MESSAGE_HISTORY',
    'MANAGE_MESSAGES',
  ],
  *args(): Generator<ArgumentOptions> {
    const help = yield {
      match: 'flag',
      flag: ['--h', '--help'],
    };

    const playlist = yield {
      type: 'custom-playlist',
      prompt: {
        start: 'What playlist would you like to delete from?',
        retry: 'Please provide the name of one of your custom playlists',
      },
    };

    const index = yield {
      type: Argument.range(
        'number',
        1,
        (playlist as Playlist).tracks.length,
        true
      ),
      prompt: {
        start: "What's the index of the song to delete?",
        retry: `That's not a valid index (1-${
          (playlist as Playlist).tracks.length
        })`,
      },
    };

    return { help, playlist, index };
  },
})
export default class DeleteSongCommand extends Command {
  public async run(message: Message, { playlist, index }: Args): Promise<void> {
    const track = playlist.tracks[index - 1];

    const sent = await message.embed(
      `Are you sure you want to delete "${track.title}" by ${track.author}?`,
      (embed) =>
        embed
          .setColor(
            this.client.util.isBlue(
              track.color as [number, number, number],
              'RED'
            )
          )
          .setThumbnail(track.thumbnail)
          .setDescription('You cannot undo this action')
          .setURL(track.url)
    );

    const confirm = await sent.poll(message.author.id);
    if (confirm) {
      playlist.tracks.splice(index - 1, 1);
      playlist.track_count--;
      await playlist.save();

      return sent.attemptEdit(
        sent.embeds[0]
          .setTitle(`Deleted "${track.title}" by ${track.author}`)
          .setDescription(
            `You now have ${playlist.tracks.length} songs on your playlist`
          )
      );
    }

    void sent.edit(
      sent.embeds[0]
        .setTitle(`Ok, I won't delete "${track.title}" by ${track.author}`)
        .setDescription('Whew, that was a close one')
    );
  }
}
