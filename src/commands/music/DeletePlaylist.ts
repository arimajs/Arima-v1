import type { CommandOptions } from 'discord-akairo';
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
  clientPermissions: [
    'ADD_REACTIONS',
    'READ_MESSAGE_HISTORY',
    'MANAGE_MESSAGES',
  ],
})
export default class DeletePlaylistCommand extends Command {
  public async run(message: Message, { playlist }: Args): Promise<void> {
    const sent = await message.channel.send(
      message
        .embed(`Are you sure you want to delete "${playlist.title}"?`)
        .setDescription('You cannot undo this action')
        .setColor(
          this.client.util.isBlue(
            playlist.color as [number, number, number],
            'RED'
          )
        )
        .setThumbnail(playlist.thumbnail)
    );

    const confirm = await sent.poll(message.author.id);
    if (confirm) {
      await playlist.deleteOne();
      return sent.attemptEdit(
        sent.embeds[0]
          .setTitle(`Deleted "${playlist.title}"`)
          .setDescription('')
      );
    }

    void sent.edit(
      sent.embeds[0]
        .setTitle(`Ok, I won't delete "${playlist.title}"`)
        .setDescription('Whew, that was a close one')
    );
  }
}
