import type {
  CommandOptions,
  PromptContentSupplier,
} from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import { DocumentType } from '@typegoose/typegoose';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';
import type { Playlist, Song } from '../../lib/database/entities';

interface Args {
  playlist: DocumentType<Playlist>;
  newSong: Song;
}

@ApplyOptions<CommandOptions>('add-song', {
  aliases: ['add-song', 'save-song', 'save-to-playlist', 'add-to-playlist'],
  description: 'Add a song to your custom playlists (`a!create-playlist`)',
  usage: '<name> <song>',
  examples: ['watashi no uso', 'spotify:track:10J2w5eBSQcBtiRB89V5bU'],
  cooldown: 5000,
  args: [
    {
      id: 'playlist',
      type: 'custom-playlist',
      description: 'The custom playlist to add to',
      prompt: {
        start: 'What playlist would you like to add to?',
        retry: 'Please provide the name of one of your custom playlists',
      },
    },
    {
      id: 'newSong',
      type: 'song',
      description:
        'Song to add (spotify, soundcloud, and youtube links or keywords accepted)',
      prompt: {
        start: 'What song would you like to add?',
        retry: ((message, { failure }: { failure: { value: string } }) =>
          message
            .embed(
              `${
                failure.value === 'LIVE_VIDEO'
                  ? "I can't stream a live video!"
                  : "That's not a valid song!"
              } Please try again`
            )
            .setFooter('Respond with `cancel` to cancel')
            .setColor('RED')) as PromptContentSupplier,
      },
    },
  ],
  clientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
})
export default class AddSongCommand extends Command {
  public async run(
    message: Message,
    { playlist, newSong }: Args
  ): Promise<unknown> {
    if (newSong.duration < 3e4)
      return message.error('The song must be over 30 seconds in length');

    if (playlist.track_count >= 100)
      return message.error('You can only have 100 songs in your playlist');

    if (playlist.tracks.some(({ url }) => url === newSong.url))
      return message.error('You already have this song on your playlist');

    const color = await newSong.color;

    void message.embed(
      `Added "${newSong.title}" by ${newSong.author}`,
      (embed) =>
        embed
          .setColor(color)
          .setThumbnail(newSong.thumbnail)
          .setDescription(
            `This is the ${this.client.util.ordinal(
              playlist.track_count
            )} song on your playlist "${playlist.title}"`
          )
          .setURL(newSong.url)
    );

    playlist.tracks.push({ ...newSong, color });
    playlist.track_count++;
    await playlist.save();
  }
}
