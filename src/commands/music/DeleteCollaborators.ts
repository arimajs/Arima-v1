import type { CommandOptions } from '@arimajs/discord-akairo';
import { DocumentType } from '@typegoose/typegoose';
import { commaListsAnd } from 'common-tags';
import { GuildMember, Message, Role } from 'discord.js-light';
import type { Playlist } from 'src/lib/database/entities';
import Command from '../../lib/structures/Command';
import ApplyOptions from '../../lib/utils/ApplyOptions';

interface Args {
  playlist: DocumentType<Playlist>;
  collaborators: (GuildMember | Role)[];
}

@ApplyOptions<CommandOptions>('delete-collaborators', {
  aliases: ['delete-collaborators', 'remove-collaborators'],
  description: 'Delete collaborators from a playlist',
  usage: '<member | role> [member | role]...',
  examples: ['@Lioness100', '@Admin @Mod @DJ @Frank @Debbie'],
  args: [
    {
      id: 'playlist',
      type: 'custom-playlist',
      description: 'The custom playlist to remove collaborators from',
      prompt: {
        start: 'What playlist would you like to modify?',
        retry: 'Please provide the name of a custom playlist',
      },
    },
    {
      id: 'collaborators',
      type: 'membersOrRoles',
      match: 'rest',
      description: 'The members/roles to remove as collaborators',
      prompt: {
        start: 'Who would you like to remove?',
        retry:
          'Please provide the mention or id of at least one valid member or role',
      },
    },
  ],
})
export default class AddCollaboratorsCommand extends Command {
  public async run(
    message: Message,
    { playlist, collaborators }: Args
  ): Promise<void> {
    if (playlist.id !== message.author.id)
      return message.error("You don't own this playlist");

    if (playlist.collaborators!.length === 1)
      return message.error(
        'This playlist has no collaborators besides yourself'
      );

    const ids = [
      ...new Set(
        collaborators.flatMap((collaborator) =>
          collaborator instanceof Role
            ? collaborator.members.map(({ id }) => id)
            : collaborator.id
        )
      ),
    ];

    const updatedCollaborators = playlist.collaborators!.filter(
      (id) => !ids.includes(id)
    );

    if (updatedCollaborators.length === playlist.collaborators!.length)
      return message.error(
        'None of the collaborators you provided are collaborating'
      );

    playlist.collaborators = updatedCollaborators;
    await playlist.save();

    const list = commaListsAnd`List of members collaborating: ${playlist.collaborators.map(
      (collaborator) => `<@${collaborator}>`
    )}`;

    message.embed(`Removed collaborators from "${playlist.title}"`, (embed) =>
      embed
        .setThumbnail(playlist.thumbnail)
        .setColor(playlist.color as [number, number, number])
        .setDescription(
          list.length > 2048
            ? `There are now ${
                playlist.collaborators!.length
              } members collaborating`
            : list
        )
    );
  }
}
