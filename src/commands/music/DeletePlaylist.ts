import type { CommandOptions } from '@arimajs/discord-akairo';
import type { Message } from 'discord.js-light';
import type { DocumentType } from '@typegoose/typegoose';
import type Playlist from '../../lib/database/entities/Playlist';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  playlist: DocumentType<Playlist>;
}

@ApplyOptions<CommandOptions>('delete-playlist', {
  aliases: ['delete-playlist'],
  description: 'Delete one of your playlists',
  usage: '<name>',
  examples: ['vibing', 'classical'],
  cooldown: 5000,
  args: [
    {
      id: 'playlist',
      match: 'rest',
      type: 'custom-playlist',
      description: 'The playlist you want to delete',
      prompt: {
        start: 'What playlist would you like to delete?',
        retry: 'Please provide the name of one of your custom playlists',
      },
    },
  ],
  clientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
})
export default class DeletePlaylistCommand extends Command {
  public async run(message: Message, { playlist }: Args): Promise<unknown> {
    const playlistEmbed = (title: string, description: string) =>
      message.embed(title, (embed) =>
        embed
          .setDescription(description)
          .setColor(
            this.client.util.isBlue(
              playlist.color as [number, number, number],
              'RED'
            )
          )
          .setThumbnail(playlist.thumbnail)
      );

    const sent = await playlistEmbed(
      `Are you sure you want to delete "${playlist.title}"?`,
      'You cannot undo this action'
    );

    const confirm = await sent.poll(message.author.id);
    if (confirm) {
      await playlist.deleteOne();
      return playlistEmbed(`Deleted "${playlist.title}"`, '');
    }

    playlistEmbed(
      `Ok, I won't delete "${playlist.title}"`,
      'Whew, that was a close one'
    );
  }
}
